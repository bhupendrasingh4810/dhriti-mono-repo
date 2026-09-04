import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import type { OrganizationRole } from "@prisma/client";

import { ORG_ROLES_KEY } from "../decorators/org-roles.decorator";
import type { OrganizationContext } from "../decorators/organization.decorator";

interface RoleRequest extends Request {
  organization?: OrganizationContext;
}

/** Runs after TenantGuard; enforces the caller's role within the active organization. */
@Injectable()
export class OrgRolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<OrganizationRole[] | undefined>(
      ORG_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!required || required.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RoleRequest>();
    const organization = request.organization;
    if (!organization) {
      throw new ForbiddenException({
        code: "ORGANIZATION_REQUIRED",
        message: "Organization context is required for role checks",
      });
    }

    if (!required.includes(organization.role)) {
      throw new ForbiddenException({
        code: "FORBIDDEN",
        message: "You do not have permission to perform this action",
      });
    }
    return true;
  }
}
