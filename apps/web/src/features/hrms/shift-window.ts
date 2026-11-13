import type { ShiftTimes } from "./shift-format";

const MS_PER_MINUTE = 60_000;
const MS_PER_DAY = 86_400_000;

/** Shift with its IANA zone; "HH:mm" times are wall-clock in that zone, not the browser's. */
export interface ZonedShift extends ShiftTimes {
  timeZone: string;
}

/** Offset (zone - UTC) in ms at `instant`. Mirrors the API's `shift-time.ts`; keep both in sync. */
function zoneOffsetMs(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(instant));
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(value("year"), value("month") - 1, value("day"), value("hour"), value("minute"), value("second"));
  return asUtc - Math.floor(instant / 1000) * 1000;
}

const localDate = (instant: number, timeZone: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instant));

export const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * MS_PER_DAY).toISOString().slice(0, 10);

export function zonedInstant(date: string, time: string, timeZone: string): number {
  const [year = 0, month = 1, day = 1] = date.split("-").map(Number);
  const [hours = 0, minutes = 0] = time.split(":").map(Number);
  const guess = Date.UTC(year, month - 1, day, hours, minutes);
  const first = guess - zoneOffsetMs(guess, timeZone);
  return guess - zoneOffsetMs(first, timeZone);
}

/** Start of the shift occurrence nearest to `now` (yesterday or today in the shift's zone). */
export function nearestShiftStart(shift: ZonedShift, now: number): number {
  const today = localDate(now, shift.timeZone);
  return [addDays(today, -1), today]
    .map((date) => zonedInstant(date, shift.startTime, shift.timeZone))
    .reduce((best, candidate) => (Math.abs(candidate - now) < Math.abs(best - now) ? candidate : best));
}

/** Shift end for the occurrence starting at `start`; an end at or before the start falls on the next day. */
export function shiftEnd(shift: ZonedShift, start: number): number {
  const startDate = localDate(start, shift.timeZone);
  const end = zonedInstant(startDate, shift.endTime, shift.timeZone);
  return end <= start ? zonedInstant(addDays(startDate, 1), shift.endTime, shift.timeZone) : end;
}

/** Time of day in the shift's zone, e.g. "9:00 AM". */
export function formatInZone(instant: number, timeZone?: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(instant));
}

export interface ClockInRules {
  attendanceClockInWindowMinutes: number;
  missedClockInAlertEnabled: boolean;
  missedClockInAlertMinutes: number;
  missedClockInAlertRepeatSeconds: number;
}

export const clockInOpensAt = (shiftStart: number, rules: Pick<ClockInRules, "attendanceClockInWindowMinutes">) =>
  shiftStart - rules.attendanceClockInWindowMinutes * MS_PER_MINUTE;

/** True once the missed-clock-in alert threshold has passed and the shift has not yet ended. */
export function isMissedClockIn(shift: ZonedShift, rules: ClockInRules, now: number): boolean {
  if (!rules.missedClockInAlertEnabled) {
    return false;
  }
  const start = nearestShiftStart(shift, now);
  return now >= start + rules.missedClockInAlertMinutes * MS_PER_MINUTE && now < shiftEnd(shift, start);
}
