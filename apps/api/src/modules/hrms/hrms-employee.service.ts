import { HttpStatus, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class HrmsEmployeeService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService) {}

  list(organizationId: string) {
    return this.prisma.hrmsEmployee.findMany({
      where: { organizationId, deletedAt: null },
      select: { id: true, employeeNumber: true, status: true, employmentType: true, startDate: true, endDate: true, createdAt: true, updatedAt: true, user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      orderBy: { employeeNumber: "asc" },
    });
  }

  async get(organizationId: string, employeeId: string) {
    return this.requireEmployee(organizationId, employeeId);
  }

  async create(organizationId: string, actorUserId: string, input: { userId: string; employeeNumber: string; status: string; employmentType?: string; startDate?: string; endDate?: string }) {
    await this.assertActiveMember(organizationId, input.userId);
    const employee = await this.prisma.hrmsEmployee.create({
      data: { organizationId, userId: input.userId, employeeNumber: input.employeeNumber.trim(), status: input.status.trim(), employmentType: input.employmentType?.trim() ?? null, startDate: input.startDate ? new Date(input.startDate) : null, endDate: input.endDate ? new Date(input.endDate) : null },
    }).catch(() => { throw new AppError(ErrorCode.EMPLOYEE_ALREADY_EXISTS, "Employee number or user is already assigned in this organization", HttpStatus.CONFLICT); });
    await this.audit.record({ action: "hrms.employee.created", organizationId, actorUserId, resourceType: "HrmsEmployee", resourceId: employee.id });
    return employee;
  }

  async update(organizationId: string, employeeId: string, actorUserId: string, input: { status?: string; employmentType?: string; startDate?: string; endDate?: string }) {
    await this.requireEmployee(organizationId, employeeId);
    const employee = await this.prisma.hrmsEmployee.update({
      where: { id: employeeId },
      data: { ...(input.status !== undefined ? { status: input.status.trim() } : {}), ...(input.employmentType !== undefined ? { employmentType: input.employmentType.trim() } : {}), ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}), ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}) },
    });
    await this.audit.record({ action: "hrms.employee.updated", organizationId, actorUserId, resourceType: "HrmsEmployee", resourceId: employeeId });
    return employee;
  }

  async delete(organizationId: string, employeeId: string, actorUserId: string): Promise<void> {
    await this.requireEmployee(organizationId, employeeId);
    await this.prisma.hrmsEmployee.update({ where: { id: employeeId }, data: { deletedAt: new Date(), status: "INACTIVE", endDate: new Date() } });
    await this.audit.record({ action: "hrms.employee.deleted", organizationId, actorUserId, resourceType: "HrmsEmployee", resourceId: employeeId });
  }

  private async requireEmployee(organizationId: string, employeeId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    });
    if (!employee) throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    return employee;
  }

  private async assertActiveMember(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null, user: { deletedAt: null } },
      select: { id: true },
    });
    if (!membership) throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "Employee must be an active organization member", HttpStatus.BAD_REQUEST);
  }
}