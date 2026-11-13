import { HttpStatus, Injectable } from "@nestjs/common";
import type { AttendanceRegularizationStatus, AttendanceRegularizationType } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { computeWorkHours } from "./hrms-attendance-clock.service";

const include = {
  employee: { select: { id: true, employeeNumber: true, user: { select: { id: true, name: true, avatarUrl: true } } } },
} as const;

/** Times a request must supply, by type; the rest are optional. */
const REQUIRED_TIMES: Partial<Record<AttendanceRegularizationType, ("requestedCheckIn" | "requestedCheckOut")[]>> = {
  MISSED_CLOCK_IN: ["requestedCheckIn"],
  MISSED_CLOCK_OUT: ["requestedCheckOut"],
  LATE_ARRIVAL: ["requestedCheckIn"],
};

/**
 * Attendance regularization: employees request corrections; a manager (hrms.attendance.manage) decides.
 * Approval writes the requested times to the day's attendance record (creating it if absent), recomputes work hours
 * from the final in/out minus recorded breaks, and marks the day PRESENT. Decisions are final, require a reason, and run in one transaction.
 */
@Injectable()
export class HrmsAttendanceRegularizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listMine(organizationId: string, userId: string) {
    const employee = await this.requireEmployee(organizationId, userId);
    return this.prisma.hrmsAttendanceRegularization.findMany({
      where: { organizationId, employeeId: employee.id },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include,
    }).then((rows) => this.withRecords(rows));
  }

  listAll(organizationId: string, status?: AttendanceRegularizationStatus) {
    return this.prisma.hrmsAttendanceRegularization.findMany({
      where: { organizationId, ...(status ? { status } : {}) },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include,
    }).then((rows) => this.withRecords(rows));
  }

  /** Attaches each request's current attendance record so reviewers can compare it with the requested times. */
  private async withRecords<T extends { employeeId: string; date: Date }>(requests: T[]) {
    if (requests.length === 0) {
      return [];
    }
    const records = await this.prisma.hrmsAttendanceRecord.findMany({
      where: { OR: requests.map((request) => ({ employeeId: request.employeeId, date: request.date })) },
    });
    const byKey = new Map(records.map((record) => [`${record.employeeId}:${record.date.toISOString()}`, record]));
    return requests.map((request) => ({
      ...request,
      attendanceRecord: byKey.get(`${request.employeeId}:${request.date.toISOString()}`) ?? null,
    }));
  }

  async create(
    organizationId: string,
    userId: string,
    input: {
      date: string;
      type: AttendanceRegularizationType;
      requestedCheckIn?: string;
      requestedCheckOut?: string;
      reason: string;
    },
  ) {
    const employee = await this.requireEmployee(organizationId, userId);
    const checkIn = input.requestedCheckIn ? new Date(input.requestedCheckIn) : null;
    const checkOut = input.requestedCheckOut ? new Date(input.requestedCheckOut) : null;
    for (const field of REQUIRED_TIMES[input.type] ?? []) {
      if (!input[field]) {
        throw this.invalid(field === "requestedCheckIn" ? "Requested clock-in time is required" : "Requested clock-out time is required");
      }
    }
    if (checkIn && checkOut && checkOut <= checkIn) {
      throw this.invalid("Requested clock-out must be after clock-in");
    }
    const reason = input.reason.trim();
    if (!reason) {
      throw this.invalid("Reason is required");
    }
    const date = new Date(input.date);
    const duplicate = await this.prisma.hrmsAttendanceRegularization.findFirst({
      where: { employeeId: employee.id, date, status: "PENDING" },
      select: { id: true },
    });
    if (duplicate) {
      throw this.invalid("A regularization request for this day is already pending");
    }
    return this.prisma.hrmsAttendanceRegularization.create({
      data: {
        organizationId,
        employeeId: employee.id,
        date,
        type: input.type,
        requestedCheckIn: checkIn,
        requestedCheckOut: checkOut,
        reason,
      },
      include,
    });
  }

  async decide(
    organizationId: string,
    regularizationId: string,
    actorUserId: string,
    status: "APPROVED" | "REJECTED",
    decisionNote?: string,
  ) {
    if (!decisionNote?.trim()) {
      throw this.invalid("A reason is required to approve or reject a request");
    }
    const request = await this.prisma.hrmsAttendanceRegularization.findFirst({
      where: { id: regularizationId, organizationId },
    });
    if (!request) {
      throw new AppError(ErrorCode.ATTENDANCE_REGULARIZATION_NOT_FOUND, "Regularization request not found", HttpStatus.NOT_FOUND);
    }
    if (request.status !== "PENDING") {
      throw new AppError(ErrorCode.ATTENDANCE_REGULARIZATION_DECIDED, "This request was already decided", HttpStatus.CONFLICT);
    }
    const decidedAt = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      // Conditional update guards against two managers deciding concurrently.
      const claimed = await tx.hrmsAttendanceRegularization.updateMany({
        where: { id: request.id, status: "PENDING" },
        data: { status, decidedByUserId: actorUserId, decidedAt, decisionNote: decisionNote?.trim() || null },
      });
      if (claimed.count === 0) {
        throw new AppError(ErrorCode.ATTENDANCE_REGULARIZATION_DECIDED, "This request was already decided", HttpStatus.CONFLICT);
      }
      if (status === "APPROVED") {
        await this.applyToRecord(tx, request);
      }
      return tx.hrmsAttendanceRegularization.findUniqueOrThrow({ where: { id: request.id }, include });
    });
    await this.audit.record({
      action: `hrms.attendance.regularization.${status.toLowerCase()}`,
      organizationId,
      actorUserId,
      resourceType: "HrmsAttendanceRegularization",
      resourceId: request.id,
      metadata: { employeeId: request.employeeId, date: request.date.toISOString().slice(0, 10) },
    });
    return updated;
  }

  private async applyToRecord(
    tx: Pick<PrismaService, "hrmsAttendanceRecord">,
    request: { organizationId: string; employeeId: string; date: Date; requestedCheckIn: Date | null; requestedCheckOut: Date | null },
  ) {
    const existing = await tx.hrmsAttendanceRecord.findUnique({
      where: { employeeId_date: { employeeId: request.employeeId, date: request.date } },
    });
    const checkIn = request.requestedCheckIn ?? existing?.checkIn ?? null;
    const checkOut = request.requestedCheckOut ?? existing?.checkOut ?? null;
    if (checkIn && checkOut && checkOut <= checkIn) {
      throw this.invalid("Approved times conflict with the existing record: clock-out would be before clock-in");
    }
    const breakMinutes = existing?.breakMinutes ?? 0;
    const data = {
      checkIn,
      checkOut,
      status: "PRESENT" as const,
      // A corrected clock-out closes any break that was left running.
      breakStartedAt: checkOut ? null : (existing?.breakStartedAt ?? null),
      workHours: checkIn && checkOut ? computeWorkHours(checkIn, checkOut, breakMinutes) : (existing?.workHours ?? null),
    };
    await tx.hrmsAttendanceRecord.upsert({
      where: { employeeId_date: { employeeId: request.employeeId, date: request.date } },
      create: { organizationId: request.organizationId, employeeId: request.employeeId, date: request.date, ...data },
      update: data,
    });
  }

  private invalid(message: string) {
    return new AppError(ErrorCode.ATTENDANCE_REGULARIZATION_INVALID, message, HttpStatus.BAD_REQUEST);
  }

  private async requireEmployee(organizationId: string, userId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "You do not have an active employee record", HttpStatus.NOT_FOUND);
    }
    return employee;
  }
}
