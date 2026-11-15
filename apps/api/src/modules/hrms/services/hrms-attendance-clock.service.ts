import { HttpStatus, Injectable } from "@nestjs/common";
import type { AttendanceCaptureInput, AttendanceCapturePolicy } from "@dhriti/types";
import { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AppSettingsService } from "../../settings/app-settings.service";
import { resolveAppSettings } from "../../settings/settings.defaults";
import { isLate, localDate, nearestShiftStart, opensAt } from "../shift-time";
import { validateAttendanceCapture } from "../attendance-capture";

const MS_PER_MINUTE = 60_000;

/** Whole minutes between two instants, never negative. */
const minutesBetween = (from: Date, to: Date) =>
  Math.max(0, Math.floor((to.getTime() - from.getTime()) / MS_PER_MINUTE));

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
    const rules = await resolveAppSettings(this.settings, "hrms", organizationId);
    const location = employee.workLocation;
    const capturePolicy: AttendanceCapturePolicy = {
      enabled: rules.attendanceGpsEnabled,
      maxAccuracyMeters: rules.attendanceGpsMaxAccuracyMeters,
      workLocation: location
        ? {
            name: location.name,
            configured:
              location.organizationId === organizationId &&
              location.isActive &&
              typeof location.geofenceLatitude === "number" &&
              typeof location.geofenceLongitude === "number" &&
              typeof location.geofenceRadiusMeters === "number",
          }
        : null,
    };
    return { employeeId: employee.id, record, capturePolicy };
  }

  async records(organizationId: string, userId: string, from?: string, to?: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    return this.prisma.hrmsAttendanceRecord.findMany({
      where: {
        organizationId,
        employeeId: employee.id,
        ...(from || to
          ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
          : {}),
      },
      orderBy: { date: "desc" },
    });
  }

  async clockIn(organizationId: string, userId: string, date: string, capture?: AttendanceCaptureInput) {
    return this.punch(async (tx) => {
      const employee = await this.requireEmployee(organizationId, userId, tx);
      if (await this.findOpen(employee.id, tx)) {
        throw new AppError(ErrorCode.ATTENDANCE_ALREADY_CLOCKED_IN, "You are already clocked in", HttpStatus.CONFLICT);
      }
      const now = new Date();
      const rules = await resolveAppSettings(this.settings, "hrms", organizationId);
      const checkInCapture = validateAttendanceCapture(
        capture,
        rules,
        employee.workLocation ?? null,
        organizationId,
        now,
      );
      let status: "PRESENT" | "LATE" = "PRESENT";
      // Shifted employees are keyed to the shift's own calendar day (in the shift's zone); others use the client's day.
      let attendanceDate = date;
      if (employee.shift) {
        const { startTime, timeZone } = employee.shift;
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
      const existing = await tx.hrmsAttendanceRecord.findUnique({
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
      return tx.hrmsAttendanceRecord.upsert({
        where: { employeeId_date: { employeeId: employee.id, date: day } },
        create: { organizationId, employeeId: employee.id, date: day, checkIn: now, status, checkInCapture },
        update: { checkIn: now, status, breakMinutes: 0, breakStartedAt: null, checkInCapture },
      });
    });
  }

  async clockOut(organizationId: string, userId: string, capture?: AttendanceCaptureInput) {
    return this.punch(async (tx) => {
      const employee = await this.requireEmployee(organizationId, userId, tx);
      const open = await this.requireOpen(employee.id, tx);
      const now = new Date();
      const rules = await resolveAppSettings(this.settings, "hrms", organizationId);
      const checkOutCapture = validateAttendanceCapture(
        capture,
        rules,
        employee.workLocation ?? null,
        organizationId,
        now,
      );
      const original = open.checkInCapture;
      if (
        original &&
        typeof original === "object" &&
        !Array.isArray(original) &&
        original.mode &&
        capture &&
        capture.mode !== original.mode
      ) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Clock out must use the same work mode as clock in.",
          HttpStatus.BAD_REQUEST,
        );
      }
      const breakMinutes = open.breakMinutes + (open.breakStartedAt ? minutesBetween(open.breakStartedAt, now) : 0);
      return tx.hrmsAttendanceRecord.update({
        where: { id: open.id },
        data: {
          checkOut: now,
          checkOutCapture,
          breakStartedAt: null,
          breakMinutes,
          workHours: computeWorkHours(open.checkIn ?? now, now, breakMinutes),
        },
      });
    });
  }

  /** Serializable punches prevent concurrent clients from overwriting an accepted punch's evidence. */
  private async punch<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    try {
      return await this.prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2002"].includes(error.code)) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Attendance changed on another device. Reload and retry.",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async startBreak(organizationId: string, userId: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    const open = await this.requireOpen(employee.id);
    if (open.breakStartedAt) {
      throw new AppError(
        ErrorCode.ATTENDANCE_BREAK_STATE_INVALID,
        "A break is already in progress",
        HttpStatus.CONFLICT,
      );
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

  private findOpen(employeeId: string, db: Prisma.TransactionClient = this.prisma) {
    return db.hrmsAttendanceRecord.findFirst({
      where: { employeeId, checkIn: { not: null }, checkOut: null },
      orderBy: { date: "desc" },
    });
  }

  private async requireOpen(employeeId: string, db: Prisma.TransactionClient = this.prisma) {
    const open = await this.findOpen(employeeId, db);
    if (!open) {
      throw new AppError(ErrorCode.ATTENDANCE_NOT_CLOCKED_IN, "You are not clocked in", HttpStatus.CONFLICT);
    }
    return open;
  }

  private async requireEmployee(organizationId: string, userId: string, db: Prisma.TransactionClient = this.prisma) {
    const employee = await db.hrmsEmployee.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
      select: { id: true, workLocation: true, shift: { select: { startTime: true, timeZone: true } } },
    });
    if (!employee) {
      throw new AppError(
        ErrorCode.EMPLOYEE_NOT_FOUND,
        "You do not have an active employee record",
        HttpStatus.NOT_FOUND,
      );
    }
    return employee;
  }
}
