import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity, CursorPage } from "@/services/service-types";
export interface NotificationPage extends CursorPage<ApiEntity> {
  notifications: ApiEntity[];
  unreadCount: number;
}
const base = "/api/organization/notifications";
export const notificationsService = {
  list: (organizationId: string, query: { cursor?: string; limit?: number; unreadOnly?: boolean } = {}) =>
    tenantRequest<NotificationPage>(organizationId, base, { query }),
  unreadCount: (organizationId: string) =>
    tenantRequest<{ unreadCount: number }>(organizationId, `${base}/unread-count`),
  create: (
    organizationId: string,
    input: { userId: string; type: string; title: string; body?: string; data?: Record<string, unknown> },
  ) => tenantJsonRequest<ApiEntity, typeof input>(organizationId, base, "POST", input),
  markRead: (organizationId: string, notificationId: string) =>
    tenantRequest<void>(organizationId, `${base}/${pathSegment(notificationId)}/read`, { method: "PATCH" }),
  markAllRead: (organizationId: string) =>
    tenantRequest<{ markedRead: number }>(organizationId, `${base}/read-all`, { method: "PATCH" }),
  listPreferences: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/preferences`),
  upsertPreference: (
    organizationId: string,
    input: { type: string; inApp?: boolean; email?: boolean; push?: boolean },
  ) => tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${base}/preferences`, "POST", input),
};
