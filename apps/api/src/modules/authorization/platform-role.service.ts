import { HttpStatus, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";

@Injectable()
export class PlatformRoleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.platformRole.findMany({
      include: { permissions: { include: { permission: true } }, _count: { select: { assignments: true } } },
      orderBy: { key: "asc" },
    });
  }

  async create(actorUserId: string, input: { key: string; name: string; description?: string }) {
    const role = await this.prisma.platformRole.create({
      data: { key: input.key.trim().toLowerCase(), name: input.name.trim(), description: input.description?.trim() ?? null, isSystem: false },
    }).catch(() => { throw new AppError(ErrorCode.PLATFORM_ROLE_KEY_TAKEN, "A platform role with this key already exists", HttpStatus.CONFLICT); });
    await this.audit.record({ action: "iam.platform-role.created", actorUserId, resourceType: "PlatformRole", resourceId: role.id });
    return role;
  }

  async attachPermission(roleId: string, permissionId: string, actorUserId: string): Promise<void> {
    await this.requireRole(roleId);
    const permission = await this.prisma.permission.findFirst({ where: { id: permissionId }, select: { id: true } });
    if (!permission) {throw new AppError(ErrorCode.PERMISSION_NOT_FOUND, "Permission not found", HttpStatus.NOT_FOUND);}
    await this.prisma.platformRolePermission.upsert({ where: { platformRoleId_permissionId: { platformRoleId: roleId, permissionId } }, update: {}, create: { platformRoleId: roleId, permissionId } });
    await this.audit.record({ action: "iam.platform-role.permission-attached", actorUserId, resourceType: "Permission", resourceId: permissionId, metadata: { roleId } });
  }

  async removePermission(roleId: string, permissionId: string, actorUserId: string): Promise<void> {
    await this.requireRole(roleId);
    await this.prisma.platformRolePermission.deleteMany({ where: { platformRoleId: roleId, permissionId } });
    await this.audit.record({ action: "iam.platform-role.permission-removed", actorUserId, resourceType: "Permission", resourceId: permissionId, metadata: { roleId } });
  }

  async assign(roleId: string, userId: string, actorUserId: string) {
    await this.requireRole(roleId);
    const user = await this.prisma.user.findFirst({ where: { id: userId, deletedAt: null }, select: { id: true } });
    if (!user) {throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);}
    const assignment = await this.prisma.platformUserRoleAssignment.upsert({
      where: { userId_platformRoleId: { userId, platformRoleId: roleId } },
      update: { revokedAt: null, assignedById: actorUserId },
      create: { userId, platformRoleId: roleId, assignedById: actorUserId },
    });
    await this.audit.record({ action: "iam.platform-role.assigned", actorUserId, resourceType: "PlatformUserRoleAssignment", resourceId: `${userId}:${roleId}`, metadata: { userId, roleId } });
    return assignment;
  }

  async revoke(roleId: string, userId: string, actorUserId: string): Promise<void> {
    await this.requireRole(roleId);
    await this.prisma.platformUserRoleAssignment.updateMany({ where: { userId, platformRoleId: roleId, revokedAt: null }, data: { revokedAt: new Date() } });
    await this.audit.record({ action: "iam.platform-role.revoked", actorUserId, resourceType: "PlatformUserRoleAssignment", resourceId: `${userId}:${roleId}`, metadata: { userId, roleId } });
  }

  private async requireRole(roleId: string) {
    const role = await this.prisma.platformRole.findUnique({ where: { id: roleId } });
    if (!role) {throw new AppError(ErrorCode.PLATFORM_ROLE_NOT_FOUND, "Platform role not found", HttpStatus.NOT_FOUND);}
    return role;
  }
}