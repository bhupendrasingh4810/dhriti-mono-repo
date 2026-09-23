import { HttpStatus, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";

export interface PermissionResource {
  type: string;
  id?: string;
  departmentId?: string;
  teamId?: string;
  flowProjectId?: string;
}

export interface PermissionCheck {
  userId: string;
  organizationId: string;
  permissionKey: string;
  resource?: PermissionResource;
}

@Injectable()
export class PermissionService {
  constructor(private readonly prisma: PrismaService) {}

  async hasPermission(params: PermissionCheck): Promise<boolean> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId: params.organizationId, userId: params.userId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      return false;
    }

    const platformPermission = await this.prisma.platformUserRoleAssignment.findFirst({
      where: {
        userId: params.userId,
        revokedAt: null,
        platformRole: { permissions: { some: { permission: { key: params.permissionKey } } } },
      },
      select: { userId: true },
    });
    if (platformPermission) {
      return true;
    }

    const assignments = await this.prisma.organizationPermissionGroupAssignment.findMany({
      where: {
        organizationId: params.organizationId,
        userId: params.userId,
        revokedAt: null,
        permissionGroup: {
          organizationId: params.organizationId,
          isActive: true,
          deletedAt: null,
          permissions: { some: { permission: { key: params.permissionKey } } },
        },
      },
      select: { scopeType: true, departmentId: true, teamId: true, flowProjectId: true },
    });
    return assignments.some((assignment) => this.matchesScope(assignment, params.resource));
  }

  async assertPermission(params: PermissionCheck): Promise<void> {
    if (!(await this.hasPermission(params))) {
      throw new AppError(
        ErrorCode.PERMISSION_DENIED,
        "You do not have permission to perform this action",
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      return [];
    }
    const [platformPermissions, organizationPermissions] = await Promise.all([
      this.prisma.platformUserRoleAssignment.findMany({
        where: { userId, revokedAt: null },
        select: { platformRole: { select: { permissions: { select: { permission: { select: { key: true } } } } } } },
      }),
      this.prisma.organizationPermissionGroupAssignment.findMany({
        where: {
          organizationId,
          userId,
          revokedAt: null,
          permissionGroup: { organizationId, isActive: true, deletedAt: null },
        },
        select: { permissionGroup: { select: { permissions: { select: { permission: { select: { key: true } } } } } } },
      }),
    ]);
    const keys = [
      ...platformPermissions.flatMap((assignment) => assignment.platformRole.permissions.map(({ permission }) => permission.key)),
      ...organizationPermissions.flatMap((assignment) => assignment.permissionGroup.permissions.map(({ permission }) => permission.key)),
    ];
    return [...new Set(keys)];
  }

  private matchesScope(
    assignment: { scopeType: string; departmentId: string | null; teamId: string | null; flowProjectId: string | null },
    resource?: PermissionResource,
  ): boolean {
    if (assignment.scopeType === "ORGANIZATION") {
      return true;
    }
    if (!resource) {
      return false;
    }
    if (assignment.scopeType === "DEPARTMENT") {
      return assignment.departmentId !== null && assignment.departmentId === resource.departmentId;
    }
    if (assignment.scopeType === "TEAM") {
      return assignment.teamId !== null && assignment.teamId === resource.teamId;
    }
    return assignment.flowProjectId !== null && assignment.flowProjectId === resource.flowProjectId;
  }
}