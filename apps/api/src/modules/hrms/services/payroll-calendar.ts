export const PAYROLL_FREQUENCIES = ["MONTHLY", "WEEKLY", "BIWEEKLY", "SEMIMONTHLY"] as const;
export type PayrollFrequency = (typeof PAYROLL_FREQUENCIES)[number];
type CalendarProfile = { frequency: string; calendarAnchor?: Date | null; payDateOffset?: number };
const DAY = 86_400_000;
const iso = (value: Date) => value.toISOString().slice(0, 10);
const addDays = (value: Date, days: number) => new Date(value.getTime() + days * DAY);

function dateOnly(value: string) {
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(date.getTime()) || iso(date) !== value) {
    throw new Error("Select a valid calendar date");
  }
  return date;
}

/** Profiles are append-only calendars. Date keys are canonical starts, never arbitrary labels. */
export function payrollPeriod(profile: CalendarProfile, key: string) {
  if (!PAYROLL_FREQUENCIES.some((value) => value === profile.frequency)) {
    throw new Error("Unsupported payroll frequency");
  }
  const offset = profile.payDateOffset ?? 0;
  if (!Number.isInteger(offset) || offset < 0 || offset > 60) {
    throw new Error("Pay-date offset must be 0–60 calendar days");
  }
  let start: Date;
  let end: Date;
  if (profile.frequency === "MONTHLY") {
    if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(key)) {
      throw new Error("Select a valid payroll month");
    }
    start = dateOnly(`${key}-01`);
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
  } else {
    start = dateOnly(key);
    if (profile.frequency === "SEMIMONTHLY") {
      if (![1, 16].includes(start.getUTCDate())) {
        throw new Error("Twice-monthly periods must start on day 1 or 16");
      }
      end =
        start.getUTCDate() === 1
          ? addDays(start, 14)
          : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0));
    } else {
      if (!profile.calendarAnchor) {
        throw new Error("Weekly calendars require an anchor date");
      }
      const length = profile.frequency === "WEEKLY" ? 7 : 14;
      const distance = (start.getTime() - profile.calendarAnchor.getTime()) / DAY;
      if (!Number.isInteger(distance) || distance % length !== 0) {
        throw new Error("Period start does not align with the configured calendar anchor");
      }
      end = addDays(start, length - 1);
    }
  }
  const payDate = addDays(end, offset);
  if (end.getUTCFullYear() > 9999 || payDate.getUTCFullYear() > 9999) {
    throw new Error("Calendar exceeds supported date range");
  }
  return { key, start: iso(start), end: iso(end), payDate: iso(payDate), frequency: profile.frequency };
}

/** List periods intersecting the year, including a cross-year anchored period. */
export function payrollCalendar(profile: CalendarProfile & { effectiveFrom: Date }, year: number) {
  if (!Number.isInteger(year) || year < 1000 || year > 9998) {
    throw new Error("Calendar year must be between 1000 and 9998");
  }
  const first = new Date(Date.UTC(year, 0, 1));
  const last = new Date(Date.UTC(year, 11, 31));
  const periods = [];
  if (profile.frequency === "MONTHLY" || profile.frequency === "SEMIMONTHLY") {
    for (let month = 1; month <= 12; month++) {
      const key = `${year}-${String(month).padStart(2, "0")}`;
      if (profile.frequency === "MONTHLY") {
        periods.push(payrollPeriod(profile, key));
      } else {
        for (const day of ["01", "16"]) {
          periods.push(payrollPeriod(profile, `${key}-${day}`));
        }
      }
    }
  } else {
    if (!profile.calendarAnchor) {
      throw new Error("Weekly calendars require an anchor date");
    }
    const length = profile.frequency === "WEEKLY" ? 7 : 14;
    const elapsed = Math.floor((first.getTime() - profile.calendarAnchor.getTime()) / DAY / length);
    for (let start = addDays(profile.calendarAnchor, elapsed * length); start <= last; start = addDays(start, length)) {
      periods.push(payrollPeriod(profile, iso(start)));
    }
  }
  return periods.filter((period) => new Date(period.start) >= profile.effectiveFrom);
}
