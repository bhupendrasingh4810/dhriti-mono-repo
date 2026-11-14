import { Prisma } from "@prisma/client";
import type { SalaryComponentDto } from "../dto/hrms-payroll-workspace.dto";

export type CalculatedComponent = { code: string; name: string; type: string; amount: string };

/** Decimal arithmetic and explicit ordered references; no expression evaluator or binary floating-point money. */
export function calculateSalary(grossInput: string, components: SalaryComponentDto[], precision: number) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 3) {
    throw new Error("Invalid currency precision");
  }
  const gross = new Prisma.Decimal(grossInput).toDecimalPlaces(precision, Prisma.Decimal.ROUND_HALF_UP);
  if (!gross.isFinite() || !gross.gt(0)) {
    throw new Error("Monthly gross must be greater than zero at currency precision");
  }
  const amounts = new Map<string, Prisma.Decimal>();
  const lines: CalculatedComponent[] = [];
  let earnings = new Prisma.Decimal(0);
  let deductions = new Prisma.Decimal(0);
  let employer = new Prisma.Decimal(0);
  for (const component of components) {
    if (amounts.has(component.code)) {
      throw new Error(`Duplicate component: ${component.code}`);
    }
    const value = new Prisma.Decimal(component.value);
    if (!value.isFinite() || value.isNegative()) {
      throw new Error("Component values must be finite and nonnegative");
    }
    let amount: Prisma.Decimal;
    switch (component.calculation) {
      case "FIXED":
        amount = value;
        break;
      case "PERCENT_GROSS":
        amount = gross.mul(value).div(100);
        break;
      case "PERCENT_COMPONENT": {
        const basis = component.basis ? amounts.get(component.basis) : undefined;
        if (!basis) {
          throw new Error(`Component ${component.code} must reference an earlier component`);
        }
        amount = basis.mul(value).div(100);
        break;
      }
      case "REMAINDER":
        if (component.type !== "EARNING") {
          throw new Error("Only earnings can use a remainder");
        }
        amount = gross.minus(earnings);
        break;
      default:
        throw new Error("Unsupported salary formula");
    }
    amount = amount.toDecimalPlaces(precision, Prisma.Decimal.ROUND_HALF_UP);
    if (amount.isNegative()) {
      throw new Error(`Negative amount for ${component.code}`);
    }
    amounts.set(component.code, amount);
    if (component.type === "EARNING") {
      earnings = earnings.plus(amount);
    } else if (component.type === "DEDUCTION") {
      deductions = deductions.plus(amount);
    } else {
      employer = employer.plus(amount);
    }
    lines.push({ code: component.code, name: component.name, type: component.type, amount: amount.toFixed(precision) });
  }
  if (!earnings.eq(gross.toDecimalPlaces(precision))) {
    throw new Error("Earning components must equal monthly gross; add a remainder earning");
  }
  if (deductions.gt(earnings)) {
    throw new Error("Deductions exceed gross pay");
  }
  return {
    lines,
    gross: earnings.toFixed(precision),
    deductions: deductions.toFixed(precision),
    employer: employer.toFixed(precision),
    monthlyCtc: earnings.plus(employer).toFixed(precision),
    annualCtc: earnings.plus(employer).mul(12).toFixed(precision),
    net: earnings.minus(deductions).toFixed(precision),
  };
}

export function readComponents(value: Prisma.JsonValue): SalaryComponentDto[] {
  if (!Array.isArray(value)) {
    throw new Error("Invalid stored salary components");
  }
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Invalid salary component");
    }
    const { code, name, type, calculation, value: amount, basis } = item;
    if (
      typeof code !== "string" ||
      typeof name !== "string" ||
      typeof amount !== "string" ||
      (type !== "EARNING" && type !== "DEDUCTION" && type !== "EMPLOYER") ||
      (calculation !== "FIXED" &&
        calculation !== "PERCENT_GROSS" &&
        calculation !== "PERCENT_COMPONENT" &&
        calculation !== "REMAINDER") ||
      (basis !== undefined && typeof basis !== "string")
    ) {
      throw new Error("Invalid stored salary component");
    }
    return { code, name, type, calculation, value: amount, ...(basis ? { basis } : {}) };
  });
}

