import { HttpStatus, Injectable } from "@nestjs/common";
import { OrganizationPermissionScope } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../../database/prisma.service";
import { PermissionService } from "./permission.service";

@Injectable()
export class OrganizationPermissionGroupService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly permissions: PermissionService,
  ) {}

  async list(organizationId: string) {
    return this.prisma.organizationPermissionGroup.findMany({
      where: { organizationId, deletedAt: null },
      include: { permissions: { include: { permission: true } }, _count: { select: { assignments: true } } },
      orderBy: { createdAt: "asc" },
    });
  }

  async get(organizationId: string, groupId: string) {
    return this.requireGroup(organizationId, groupId);
  }

  async create(organizationId: string, actorUserId: string, input: { name: string; description?: string }) {
    const group = await this.prisma.organizationPermissionGroup
      .create({
        data: { organizationId, name: input.name.trim(), description: input.description?.trim() ?? null },
      })
      .catch(() => {
        throw new AppError(
          ErrorCode.PERMISSION_GROUP_NAME_TAKEN,
          "A permission group with this name already exists",
          HttpStatus.CONFLICT,
        );
      });
    await this.audit.record({
      action: "iam.permission-group.created",
      organizationId,
      actorUserId,
      resourceType: "OrganizationPermissionGroup",
      resourceId: group.id,
    });
    return group;
  }

  async update(
    organizationId: string,
    groupId: string,
    actorUserId: string,
    input: { name?: string; description?: string; isActive?: boolean },
  ) {
    await this.requireGroup(organizationId, groupId);
    const group = await this.prisma.organizationPermissionGroup.update({
      where: { id: groupId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    await this.audit.record({
      action: "iam.permission-group.updated",
      organizationId,
      actorUserId,
      resourceType: "OrganizationPermissionGroup",
      resourceId: groupId,
    });
    return group;
  }

  async delete(organizationId: string, groupId: string, actorUserId: string): Promise<void> {
    await this.requireGroup(organizationId, groupId);
    await this.prisma.organizationPermissionGroup.update({
      where: { id: groupId },
      data: { deletedAt: new Date(), isActive: false },
    });
    await this.audit.record({
      action: "iam.permission-group.deleted",
      organizationId,
      actorUserId,
      resourceType: "OrganizationPermissionGroup",
      resourceId: groupId,
    });
  }

  async attachPermission(
    organizationId: string,
    groupId: string,
    permissionId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.requireGroup(organizationId, groupId);
    const permission = await this.prisma.permission.findFirst({ where: { id: permissionId, isAssignable: true } });
    if (!permission) {
      throw new AppError(ErrorCode.PERMISSION_NOT_FOUND, "Assignable permission not found", HttpStatus.NOT_FOUND);
    }
    await this.prisma.organizationPermissionGroupPermission.upsert({
      where: { permissionGroupId_permissionId: { permissionGroupId: groupId, permissionId } },
      update: {},
      create: { permissionGroupId: groupId, permissionId },
    });
    await this.audit.record({
      action: "iam.permission-group.permission-attached",
      organizationId,
      actorUserId,
      resourceType: "Permission",
      resourceId: permissionId,
      metadata: { groupId },
    });
  }

  async removePermission(
    organizationId: string,
    groupId: string,
    permissionId: string,
    actorUserId: string,
  ): Promise<void> {
    await this.requireGroup(organizationId, groupId);
    await this.prisma.organizationPermissionGroupPermission.deleteMany({
      where: { permissionGroupId: groupId, permissionId },
    });
    await this.audit.record({
      action: "iam.permission-group.permission-removed",
      organizationId,
      actorUserId,
      resourceType: "Permission",
      resourceId: permissionId,
      metadata: { groupId },
    });
  }

  async assign(
    organizationId: string,
    groupId: string,
    userId: string,
    actorUserId: string,
    input: { scopeType?: OrganizationPermissionScope; departmentId?: string; teamId?: string; flowProjectId?: string },
  ) {
    await this.requireGroup(organizationId, groupId);
    await this.assertMember(organizationId, userId);
    const scopeType = input.scopeType ?? "ORGANIZATION";
    await this.validateScope(organizationId, scopeType, input.departmentId, input.teamId, input.flowProjectId);
    const assignment = await this.prisma.organizationPermissionGroupAssignment.create({
      data: {
        organizationId,
        permissionGroupId: groupId,
        userId,
        scopeType,
        departmentId: input.departmentId ?? null,
        teamId: input.teamId ?? null,
        flowProjectId: input.flowProjectId ?? null,
        assignedByUserId: actorUserId,
      },
    });
    await this.audit.record({
      action: "iam.permission-group.assigned",
      organizationId,
      actorUserId,
      resourceType: "OrganizationPermissionGroupAssignment",
      resourceId: assignment.id,
      metadata: { groupId, userId, scopeType },
    });
    return assignment;
  }

  async revoke(organizationId: string, groupId: string, userId: string, actorUserId: string): Promise<void> {
    await this.requireGroup(organizationId, groupId);
    await this.prisma.organizationPermissionGroupAssignment.updateMany({
      where: { organizationId, permissionGroupId: groupId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    await this.audit.record({
      action: "iam.permission-group.revoked",
      organizationId,
      actorUserId,
      resourceType: "OrganizationPermissionGroup",
      resourceId: groupId,
      metadata: { userId },
    });
  }

  getEffectiveUserPermissions(userId: string, organizationId: string) {
    return this.permissions.getUserPermissions(userId, organizationId);
  }

  listAssignablePermissions() {
    return this.prisma.permission.findMany({ where: { isAssignable: true }, orderBy: { key: "asc" } });
  }

  private async requireGroup(organizationId: string, groupId: string) {
    const group = await this.prisma.organizationPermissionGroup.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
      include: { permissions: { include: { permission: true } } },
    });
    if (!group) {
      throw new AppError(ErrorCode.PERMISSION_GROUP_NOT_FOUND, "Permission group not found", HttpStatus.NOT_FOUND);
    }
    return group;
  }

  private async assertMember(organizationId: string, userId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
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

  private async validateScope(
    organizationId: string,
    scopeType: OrganizationPermissionScope,
    departmentId?: string,
    teamId?: string,
    flowProjectId?: string,
  ) {
    if (scopeType === "ORGANIZATION" && !departmentId && !teamId && !flowProjectId) {
      return;
    }
    if (
      scopeType === "DEPARTMENT" &&
      departmentId &&
      !teamId &&
      !flowProjectId &&
      (await this.prisma.organizationDepartment.findFirst({
        where: { id: departmentId, organizationId, deletedAt: null },
      }))
    ) {
      return;
    }
    if (
      scopeType === "TEAM" &&
      teamId &&
      !departmentId &&
      !flowProjectId &&
      (await this.prisma.organizationTeam.findFirst({ where: { id: teamId, organizationId, deletedAt: null } }))
    ) {
      return;
    }
    if (
      scopeType === "FLOW_PROJECT" &&
      flowProjectId &&
      !departmentId &&
      !teamId &&
      (await this.prisma.project.findFirst({ where: { id: flowProjectId, organizationId, deletedAt: null } }))
    ) {
      return;
    }
    throw new AppError(
      ErrorCode.INVALID_PERMISSION_SCOPE,
      "Permission scope must reference an active resource in this organization",
      HttpStatus.BAD_REQUEST,
    );
  }
}
