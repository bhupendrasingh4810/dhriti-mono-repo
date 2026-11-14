import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { enqueueNotification } from "../../notification/notification-events";
import type {
  ExpenseClaimDto,
  PayrollProfileDto,
  PayrollRunDto,
  SalaryAssignmentDto,
  SalaryStructureDto,
  SandboxPaymentDto,
  VariablePayInputDto,
  VariablePayDecisionDto,
} from "../dto/hrms-payroll-workspace.dto";
import { calculateCalendarSalary, calculateSalary, readComponents } from "./payroll-calculation";
import { applyVariablePay, payrollVariance, variablePayAmount } from "./payroll-variable-calculation";
import { payrollCalendar, payrollPeriod } from "./payroll-calendar";

function invalid(message: string): never {
  throw new AppError(ErrorCode.VALIDATION_FAILED, message, HttpStatus.BAD_REQUEST);
}
function json(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
}
function currencyPrecision(currency: string) {
  if (!Intl.supportedValuesOf("currency").includes(currency)) {
    invalid("Select a supported ISO currency");
  }
  const precision = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
    .maximumFractionDigits;
  if (precision === undefined) {
    invalid("Currency precision is unavailable");
  }
  return precision;
}

const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 30000,
};

@Injectable()
export class HrmsPayrollWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async workspace(organizationId: string) {
    const [
      profiles,
      structures,
      assignments,
      claims,
      runs,
      employees,
      locations,
      departments,
      records,
      variableInputs,
    ] = await Promise.all([
      this.prisma.hrmsPayrollProfile.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
      this.prisma.hrmsSalaryStructure.findMany({ where: { organizationId }, include: { profile: true } }),
      this.prisma.hrmsSalaryAssignment.findMany({
        where: { organizationId },
        orderBy: { effectiveFrom: "desc" },
        include: {
          employee: { select: { employeeNumber: true, user: { select: { name: true } } } },
          structure: { include: { profile: true } },
        },
      }),
      this.prisma.hrmsExpenseClaim.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: { employee: { select: { employeeNumber: true, user: { select: { name: true } } } } },
      }),
      this.prisma.hrmsPayrollRun.findMany({
        where: { organizationId },
        include: { profile: true },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.hrmsEmployee.findMany({
        where: { organizationId, deletedAt: null, status: "ACTIVE" },
        select: { id: true, employeeNumber: true, workLocationId: true, user: { select: { name: true } } },
      }),
      this.prisma.hrmsLocation.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, countryCode: true },
      }),
      this.prisma.organizationDepartment.findMany({ where: { organizationId }, select: { id: true, name: true } }),
      this.prisma.hrmsPayrollRecord.findMany({
        where: { organizationId },
        orderBy: { period: "desc" },
        include: { employee: { select: { employeeNumber: true, user: { select: { name: true } } } } },
      }),
      this.prisma.hrmsVariablePayInput.findMany({
        where: { organizationId },
        orderBy: { createdAt: "desc" },
        include: { employee: { select: { employeeNumber: true, user: { select: { name: true } } } }, profile: true },
      }),
    ]);
    return {
      profiles,
      variableInputs,
      structures,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        breakdown: calculateSalary(
          assignment.monthlyGross.toString(),
          readComponents(assignment.structure.components),
          assignment.structure.profile.minorUnits,
        ),
      })),
      claims,
      runs,
      employees,
      locations,
      departments,
      records,
    };
  }

  async profile(organizationId: string, actorUserId: string, dto: PayrollProfileDto) {
    // Validate the calendar before persisting an append-only pay group.
    try {
      const calendar = { ...dto, calendarAnchor: dto.calendarAnchor ? new Date(dto.calendarAnchor) : null };
      if (dto.frequency !== "MONTHLY") {
        payrollPeriod(calendar, dto.effectiveFrom);
      }
      payrollCalendar(
        { ...calendar, effectiveFrom: new Date(dto.effectiveFrom) },
        new Date(dto.effectiveFrom).getUTCFullYear(),
      );
    } catch (error) {
      invalid(error instanceof Error ? error.message : "Invalid payroll calendar");
    }
    if (
      !new Intl.DisplayNames(["en"], { type: "region", fallback: "none" }).of(dto.countryCode) ||
      ["ZZ", "EU", "UN", "QO", "XA", "XB"].includes(dto.countryCode)
    ) {
      invalid("Select a recognized country or territory code");
    }
    if (dto.workLocationId) {
      const location = await this.prisma.hrmsLocation.findFirst({
        where: { id: dto.workLocationId, organizationId, countryCode: dto.countryCode, isActive: true },
      });
      if (!location) {
        invalid("Select an active work location in this organization and country");
      }
    }
    if (currencyPrecision(dto.currency) !== dto.minorUnits) {
      invalid("Decimal places must match the ISO currency precision");
    }
    const record = await this.write(() =>
      this.prisma.hrmsPayrollProfile.create({
        data: {
          ...dto,
          name: dto.name.trim(),
          organizationId,
          effectiveFrom: new Date(dto.effectiveFrom),
          calendarAnchor: dto.calendarAnchor ? new Date(dto.calendarAnchor) : null,
        },
      }),
    );
    await this.log(organizationId, actorUserId, "profile.created", record.id);
    return record;
  }

  async calendar(organizationId: string, profileId: string, year: number) {
    const profile = await this.prisma.hrmsPayrollProfile.findFirst({ where: { id: profileId, organizationId } });
    if (!profile) {
      invalid("Payroll profile not found");
    }
    try {
      return payrollCalendar(profile, year);
    } catch (error) {
      invalid(error instanceof Error ? error.message : "Invalid payroll calendar");
    }
  }

  async verifyProfile(organizationId: string, actorUserId: string, id: string) {
    const result = await this.prisma.hrmsPayrollProfile.updateMany({
      where: { id, organizationId },
      data: { rulesVerified: true },
    });
    if (result.count !== 1) {
      invalid("Payroll profile not found");
    }
    await this.log(organizationId, actorUserId, "profile.verified", id);
    return { id, rulesVerified: true };
  }

  async structure(organizationId: string, actorUserId: string, dto: SalaryStructureDto) {
    const profile = await this.prisma.hrmsPayrollProfile.findFirst({ where: { id: dto.profileId, organizationId } });
    if (!profile) {
      invalid("Payroll profile not found");
    }
    // Validate references and arithmetic at assignment time against actual gross; structural cycles are never evaluated.
    const seen = new Set<string>();
    for (const component of dto.components) {
      if (seen.has(component.code)) {
        invalid(`Duplicate component ${component.code}`);
      }
      if (component.calculation === "PERCENT_COMPONENT" && (!component.basis || !seen.has(component.basis))) {
        invalid("Percentage components must reference an earlier component");
      }
      if (component.calculation === "REMAINDER" && component.type !== "EARNING") {
        invalid("Only earnings can use a remainder");
      }
      seen.add(component.code);
    }
    const record = await this.write(() =>
      this.prisma.hrmsSalaryStructure.create({
        data: { organizationId, profileId: dto.profileId, name: dto.name.trim(), components: json(dto.components) },
      }),
    );
    await this.log(organizationId, actorUserId, "structure.created", record.id);
    return record;
  }

  async assign(organizationId: string, actorUserId: string, dto: SalaryAssignmentDto) {
    const record = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const employee = await db.hrmsEmployee.findFirst({
          where: { id: dto.employeeId, organizationId, deletedAt: null, status: "ACTIVE" },
          include: { workLocation: true },
        });
        const structure = await db.hrmsSalaryStructure.findFirst({
          where: { id: dto.structureId, organizationId },
          include: { profile: true },
        });
        if (!employee || !structure) {
          invalid("Active employee or salary structure not found");
        }
        if (structure.profile.workLocationId && employee.workLocationId !== structure.profile.workLocationId) {
          invalid("Employee does not belong to this pay group's location");
        }
        if (
          employee.workLocation &&
          (!employee.workLocation.isActive || employee.workLocation.countryCode !== structure.profile.countryCode)
        ) {
          invalid("Employee work location must be active and match the payroll country's code");
        }
        if (new Date(dto.effectiveFrom) < structure.profile.effectiveFrom) {
          invalid("Salary cannot predate the payroll profile");
        }
        try {
          calculateSalary(dto.monthlyGross, readComponents(structure.components), structure.profile.minorUnits);
        } catch (error) {
          invalid(error instanceof Error ? error.message : "Invalid salary calculation");
        }
        // Backdated changes require a dedicated arrears workflow; never silently alter locked payroll.
        const locked = await db.hrmsPayrollRecord.findFirst({
          where: {
            organizationId,
            employeeId: dto.employeeId,
            status: { in: ["APPROVED", "PAID"] },
            periodEnd: { gte: new Date(dto.effectiveFrom) },
          },
        });
        if (locked) {
          invalid("A locked payroll exists on or after this date; backdated arrears are not yet supported");
        }
        return db.hrmsSalaryAssignment.create({
          data: { ...dto, organizationId, effectiveFrom: new Date(dto.effectiveFrom) },
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, "salary.assigned", record.id);
    return record;
  }

  async claim(organizationId: string, actorUserId: string, dto: ExpenseClaimDto) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { id: dto.employeeId, organizationId, deletedAt: null, status: "ACTIVE" },
    });
    if (!employee) {
      invalid("Employee not found");
    }
    if (!new Prisma.Decimal(dto.amount).gt(0)) {
      invalid("Claim amount must be greater than zero");
    }
    const precision = currencyPrecision(dto.currency);
    if (new Prisma.Decimal(dto.amount).decimalPlaces() > precision) {
      invalid("Claim amount exceeds the currency's decimal precision");
    }
    const record = await this.prisma.hrmsExpenseClaim.create({
      data: { ...dto, organizationId, expenseDate: new Date(dto.expenseDate) },
    });
    await this.log(organizationId, actorUserId, "claim.created", record.id);
    return record;
  }

  async approveClaim(organizationId: string, actorUserId: string, id: string) {
    const claim = await this.prisma.hrmsExpenseClaim.findFirst({
      where: { id, organizationId },
      include: { employee: { select: { userId: true } } },
    });
    if (!claim || claim.status !== "PENDING") {
      invalid("Pending claim not found");
    }
    if (claim.employee.userId === actorUserId) {
      invalid("You cannot approve your own expense claim");
    }
    const result = await this.prisma.hrmsExpenseClaim.updateMany({
      where: { id, organizationId, status: "PENDING" },
      data: { status: "APPROVED", approvedById: actorUserId },
    });
    if (result.count !== 1) {
      invalid("Claim changed; reload and retry");
    }
    await this.log(organizationId, actorUserId, "claim.approved", id);
    return { id, status: "APPROVED" };
  }

  private async calculate(organizationId: string, dto: PayrollRunDto, db: Prisma.TransactionClient) {
    const profile = await db.hrmsPayrollProfile.findFirst({ where: { id: dto.profileId, organizationId } });
    if (!profile) {
      invalid("Payroll profile not found");
    }
    if (profile.employmentModel === "EOR" || profile.employmentModel === "LOCAL_PROVIDER") {
      invalid("This pay group is provider-managed; export employee salary data to its local payroll provider");
    }
    if (
      dto.departmentId &&
      !(await db.organizationDepartment.findFirst({ where: { id: dto.departmentId, organizationId } }))
    ) {
      invalid("Department not found in this organization");
    }
    let period;
    try {
      period = payrollPeriod(profile, dto.period);
    } catch (error) {
      invalid(error instanceof Error ? error.message : "Invalid payroll period");
    }
    const start = new Date(period.start);
    const end = new Date(period.end);
    const calendarAllocation = profile.frequency !== "MONTHLY";
    if (calendarAllocation && dto.prorationPolicy !== "CALENDAR_DAYS") {
      invalid("Non-monthly payroll requires the calendar-day allocation policy");
    }
    if (profile.effectiveFrom > start) {
      invalid("Profile must be effective at the start of the payroll period");
    }
    if (new Date(dto.payDate) < end) {
      invalid("Pay date cannot be before the payroll period ends");
    }
    const assignments = await db.hrmsSalaryAssignment.findMany({
      where: {
        organizationId,
        effectiveFrom: { lte: end },
        employee: {
          deletedAt: null,
          ...(dto.prorationPolicy === "CALENDAR_DAYS"
            ? {
                AND: [
                  { OR: [{ startDate: null }, { startDate: { lte: end } }] },
                  { OR: [{ endDate: null }, { endDate: { gte: start } }] },
                  { OR: [{ status: "ACTIVE" }, { endDate: { gte: start, lte: end } }] },
                ],
              }
            : { status: "ACTIVE" }),
          ...(dto.departmentId ? { departmentId: dto.departmentId } : {}),
        },
      },
      orderBy: { effectiveFrom: "desc" },
      include: { structure: true, employee: { include: { user: { select: { name: true } }, workLocation: true } } },
    });
    const latest = new Map<string, (typeof assignments)[number]>();
    for (const assignment of assignments) {
      if (!latest.has(assignment.employeeId)) {
        latest.set(assignment.employeeId, assignment);
      }
    }
    // Include anyone assigned during the period, not only its final day.
    // Mid-period group transfers are rejected instead of silently dropping earlier salary.
    const selected = [...latest.values()].filter((item) =>
      dto.prorationPolicy === "CALENDAR_DAYS"
        ? assignments.some(
            (revision) =>
              revision.employeeId === item.employeeId &&
              revision.structure.profileId === profile.id &&
              (revision.effectiveFrom > start ||
                revision.id ===
                  assignments.find(
                    (candidate) => candidate.employeeId === item.employeeId && candidate.effectiveFrom <= start,
                  )?.id),
          )
        : item.structure.profileId === profile.id,
    );
    if (!selected.length) {
      invalid("No active employee salaries assigned to this pay group for the selected period");
    }
    const unpaidLeave = await db.hrmsLeaveRequest.findMany({
      where: {
        organizationId,
        employeeId: { in: selected.map((item) => item.employeeId) },
        startDate: { lte: end },
        endDate: { gte: start },
        OR: [{ leaveType: "UNPAID_LEAVE" }, { type: { isPaid: false } }],
        status: "APPROVED",
      },
    });
    const [variableInputs, previousRecords] = await Promise.all([
      db.hrmsVariablePayInput.findMany({
        where: {
          organizationId,
          employeeId: { in: selected.map((item) => item.employeeId) },
          startPeriod: { lte: period.end.slice(0, 7) },
          endPeriod: { gte: period.start.slice(0, 7) },
          status: { in: ["PENDING", "APPROVED"] },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        include: { profile: true },
      }),
      db.hrmsPayrollRecord.findMany({
        where: {
          organizationId,
          employeeId: { in: selected.map((item) => item.employeeId) },
          currency: profile.currency,
          status: { in: ["APPROVED", "PAID"] },
          periodEnd: { lt: start },
        },
        orderBy: [{ periodEnd: "desc" }, { id: "asc" }],
      }),
    ]);
    // Never silently omit another group's approved/pending input after an employee transfer.
    const applicableInputs = variableInputs.filter((item) => {
      if (!item.targetPeriod) {
        return true;
      }
      if (item.profileId === profile.id) {
        return item.targetPeriod === dto.period;
      }
      // Another calendar's exact input must never disappear during a transfer.
      // Resolve it with its own immutable calendar, not the current group's cycle.
      const otherPeriod = payrollPeriod(item.profile, item.targetPeriod);
      return otherPeriod.start <= period.end && otherPeriod.end >= period.start;
    });
    if (applicableInputs.some((item) => item.profileId !== profile.id)) {
      invalid(
        "An applicable variable input belongs to another pay group; resolve the input or salary transfer before payroll",
      );
    }
    const items = [];
    const fullyUnpaidDates = new Map<string, number[]>();
    for (const assignment of selected) {
      const employee = assignment.employee;
      if (
        dto.prorationPolicy !== "CALENDAR_DAYS" &&
        (assignment.effectiveFrom > start ||
          (employee.startDate && employee.startDate > start) ||
          (employee.endDate && employee.endDate < end))
      ) {
        invalid(
          `Employee ${employee.employeeNumber} requires partial-month proration; review externally before payroll`,
        );
      }
      if (profile.workLocationId && employee.workLocationId !== profile.workLocationId) {
        invalid("An employee moved out of the pay group's location; revise their salary assignment");
      }
      if (
        employee.workLocation &&
        (!employee.workLocation.isActive || employee.workLocation.countryCode !== profile.countryCode)
      ) {
        invalid("An employee's work location no longer matches the payroll country");
      }
      let salary: ReturnType<typeof calculateSalary> & {
        proration?: ReturnType<typeof calculateCalendarSalary>["proration"];
      };
      try {
        if (dto.prorationPolicy === "CALENDAR_DAYS") {
          const calendar = calculateCalendarSalary({
            start,
            end,
            employmentStart: employee.startDate,
            employmentEnd: employee.endDate,
            profileId: profile.id,
            precision: profile.minorUnits,
            ...(calendarAllocation ? { allocation: "MONTHLY_CALENDAR" as const } : {}),
            revisions: assignments
              .filter((item) => item.employeeId === employee.id)
              .map((item) => ({
                id: item.id,
                effectiveFrom: item.effectiveFrom,
                monthlyGross: item.monthlyGross.toString(),
                profileId: item.structure.profileId,
                components: readComponents(item.structure.components),
              })),
            unpaidLeave: unpaidLeave.filter((leave) => leave.employeeId === employee.id),
          });
          const { unpaidDates, ...calculated } = calendar;
          fullyUnpaidDates.set(employee.id, unpaidDates);
          salary = calculated;
        } else {
          salary = calculateSalary(
            assignment.monthlyGross.toString(),
            readComponents(assignment.structure.components),
            profile.minorUnits,
          );
        }
      } catch (error) {
        invalid(error instanceof Error ? error.message : "Salary calculation failed");
      }
      const claims = await db.hrmsExpenseClaim.findMany({
        where: {
          organizationId,
          employeeId: employee.id,
          status: "APPROVED",
          runId: null,
          currency: profile.currency,
          expenseDate: { lte: end },
        },
      });
      const reimbursements = claims.reduce((total, item) => total.plus(item.amount), new Prisma.Decimal(0));
      const inputs = applicableInputs.filter((item) => item.employeeId === employee.id && item.status === "APPROVED");
      let adjusted;
      try {
        adjusted = applyVariablePay(salary, inputs, profile.minorUnits);
      } catch (error) {
        invalid(error instanceof Error ? error.message : "Variable pay calculation failed");
      }
      const net = new Prisma.Decimal(adjusted.net).plus(reimbursements).toFixed(profile.minorUnits);
      items.push({
        employeeId: employee.id,
        employeeNumber: employee.employeeNumber,
        name: employee.user.name,
        assignmentId: salary.proration?.segments.at(-1)?.assignmentId ?? assignment.id,
        ...salary,
        ...adjusted,
        variableInputs: inputs.map((item) => ({
          id: item.id,
          name: item.name,
          type: item.type,
          calculation: item.calculation,
          quantity: item.quantity.toString(),
          rate: item.rate.toString(),
          multiplier: item.multiplier.toString(),
          amount: item.amount.toFixed(profile.minorUnits),
          reason: item.reason,
          ...(item.targetPeriod ? { targetPeriod: item.targetPeriod } : {}),
        })),
        variance: payrollVariance(
          { ...adjusted, net },
          previousRecords.find((record) => record.employeeId === employee.id) ?? null,
          profile.minorUnits,
        ),
        reimbursements: reimbursements.toFixed(profile.minorUnits),
        claimIds: claims.map((item) => item.id),
        net,
      });
    }
    const [attendance, pendingLeave] = await Promise.all([
      db.hrmsAttendanceRecord.findMany({
        where: {
          organizationId,
          employeeId: { in: selected.map((item) => item.employeeId) },
          date: { gte: start, lte: end },
          status: "ABSENT",
        },
      }),
      db.hrmsLeaveRequest.count({
        where: {
          organizationId,
          employeeId: { in: selected.map((item) => item.employeeId) },
          startDate: { lte: end },
          endDate: { gte: start },
          status: { in: ["PENDING", "NEEDS_INFO"] },
        },
      }),
    ]);
    const warnings: string[] = [];
    if (!profile.rulesVerified) {
      warnings.push("Country statutory rules have not been verified by an authorized payroll administrator");
    }
    if (applicableInputs.some((item) => item.status === "PENDING")) {
      warnings.push("Pending variable pay inputs require independent approval, rejection or cancellation");
    }
    const unresolvedAbsence = attendance.some(
      (record) => !fullyUnpaidDates.get(record.employeeId)?.includes(Math.floor(record.date.getTime() / 86_400_000)),
    );
    if (unresolvedAbsence || (dto.prorationPolicy !== "CALENDAR_DAYS" && unpaidLeave.length) || pendingLeave) {
      warnings.push(
        "Attendance/unpaid or pending leave requires review; resolve absences or approve date-allocated unpaid leave",
      );
    }
    const totalNet = items.reduce((total, item) => total.plus(item.net), new Prisma.Decimal(0));
    if (totalNet.gte("100000000000000")) {
      invalid("Run total exceeds supported storage precision; split the pay group");
    }
    const components = new Map<string, { name: string; type: string; employeeCount: number; amount: Prisma.Decimal }>();
    for (const item of items) {
      for (const line of item.lines) {
        const key = `${line.code}:${line.name}:${line.type}`;
        const summary = components.get(key) ?? {
          name: line.name,
          type: line.type,
          employeeCount: 0,
          amount: new Prisma.Decimal(0),
        };
        summary.employeeCount += 1;
        summary.amount = summary.amount.plus(line.amount);
        components.set(key, summary);
      }
    }
    return {
      profile,
      items,
      componentSummary: [...components.entries()].map(([key, component]) => ({
        key,
        ...component,
        amount: component.amount.toFixed(profile.minorUnits),
      })),
      warnings,
      totalNet: totalNet.toFixed(profile.minorUnits),
      period: dto.period,
      periodStart: period.start,
      periodEnd: period.end,
      scheduledPayDate: period.payDate,
      salaryAllocation: calendarAllocation ? "MONTHLY_CALENDAR" : "LEGACY_MONTHLY",
      payDate: dto.payDate,
      prorationPolicy: dto.prorationPolicy ?? "NONE",
      ...(dto.departmentId ? { departmentId: dto.departmentId } : {}),
    };
  }

  preview(organizationId: string, dto: PayrollRunDto) {
    return this.write(() =>
      this.prisma.$transaction((db) => this.calculate(organizationId, dto, db), transactionOptions),
    );
  }

  async variableInput(organizationId: string, actorUserId: string, dto: VariablePayInputDto) {
    const result = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const [employee, profile] = await Promise.all([
          db.hrmsEmployee.findFirst({ where: { id: dto.employeeId, organizationId, deletedAt: null } }),
          db.hrmsPayrollProfile.findFirst({ where: { id: dto.profileId, organizationId } }),
        ]);
        if (!employee || !profile) {
          invalid("Employee or payroll profile not found in this organization");
        }
        if (dto.endPeriod < dto.startPeriod) {
          invalid("End period cannot precede start period");
        }
        if (profile.frequency === "MONTHLY" && dto.calculation === "HOURS" && dto.startPeriod !== dto.endPeriod) {
          invalid("Hours inputs must be period-specific; recurring hours cannot be assumed");
        }
        const range = this.variableRange(profile, dto);
        if (range.start < profile.effectiveFrom) {
          invalid("Variable input cannot predate its payroll profile");
        }
        await this.assertVariablePeriodOpen(db, organizationId, dto.employeeId, range.start, range.end);
        await this.assertVariablePayGroup(db, organizationId, dto.employeeId, dto.profileId, range.start, range.end);
        let amount;
        try {
          amount = variablePayAmount(dto, profile.minorUnits);
        } catch (error) {
          invalid(error instanceof Error ? error.message : "Invalid variable pay amount");
        }
        return db.hrmsVariablePayInput.create({
          data: {
            ...dto,
            name: dto.name.trim(),
            reason: dto.reason.trim(),
            organizationId,
            createdById: actorUserId,
            amount,
          },
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, "variable.created", result.id);
    return result;
  }

  /** Approved month ranges/exact-period inputs remain immutable to protect approved snapshots. */
  async decideVariable(organizationId: string, actorUserId: string, id: string, dto: VariablePayDecisionDto) {
    const result = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const input = await db.hrmsVariablePayInput.findFirst({ where: { id, organizationId } });
        if (!input || input.status !== "PENDING") {
          invalid("Only a pending variable pay input can be decided");
        }
        if (dto.action !== "CANCEL" && input.createdById === actorUserId) {
          invalid("A different payroll approver must decide this input");
        }
        if (dto.action === "APPROVE") {
          const employee = await db.hrmsEmployee.findFirst({
            where: { id: input.employeeId, organizationId, userId: actorUserId },
          });
          if (employee) {
            invalid("Employees cannot approve their own variable pay");
          }
          const profile = await db.hrmsPayrollProfile.findFirst({ where: { id: input.profileId, organizationId } });
          if (!profile) {
            invalid("Payroll profile not found");
          }
          const range = this.variableRange(profile, input);
          await this.assertVariablePeriodOpen(db, organizationId, input.employeeId, range.start, range.end);
          await this.assertVariablePayGroup(
            db,
            organizationId,
            input.employeeId,
            input.profileId,
            range.start,
            range.end,
          );
        }
        return db.hrmsVariablePayInput.update({
          where: { id },
          data: {
            status: dto.action === "APPROVE" ? "APPROVED" : dto.action === "REJECT" ? "REJECTED" : "CANCELLED",
            decidedById: actorUserId,
            decidedAt: new Date(),
          },
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, `variable.${dto.action.toLowerCase()}`, id);
    return result;
  }

  private async assertVariablePeriodOpen(
    db: Prisma.TransactionClient,
    organizationId: string,
    employeeId: string,
    start: Date,
    end: Date,
  ) {
    const locked = await db.hrmsPayrollRecord.findFirst({
      where: {
        organizationId,
        employeeId,
        periodStart: { lte: end },
        periodEnd: { gte: start },
      },
    });
    if (locked) {
      invalid("Existing payroll overlaps this input range; use a future period or a dedicated adjustment workflow");
    }
  }

  private variableRange(
    profile: { frequency: string; calendarAnchor?: Date | null; payDateOffset?: number },
    input: { startPeriod: string; endPeriod: string; targetPeriod?: string | null },
  ) {
    try {
      if (profile.frequency === "MONTHLY") {
        if (input.targetPeriod) {
          invalid("Monthly inputs use month ranges, not a target date");
        }
        return {
          start: new Date(payrollPeriod(profile, input.startPeriod).start),
          end: new Date(payrollPeriod(profile, input.endPeriod).end),
        };
      }
      if (!input.targetPeriod) {
        invalid("Non-monthly inputs must target one configured payroll period");
      }
      const period = payrollPeriod(profile, input.targetPeriod);
      if (input.startPeriod !== period.start.slice(0, 7) || input.endPeriod !== period.end.slice(0, 7)) {
        invalid("Input month bounds must match its target period");
      }
      return { start: new Date(period.start), end: new Date(period.end) };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      invalid(error instanceof Error ? error.message : "Invalid variable period");
    }
  }

  /** Inputs must follow an already configured salary group throughout their finite range. */
  private async assertVariablePayGroup(
    db: Prisma.TransactionClient,
    organizationId: string,
    employeeId: string,
    profileId: string,
    start: Date,
    end: Date,
  ) {
    const assignments = await db.hrmsSalaryAssignment.findMany({
      where: { organizationId, employeeId, effectiveFrom: { lte: end } },
      include: { structure: { select: { profileId: true } } },
      orderBy: { effectiveFrom: "desc" },
    });
    const initial = assignments.find((item) => item.effectiveFrom <= start);
    if (
      !initial ||
      initial.structure.profileId !== profileId ||
      assignments.some((item) => item.effectiveFrom > start && item.structure.profileId !== profileId)
    ) {
      invalid(
        "Assign the employee to this pay group for the entire input range before adding or approving variable pay",
      );
    }
  }

  async createRun(organizationId: string, actorUserId: string, dto: PayrollRunDto) {
    const run = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const snapshot = await this.calculate(organizationId, dto, db);
        return db.hrmsPayrollRun.create({
          data: {
            organizationId,
            profileId: dto.profileId,
            period: dto.period,
            scopeKey: dto.departmentId ?? "ALL",
            payDate: new Date(dto.payDate),
            snapshot: json(snapshot),
            totalNet: snapshot.totalNet,
            employeeCount: snapshot.items.length,
            preparedById: actorUserId,
          },
          include: { profile: true },
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, "run.created", run.id);
    return run;
  }

  async transition(organizationId: string, actorUserId: string, id: string, action: "approve" | "process") {
    const record = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const run = await db.hrmsPayrollRun.findFirst({ where: { id, organizationId } });
        if (!run) {
          invalid("Payroll run not found");
        }
        if (action === "approve" && run.preparedById === actorUserId) {
          invalid("A different payroll approver must approve this run");
        }
        const expected = action === "approve" ? "DRAFT" : "APPROVED";
        if (run.status !== expected) {
          invalid(`Payroll must be ${expected.toLowerCase()} first`);
        }
        if (action === "approve") {
          // Recalculate on approval, not process: the approved snapshot is immutable thereafter.
          const snapshot = await this.calculate(
            organizationId,
            {
              profileId: run.profileId,
              period: run.period,
              payDate: run.payDate.toISOString().slice(0, 10),
              prorationPolicy: this.prorationPolicy(run.snapshot),
              ...(run.scopeKey !== "ALL" ? { departmentId: run.scopeKey } : {}),
            },
            db,
          );
          if (snapshot.warnings.length) {
            invalid(snapshot.warnings.join("; "));
          }
          // Date overlap, not a month label, protects employees across frequencies/groups/legacy callers.
          const periodStart = new Date(snapshot.periodStart);
          const periodEnd = new Date(snapshot.periodEnd);
          // Legacy periods may have free-text labels; check actual dates as well as the unique month key.
          const overlapping = await db.hrmsPayrollRecord.findFirst({
            where: {
              organizationId,
              employeeId: { in: snapshot.items.map((item) => item.employeeId) },
              periodStart: { lte: periodEnd },
              periodEnd: { gte: periodStart },
            },
            select: { id: true },
          });
          if (overlapping) {
            throw new AppError(
              ErrorCode.VALIDATION_FAILED,
              "An employee already has payroll overlapping this period",
              HttpStatus.CONFLICT,
            );
          }
          await db.hrmsPayrollRecord.createMany({
            data: snapshot.items.map((item) => ({
              organizationId,
              runId: id,
              employeeId: item.employeeId,
              period: run.period,
              periodStart,
              periodEnd,
              payDate: run.payDate,
              grossSalary: Number(item.gross),
              totalDeductions: Number(item.deductions),
              netPay: Number(item.net),
              currency: snapshot.profile.currency,
              status: "APPROVED",
              approvedByUserId: actorUserId,
              approvedAt: new Date(),
              notes: `Payroll run ${id}; exact decimal amounts and reimbursements retained in the approved run snapshot.`,
            })),
          });
          const claimIds = snapshot.items.flatMap((item) => item.claimIds);
          if (claimIds.length) {
            const claimed = await db.hrmsExpenseClaim.updateMany({
              where: { id: { in: claimIds }, organizationId, status: "APPROVED", runId: null },
              data: { runId: id },
            });
            if (claimed.count !== claimIds.length) {
              invalid("An expense claim was already allocated to another run");
            }
          }
          await db.hrmsPayrollRun.update({
            where: { id },
            data: {
              snapshot: json(snapshot),
              totalNet: snapshot.totalNet,
              employeeCount: snapshot.items.length,
              status: "APPROVED",
              approvedById: actorUserId,
              approvedAt: new Date(),
            },
          });
        } else {
          await db.hrmsPayrollRun.update({ where: { id }, data: { status: "PROCESSED", processedAt: new Date() } });
          await db.hrmsExpenseClaim.updateMany({
            where: { organizationId, runId: id },
            data: { status: "IN_PAYROLL" },
          });
          const records = await db.hrmsPayrollRecord.findMany({
            where: { organizationId, runId: id },
            select: { id: true, employee: { select: { userId: true } } },
          });
          for (const payroll of records) {
            await enqueueNotification(db, {
              organizationId,
              actorId: actorUserId,
              sourceType: "hrms",
              sourceId: payroll.id,
              type: "HRMS_PAYROLL",
              recipientIds: [payroll.employee.userId],
              title: `Your payroll for ${run.period} was processed`,
              body: "Payroll was finalized. This is not a bank payment confirmation.",
              path: "home",
              dedupKey: `payroll-processed:${payroll.id}`,
            });
          }
        }
        return db.hrmsPayrollRun.findUniqueOrThrow({ where: { id } });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, `run.${action}`, id);
    return record;
  }

  /** Closing a draft never deletes its snapshot or touches approved payroll, claims, or bank state. */
  async closeDraft(
    organizationId: string,
    actorUserId: string,
    id: string,
    action: "cancel" | "reject",
    reason: string,
  ) {
    const cleaned = reason.trim();
    if (cleaned.length < 3 || cleaned.length > 1000) {
      invalid("Provide a reason between 3 and 1000 characters");
    }
    const result = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const run = await db.hrmsPayrollRun.findFirst({ where: { id, organizationId } });
        if (!run || run.status !== "DRAFT") {
          invalid("Only a draft payroll can be cancelled or rejected");
        }
        if (action === "reject" && run.preparedById === actorUserId) {
          invalid("A different payroll approver must reject this run; preparers can cancel it");
        }
        return db.hrmsPayrollRun.update({
          where: { id },
          data: {
            status: action === "cancel" ? "CANCELLED" : "REJECTED",
            closedById: actorUserId,
            closedAt: new Date(),
            closureReason: cleaned,
          },
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, `run.${action}`, id);
    return result;
  }

  private prorationPolicy(snapshot: Prisma.JsonValue): "NONE" | "CALENDAR_DAYS" {
    if (snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)) {
      if (snapshot.prorationPolicy === "CALENDAR_DAYS") {
        return "CALENDAR_DAYS";
      }
      if (snapshot.prorationPolicy === undefined || snapshot.prorationPolicy === "NONE") {
        return "NONE";
      }
    }
    invalid("Invalid stored payroll proration policy");
  }

  async sandbox(organizationId: string, actorUserId: string, id: string, dto: SandboxPaymentDto) {
    if (!dto.confirmSandbox) {
      invalid("Explicit sandbox confirmation is required; no real funds will move");
    }
    const result = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const run = await db.hrmsPayrollRun.findFirst({ where: { id, organizationId, status: "PROCESSED" } });
        if (!run) {
          invalid("Process and lock the payroll before testing a payment");
        }
        if (dto.action === "SUBMIT") {
          if (run.sandboxReference) {
            return run;
          }
          return db.hrmsPayrollRun.update({
            where: { id },
            data: { sandboxReference: `SANDBOX-${randomUUID()}`, sandboxStatus: "SUBMITTED" },
          });
        }
        if (run.sandboxStatus !== "SUBMITTED") {
          invalid("Only a submitted sandbox payment can change status");
        }
        return db.hrmsPayrollRun.update({
          where: { id },
          data: { sandboxStatus: dto.action === "SETTLE" ? "SIMULATED_SETTLED" : "SIMULATED_FAILED" },
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, `sandbox.${dto.action.toLowerCase()}`, id);
    return { ...result, sandboxOnly: true, realFundsMoved: false };
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "A profile, salary revision, payroll run, or employee payroll already exists for these keys. Reload before retrying.",
            HttpStatus.CONFLICT,
          );
        }
        if (error.code === "P2034") {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "Payroll inputs changed concurrently. Reload and retry.",
            HttpStatus.CONFLICT,
          );
        }
      }
      throw error;
    }
  }

  private log(organizationId: string, actorUserId: string, action: string, resourceId: string) {
    return this.audit.record({
      organizationId,
      actorUserId,
      action: `hrms.payroll.${action}`,
      resourceType: "Payroll",
      resourceId,
    });
  }
}
