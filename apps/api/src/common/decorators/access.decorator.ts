import { SetMetadata } from "@nestjs/common";

export const ACCESS_REQUIREMENTS_KEY = "accessRequirements";

export interface AccessRequirements {
  entitlement?: string;
  permission?: string;
  limit?: string;
}

export const RequireAccess = (requirements: AccessRequirements) =>
  SetMetadata(ACCESS_REQUIREMENTS_KEY, requirements);

export const RequirePermission = (permission: string) => RequireAccess({ permission });
export const RequireEntitlement = (entitlement: string) => RequireAccess({ entitlement });
export const RequireLimit = (limit: string) => RequireAccess({ limit });