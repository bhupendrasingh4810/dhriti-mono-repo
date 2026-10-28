import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import type { CreateHrmsEmployeeDto, UpdateHrmsEmployeeDto } from "../dto/hrms-employee.dto";

@Injectable()
export class HrmsEmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string) {
    return this.prisma.hrmsEmployee.findMany({
      where: { organizationId, deletedAt: null },
      select: {
        id: true,
        employeeNumber: true,
        status: true,
        employmentType: true,
        startDate: true,
        endDate: true,
        biometricId: true,
        retirementDate: true,
        resignationDate: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { employeeNumber: "asc" },
    });
  }

  async get(organizationId: string, employeeId: string) {
    return this.requireEmployee(organizationId, employeeId);
  }

  async create(organizationId: string, actorUserId: string, input: CreateHrmsEmployeeDto) {
    await this.assertActiveMember(organizationId, input.userId);
    this.validateLifecycleDates(input.startDate ? new Date(input.startDate) : null, input);
    const employee = await this.prisma.hrmsEmployee
      .create({
        data: {
          organizationId,
          userId: input.userId,
          employeeNumber: input.employeeNumber.trim(),
          status: input.status.trim(),
          employmentType: input.employmentType?.trim() ?? null,
          startDate: input.startDate ? new Date(input.startDate) : null,
          endDate: input.endDate ? new Date(input.endDate) : null,
          biometricId: input.biometricId?.trim() || null,
          retirementDate: input.retirementDate ? new Date(`${input.retirementDate}T00:00:00.000Z`) : null,
          resignationDate: input.resignationDate ? new Date(`${input.resignationDate}T00:00:00.000Z`) : null,
        },
      })
      .catch(() => {
        throw new AppError(
          ErrorCode.EMPLOYEE_ALREADY_EXISTS,
          "Employee number or user is already assigned in this organization",
          HttpStatus.CONFLICT,
        );
      });
    await this.audit.record({
      action: "hrms.employee.created",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employee.id,
    });
    return employee;
  }

  async update(organizationId: string, employeeId: string, actorUserId: string, input: UpdateHrmsEmployeeDto) {
    const current = await this.requireEmployee(organizationId, employeeId);
    const startDate = input.startDate !== undefined ? new Date(input.startDate) : current.startDate;
    this.validateLifecycleDates(startDate, {
      retirementDate:
        input.retirementDate === undefined ? current.retirementDate?.toISOString().slice(0, 10) : input.retirementDate,
      resignationDate:
        input.resignationDate === undefined
          ? current.resignationDate?.toISOString().slice(0, 10)
          : input.resignationDate,
    });
    const employee = await this.prisma.hrmsEmployee
      .update({
        where: { id: employeeId },
        data: {
          ...(input.employeeNumber !== undefined ? { employeeNumber: input.employeeNumber.trim() } : {}),
          ...(input.status !== undefined ? { status: input.status.trim() } : {}),
          ...(input.employmentType !== undefined ? { employmentType: input.employmentType.trim() } : {}),
          ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
          ...(input.biometricId !== undefined ? { biometricId: input.biometricId?.trim() || null } : {}),
          ...(input.retirementDate !== undefined
            ? { retirementDate: input.retirementDate ? new Date(`${input.retirementDate}T00:00:00.000Z`) : null }
            : {}),
          ...(input.resignationDate !== undefined
            ? { resignationDate: input.resignationDate ? new Date(`${input.resignationDate}T00:00:00.000Z`) : null }
            : {}),
        },
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError(
            ErrorCode.EMPLOYEE_ALREADY_EXISTS,
            "Employee code is already assigned in this organization",
            HttpStatus.CONFLICT,
          );
        }
        throw error;
      });
    await this.audit.record({
      action: "hrms.employee.updated",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employeeId,
    });
    return employee;
  }

  private validateLifecycleDates(
    startDate: Date | null,
    input: { retirementDate?: string | null; resignationDate?: string | null },
  ) {
    if (!startDate) {
      return;
    }
    const joiningDate = startDate.toISOString().slice(0, 10);
    if (input.retirementDate && input.retirementDate < joiningDate) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Retirement date cannot precede date of joining",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.resignationDate && input.resignationDate < joiningDate) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Resignation date cannot precede date of joining",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(organizationId: string, employeeId: string, actorUserId: string): Promise<void> {
    await this.requireEmployee(organizationId, employeeId);
    await this.prisma.hrmsEmployee.update({
      where: { id: employeeId },
      data: { deletedAt: new Date(), status: "INACTIVE", endDate: new Date() },
    });
    await this.audit.record({
      action: "hrms.employee.deleted",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employeeId,
    });
  }

  private async requireEmployee(organizationId: string, employeeId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    }
    return employee;
  }

  private async assertActiveMember(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null, user: { deletedAt: null } },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "Employee must be an active organization member",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
