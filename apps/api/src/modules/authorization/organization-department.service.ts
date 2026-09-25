import { HttpStatus, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class OrganizationDepartmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list(organizationId: string) {
    return this.prisma.organizationDepartment.findMany({
      where: { organizationId, deletedAt: null },
      include: { _count: { select: { members: true, children: true } } },
      orderBy: { name: "asc" },
    });
  }

  async create(organizationId: string, actorUserId: string, input: { name: string; code?: string; parentId?: string }) {
    if (input.parentId) {
      await this.requireDepartment(organizationId, input.parentId);
    }
    const department = await this.prisma.organizationDepartment
      .create({
        data: {
          organizationId,
          name: input.name.trim(),
          code: input.code?.trim() ?? null,
          parentId: input.parentId ?? null,
        },
      })
      .catch(() => {
        throw new AppError(
          ErrorCode.DEPARTMENT_NAME_TAKEN,
          "A department with this name already exists",
          HttpStatus.CONFLICT,
        );
      });
    await this.audit.record({
      action: "iam.department.created",
      organizationId,
      actorUserId,
      resourceType: "OrganizationDepartment",
      resourceId: department.id,
    });
    return department;
  }

  async update(
    organizationId: string,
    departmentId: string,
    actorUserId: string,
    input: { name?: string; code?: string; parentId?: string | null; isActive?: boolean },
  ) {
    await this.requireDepartment(organizationId, departmentId);
    if (input.parentId !== undefined) {
      if (input.parentId === departmentId) {
        throw new AppError(ErrorCode.DEPARTMENT_CYCLE, "A department cannot be its own parent", HttpStatus.BAD_REQUEST);
      }
      if (input.parentId) {
        await this.requireDepartment(organizationId, input.parentId);
        await this.assertNotDescendant(organizationId, departmentId, input.parentId);
      }
    }
    const department = await this.prisma.organizationDepartment.update({
      where: { id: departmentId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.code !== undefined ? { code: input.code.trim() || null } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    await this.audit.record({
      action: "iam.department.updated",
      organizationId,
      actorUserId,
      resourceType: "OrganizationDepartment",
      resourceId: departmentId,
    });
    return department;
  }

  async delete(organizationId: string, departmentId: string, actorUserId: string): Promise<void> {
    await this.requireDepartment(organizationId, departmentId);
    const hasChildren = await this.prisma.organizationDepartment.count({
      where: { organizationId, parentId: departmentId, deletedAt: null },
    });
    if (hasChildren > 0) {
      throw new AppError(
        ErrorCode.DEPARTMENT_HAS_CHILDREN,
        "Move or delete child departments first",
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.organizationDepartment.update({
      where: { id: departmentId },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.record({
      action: "iam.department.deleted",
      organizationId,
      actorUserId,
      resourceType: "OrganizationDepartment",
      resourceId: departmentId,
    });
  }

  async assignUser(organizationId: string, departmentId: string, userId: string, actorUserId: string): Promise<void> {
    await this.requireDepartment(organizationId, departmentId);
    await this.assertMember(organizationId, userId);
    await this.prisma.organizationDepartmentMember.upsert({
      where: { departmentId_userId: { departmentId, userId } },
      update: {},
      create: { departmentId, userId },
    });
    await this.audit.record({
      action: "iam.department.member-assigned",
      organizationId,
      actorUserId,
      resourceType: "OrganizationDepartment",
      resourceId: departmentId,
      metadata: { userId },
    });
  }

  async removeUser(organizationId: string, departmentId: string, userId: string, actorUserId: string): Promise<void> {
    await this.requireDepartment(organizationId, departmentId);
    await this.prisma.organizationDepartmentMember.deleteMany({ where: { departmentId, userId } });
    await this.audit.record({
      action: "iam.department.member-removed",
      organizationId,
      actorUserId,
      resourceType: "OrganizationDepartment",
      resourceId: departmentId,
      metadata: { userId },
    });
  }

  private async requireDepartment(organizationId: string, departmentId: string) {
    const department = await this.prisma.organizationDepartment.findFirst({
      where: { id: departmentId, organizationId, deletedAt: null },
    });
    if (!department) {
      throw new AppError(ErrorCode.DEPARTMENT_NOT_FOUND, "Department not found", HttpStatus.NOT_FOUND);
    }
    return department;
  }

  private async assertMember(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!member) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "User is not an active organization member",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async assertNotDescendant(organizationId: string, departmentId: string, parentId: string): Promise<void> {
    let currentId: string | null = parentId;
    while (currentId) {
      if (currentId === departmentId) {
        throw new AppError(
          ErrorCode.DEPARTMENT_CYCLE,
          "Department hierarchy cannot contain a cycle",
          HttpStatus.BAD_REQUEST,
        );
      }
      const current: { parentId: string | null } | null = await this.prisma.organizationDepartment.findFirst({
        where: { id: currentId, organizationId, deletedAt: null },
        select: { parentId: true },
      });
      currentId = current?.parentId ?? null;
    }
  }
}
