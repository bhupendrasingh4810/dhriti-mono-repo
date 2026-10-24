import { tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
export type SearchResult = {
  entityType: "message" | "issue" | "page" | "event" | "user";
  entityId: string;
  title: string;
  snippet: string;
  authorId: string | null;
  createdAt: string;
  rank: number;
};
export const analyticsService = {
  track: (organizationId: string, input: { event: string; properties?: Record<string, unknown> }) =>
    tenantJsonRequest<void, typeof input>(organizationId, "/api/organization/analytics/track", "POST", input),
  overview: (organizationId: string, query: { from?: string; to?: string } = {}) =>
    tenantRequest<ApiEntity>(organizationId, "/api/organization/analytics/overview", { query }),
};
export const searchService = {
  run: (organizationId: string, query: { q: string; limit?: number; type?: SearchResult["entityType"] }) =>
    tenantRequest<SearchResult[]>(organizationId, "/api/organization/search", { query }),
  history: (organizationId: string) => tenantRequest<string[]>(organizationId, "/api/organization/search/history"),
};
