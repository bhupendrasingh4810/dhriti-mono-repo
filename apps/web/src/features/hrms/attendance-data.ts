import dayjs, { type Dayjs } from "dayjs";

import type {
  HrmsAttendanceRecord,
  HrmsAttendanceRegularization,
  HrmsRegularizationStatus,
  HrmsRegularizationType,
} from "@/services/hrms.service";

/** View models for the attendance log, derived from HRMS attendance records. */
export type AttendanceStatus =
  | "Present"
  | "Late"
  | "Absent"
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
 */
export function buildAttendanceRange(
  start: Dayjs,
  end: Dayjs,
  records: HrmsAttendanceRecord[],
  workingDays: number[],
): AttendanceDay[] {
  const byDate = new Map(records.map((record) => [recordKey(record), record]));
  const days: AttendanceDay[] = [];
  for (let cursor = start.startOf("day"); !cursor.isAfter(end, "day"); cursor = cursor.add(1, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    const record = byDate.get(key);
    const base = { key, date: cursor };
    if (record) {
      const open = Boolean(record.checkIn && !record.checkOut);
      days.push({
        ...base,
        clockIn: formatTime(record.checkIn),
        clockOut: formatTime(record.checkOut),
        workMinutes: Math.round((record.workHours ?? 0) * 60),
        status: open ? "Working" : (recordStatusLabels[record.status] ?? "Present"),
      });
      continue;
    }
    const empty = { ...base, clockIn: "—", clockOut: "—", workMinutes: 0 };
    if (!workingDays.includes(cursor.day() || 7)) days.push({ ...empty, status: "Weekly off" });
    else if (cursor.isAfter(dayjs(), "day")) days.push({ ...empty, status: "Upcoming" });
    else if (cursor.isSame(dayjs(), "day")) days.push({ ...empty, status: "Not clocked in" });
    else days.push({ ...empty, status: "Absent" });
  }
  return days;
}

export const formatWorkMinutes = (minutes: number) => (minutes ? `${Math.floor(minutes / 60)}h ${String(minutes % 60).padStart(2, "0")}m` : "—");

export type { HrmsAttendanceRegularization };
