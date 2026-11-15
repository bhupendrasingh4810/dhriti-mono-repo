import { HttpStatus } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type { WorkWeekPattern, WorkWeekScheduleDay } from "@dhriti/types";
import { hrmsWorkWeekPatternSchema } from "@dhriti/validation";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

const DAY = 86_400_000;
export const workWeekError = (message: string, status = HttpStatus.BAD_REQUEST) =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, status);

export function workWeekDate(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw workWeekError("Use a valid calendar date (YYYY-MM-DD).");
  }
  return date;
}

export function workWeekPattern(value: unknown): WorkWeekPattern {
  const result = hrmsWorkWeekPatternSchema.safeParse(value);
  if (!result.success) {
    throw workWeekError("A work week requires five rows of seven working, half-day or off days.");
  }
  return result.data;
}

export const legacyWorkWeekPattern = (days: number[]): WorkWeekPattern =>
  Array.from({ length: 5 }, () =>
    Array.from({ length: 7 }, (_, index) => (days.includes(index + 1) ? "WORKING" : "OFF")),
  );

/** Monday-first columns; nth weekday occurrence resets at the beginning of each calendar month. */
export function workWeekUnits(pattern: WorkWeekPattern, date: Date) {
  const kind = pattern[Math.floor((date.getUTCDate() - 1) / 7)][(date.getUTCDay() + 6) % 7];
  return { kind, units: kind === "WORKING" ? 1 : kind === "HALF_DAY" ? 0.5 : 0 };
}

export async function resolveWorkWeek(
  db: Prisma.TransactionClient,
  organizationId: string,
  employeeId: string,
  from: string,
  to: string,
  fallbackDays: number[],
): Promise<WorkWeekScheduleDay[]> {
  const start = workWeekDate(from);
  const end = workWeekDate(to);
  if (end < start || (end.getTime() - start.getTime()) / DAY > 365) {
    throw workWeekError("Choose a schedule range of at most 366 days.");
  }
  const [defaults, assignments, rules] = await Promise.all([
    db.hrmsWorkWeekDefault.findMany({
      where: { organizationId, effectiveFrom: { lte: end } },
      orderBy: { effectiveFrom: "desc" },
    }),
    db.hrmsWorkWeekAssignment.findMany({
      where: { organizationId, employeeId, effectiveFrom: { lte: end } },
      orderBy: { effectiveFrom: "desc" },
    }),
    db.hrmsWorkWeekRule.findMany({
      where: { organizationId },
      include: { versions: { where: { effectiveFrom: { lte: end } }, orderBy: { effectiveFrom: "desc" } } },
    }),
  ]);
  const fallback = legacyWorkWeekPattern(fallbackDays);
  const byId = new Map(rules.map((rule) => [rule.id, rule]));
  const days: WorkWeekScheduleDay[] = [];
  for (let time = start.getTime(); time <= end.getTime(); time += DAY) {
    const date = new Date(time);
    const assignment = assignments.find((item) => item.effectiveFrom <= date);
    const ruleId = assignment?.ruleId ?? defaults.find((item) => item.effectiveFrom <= date)?.ruleId ?? null;
    const rule = ruleId ? byId.get(ruleId) : null;
    const version = rule?.versions.find((item) => item.effectiveFrom <= date);
    if (ruleId && (!rule || !version)) {
      throw workWeekError("The assigned work week has no version for this date. Contact HR.", HttpStatus.CONFLICT);
    }
    days.push({
      date: date.toISOString().slice(0, 10),
      ...workWeekUnits(version ? workWeekPattern(version.pattern) : fallback, date),
      ruleId,
      ruleName: rule?.name ?? null,
      versionId: version?.id ?? null,
    });
  }
  return days;
}

/** The submitted total must match full scheduled units, or a single 0.5-day request on a full working day. */
export function workWeekLeaveAllocation(days: WorkWeekScheduleDay[], total: number, allowHalfDay: boolean) {
  const scheduled = days.reduce((sum, day) => sum + day.units, 0);
  const discretionaryHalf = days.length === 1 && scheduled === 1 && total === 0.5;
  if (total <= 0 || (total !== scheduled && !(discretionaryHalf && allowHalfDay))) {
    throw workWeekError(
      `Leave must match the applicable work week (${scheduled} scheduled day(s)). Reload the dates and try again.`,
    );
  }
  return days.map((day) => ({
    date: day.date,
    units: discretionaryHalf ? 0.5 : day.units,
    ruleId: day.ruleId,
    versionId: day.versionId,
  }));
}
