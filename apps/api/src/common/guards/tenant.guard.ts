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
 * Resolves the active organization from the authenticated session and enforces
 * an active membership. A requested organization header can switch context
 * only for an active membership or an active platform administrator.
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
    if (user.organizationId && session.organizationId && user.organizationId !== session.organizationId) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "Session organization context is stale",
      });
    }
    const sessionOrganizationId = session.organizationId ?? user.organizationId;
    const headerOrganization =
      headerOrganizationId && !isUUID(headerOrganizationId)
        ? await this.prisma.organization.findFirst({
            where: { slug: headerOrganizationId, deletedAt: null },
            select: { id: true },
          })
        : null;
    const organizationId = headerOrganization?.id ?? headerOrganizationId ?? sessionOrganizationId;

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
      select: {
        id: true,
        user: { select: { role: true } },
        organization: { select: { deletedAt: true } },
      },
    });

    if (membership && membership.organization.deletedAt === null) {
      request.organization = {
        organizationId,
        memberId: membership.id,
        role: membership.user.role,
      };
      return true;
    }

    const platformAdministrator = await this.prisma.user.findFirst({
      where: { id: user.userId, deletedAt: null, status: "ACTIVE", role: "PLATFORM_ADMIN", isPlatformUser: true },
      select: { role: true },
    });
    const targetOrganization =
      headerOrganization ??
      (await this.prisma.organization.findFirst({
        where: { id: organizationId, deletedAt: null },
        select: { id: true },
      }));
    if (!platformAdministrator || !targetOrganization) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }
    request.organization = {
      organizationId,
      memberId: null,
      role: platformAdministrator.role,
    };
    return true;
  }
}

export type { UserRole };
