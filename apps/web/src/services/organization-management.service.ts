import { jsonRequest, pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
type Input = Record<string, unknown>;
const org = "/api/organization";
const memberPath = (memberId: string) => `${org}/members/${pathSegment(memberId)}`;
export const organizationManagementService = {
  listMine: () => tenantRequest<ApiEntity[]>("", "/api/organizations"),
  getActive: (organizationId: string) => tenantRequest<ApiEntity>(organizationId, org),
  updateActive: (organizationId: string, input: { name: string }) =>
    tenantJsonRequest<ApiEntity, typeof input>(organizationId, org, "PATCH", input),
  listMembers: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${org}/members`),
  addMember: (organizationId: string, input: { email: string; role: string }) =>
    tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${org}/members`, "POST", input),
  updateMemberRole: (organizationId: string, memberId: string, role: string) =>
    tenantJsonRequest<ApiEntity, { role: string }>(organizationId, memberPath(memberId), "PATCH", { role }),
  updateMemberLifecycle: (organizationId: string, memberId: string, status: string) =>
    tenantJsonRequest<ApiEntity, { status: string }>(organizationId, `${memberPath(memberId)}/lifecycle`, "PATCH", {
      status,
    }),
  transferOwnership: (organizationId: string, memberId: string, targetMemberId: string) =>
    tenantJsonRequest<void, { memberId: string }>(
      organizationId,
      `${memberPath(memberId)}/transfer-ownership`,
      "POST",
      { memberId: targetMemberId },
    ),
  removeMember: (organizationId: string, memberId: string) =>
    tenantRequest<void>(organizationId, memberPath(memberId), { method: "DELETE" }),
};
function tenantCollection(path: string) {
  return {
    list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, path),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, path, "POST", input),
    update: (organizationId: string, id: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${path}/${pathSegment(id)}`, "PATCH", input),
    remove: (organizationId: string, id: string) =>
      tenantRequest<void>(organizationId, `${path}/${pathSegment(id)}`, { method: "DELETE" }),
  };
}
export const invitationsService = {
  list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${org}/invitations`),
  create: (organizationId: string, input: { email: string }) =>
    tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${org}/invitations`, "POST", input),
  bulk: (organizationId: string, emails: string) =>
    tenantJsonRequest<ApiEntity[], { emails: string }>(organizationId, `${org}/invitations/bulk`, "POST", { emails }),
  accept: (token: string) => jsonRequest<void, { token: string }>("/api/invitations/accept", "POST", { token }),
  cancel: (organizationId: string, invitationId: string) =>
    tenantRequest<void>(organizationId, `${org}/invitations/${pathSegment(invitationId)}`, { method: "DELETE" }),
};
export const organizationCollectionsService = {
  teams: tenantCollection(`${org}/teams`),
  groups: tenantCollection(`${org}/groups`),
};
const access = (organizationId: string) => `/api/organizations/${pathSegment(organizationId)}`;
export const organizationAccessService = {
  permissionGroups: {
    list: (organizationId: string) =>
      tenantRequest<ApiEntity[]>(organizationId, `${access(organizationId)}/permission-groups`),
    get: (organizationId: string, groupId: string) =>
      tenantRequest<ApiEntity>(organizationId, `${access(organizationId)}/permission-groups/${pathSegment(groupId)}`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${access(organizationId)}/permission-groups`, "POST", input),
    update: (organizationId: string, groupId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(
        organizationId,
        `${access(organizationId)}/permission-groups/${pathSegment(groupId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, groupId: string) =>
      tenantRequest<void>(organizationId, `${access(organizationId)}/permission-groups/${pathSegment(groupId)}`, {
        method: "DELETE",
      }),
  },
  departments: {
    list: (organizationId: string) =>
      tenantRequest<ApiEntity[]>(organizationId, `${access(organizationId)}/departments`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${access(organizationId)}/departments`, "POST", input),
    update: (organizationId: string, departmentId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(
        organizationId,
        `${access(organizationId)}/departments/${pathSegment(departmentId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, departmentId: string) =>
      tenantRequest<void>(organizationId, `${access(organizationId)}/departments/${pathSegment(departmentId)}`, {
        method: "DELETE",
      }),
  },
  teams: {
    list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${access(organizationId)}/teams`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${access(organizationId)}/teams`, "POST", input),
    update: (organizationId: string, teamId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(
        organizationId,
        `${access(organizationId)}/teams/${pathSegment(teamId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, teamId: string) =>
      tenantRequest<void>(organizationId, `${access(organizationId)}/teams/${pathSegment(teamId)}`, {
        method: "DELETE",
      }),
  },
  listPermissions: (organizationId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${access(organizationId)}/permissions`),
  getUserPermissions: (organizationId: string, userId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${access(organizationId)}/users/${pathSegment(userId)}/permissions`),
  getSubscription: (organizationId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${access(organizationId)}/subscription`),
  updateSubscription: (organizationId: string, input: Input, idempotencyKey?: string) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, `${access(organizationId)}/subscription`, "PATCH", input, {
      headers: idempotencyKey ? { "idempotency-key": idempotencyKey } : undefined,
    }),
  listEntitlements: (organizationId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${access(organizationId)}/entitlements`),
};
