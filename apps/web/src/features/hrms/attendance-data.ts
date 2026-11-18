import dayjs, { type Dayjs } from "dayjs";
import type { WorkWeekScheduleDay } from "@dhriti/types";

import type {
  HrmsAttendanceRecord,
  HrmsAttendanceRegularization,
  HrmsLeaveCenterRequest,
  HrmsRegularizationStatus,
  HrmsRegularizationType,
} from "@/services/hrms.service";

/** View models for the attendance log, derived from HRMS attendance records. */
export type AttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
  | "Half-day absent"
  | "Working"
  | "Not clocked in"
  | "Half day"
  | "Work from home"
  | "On leave"
  | "Holiday"
  | "Weekly off"
  | "Upcoming";

export interface AttendanceDay {
  key: string;
  date: Dayjs;
  clockIn: string;
  clockOut: string;
  workMinutes: number;
  status: AttendanceStatus;
  scheduledUnits?: number;
  leaveUnits?: number;
}

/**
 * Use the approved request's saved date allocation, not today's schedule. Legacy full
 * calendar ranges and single half-days are exact; ambiguous legacy splits need correction.
 */
export function approvedLeaveByDate(
  requests: Pick<HrmsLeaveCenterRequest, "status" | "startDate" | "endDate" | "totalDays" | "dayAllocation">[],
): Map<string, number> {
  const result = new Map<string, number>();
  for (const request of requests) {
    if (request.status !== "APPROVED") continue;
    const first = dayjs(request.startDate.slice(0, 10));
    const last = dayjs(request.endDate.slice(0, 10));
    const span = last.diff(first, "day") + 1;
    if (!first.isValid() || !last.isValid() || span < 1 || !Number.isInteger(span)) {
      throw new Error("Approved leave has an invalid date range.");
    }
    let allocation = request.dayAllocation;
    if (allocation == null) {
      if (request.totalDays !== span && !(span === 1 && request.totalDays === 0.5)) {
        throw new Error("Approved leave needs a per-date allocation before attendance can be displayed.");
      }
      allocation = Array.from({ length: span }, (_, index) => ({
        date: first.add(index, "day").format("YYYY-MM-DD"),
        units: span === 1 ? request.totalDays : 1,
      }));
    }
    if (!Array.isArray(allocation) || allocation.length !== span) {
      throw new Error("Approved leave has an invalid per-date allocation.");
    }
    const seen = new Set<string>();
    let total = 0;
    for (const entry of allocation) {
      if (
        !entry || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date) ||
        ![0, 0.5, 1].includes(entry.units) ||
        !dayjs(entry.date).isValid() || dayjs(entry.date).format("YYYY-MM-DD") !== entry.date ||
        entry.date < first.format("YYYY-MM-DD") || entry.date > last.format("YYYY-MM-DD") ||
        seen.has(entry.date)
      ) {
        throw new Error("Approved leave has an invalid per-date allocation.");
      }
      seen.add(entry.date);
      total += entry.units;
      if (entry.units > 0) result.set(entry.date, Math.min(1, (result.get(entry.date) ?? 0) + entry.units));
    }
    if (total !== request.totalDays) throw new Error("Approved leave allocation does not match its total days.");
  }
  return result;
}

export const regularizationTypeLabels: Record<HrmsRegularizationType, string> = {
  MISSED_CLOCK_IN: "Missed clock-in",
  MISSED_CLOCK_OUT: "Missed clock-out",
  LATE_ARRIVAL: "Late arrival",
  WORK_FROM_CLIENT_SITE: "Work from client site",
  OTHER: "Other",
};
export const regularizationTypes = Object.keys(regularizationTypeLabels) as HrmsRegularizationType[];
export const regularizationStatusLabels: Record<HrmsRegularizationStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

const recordStatusLabels: Record<string, AttendanceStatus> = {
  PRESENT: "Present",
  LATE: "Late",
  ABSENT: "Absent",
  HALF_DAY: "Half day",
  WORK_FROM_HOME: "Work from home",
  ON_LEAVE: "On leave",
  HOLIDAY: "Holiday",
};

const formatTime = (value: string | null) => (value ? dayjs(value).format("HH:mm") : "—");

/** Attendance record dates are calendar days serialized as UTC midnight, so compare their YYYY-MM-DD prefix. */
export const recordKey = (record: Pick<HrmsAttendanceRecord, "date">) => record.date.slice(0, 10);

/**
 * One row per calendar day in the range. Days without a record are weekly off (outside the organization's
 * ISO working days, 1 = Monday … 7 = Sunday), upcoming, not-yet-clocked-in (today) or absent.
 * Approved leave suppresses absence only for covered units; actual punches remain visible.
 */
export function buildAttendanceRange(
  start: Dayjs,
  end: Dayjs,
  records: HrmsAttendanceRecord[],
  workingDays: number[],
  schedule?: WorkWeekScheduleDay[],
  approvedLeave: ReadonlyMap<string, number> = new Map(),
): AttendanceDay[] {
  const byDate = new Map(records.map((record) => [recordKey(record), record]));
  const days: AttendanceDay[] = [];
  const scheduleByDate = new Map(schedule?.map((day) => [day.date, day]));
  for (let cursor = start.startOf("day"); !cursor.isAfter(end, "day"); cursor = cursor.add(1, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    const record = byDate.get(key);
    const scheduled = scheduleByDate.get(key);
    const leaveUnits = approvedLeave.get(key) ?? 0;
    const scheduledUnits = scheduled?.units ?? (workingDays.includes(cursor.day() || 7) ? 1 : 0);
    const fullyCovered = leaveUnits > 0 && leaveUnits >= scheduledUnits;
    const base = { key, date: cursor, leaveUnits, ...(scheduled ? { scheduledUnits: scheduled.units } : {}) };
    if (record) {
      const open = Boolean(record.checkIn && !record.checkOut);
      days.push({
        ...base,
        clockIn: formatTime(record.checkIn),
        clockOut: formatTime(record.checkOut),
        workMinutes: Math.round((record.workHours ?? 0) * 60),
        status: open ? "Working" : record.status === "ABSENT" && fullyCovered
          ? "On leave"
          : record.status === "ABSENT" && leaveUnits === 0.5
            ? "Half-day absent"
            : (recordStatusLabels[record.status] ?? "Present"),
      });
      continue;
    }
    const empty = { ...base, clockIn: "—", clockOut: "—", workMinutes: 0 };
    if (fullyCovered) days.push({ ...empty, status: "On leave" });
    else if (scheduled ? scheduled.units === 0 : !workingDays.includes(cursor.day() || 7)) days.push({ ...empty, status: "Weekly off" });
    else if (cursor.isAfter(dayjs(), "day")) days.push({ ...empty, status: "Upcoming" });
    else if (cursor.isSame(dayjs(), "day")) days.push({ ...empty, status: "Not clocked in" });
    else days.push({ ...empty, status: leaveUnits === 0.5 ? "Half-day absent" : "Absent" });
  }
  return days;
}

export const formatWorkMinutes = (minutes: number) => (minutes ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m` : "—");

export type { HrmsAttendanceRegularization };
