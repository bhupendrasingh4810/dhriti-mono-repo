import { jsonRequest, pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
import type { SystemHealthSnapshot } from "@dhriti/types";
type Input = Record<string, unknown>;
export interface PlatformOrganization extends ApiEntity {
  name: string;
  slug: string;
  deletedAt: string | null;
  _count: { members: number };
  subscription: { plan: string; status: string; seats: number } | null;
}

export type PlatformOrganizationSortField = "name" | "seats" | "createdAt";

export interface ListPlatformOrganizationsQuery {
  search?: string;
  plan?: "FREE" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  status?: "TRIALING" | "ACTIVE" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "SUSPENDED";
  sortBy?: PlatformOrganizationSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PlatformOrganizationPage {
  items: PlatformOrganization[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface PlatformUser extends ApiEntity {
  name: string | null;
  email: string;
  avatarUrl: string | null;
  status: "ACTIVE" | "SUSPENDED" | string;
  createdAt: string;
  auth: { platformRole: string | null; mfaEnabled: boolean; lastLoginAt: string | null } | null;
}

export type PlatformUserSortField = "name" | "email" | "status" | "createdAt";

export interface ListPlatformUsersQuery {
  search?: string;
  status?: "ACTIVE" | "SUSPENDED" | "LOCKED";
  mfaEnabled?: boolean;
  sortBy?: PlatformUserSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface PlatformUserPage {
  items: PlatformUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface PlatformAuditLog {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: { id: string; name: string; email: string } | null;
  organization: { id: string; name: string; slug: string } | null;
}

export interface PlatformSecurityEvent {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  type: string;
  description: string;
  ipAddress: string | null;
  createdAt: string;
  resolvedAt: string | null;
  source: string;
  externalId: string | null;
}
export interface SecurityEventFilters {
  severity?: PlatformSecurityEvent["severity"];
  status?: "open" | "resolved";
  ipAddress?: string;
  from?: string;
  to?: string;
}
export interface SecurityEventDetail {
  event: PlatformSecurityEvent;
  timeline: {
    id: string;
    action: string;
    createdAt: string;
    actorUserId: string | null;
    metadata: Record<string, unknown> | null;
  }[];
  hasMoreTimeline: boolean;
}
export interface SecuritySession {
  id: string;
  organizationId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
  user: { id: string; name: string | null; email: string };
}
export interface SecurityCompliance {
  id: string;
  name: string;
  slug: string;
  mfaEnforced: boolean;
  activeMembers: number;
  mfaEnabledMembers: number;
  mfaGap: number;
  ssoStatus: "not_configured" | "disabled" | "configured" | "verified";
  lastVerifiedAt: string | null;
}
export interface SecurityDelivery {
  id: string;
  eventId: string;
  channel: string;
  attempts: number;
  deliveredAt: string | null;
  lastError: string | null;
  createdAt: string;
  availableAt: string;
}
export interface PlatformSecurityOverview {
  activeThreats: number;
  blockedIps: number;
  mfaAdoption: number;
  ssoOrgs: number;
  mfaStatus: { enforced: number; optional: number; none: number; total: number };
}
export interface SecurityPage<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface PlatformBlockedIp {
  ipAddress: string;
  createdAt: string;
  reason: string;
  expiresAt: string | null;
}
export interface ConfigureOrganizationOidcInput {
  issuer: string;
  clientId: string;
  clientSecret: string;
  enabled: boolean;
}
export interface OrganizationOidcConfiguration {
  organizationId: string;
  issuer: string;
  clientId: string;
  enabled: boolean;
  lastVerifiedAt: string | null;
  updatedAt: string;
}

export interface ListPlatformAuditLogsQuery {
  search?: string;
  action?: string;
  resourceType?: string;
  page?: number;
  limit?: number;
}

export interface PlatformAuditLogPage {
  items: PlatformAuditLog[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface CreatePlatformOrganizationInput {
  name: string;
  adminEmail: string;
  plan: "FREE" | "STANDARD" | "PREMIUM" | "ENTERPRISE";
  seats: number;
}

export interface PlatformDashboard {
  organizations: { total: number; active: number; suspended: number };
  users: { total: number; active: number; mfaEnabled: number };
  metrics: {
    totalOrganizations: number;
    activeUsers: number;
    monthlyRecurringRevenueMinor: number;
    uptimePercent: number | null;
    observedSince: string;
  };
  recentOrganizations: Array<{ id: string; name: string; plan: string; seats: number; status: string }>;
  alerts: Array<{ severity: "critical" | "warning" | "info"; message: string; observedAt: string }>;
  topOrganizationsByUsage: Array<{ id: string; name: string; usage: number; percentage: number }>;
}

export interface ControlOrganizationMember extends ApiEntity {
  name: string;
  email: string;
  role: string;
  status: string;
  isOwner: boolean;
  joinedAt: string;
  teams: string[];
}

export interface ControlProductEntitlement extends ApiEntity {
  isEnabled: boolean;
  product: { key: string; name: string; isActive: boolean };
}

export interface ControlOrganizationDashboard {
  members: { total: number; active: number };
  teams: number;
  products: { enabled: number; total: number };
  storage: { files: number; bytes: number };
}

export interface ControlEntitlementDefinition extends ApiEntity {
  key: string;
  name: string;
  kind: "FEATURE" | "LIMIT";
  productKey: string | null;
  description: string | null;
  unit: string | null;
  _count: { planEntitlements: number; overrides: number };
}

export interface ControlEntitlementInput {
  key?: string;
  name?: string;
  kind?: "FEATURE" | "LIMIT";
  productKey?: string;
  description?: string;
  unit?: string;
}

export type PlatformOrganizationEntitlement = Pick<
  ControlEntitlementDefinition,
  "id" | "key" | "name" | "kind" | "productKey" | "description" | "unit"
> & {
  enabled: boolean;
  value: number | null;
};

export interface UpdateOrganizationEntitlementInput {
  key: string;
  enabled: boolean;
  value?: number;
}

export type EntitlementSortField = "key" | "name" | "productKey" | "kind";

export interface ListEntitlementsQuery {
  search?: string;
  productKey?: string;
  kind?: "FEATURE" | "LIMIT";
  sortBy?: EntitlementSortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export interface ControlEntitlementPage {
  items: ControlEntitlementDefinition[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface ControlPlanEntitlement {
  enabled: boolean;
  value: number | null;
  entitlement: ControlEntitlementDefinition;
}

export interface ControlPlan extends ApiEntity {
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  entitlements: ControlPlanEntitlement[];
}

export interface ControlPlanEntitlementInput {
  entitlementKey: string;
  enabled: boolean;
  value?: number;
}

export interface ControlRolePermission extends ApiEntity {
  key: string;
  resource: string;
  action: string;
  productKey: string | null;
  description: string | null;
  isAssignable: boolean;
  isSystemOnly: boolean;
}

export interface ControlPlatformRole extends ApiEntity {
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Array<{ permission: ControlRolePermission }>;
  _count: { assignments: number };
}

export interface CreateControlPlatformRoleInput {
  key: string;
  name: string;
  description?: string;
}

export interface ControlPermissionInput {
  key: string;
  resource: string;
  action: string;
  productKey?: string;
  description?: string;
  isAssignable?: boolean;
  isSystemOnly?: boolean;
}

export type UpdateControlPermissionInput = Omit<ControlPermissionInput, "key">;

export interface CreateControlPlanInput {
  key: string;
  name: string;
  description?: string;
  entitlements: ControlPlanEntitlementInput[];
}

const platform = "/api/control/platform";
export const controlPlatformService = {
  dashboard: () => tenantRequest<PlatformDashboard>("", `${platform}/dashboard`),
  listOrganizations: (query: ListPlatformOrganizationsQuery = {}) =>
    tenantRequest<PlatformOrganizationPage>("", `${platform}/organizations`, { query }),
  createOrganization: (input: CreatePlatformOrganizationInput) =>
    jsonRequest<PlatformOrganization, CreatePlatformOrganizationInput>(`${platform}/organizations`, "POST", input),
  listOrganizationEntitlements: (organizationId: string) =>
    tenantRequest<PlatformOrganizationEntitlement[]>(
      "",
      `${platform}/organizations/${pathSegment(organizationId)}/entitlements`,
    ),
  updateOrganizationEntitlement: (organizationId: string, input: UpdateOrganizationEntitlementInput) =>
    jsonRequest<PlatformOrganizationEntitlement, UpdateOrganizationEntitlementInput>(
      `${platform}/organizations/${pathSegment(organizationId)}/entitlements`,
      "PATCH",
      input,
    ),
  deleteOrganization: (organizationId: string) =>
    tenantRequest<void>("", `${platform}/organizations/${pathSegment(organizationId)}`, { method: "DELETE" }),
  listUsers: async (query: ListPlatformUsersQuery = {}) => {
    const response = await tenantRequest<PlatformUserPage | PlatformUser[]>("", `${platform}/users`, { query });
    if (!Array.isArray(response)) return response;

    // Keep the table usable while an older API process still returns an array during rollout.
    const search = query.search?.trim().toLowerCase();
    const filtered = response.filter(
      (user) =>
        (!search || `${user.name ?? ""} ${user.email}`.toLowerCase().includes(search)) &&
        (!query.status || user.status === query.status) &&
        (query.mfaEnabled === undefined || user.auth?.mfaEnabled === query.mfaEnabled),
    );
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder ?? "desc";
    const sorted = [...filtered].sort((first, second) => {
      const firstValue = String(first[sortBy] ?? "");
      const secondValue = String(second[sortBy] ?? "");
      const comparison = firstValue.localeCompare(secondValue);
      return sortOrder === "asc" ? comparison : -comparison;
    });
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    return {
      items: sorted.slice((page - 1) * limit, page * limit),
      pagination: { page, limit, total: sorted.length, totalPages: Math.max(1, Math.ceil(sorted.length / limit)) },
    };
  },
  setOrganizationSuspended: (organizationId: string, suspended: boolean) =>
    tenantRequest<void>(
      "",
      `${platform}/organizations/${pathSegment(organizationId)}/${suspended ? "suspend" : "reactivate"}`,
      { method: "POST" },
    ),
  setUserSuspended: (userId: string, suspended: boolean) =>
    tenantRequest<void>("", `${platform}/users/${pathSegment(userId)}/${suspended ? "suspend" : "reactivate"}`, {
      method: "POST",
    }),
  lockUser: (userId: string) =>
    tenantRequest<void>("", `${platform}/users/${pathSegment(userId)}/lock`, { method: "POST" }),
  listRoles: () => tenantRequest<ControlPlatformRole[]>("", `${platform}/roles`),
  securityOverview: () => tenantRequest<PlatformSecurityOverview>("", `${platform}/security/overview`),
  systemHealth: (signal?: AbortSignal) =>
    tenantRequest<SystemHealthSnapshot>("", `${platform}/system-health`, { signal, cache: "no-store" }),
  systemHealthReport: (signal?: AbortSignal) =>
    tenantRequest<SystemHealthSnapshot>("", `${platform}/system-health/report`, { signal, cache: "no-store" }),
  organizationOidc: (id: string) =>
    tenantRequest<{ configuration: OrganizationOidcConfiguration | null; redirectUri: string }>(
      "",
      `${platform}/security/organizations/${pathSegment(id)}/oidc`,
    ),
  configureOrganizationOidc: (id: string, input: ConfigureOrganizationOidcInput) =>
    jsonRequest<OrganizationOidcConfiguration, ConfigureOrganizationOidcInput>(
      `${platform}/security/organizations/${pathSegment(id)}/oidc`,
      "PUT",
      input,
    ),
  securityEvents: (page = 1, limit = 20, filters: SecurityEventFilters = {}) =>
    tenantRequest<SecurityPage<PlatformSecurityEvent>>("", `${platform}/security/events`, {
      query: { page, limit, ...filters },
    }),
  securityEvent: (id: string) =>
    tenantRequest<SecurityEventDetail>("", `${platform}/security/events/${pathSegment(id)}`),
  securitySessions: (page = 1, limit = 20, search = "") =>
    tenantRequest<SecurityPage<SecuritySession>>("", `${platform}/security/sessions`, {
      query: { page, limit, search: search || undefined },
    }),
  revokeSecuritySession: (id: string, reason: string) =>
    jsonRequest<void, { reason: string }>(`${platform}/security/sessions/${pathSegment(id)}/revoke`, "POST", {
      reason,
    }),
  securityCompliance: (page = 1, limit = 20) =>
    tenantRequest<SecurityPage<SecurityCompliance>>("", `${platform}/security/compliance`, { query: { page, limit } }),
  securityIntegrationStatus: () =>
    tenantRequest<{ email: boolean; webhook: boolean; ingestion: boolean }>("", `${platform}/security/integrations`),
  securityDeliveries: (page = 1, limit = 20) =>
    tenantRequest<SecurityPage<SecurityDelivery>>("", `${platform}/security/deliveries`, { query: { page, limit } }),
  blockedIps: (page = 1, limit = 20) =>
    tenantRequest<SecurityPage<PlatformBlockedIp>>("", `${platform}/security/blocked-ips`, { query: { page, limit } }),
  resolveSecurityEvent: (id: string) =>
    tenantRequest<void>("", `${platform}/security/events/${pathSegment(id)}/resolve`, { method: "POST" }),
  blockIp: (ipAddress: string, reason: string, expiresAt?: string) =>
    jsonRequest<void, { ipAddress: string; reason: string; expiresAt?: string }>(
      `${platform}/security/blocked-ips`,
      "POST",
      { ipAddress, reason, expiresAt },
    ),
  unblockIp: (ip: string) =>
    tenantRequest<void>("", `${platform}/security/blocked-ips/${pathSegment(ip)}`, { method: "DELETE" }),
  listRolePermissions: () => tenantRequest<ControlRolePermission[]>("", `${platform}/roles/permissions`),
  listPermissions: () => tenantRequest<ControlRolePermission[]>("", `${platform}/permissions`),
  createPermission: (input: ControlPermissionInput) =>
    jsonRequest<ControlRolePermission, ControlPermissionInput>(`${platform}/permissions`, "POST", input),
  updatePermission: (permissionId: string, input: UpdateControlPermissionInput) =>
    jsonRequest<ControlRolePermission, UpdateControlPermissionInput>(
      `${platform}/permissions/${pathSegment(permissionId)}`,
      "PATCH",
      input,
    ),
  deletePermission: (permissionId: string) =>
    tenantRequest<void>("", `${platform}/permissions/${pathSegment(permissionId)}`, { method: "DELETE" }),
  createRole: (input: CreateControlPlatformRoleInput) =>
    jsonRequest<ControlPlatformRole, CreateControlPlatformRoleInput>(`${platform}/roles`, "POST", input),
  attachRolePermission: (roleId: string, permissionId: string) =>
    tenantRequest<void>("", `${platform}/roles/${pathSegment(roleId)}/permissions/${pathSegment(permissionId)}`, {
      method: "PUT",
    }),
  retrySecurityDelivery: (id: string) =>
    tenantRequest<void>("", `${platform}/security/deliveries/${pathSegment(id)}/retry`, { method: "POST" }),
  removeRolePermission: (roleId: string, permissionId: string) =>
    tenantRequest<void>("", `${platform}/roles/${pathSegment(roleId)}/permissions/${pathSegment(permissionId)}`, {
      method: "DELETE",
    }),
  assignRole: (roleId: string, userId: string) =>
    jsonRequest<ApiEntity, Record<string, never>>(
      `${platform}/roles/${pathSegment(roleId)}/users/${pathSegment(userId)}`,
      "POST",
      {},
    ),
  revokeRole: (roleId: string, userId: string) =>
    tenantRequest<void>("", `${platform}/roles/${pathSegment(roleId)}/users/${pathSegment(userId)}/revoke`, {
      method: "PATCH",
    }),
  listProducts: () => tenantRequest<ApiEntity[]>("", `${platform}/products`),
  listEntitlements: (query: ListEntitlementsQuery = {}) =>
    tenantRequest<ControlEntitlementPage>("", `${platform}/entitlements`, { query }),
  createEntitlement: (
    input: Required<Pick<ControlEntitlementInput, "key" | "name" | "kind">> & ControlEntitlementInput,
  ) => jsonRequest<ControlEntitlementDefinition, ControlEntitlementInput>(`${platform}/entitlements`, "POST", input),
  updateEntitlement: (entitlementId: string, input: ControlEntitlementInput) =>
    jsonRequest<ControlEntitlementDefinition, ControlEntitlementInput>(
      `${platform}/entitlements/${pathSegment(entitlementId)}`,
      "PATCH",
      input,
    ),
  deleteEntitlement: (entitlementId: string) =>
    tenantRequest<void>("", `${platform}/entitlements/${pathSegment(entitlementId)}`, { method: "DELETE" }),
  listPlans: () => tenantRequest<ControlPlan[]>("", `${platform}/plans`),
  createPlan: (input: CreateControlPlanInput) =>
    jsonRequest<ControlPlan, CreateControlPlanInput>(`${platform}/plans`, "POST", input),
  replacePlanEntitlements: (planId: string, entitlements: ControlPlanEntitlementInput[]) =>
    jsonRequest<ControlPlan, { entitlements: ControlPlanEntitlementInput[] }>(
      `${platform}/plans/${pathSegment(planId)}/entitlements`,
      "PUT",
      { entitlements },
    ),
  updatePlanStatus: (planId: string, isActive: boolean) =>
    jsonRequest<ControlPlan, { isActive: boolean }>(`${platform}/plans/${pathSegment(planId)}/status`, "PATCH", {
      isActive,
    }),
  deletePlan: (planId: string) =>
    tenantRequest<void>("", `${platform}/plans/${pathSegment(planId)}`, { method: "DELETE" }),
  createProduct: (input: Input) => jsonRequest<ApiEntity, Input>(`${platform}/products`, "POST", input),
  updateProduct: (productId: string, input: Input) =>
    jsonRequest<ApiEntity, Input>(`${platform}/products/${pathSegment(productId)}`, "PATCH", input),
  updateOrganizationSubscription: (organizationId: string, input: Input) =>
    jsonRequest<ApiEntity, Input>(
      `${platform}/organizations/${pathSegment(organizationId)}/subscription`,
      "PUT",
      input,
    ),
  listTickets: (status?: string) => tenantRequest<ApiEntity[]>("", `${platform}/tickets`, { query: { status } }),
  createTicket: (input: Input) => jsonRequest<ApiEntity, Input>(`${platform}/tickets`, "POST", input),
  updateTicket: (ticketId: string, input: Input) =>
    jsonRequest<ApiEntity, Input>(`${platform}/tickets/${pathSegment(ticketId)}`, "PATCH", input),
  auditLogs: (query: ListPlatformAuditLogsQuery = {}) =>
    tenantRequest<PlatformAuditLogPage>("", `${platform}/audit-logs`, { query }),
  health: () => tenantRequest<ApiEntity>("", `${platform}/health`),
};
const content = "/api/content";
function contentResource(path: string) {
  return {
    list: () => tenantRequest<ApiEntity[]>("", `${content}/${path}`),
    get: (id: string) => tenantRequest<ApiEntity>("", `${content}/${path}/${pathSegment(id)}`),
    create: (input: Input) => jsonRequest<ApiEntity, Input>(`${content}/${path}`, "POST", input),
    update: (id: string, input: Input) =>
      jsonRequest<ApiEntity, Input>(`${content}/${path}/${pathSegment(id)}`, "PATCH", input),
    remove: (id: string) => tenantRequest<void>("", `${content}/${path}/${pathSegment(id)}`, { method: "DELETE" }),
  };
}
export const contentService = {
  blogPosts: contentResource("blogs/posts"),
  blogCategories: contentResource("blogs/categories"),
  blogTags: contentResource("blogs/tags"),
  careers: contentResource("careers"),
  legalDocuments: contentResource("legal-documents"),
  faq: {
    listGroups: () => tenantRequest<ApiEntity[]>("", `${content}/faq/groups`),
    createGroup: (input: Input) => jsonRequest<ApiEntity, Input>(`${content}/faq/groups`, "POST", input),
  },
};
export const controlOrganizationService = {
  dashboard: (organizationId: string) =>
    tenantRequest<ControlOrganizationDashboard>(organizationId, "/api/control/organization/dashboard"),
  getSettings: (organizationId: string) =>
    tenantRequest<ApiEntity>(organizationId, "/api/control/organization/settings"),
  updateSettings: (organizationId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, "/api/control/organization/settings", "PATCH", input),
  listEntitlements: (organizationId: string) =>
    tenantRequest<ControlProductEntitlement[]>(organizationId, "/api/control/organization/entitlements"),
  listMembers: (organizationId: string, search?: string) =>
    tenantRequest<ControlOrganizationMember[]>(organizationId, "/api/control/organization/members", {
      query: { search: search?.trim() || undefined },
    }),
  removeMember: (organizationId: string, memberId: string) =>
    tenantRequest<void>(organizationId, `/api/control/organization/members/${pathSegment(memberId)}`, {
      method: "DELETE",
    }),
  setEntitlement: (organizationId: string, input: Input) =>
    tenantJsonRequest<ControlProductEntitlement, Input>(
      organizationId,
      "/api/control/organization/entitlements",
      "POST",
      input,
    ),
  getSubscription: (organizationId: string) =>
    tenantRequest<ApiEntity | null>(organizationId, "/api/control/organization/subscription"),
};
