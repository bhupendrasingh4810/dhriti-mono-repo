import { pathSegment, tenantRequest } from "@/services/request.service";

/** Permission keys the current user holds in the organization (from all their permission groups). */
export const permissionsService = {
  mine: (organizationId: string) =>
    tenantRequest<{ permissions: string[] }>(
      organizationId,
      `/api/organizations/${pathSegment(organizationId)}/me/permissions`,
    ).then((result) => result.permissions),
};
