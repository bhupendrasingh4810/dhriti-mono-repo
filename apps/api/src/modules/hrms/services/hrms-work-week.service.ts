import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { AppSettingsService } from "../../settings/app-settings.service";
import type { AssignWorkWeekDto, CreateWorkWeekDto, UpdateWorkWeekDto } from "../dto/hrms-work-week.dto";
import { legacyWorkWeekPattern, resolveWorkWeek, workWeekDate, workWeekError, workWeekPattern } from "../work-week";

@Injectable()
export class HrmsWorkWeekService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AppSettingsService,
  ) {}

  async list(organizationId: string) {
    const [rules, defaults] = await Promise.all([
      this.prisma.hrmsWorkWeekRule.findMany({
        where: { organizationId },
        orderBy: { name: "asc" },
        include: { versions: { orderBy: { effectiveFrom: "desc" } } },
      }),
      this.prisma.hrmsWorkWeekDefault.findMany({ where: { organizationId }, orderBy: { effectiveFrom: "desc" } }),
    ]);
    return { rules, defaults };
  }

  async create(organizationId: string, actorUserId: string, input: CreateWorkWeekDto) {
    const effectiveFrom = this.futureDate(input.effectiveFrom);
    const pattern = workWeekPattern(input.pattern);
    const settings = await this.settings.get("hrms", organizationId);
    return this.write(async (tx) => {
      // Snapshot legacy weekdays once so adopting dated rules cannot rewrite earlier schedules.
      if (!(await tx.hrmsWorkWeekDefault.findFirst({ where: { organizationId } }))) {
        const baseline = await tx.hrmsWorkWeekRule.create({
          data: {
            organizationId,
            name: "Original work week",
            description: "Working days before dated work-week rules were configured.",
            versions: {
              create: {
                effectiveFrom: new Date("0001-01-01T00:00:00Z"),
                pattern: legacyWorkWeekPattern(settings.workingDays),
              },
            },
          },
        });
        await tx.hrmsWorkWeekDefault.create({
          data: { organizationId, ruleId: baseline.id, effectiveFrom: new Date("0001-01-01T00:00:00Z") },
        });
      }
      const rule = await tx.hrmsWorkWeekRule.create({
        data: {
          organizationId,
          name: input.name.trim(),
          description: input.description?.trim() ?? "",
          versions: { create: { effectiveFrom, pattern } },
        },
        include: { versions: true },
      });
      await this.audit(tx, organizationId, actorUserId, "created", rule.id, {
        effectiveFrom: input.effectiveFrom,
        pattern,
      });
      return rule;
    });
  }

  async update(organizationId: string, actorUserId: string, id: string, input: UpdateWorkWeekDto) {
    const effectiveFrom = this.futureDate(input.effectiveFrom);
    const pattern = workWeekPattern(input.pattern);
    return this.write(async (tx) => {
      const rule = await this.rule(tx, organizationId, id);
      const changed = await tx.hrmsWorkWeekRule.updateMany({
        where: { id: rule.id, organizationId, revision: input.revision },
        data: { name: input.name.trim(), description: input.description?.trim() ?? "", revision: { increment: 1 } },
      });
      if (changed.count !== 1) {
        throw workWeekError("This rule changed. Reload before saving.", HttpStatus.CONFLICT);
      }
      // Same-day/future corrections replace only that date; earlier versions are never changed.
      await tx.hrmsWorkWeekVersion.upsert({
        where: { ruleId_effectiveFrom: { ruleId: id, effectiveFrom } },
        create: { ruleId: id, effectiveFrom, pattern },
        update: { pattern },
      });
      await this.audit(tx, organizationId, actorUserId, "updated", id, { effectiveFrom: input.effectiveFrom, pattern });
    });
  }

  async setDefault(organizationId: string, actorUserId: string, id: string, date: string) {
    const effectiveFrom = this.futureDate(date);
    return this.write(async (tx) => {
      await this.ruleForDate(tx, organizationId, id, effectiveFrom);
      await tx.hrmsWorkWeekDefault.upsert({
        where: { organizationId_effectiveFrom: { organizationId, effectiveFrom } },
        create: { organizationId, ruleId: id, effectiveFrom },
        update: { ruleId: id },
      });
      await this.audit(tx, organizationId, actorUserId, "default_changed", id, { effectiveFrom: date });
    });
  }

  async assign(organizationId: string, actorUserId: string, input: AssignWorkWeekDto) {
    const effectiveFrom = this.futureDate(input.effectiveFrom);
    if (input.allEmployees && input.employeeIds !== undefined) {
      throw workWeekError("Choose either all employees or specific employees, not both.");
    }
    if (!input.allEmployees && !input.employeeIds?.length) {
      throw workWeekError("Select at least one employee.");
    }
    return this.write(async (tx) => {
      if (input.ruleId) {
        await this.ruleForDate(tx, organizationId, input.ruleId, effectiveFrom);
      }
      const employees = await tx.hrmsEmployee.findMany({
        where: { organizationId, ...(input.allEmployees ? {} : { id: { in: input.employeeIds } }), deletedAt: null },
        select: { id: true },
      });
      if (!input.allEmployees && employees.length !== input.employeeIds?.length) {
        throw workWeekError("One or more employees were not found in this organization.", HttpStatus.NOT_FOUND);
      }
      if (!employees.length) {
        throw workWeekError("No employees are available to assign.");
      }
      // Bound statement size, not employee count; replace only this date and preserve later assignments.
      for (let offset = 0; offset < employees.length; offset += 500) {
        const batch = employees.slice(offset, offset + 500);
        await tx.hrmsWorkWeekAssignment.updateMany({
          where: { organizationId, employeeId: { in: batch.map(({ id }) => id) }, effectiveFrom },
          data: { ruleId: input.ruleId },
        });
        await tx.hrmsWorkWeekAssignment.createMany({
          data: batch.map(({ id: employeeId }) => ({
            organizationId,
            employeeId,
            ruleId: input.ruleId,
            effectiveFrom,
          })),
          skipDuplicates: true,
        });
      }
      await this.audit(tx, organizationId, actorUserId, "assigned", input.ruleId ?? organizationId, {
        ...(input.allEmployees ? { allEmployees: true } : { employeeIds: input.employeeIds }),
        employeeCount: employees.length,
        effectiveFrom: input.effectiveFrom,
        ruleId: input.ruleId,
      });
    });
  }

  async assignments(organizationId: string, employeeId: string) {
    await this.employee(organizationId, employeeId);
    return this.prisma.hrmsWorkWeekAssignment.findMany({
      where: { organizationId, employeeId },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  async remove(organizationId: string, actorUserId: string, id: string) {
    return this.write(async (tx) => {
      await this.rule(tx, organizationId, id);
      const references = await tx.hrmsWorkWeekRule.findFirst({
        where: { id, organizationId },
        select: { _count: { select: { defaults: true, assignments: true } } },
      });
      if (references && (references._count.defaults || references._count.assignments)) {
        throw workWeekError(
          "This rule is used by default or assignment history and cannot be deleted. Keep it to preserve historical schedules.",
          HttpStatus.CONFLICT,
        );
      }
      await tx.hrmsWorkWeekRule.delete({ where: { id } });
      await this.audit(tx, organizationId, actorUserId, "deleted", id, {});
    });
  }

  async schedule(organizationId: string, employeeId: string, from: string, to: string) {
    await this.employee(organizationId, employeeId);
    const settings = await this.settings.get("hrms", organizationId);
    return { days: await resolveWorkWeek(this.prisma, organizationId, employeeId, from, to, settings.workingDays) };
  }

  async mySchedule(organizationId: string, userId: string, from: string, to: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) {
      throw workWeekError("You do not have an employee record.", HttpStatus.NOT_FOUND);
    }
    return this.schedule(organizationId, employee.id, from, to);
  }

  private async employee(organizationId: string, employeeId: string) {
    if (
      !(await this.prisma.hrmsEmployee.findFirst({
        where: { id: employeeId, organizationId, deletedAt: null },
        select: { id: true },
      }))
    ) {
      throw workWeekError("Employee not found.", HttpStatus.NOT_FOUND);
    }
  }

  private futureDate(value: string) {
    const date = workWeekDate(value);
    if (value < new Date().toISOString().slice(0, 10)) {
      throw workWeekError("Work-week changes must apply from today or a future date (UTC).");
    }
    return date;
  }

  private async rule(tx: Prisma.TransactionClient, organizationId: string, id: string) {
    const rule = await tx.hrmsWorkWeekRule.findFirst({ where: { id, organizationId } });
    if (!rule) {
      throw workWeekError("Work-week rule not found.", HttpStatus.NOT_FOUND);
    }
    return rule;
  }

  private async ruleForDate(tx: Prisma.TransactionClient, organizationId: string, id: string, date: Date) {
    await this.rule(tx, organizationId, id);
    if (!(await tx.hrmsWorkWeekVersion.findFirst({ where: { ruleId: id, effectiveFrom: { lte: date } } }))) {
      throw workWeekError("This rule does not take effect until after the selected date.");
    }
  }

  private audit(
    tx: Prisma.TransactionClient,
    organizationId: string,
    actorUserId: string,
    action: string,
    resourceId: string,
    metadata: Prisma.InputJsonObject,
  ) {
    return tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        action: `hrms.work_week.${action}`,
        resourceType: "HrmsWorkWeekRule",
        resourceId,
        metadata,
      },
    });
  }

  private async write<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    try {
      return await this.prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw workWeekError(
            "A rule with this name already exists, or this schedule changed. Reload and retry.",
            HttpStatus.CONFLICT,
          );
        }
        if (["P2034", "P2025", "P2003"].includes(error.code)) {
          throw workWeekError("The work-week configuration changed. Reload and retry.", HttpStatus.CONFLICT);
        }
      }
      throw error;
    }
  }
}
