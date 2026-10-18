import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { LegacyPlatformRole, UserRole } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { PLATFORM_ROLES_KEY, type PlatformRoleKey } from "../decorators/platform-roles.decorator";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";

interface PlatformRequest extends Request {
  user?: AuthenticatedUser;
}

/** Enforces platform (internal staff) roles for Control platform-admin endpoints. */
@Injectable()
export class PlatformRolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<PlatformRoleKey[] | undefined>(PLATFORM_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<PlatformRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({ code: "UNAUTHORIZED", message: "Authentication required" });
    }

    const record = await this.prisma.userAuth.findUnique({
      where: { userId: user.userId },
      select: { platformRole: true, user: { select: { role: true, isPlatformUser: true } } },
    });
    const userRole: UserRole | undefined = record?.user.role;
    const hasPlatformUserFlag = record?.user.isPlatformUser === true;
    if (!hasPlatformUserFlag) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Platform staff access required",
      });
    }
    if (hasPlatformUserFlag && (userRole === "PLATFORM_ADMIN" || userRole === "EMPLOYEE")) {
      return true;
    }

    const explicitAssignment = await this.prisma.platformUserRoleAssignment.findFirst({
      where: {
        userId: user.userId,
        revokedAt: null,
        platformRole: { key: { in: required.map((role) => role.toLowerCase()) } },
      },
      select: { userId: true },
    });
    if (explicitAssignment) {
      return true;
    }

    const hasCurrentPlatformAdminRole =
      hasPlatformUserFlag && userRole === "PLATFORM_ADMIN" && required.includes("PLATFORM_ADMIN");
    const hasLegacyPlatformRole =
      record?.platformRole !== undefined && required.includes(record.platformRole as LegacyPlatformRole);

    if (!hasCurrentPlatformAdminRole && !hasLegacyPlatformRole) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "Platform staff access required",
      });
    }
    return true;
  }
}
