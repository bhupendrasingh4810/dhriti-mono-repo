import { jsonRequest, pathSegment, request, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
type Input = Record<string, unknown>;
export const usersService = {
  list: () => request<ApiEntity[]>("/api/users"),
  create: (input: Input) => jsonRequest<ApiEntity, Input>("/api/users", "POST", input),
  get: (userId: string) => request<ApiEntity>(`/api/users/${pathSegment(userId)}`),
  update: (userId: string, input: Input) =>
    jsonRequest<ApiEntity, Input>(`/api/users/${pathSegment(userId)}`, "PATCH", input),
  remove: (userId: string) => request<void>(`/api/users/${pathSegment(userId)}`, { method: "DELETE" }),
};
const base = "/api/organization/webhooks";
export const webhooksService = {
  list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, base),
  create: (organizationId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, base, "POST", input),
  update: (organizationId: string, webhookId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/${pathSegment(webhookId)}`, "PATCH", input),
  rotateSecret: (organizationId: string, webhookId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${base}/${pathSegment(webhookId)}/rotate-secret`, { method: "POST" }),
  remove: (organizationId: string, webhookId: string) =>
    tenantRequest<void>(organizationId, `${base}/${pathSegment(webhookId)}`, { method: "DELETE" }),
  listDeliveries: (organizationId: string, webhookId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/${pathSegment(webhookId)}/deliveries`),
};
