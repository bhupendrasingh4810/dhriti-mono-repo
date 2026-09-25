import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { isUUID } from "class-validator";
import type { Request } from "express";

import type { OrganizationContext } from "../decorators/organization.decorator";

interface OrganizationRequest extends Request {
  organization?: OrganizationContext;
}

/** Ensures a route organization id cannot differ from the authenticated tenant context. */
@Injectable()
export class OrganizationContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<OrganizationRequest>();
    const routeOrganizationId = request.params.organizationId as string | undefined;
    const bodyOrganizationId =
      typeof request.body?.organizationId === "string" ? request.body.organizationId : undefined;
    const activeOrganizationId = request.organization?.organizationId;
    if (
      !activeOrganizationId ||
      !isUUID(activeOrganizationId) ||
      (routeOrganizationId !== undefined &&
        (!isUUID(routeOrganizationId) || routeOrganizationId !== activeOrganizationId)) ||
      (bodyOrganizationId !== undefined && (!isUUID(bodyOrganizationId) || bodyOrganizationId !== activeOrganizationId))
    ) {
      throw new ForbiddenException({
        code: "ORGANIZATION_FORBIDDEN",
        message: "Organization context does not match the active organization",
      });
    }
    return true;
  }
}
