import { SetMetadata, type CustomDecorator } from "@nestjs/common";
import type { PlatformRole } from "@prisma/client";

export const PLATFORM_ROLES_KEY = "dhriti:platformRoles";

/** Requires the user to hold one of these platform roles (internal staff). */
export function PlatformRoles(...roles: PlatformRole[]): CustomDecorator<string> {
  return SetMetadata(PLATFORM_ROLES_KEY, roles);
}
