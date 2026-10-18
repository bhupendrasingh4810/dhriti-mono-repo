import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { UserRole } from "@prisma/client";
import { isUUID } from "class-validator";

import { PrismaService } from "../../database/prisma.service";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { OrganizationContext } from "../decorators/organization.decorator";

const ORG_HEADER = "x-organization-id";

interface TenantGuardRequest extends Request {
  user?: AuthenticatedUser;
  organization?: OrganizationContext;
}

/**
 * Resolves the active organization for the request: prefers the
 * `x-organization-id` header, falls back to the organization in the access
 * token. Enforces that the user is a member of that organization.
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantGuardRequest>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException({
        code: "UNAUTHORIZED",
        message: "Authentication is required before organization context",
      });
    }

    const headerValue = request.headers[ORG_HEADER];
    const headerOrganizationId = Array.isArray(headerValue) ? headerValue[0] : headerValue;
    const session = await this.prisma.userSession.findFirst({
      where: { id: user.sessionId, userId: user.userId, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { organizationId: true },
    });
    if (!session) {
      throw new ForbiddenException({ code: "SESSION_REVOKED", message: "Session is no longer active" });
    }
    if (
      !headerOrganizationId &&
      user.organizationId &&
      session.organizationId &&
      user.organizationId !== session.organizationId
    ) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "Session organization context is stale",
      });
    }
    const organizationId = headerOrganizationId ?? session.organizationId ?? user.organizationId;

    if (!organizationId || !isUUID(organizationId)) {
      throw new ForbiddenException({
        code: "ORGANIZATION_REQUIRED",
        message: "A valid active organization is required",
      });
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: user.userId,
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { id: true, user: { select: { role: true } }, organization: { select: { deletedAt: true } } },
    });

    if (membership && membership.organization.deletedAt === null) {
      request.organization = {
        organizationId,
        memberId: membership.id,
        role: membership.user.role,
      };
    } else {
      const [platformAdmin, organization] = await Promise.all([
        this.prisma.user.findFirst({
          where: {
            id: user.userId,
            role: "PLATFORM_ADMIN",
            isPlatformUser: true,
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { role: true },
        }),
        this.prisma.organization.findFirst({
          where: { id: organizationId, deletedAt: null },
          select: { id: true },
        }),
      ]);
      if (!platformAdmin || !organization) {
        throw new ForbiddenException({
          code: "ORGANIZATION_FORBIDDEN",
          message: "You are not a member of this organization",
        });
      }
      request.organization = { organizationId, memberId: null, role: platformAdmin.role };
    }

    if (!request.organization) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    if (headerOrganizationId && session.organizationId !== organizationId) {
      await this.prisma.userSession.update({ where: { id: user.sessionId }, data: { organizationId } });
    }
    // Keep the request principal in sync after a validated session switch.
    user.organizationId = organizationId;
    return true;
  }
}

export type { UserRole };
