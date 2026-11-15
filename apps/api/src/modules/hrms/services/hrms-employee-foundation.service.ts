import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  hrmsEmployeeLifecycleSchema,
  updateHrmsLifecycleSchema,
  validateHrmsOrganizationFields,
  z,
} from "@dhriti/validation";
import type { HrmsEmployeeLifecycleResponse, HrmsEmployeeReadiness } from "@dhriti/types";
import { PrismaService } from "../../../database/prisma.service";
import { HrmsEmployeeService } from "./hrms-employee.service";
import { applyLifecycleAction, lifecycleError, lifecycleSummary } from "../employee-lifecycle";

const todayUTC = () => new Date().toISOString().slice(0, 10);
const historySchema = z.object({ reason: z.string() });
const lifecycleLabels = {
  probationEndDate: "Probation end date",
  probationConfirmedOn: "Probation confirmed on",
  contractStartDate: "Contract start date",
  contractEndDate: "Contract end date",
  noticePeriodDays: "Notice period days",
  approvedLastWorkingDate: "Approved last working date",
} as const;

@Injectable()
export class HrmsEmployeeFoundationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly employees: HrmsEmployeeService,
  ) {}

  private async employee(db: Prisma.TransactionClient, organizationId: string, employeeId: string) {
    const employee = await db.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
      select: { lifecycleData: true, lifecycleVersion: true, startDate: true, resignationDate: true },
    });
    if (!employee) {
      throw lifecycleError("Employee not found.", HttpStatus.NOT_FOUND);
    }
    return employee;
  }

  async lifecycle(organizationId: string, employeeId: string): Promise<HrmsEmployeeLifecycleResponse> {
    const employee = await this.employee(this.prisma, organizationId, employeeId);
    const parsed = hrmsEmployeeLifecycleSchema.safeParse(employee.lifecycleData);
    if (!parsed.success) {
      throw lifecycleError("Stored lifecycle data is invalid.", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    const events = await this.prisma.auditLog.findMany({
      where: {
        organizationId,
        resourceId: employeeId,
        resourceType: "HrmsEmployee",
        action: { startsWith: "hrms.employee.lifecycle." },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 50,
      select: { id: true, action: true, metadata: true, createdAt: true, actorUserId: true },
    });
    const ids = [...new Set(events.flatMap((event) => (event.actorUserId ? [event.actorUserId] : [])))];
    const actors = ids.length
      ? await this.prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })
      : [];
    const asOf = todayUTC();
    return {
      data: parsed.data,
      version: employee.lifecycleVersion,
      asOf,
      ...lifecycleSummary(parsed.data, employee.resignationDate?.toISOString().slice(0, 10) ?? null, asOf),
      history: events.map((event) => {
        const metadata = historySchema.safeParse(event.metadata);
        if (!metadata.success) {
          throw lifecycleError("Stored lifecycle history is invalid.", HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return {
          id: event.id,
          action: event.action.split(".").at(-1) ?? event.action,
          recordedAt: event.createdAt.toISOString(),
          actor: actors.find((actor) => actor.id === event.actorUserId) ?? null,
          reason: metadata.data.reason,
        };
      }),
    };
  }

  async updateLifecycle(organizationId: string, employeeId: string, actorUserId: string, body: unknown) {
    const parsed = updateHrmsLifecycleSchema.safeParse(body);
    if (!parsed.success) {
      throw lifecycleError(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
    }
    const input = parsed.data;
    try {
      await this.prisma.$transaction(
        async (tx) => {
          const employee = await this.employee(tx, organizationId, employeeId);
          const current = hrmsEmployeeLifecycleSchema.safeParse(employee.lifecycleData);
          if (!current.success) {
            throw lifecycleError("Stored lifecycle data is invalid.", HttpStatus.INTERNAL_SERVER_ERROR);
          }
          const next = applyLifecycleAction(
            current.data,
            input,
            employee.startDate?.toISOString().slice(0, 10) ?? null,
            employee.resignationDate?.toISOString().slice(0, 10) ?? null,
            todayUTC(),
          );
          const changed = await tx.hrmsEmployee.updateMany({
            where: { id: employeeId, organizationId, deletedAt: null, lifecycleVersion: input.version },
            data: { lifecycleData: { ...next }, lifecycleVersion: { increment: 1 } },
          });
          if (changed.count !== 1) {
            throw lifecycleError("Lifecycle data changed. Reload before saving.", HttpStatus.CONFLICT);
          }
          await tx.auditLog.create({
            data: {
              organizationId,
              actorUserId,
              resourceType: "HrmsEmployee",
              resourceId: employeeId,
              action: `hrms.employee.lifecycle.${input.action.toLowerCase()}`,
              metadata: {
                reason: input.reason,
                before: { ...current.data },
                after: { ...next },
                timeline: {
                  version: 1,
                  changes: (Object.keys(lifecycleLabels) as (keyof typeof lifecycleLabels)[])
                    .filter((field) => current.data[field] !== next[field])
                    .map((field) => ({
                      field,
                      label: lifecycleLabels[field],
                      before: current.data[field] === null ? null : String(current.data[field]),
                      after: next[field] === null ? null : String(next[field]),
                    })),
                },
              },
            },
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw lifecycleError("Employee or lifecycle data changed. Reload before saving.", HttpStatus.CONFLICT);
      }
      throw error;
    }
    return this.lifecycle(organizationId, employeeId);
  }

  /** Advisory setup completeness, not a payroll/compliance approval and not a requirement for top-level managers. */
  async readiness(organizationId: string, employeeId: string): Promise<HrmsEmployeeReadiness> {
    const employee = await this.employees.get(organizationId, employeeId);
    const profile = await this.employees.profile(organizationId, employeeId);
    const date = new Date(`${todayUTC()}T00:00:00Z`);
    const [assignment, defaultRule] = await Promise.all([
      this.prisma.hrmsWorkWeekAssignment.findFirst({
        where: { organizationId, employeeId, effectiveFrom: { lte: date } },
        orderBy: { effectiveFrom: "desc" },
      }),
      this.prisma.hrmsWorkWeekDefault.findFirst({
        where: { organizationId, effectiveFrom: { lte: date } },
        orderBy: { effectiveFrom: "desc" },
      }),
    ]);
    const missingFields = Object.keys(
      validateHrmsOrganizationFields(
        profile.catalog.definitions.filter((field) => !field.archived && field.required),
        Object.fromEntries(
          Object.entries(profile.profile.organizationFields ?? {}).filter(([id]) =>
            profile.catalog.definitions.some((field) => field.id === id && !field.archived && field.required),
          ),
        ),
      ),
    );
    const fieldLabels = missingFields.map(
      (id) => profile.catalog.definitions.find((field) => field.id === id)?.label ?? id,
    );
    const items: [string, string, boolean, string][] = [
      [
        "manager",
        "Reporting manager",
        !!employee.reportingManagerId,
        "No manager assigned; this may be intentional for a top-level employee.",
      ],
      ["location", "Work location", !!employee.workLocationId, "Assign a work location."],
      ["shift", "Shift", !!employee.shiftId, "Assign a shift when the employee uses shift-based attendance."],
      ["department", "Department", !!employee.departmentId, "Assign a department."],
      ["designation", "Designation", !!employee.designationId, "Assign a designation."],
      ["joining", "Joining date", !!employee.startDate, "Record the joining date."],
      [
        "workWeek",
        "Dated work week",
        !!(assignment?.ruleId ?? defaultRule?.ruleId),
        "Using legacy organization working days; no dated rule is effective.",
      ],
      [
        "requiredProfile",
        "Required profile fields",
        fieldLabels.length === 0,
        fieldLabels.length ? `Review: ${fieldLabels.join(", ")}.` : "",
      ],
    ];
    const checks: HrmsEmployeeReadiness["checks"] = items.map(([key, label, complete, message]) => ({
      key,
      label,
      status: complete ? "COMPLETE" : "ATTENTION",
      message: complete ? "Configured." : message,
    }));
    return { checks, complete: checks.filter((check) => check.status === "COMPLETE").length, total: checks.length };
  }
}
