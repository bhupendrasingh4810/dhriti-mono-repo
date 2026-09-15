import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import type { Request } from "express";
import type { UserRole } from "@prisma/client";

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
    const organizationId =
      (Array.isArray(headerValue) ? headerValue[0] : headerValue) ?? user.organizationId;

    if (!organizationId) {
      throw new ForbiddenException({
        code: "ORGANIZATION_REQUIRED",
        message: "No active organization; select one or join an organization first",
      });
    }

    const membership = await this.prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: user.userId },
      },
      select: { id: true, user: { select: { role: true } }, organization: { select: { deletedAt: true } } },
    });

    if (!membership || membership.organization.deletedAt !== null) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "You are not a member of this organization",
      });
    }

    const contextValue: OrganizationContext = {
      organizationId,
      memberId: membership.id,
      role: membership.user.role,
    };
    request.organization = contextValue;

    // Keep the JWT org in sync when the caller switched via header.
    user.organizationId = organizationId;
    return true;
  }
}

export type { UserRole };
