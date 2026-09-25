import { jsonRequest, pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
type Input = Record<string, unknown>;
const platform = "/api/control/platform";
export const controlPlatformService = {
  dashboard: () => tenantRequest<ApiEntity>("", `${platform}/dashboard`),
  listOrganizations: () => tenantRequest<ApiEntity[]>("", `${platform}/organizations`),
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
  createProduct: (input: Input) => jsonRequest<ApiEntity, Input>(`${platform}/products`, "POST", input),
  updateProduct: (productId: string, input: Input) =>
    jsonRequest<ApiEntity, Input>(`${platform}/products/${pathSegment(productId)}`, "PATCH", input),
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
    tenantRequest<ApiEntity[]>(organizationId, "/api/control/organization/entitlements"),
  listFeatureFlags: (organizationId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, "/api/control/organization/feature-flags"),
};
