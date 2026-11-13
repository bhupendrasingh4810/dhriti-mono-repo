/**
 * Shift attendance rules. Shift times are wall-clock "HH:mm" with no zone, so callers supply the
 * employee's IANA time zone (sent by the client at clock-in) to turn them into instants.
 */

const MS_PER_MINUTE = 60_000;

/** Offset (local - UTC) in ms of `timeZone` at the given instant. Throws RangeError for an unknown zone. */
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

export function isValidTimeZone(timeZone: string): boolean {
  try {
    zoneOffsetMs(Date.now(), timeZone);
    return true;
  } catch {
    return false;
  }
}

/** Instant at which the wall-clock `time` on calendar `date` (YYYY-MM-DD) occurs in `timeZone`. */
export function zonedInstant(date: string, time: string, timeZone: string): number {
  const [year, month, day] = date.split("-").map(Number) as [number, number, number];
  const [hours, minutes] = time.split(":").map(Number) as [number, number];
  const guess = Date.UTC(year, month - 1, day, hours, minutes);
  const first = guess - zoneOffsetMs(guess, timeZone);
  return guess - zoneOffsetMs(first, timeZone);
}

/** Calendar date (YYYY-MM-DD) of `instant` in `timeZone`. */
export function localDate(instant: number, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(instant));
}

const addDays = (date: string, days: number) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

/**
 * The shift occurrence closest to `now`, considering the day before and the clock-in day, so a night shift that
 * began yesterday evening is still the relevant one after midnight.
 */
export function nearestShiftStart(now: number, localDate: string, startTime: string, timeZone: string): number {
  return [addDays(localDate, -1), localDate]
    .map((date) => zonedInstant(date, startTime, timeZone))
    .reduce((best, candidate) => (Math.abs(candidate - now) < Math.abs(best - now) ? candidate : best));
}

/** Thresholds come from the organization's HRMS settings. */
export const opensAt = (shiftStart: number, windowMinutes: number) => shiftStart - windowMinutes * MS_PER_MINUTE;
export const isLate = (shiftStart: number, clockIn: number, lateAfterMinutes: number) =>
  clockIn - shiftStart > lateAfterMinutes * MS_PER_MINUTE;
