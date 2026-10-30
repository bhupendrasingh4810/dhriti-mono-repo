import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { NotificationPreference, NotificationType } from "@dhriti/types";
export interface InboxNotification {
  id: string;
  userId: string;
  actorId: string | null;
  sourceType: string;
  sourceId: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  linkUrl: string | null;
  payload: Record<string, unknown>;
  isRead: boolean;
  isSeen: boolean;
  createdAt: string;
}
export interface NotificationPage {
  notifications: InboxNotification[];
  nextCursor: string | null;
  unreadCount: number;
  unseenCount: number;
}
const base = "/api/organization/notifications";
export const notificationsService = {
  list: (organizationId: string, query: { cursor?: string; limit?: number; unreadOnly?: boolean } = {}) =>
    tenantRequest<NotificationPage>(organizationId, base, { query }),
  unreadCount: (organizationId: string) =>
    tenantRequest<{ unreadCount: number }>(organizationId, `${base}/unread-count`),
  create: (organizationId: string, input: { userId: string; type: NotificationType; title: string; body?: string }) =>
    tenantJsonRequest<{ eventId: string }, typeof input>(organizationId, base, "POST", input),
  markRead: (organizationId: string, notificationId: string) =>
    tenantRequest<void>(organizationId, `${base}/${pathSegment(notificationId)}/read`, { method: "PATCH" }),
  markAllRead: (organizationId: string) =>
    tenantRequest<{ markedRead: number }>(organizationId, `${base}/read-all`, { method: "PATCH" }),
  markSeen: (organizationId: string, ids: string[]) =>
    tenantJsonRequest<void, { ids: string[] }>(organizationId, `${base}/seen`, "PATCH", { ids }),
  listPreferences: (organizationId: string) =>
    tenantRequest<NotificationPreference[]>(organizationId, `${base}/preferences`),
  upsertPreference: (
    organizationId: string,
    input: Pick<NotificationPreference, "type"> & Partial<Omit<NotificationPreference, "type">>,
  ) => tenantJsonRequest<NotificationPreference, typeof input>(organizationId, `${base}/preferences`, "POST", input),
};
