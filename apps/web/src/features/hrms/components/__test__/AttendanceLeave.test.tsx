import dayjs from "dayjs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { approvedLeaveByDate, buildAttendanceRange } from "../../attendance-data";
import type { HrmsAttendanceRecord } from "@/services/hrms.service";
import type { WorkWeekScheduleDay } from "@dhriti/types";

const date = "2026-11-16";
type Leave = Parameters<typeof approvedLeaveByDate>[0][number];
const leave: Leave = {
  status: "APPROVED",
  startDate: `${date}T00:00:00.000Z`,
  endDate: `${date}T00:00:00.000Z`,
  totalDays: 1,
  dayAllocation: [{ date, units: 1 }],
};
const record: HrmsAttendanceRecord = {
  id: "attendance",
  employeeId: "employee",
  date: leave.startDate,
  checkIn: null,
  checkOut: null,
  status: "ABSENT",
  workHours: null,
  breakMinutes: 0,
  breakStartedAt: null,
  notes: null,
};
const range = (requests: Leave[] = [leave], records: HrmsAttendanceRecord[] = []) =>
  buildAttendanceRange(dayjs(date), dayjs(date), records, [1, 2, 3, 4, 5], undefined, approvedLeaveByDate(requests));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-18T12:00:00Z"));
});
afterEach(() => vi.useRealTimers());

describe("approved leave in attendance", () => {
  it("shows on leave for a missing attendance record and suppresses a stored absence", () => {
    expect(range()[0].status).toBe("On leave");
    expect(range([leave], [record])[0].status).toBe("On leave");
  });

  it.each<Leave["status"]>(["PENDING", "NEEDS_INFO", "REJECTED", "CANCELLED", "WITHDRAWN"])(
    "does not suppress absence for %s leave",
    (status) => expect(range([{ ...leave, status }])[0].status).toBe("Absent"),
  );

  it("marks only the uncovered half absent", () => {
    const half = { ...leave, totalDays: 0.5, dayAllocation: [{ date, units: 0.5 }] };
    expect(range([half])[0]).toMatchObject({ status: "Half-day absent", leaveUnits: 0.5 });
    expect(range([half], [record])[0].status).toBe("Half-day absent");
  });

  it("preserves actual worked time and open punches", () => {
    const worked = { ...record, status: "PRESENT", checkIn: `${date}T09:00:00Z`, checkOut: `${date}T13:00:00Z`, workHours: 4 };
    expect(range([leave], [worked])[0]).toMatchObject({ status: "Present", workMinutes: 240 });
    expect(range([leave], [{ ...worked, checkOut: null }])[0].status).toBe("Working");
  });

  it("does not cover unallocated dates in a multi-day request", () => {
    const units = approvedLeaveByDate([{
      ...leave,
      endDate: "2026-11-17",
      dayAllocation: [{ date, units: 0 }, { date: "2026-11-17", units: 1 }],
    }]);
    const rows = buildAttendanceRange(dayjs(date), dayjs("2026-11-17"), [], [1, 2, 3, 4, 5], undefined, units);
    expect(rows.map((row) => row.status)).toEqual(["Absent", "On leave"]);
  });

  it("does not extend approval outside its date boundaries", () => {
    const rows = buildAttendanceRange(
      dayjs("2026-11-15"), dayjs("2026-11-17"), [], [1, 2, 3, 4, 5],
      undefined, approvedLeaveByDate([leave]),
    );
    expect(rows.map((row) => row.status)).toEqual(["Weekly off", "On leave", "Absent"]);
  });

  it("restores normal absence after an approved request is cancelled", () => {
    expect(range()[0].status).toBe("On leave");
    expect(range([{ ...leave, status: "CANCELLED" }], [record])[0].status).toBe("Absent");
  });

  it("retains normal today/future statuses for the uncovered half", () => {
    const half = { ...leave, totalDays: 0.5, dayAllocation: [{ date, units: 0.5 }] };
    vi.setSystemTime(new Date("2026-11-16T12:00:00Z"));
    expect(range([half])[0]).toMatchObject({ status: "Not clocked in", leaveUnits: 0.5 });
    vi.setSystemTime(new Date("2026-11-15T12:00:00Z"));
    expect(range([half])[0].status).toBe("Upcoming");
  });

  it("fully covers an applicable half-day work schedule with half-day leave", () => {
    const half = { ...leave, totalDays: 0.5, dayAllocation: [{ date, units: 0.5 }] };
    const schedule: WorkWeekScheduleDay[] = [{
      date, units: 0.5, kind: "HALF_DAY", ruleId: null, ruleName: null, versionId: null,
    }];
    expect(buildAttendanceRange(dayjs(date), dayjs(date), [], [1], schedule, approvedLeaveByDate([half]))[0].status).toBe("On leave");
  });

  it("supports exact legacy full-day and half-day requests", () => {
    expect(range([{ ...leave, dayAllocation: null }])[0].status).toBe("On leave");
    expect(approvedLeaveByDate([{ ...leave, totalDays: 0.5, dayAllocation: null }]).get(date)).toBe(0.5);
  });

  it("surfaces ambiguous legacy and invalid saved allocation instead of inventing absence", () => {
    expect(() => approvedLeaveByDate([{ ...leave, endDate: "2026-11-18", dayAllocation: null }])).toThrow("per-date allocation");
    expect(() => approvedLeaveByDate([{ ...leave, totalDays: 0.5 }])).toThrow("total days");
    expect(() => approvedLeaveByDate([{ ...leave, dayAllocation: [{ date: "2026-11-17", units: 1 }] }])).toThrow("invalid per-date");
  });
});
