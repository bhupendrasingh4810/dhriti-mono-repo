import { HttpStatus, Injectable } from "@nestjs/common";
import { AttendanceStatus } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class HrmsAttendanceService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  async list(organizationId: string, employeeId: string, from?: string, to?: string) {
    await this.requireEmployee(organizationId, employeeId);
    return this.prisma.hrmsAttendanceRecord.findMany({
      where: {
        organizationId,
        employeeId,
        ...(from || to ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}),
      },
      orderBy: { date: "desc" },
    });
  }

  async upsert(organizationId: string, employeeId: string, actorUserId: string, input: { date: string; checkIn?: string; checkOut?: string; status?: AttendanceStatus; workHours?: number; notes?: string }) {
    await this.requireEmployee(organizationId, employeeId);
    const date = new Date(input.date);
    const record = await this.prisma.hrmsAttendanceRecord.upsert({
      where: { employeeId_date: { employeeId, date } },
      create: {
        organizationId,
        employeeId,
        date,
        checkIn: input.checkIn ? new Date(input.checkIn) : null,
        checkOut: input.checkOut ? new Date(input.checkOut) : null,
        status: input.status ?? "PRESENT",
        workHours: input.workHours ?? null,
        notes: input.notes?.trim() ?? null,
      },
      update: {
        ...(input.checkIn !== undefined ? { checkIn: new Date(input.checkIn) } : {}),
        ...(input.checkOut !== undefined ? { checkOut: new Date(input.checkOut) } : {}),
        ...(input.status !== undefined ? { status: input.status } : {}),
        ...(input.workHours !== undefined ? { workHours: input.workHours } : {}),
        ...(input.notes !== undefined ? { notes: input.notes.trim() } : {}),
      },
    });
    await this.audit.record({ action: "hrms.attendance.upserted", organizationId, actorUserId, resourceType: "HrmsAttendanceRecord", resourceId: record.id, metadata: { employeeId, date: input.date } });
    return record;
  }

  private async requireEmployee(organizationId: string, employeeId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({ where: { id: employeeId, organizationId, status: "ACTIVE", deletedAt: null }, select: { id: true } });
    if (!employee) throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    return employee;
  }
}