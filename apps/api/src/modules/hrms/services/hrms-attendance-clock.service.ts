import { HttpStatus, Injectable } from "@nestjs/common";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AppSettingsService } from "../../settings/app-settings.service";
import { resolveAppSettings } from "../../settings/settings.defaults";
import { isLate, localDate, nearestShiftStart, opensAt } from "../shift-time";

const MS_PER_MINUTE = 60_000;

/** Whole minutes between two instants, never negative. */
const minutesBetween = (from: Date, to: Date) => Math.max(0, Math.floor((to.getTime() - from.getTime()) / MS_PER_MINUTE));

/** Net worked hours rounded to 2 decimals (elapsed time minus breaks). */
export function computeWorkHours(checkIn: Date, checkOut: Date, breakMinutes: number): number {
  const netMinutes = Math.max(0, minutesBetween(checkIn, checkOut) - breakMinutes);
  return Math.round((netMinutes / 60) * 100) / 100;
}

/**
 * Self-service clock in/out and breaks for the signed-in employee.
 * Shift times are interpreted in the shift's own time zone. Shift rules (HRMS settings attendanceClockInWindowMinutes / attendanceLateAfterMinutes, defaults 30 / 60):
 * clock-in opens that many minutes before the assigned shift starts, and a clock-in later than the late threshold
 * after the start is recorded as LATE. Employees without a shift are never restricted or marked late.
 * Invariants: one attendance record per employee per local day (`date` is supplied by the client at clock-in);
 * the "open" record is the latest one with a check-in and no check-out, so overnight shifts clock out on the next day;
 * ending a break or clocking out folds any running break into `breakMinutes`.
 */
@Injectable()
export class HrmsAttendanceClockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: AppSettingsService,
  ) {}

  /** Today's state for the Home card: the open record, or the record for `date` when already clocked out. */
  async today(organizationId: string, userId: string, date: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    let day = date;
    if (employee.shift) {
      const { startTime, timeZone } = employee.shift;
      const now = Date.now();
      day = localDate(nearestShiftStart(now, localDate(now, timeZone), startTime, timeZone), timeZone);
    }
    const record =
      (await this.findOpen(employee.id)) ??
      (await this.prisma.hrmsAttendanceRecord.findUnique({
        where: { employeeId_date: { employeeId: employee.id, date: new Date(day) } },
      }));
    return { employeeId: employee.id, record };
  }

  async records(organizationId: string, userId: string, from?: string, to?: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    return this.prisma.hrmsAttendanceRecord.findMany({
      where: {
        organizationId,
        employeeId: employee.id,
        ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      },
      orderBy: { date: "desc" },
    });
  }

  async clockIn(organizationId: string, userId: string, date: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    if (await this.findOpen(employee.id)) {
      throw new AppError(ErrorCode.ATTENDANCE_ALREADY_CLOCKED_IN, "You are already clocked in", HttpStatus.CONFLICT);
    }
    const now = new Date();
    let status: "PRESENT" | "LATE" = "PRESENT";
    // Shifted employees are keyed to the shift's own calendar day (in the shift's zone); others use the client's day.
    let attendanceDate = date;
    if (employee.shift) {
      const { startTime, timeZone } = employee.shift;
      const rules = await resolveAppSettings(this.settings, "hrms", organizationId);
      const start = nearestShiftStart(now.getTime(), localDate(now.getTime(), timeZone), startTime, timeZone);
      if (now.getTime() < opensAt(start, rules.attendanceClockInWindowMinutes)) {
        throw new AppError(
          ErrorCode.ATTENDANCE_CLOCK_IN_NOT_OPEN,
          `Clock-in opens ${rules.attendanceClockInWindowMinutes} minutes before your shift starts`,
          HttpStatus.CONFLICT,
        );
      }
      if (isLate(start, now.getTime(), rules.attendanceLateAfterMinutes)) {
        status = "LATE";
      }
      attendanceDate = localDate(start, timeZone);
    }
    const day = new Date(attendanceDate);
    const existing = await this.prisma.hrmsAttendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: employee.id, date: day } },
    });
    if (existing?.checkOut) {
      throw new AppError(
        ErrorCode.ATTENDANCE_ALREADY_CLOCKED_OUT,
        "You have already clocked out for this shift. Request a regularization to change it.",
        HttpStatus.CONFLICT,
      );
    }
    // A record may pre-exist without a check-in (e.g. admin-marked); clocking in completes it.
    return this.prisma.hrmsAttendanceRecord.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: day } },
      create: { organizationId, employeeId: employee.id, date: day, checkIn: now, status },
      update: { checkIn: now, status, breakMinutes: 0, breakStartedAt: null },
    });
  }

  async clockOut(organizationId: string, userId: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    const open = await this.requireOpen(employee.id);
    const now = new Date();
    const breakMinutes = open.breakMinutes + (open.breakStartedAt ? minutesBetween(open.breakStartedAt, now) : 0);
    return this.prisma.hrmsAttendanceRecord.update({
      where: { id: open.id },
      data: {
        checkOut: now,
        breakStartedAt: null,
        breakMinutes,
        workHours: computeWorkHours(open.checkIn ?? now, now, breakMinutes),
      },
    });
  }

  async startBreak(organizationId: string, userId: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    const open = await this.requireOpen(employee.id);
    if (open.breakStartedAt) {
      throw new AppError(ErrorCode.ATTENDANCE_BREAK_STATE_INVALID, "A break is already in progress", HttpStatus.CONFLICT);
    }
    return this.prisma.hrmsAttendanceRecord.update({ where: { id: open.id }, data: { breakStartedAt: new Date() } });
  }

  async endBreak(organizationId: string, userId: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    const open = await this.requireOpen(employee.id);
    if (!open.breakStartedAt) {
      throw new AppError(ErrorCode.ATTENDANCE_BREAK_STATE_INVALID, "No break is in progress", HttpStatus.CONFLICT);
    }
    return this.prisma.hrmsAttendanceRecord.update({
      where: { id: open.id },
      data: { breakStartedAt: null, breakMinutes: open.breakMinutes + minutesBetween(open.breakStartedAt, new Date()) },
    });
  }

  private findOpen(employeeId: string) {
    return this.prisma.hrmsAttendanceRecord.findFirst({
      where: { employeeId, checkIn: { not: null }, checkOut: null },
      orderBy: { date: "desc" },
    });
  }

  private async requireOpen(employeeId: string) {
    const open = await this.findOpen(employeeId);
    if (!open) {
      throw new AppError(ErrorCode.ATTENDANCE_NOT_CLOCKED_IN, "You are not clocked in", HttpStatus.CONFLICT);
    }
    return open;
  }

  private async requireEmployee(organizationId: string, userId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
      select: { id: true, shift: { select: { startTime: true, timeZone: true } } },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "You do not have an active employee record", HttpStatus.NOT_FOUND);
    }
    return employee;
  }
}
