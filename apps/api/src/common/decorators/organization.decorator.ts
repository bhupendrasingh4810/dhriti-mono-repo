import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { UserRole } from "@prisma/client";

export interface OrganizationContext {
  organizationId: string;
  memberId: string | null;
  role: UserRole;
}

interface TenantRequest extends Request {
  organization?: OrganizationContext;
}

export const CurrentOrganization = createParamDecorator(
  (data: keyof OrganizationContext | undefined, ctx: ExecutionContext): OrganizationContext | string | null => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    const organization = request.organization;
    if (!organization) {
      throw new Error("CurrentOrganization used on a route without organization context; add TenantGuard");
    }
    return data ? organization[data] : organization;
  },
);
