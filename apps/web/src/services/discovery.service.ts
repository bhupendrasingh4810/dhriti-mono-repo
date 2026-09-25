import { tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
export const analyticsService = {
  track: (organizationId: string, input: { event: string; properties?: Record<string, unknown> }) =>
    tenantJsonRequest<void, typeof input>(organizationId, "/api/organization/analytics/track", "POST", input),
  overview: (organizationId: string, query: { from?: string; to?: string } = {}) =>
    tenantRequest<ApiEntity>(organizationId, "/api/organization/analytics/overview", { query }),
};
export const searchService = {
  run: (organizationId: string, query: { query: string; limit?: number; types?: string[] }) =>
    tenantRequest<ApiEntity[]>(organizationId, "/api/organization/search", { query }),
  history: (organizationId: string) => tenantRequest<string[]>(organizationId, "/api/organization/search/history"),
};