const DAY_MS = 86_400_000;
const dayNumber = (date: Date) => Math.floor(date.getTime() / DAY_MS);

export type CalendarSalaryRevision = {
  id: string;
  effectiveFrom: Date;
  monthlyGross: string;
  profileId: string;
  components: SalaryComponentDto[];
};
export type PayrollLeave = { id?: string; startDate: Date; endDate: Date; totalDays: number };

/**
 * Calendar policy includes weekends/holidays and the joining/leaving dates.
 * All recurring components, including fixed deductions, are prorated. Round only
 * after aggregating each component across revisions for legacy monthly runs.
 * Non-monthly runs use cumulative monthly rounding differences per day so complete
 * month partitions preserve each contractual component. Retain the day/month basis.
 * Leave ranges with unspecified per-date allocation must not be guessed.
 */
export function calculateCalendarSalary(input: {
  start: Date;
  end: Date;
  employmentStart: Date | null;
  employmentEnd: Date | null;
  profileId: string;
  revisions: CalendarSalaryRevision[];
  unpaidLeave: PayrollLeave[];
  precision: number;
  allocation?: "MONTHLY_CALENDAR";
}) {
  const first = dayNumber(input.start);
  const last = dayNumber(input.end);
  const periodDays = last - first + 1;
  if (!Number.isInteger(periodDays) || periodDays < 1 || periodDays > 31) {
    throw new Error("Invalid calendar payroll period");
  }
  const employmentFirst = Math.max(first, input.employmentStart ? dayNumber(input.employmentStart) : first);
  const employmentLast = Math.min(last, input.employmentEnd ? dayNumber(input.employmentEnd) : last);
  if (employmentLast < employmentFirst) {
    throw new Error("Employee employment dates do not overlap this payroll period");
  }
  const unpaidByDay = new Map<number, number>();
  for (const leave of input.unpaidLeave) {
    const from = dayNumber(leave.startDate);
    const to = dayNumber(leave.endDate);
    if (to < employmentFirst || from > employmentLast) {
      continue;
    }
    const span = to - from + 1;
    if (span < 1 || (leave.totalDays !== span && !(span === 1 && leave.totalDays === 0.5))) {
      throw new Error(
        "Unpaid leave needs explicit calendar-date allocation: use full calendar ranges or single half-days",
      );
    }
    for (let day = Math.max(from, employmentFirst); day <= Math.min(to, employmentLast); day++) {
      if (unpaidByDay.has(day)) {
        throw new Error("Overlapping unpaid leave must be resolved before payroll");
      }
      unpaidByDay.set(day, span === 1 ? leave.totalDays : 1);
    }
  }
  const revisions = [...input.revisions].sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
  const segments = new Map<
    string,
    {
      revision: CalendarSalaryRevision;
      calendarDays: number;
      unpaidDays: number;
      days: number[];
      month: string;
      monthDays: number;
    }
  >();
  for (let day = employmentFirst; day <= employmentLast; day++) {
    const revision = revisions.find((item) => dayNumber(item.effectiveFrom) <= day);
    if (!revision) {
      throw new Error("Salary assignment is missing for employed days; add the applicable effective-dated salary");
    }
    if (revision.profileId !== input.profileId) {
      throw new Error("Mid-period pay-group transfers require a dedicated settlement; split at a period boundary");
    }
    const date = new Date(day * DAY_MS);
    const month = date.toISOString().slice(0, 7);
    const monthDays = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
    const key = input.allocation ? `${revision.id}:${month}` : revision.id;
    const segment = segments.get(key) ?? { revision, calendarDays: 0, unpaidDays: 0, days: [], month, monthDays };
    segment.calendarDays++;
    segment.unpaidDays += unpaidByDay.get(day) ?? 0;
    segment.days.push(day);
    segments.set(key, segment);
  }
  const totals = new Map<string, { line: CalculatedComponent; amount: Prisma.Decimal }>();
  const basis = [];
  let contractual: ReturnType<typeof calculateSalary> | undefined;
  for (const { revision, calendarDays, unpaidDays, days, month, monthDays } of segments.values()) {
    const monthly = calculateSalary(revision.monthlyGross, revision.components, input.precision);
    contractual = monthly;
    const payableDays = calendarDays - unpaidDays;
    basis.push({
      assignmentId: revision.id,
      effectiveFrom: revision.effectiveFrom.toISOString().slice(0, 10),
      monthlyGross: monthly.gross,
      calendarDays,
      unpaidDays,
      payableDays,
      ...(input.allocation ? { month, monthDays } : {}),
    });
    for (const line of monthly.lines) {
      const key = `${line.code}:${line.type}:${line.name}`;
      const total = totals.get(key) ?? { line, amount: new Prisma.Decimal(0) };
      // Cumulative month-to-date rounding assigns minor units deterministically to days,
      // so disjoint full-employment periods sum exactly to the configured monthly component.
      const amount = input.allocation
        ? days.reduce((sum, day) => {
            const n = new Date(day * DAY_MS).getUTCDate();
            const monthlyAmount = new Prisma.Decimal(line.amount);
            const cumulative = (count: number) =>
              monthlyAmount.mul(count).div(monthDays).toDecimalPlaces(input.precision, Prisma.Decimal.ROUND_HALF_UP);
            return sum.plus(
              cumulative(n)
                .minus(cumulative(n - 1))
                .mul(1 - (unpaidByDay.get(day) ?? 0)),
            );
          }, new Prisma.Decimal(0))
        : new Prisma.Decimal(line.amount).mul(payableDays).div(periodDays);
      total.amount = total.amount.plus(amount);
      totals.set(key, total);
    }
  }
  if (!contractual) {
    throw new Error("No salary applies to this payroll period");
  }
  const lines = [...totals.values()].map(({ line, amount }) => ({
    ...line,
    amount: amount.toDecimalPlaces(input.precision, Prisma.Decimal.ROUND_HALF_UP).toFixed(input.precision),
  }));
  const sum = (type: string) =>
    lines.filter((line) => line.type === type).reduce((total, line) => total.plus(line.amount), new Prisma.Decimal(0));
  const gross = sum("EARNING");
  const deductions = sum("DEDUCTION");
  if (deductions.gt(gross)) {
    throw new Error("Rounded prorated deductions exceed earnings");
  }
  return {
    lines,
    gross: gross.toFixed(input.precision),
    deductions: deductions.toFixed(input.precision),
    employer: sum("EMPLOYER").toFixed(input.precision),
    net: gross.minus(deductions).toFixed(input.precision),
    monthlyCtc: contractual.monthlyCtc,
    annualCtc: contractual.annualCtc,
    proration: {
      policy: "CALENDAR_DAYS" as const,
      ...(input.allocation ? { allocation: input.allocation } : {}),
      periodDays,
      employmentDays: employmentLast - employmentFirst + 1,
      employmentFrom: new Date(employmentFirst * DAY_MS).toISOString().slice(0, 10),
      employmentThrough: new Date(employmentLast * DAY_MS).toISOString().slice(0, 10),
      unpaidDays: [...unpaidByDay.values()].reduce((total, days) => total + days, 0),
      unpaidLeave: input.unpaidLeave
        .filter((leave) => dayNumber(leave.endDate) >= employmentFirst && dayNumber(leave.startDate) <= employmentLast)
        .map((leave) => ({
          ...(leave.id ? { requestId: leave.id } : {}),
          from: leave.startDate.toISOString().slice(0, 10),
          through: leave.endDate.toISOString().slice(0, 10),
          totalDays: leave.totalDays,
        })),
      segments: basis,
    },
    unpaidDates: [...unpaidByDay.keys()].filter((day) => unpaidByDay.get(day) === 1),
  };
}
