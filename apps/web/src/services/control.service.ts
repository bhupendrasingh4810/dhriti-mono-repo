import { jsonRequest, pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
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
  deleteOrganization: (organizationId: string) =>
    tenantRequest<void>("", `${platform}/organizations/${pathSegment(organizationId)}`, { method: "DELETE" }),
  listUsers: () => tenantRequest<ApiEntity[]>("", `${platform}/users`),
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
  listProducts: () => tenantRequest<ApiEntity[]>("", `${platform}/products`),
  listEntitlements: (query: ListEntitlementsQuery = {}) =>
    tenantRequest<ControlEntitlementPage>("", `${platform}/entitlements`, { query }),
  createEntitlement: (input: Required<Pick<ControlEntitlementInput, "key" | "name" | "kind">> & ControlEntitlementInput) =>
    jsonRequest<ControlEntitlementDefinition, ControlEntitlementInput>(`${platform}/entitlements`, "POST", input),
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
  auditLogs: (limit?: number) => tenantRequest<ApiEntity[]>("", `${platform}/audit-logs`, { query: { limit } }),
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
    tenantRequest<ApiEntity>(organizationId, "/api/control/organization/dashboard"),
  getSettings: (organizationId: string) =>
    tenantRequest<ApiEntity>(organizationId, "/api/control/organization/settings"),
  updateSettings: (organizationId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, "/api/control/organization/settings", "PATCH", input),
  listEntitlements: (organizationId: string) =>
    tenantRequest<ControlProductEntitlement[]>(organizationId, "/api/control/organization/entitlements"),
  listMembers: (organizationId: string) =>
    tenantRequest<ControlOrganizationMember[]>(organizationId, "/api/control/organization/members"),
  removeMember: (organizationId: string, memberId: string) =>
    tenantRequest<void>(organizationId, `/api/control/organization/members/${pathSegment(memberId)}`, { method: "DELETE" }),
  setEntitlement: (organizationId: string, input: Input) =>
    tenantJsonRequest<ControlProductEntitlement, Input>(organizationId, "/api/control/organization/entitlements", "POST", input),
  listFeatureFlags: (organizationId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, "/api/control/organization/feature-flags"),
  upsertFeatureFlag: (organizationId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, "/api/control/organization/feature-flags", "POST", input),
  getSubscription: (organizationId: string) =>
    tenantRequest<ApiEntity | null>(organizationId, "/api/control/organization/subscription"),
};
