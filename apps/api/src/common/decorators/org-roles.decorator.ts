import { SetMetadata, type CustomDecorator } from "@nestjs/common";
import type { UserRole } from "@prisma/client";

export const ORG_ROLES_KEY = "dhriti:orgRoles";

/** Requires the authenticated user to hold one of these roles in the active organization. */
export function OrgRoles(...roles: UserRole[]): CustomDecorator<string> {
  return SetMetadata(ORG_ROLES_KEY, roles);
}
