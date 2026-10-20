import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity, CursorPage } from "@/services/service-types";

export interface CreateChannelInput {
  name: string;
  slug: string;
  type?: string;
  visibility?: string;
  teamId?: string;
  topic?: string;
  description?: string;
}
export interface UpdateChannelInput {
  name?: string;
  topic?: string;
  description?: string;
  isArchived?: boolean;
}
export interface CreateMessageInput {
  content: string;
  clientMessageId?: string;
  parentId?: string;
  mentionUserIds?: string[];
}
export interface ListMessagesInput {
  cursor?: string;
  limit?: number;
  initial?: "unread";
  after?: string;
}
export interface MessagePage extends CursorPage<ApiEntity> {
  messages: ConnectApiMessage[];
  newerCursor: string | null;
  firstUnreadId: string | null;
  readReceipts: { userId: string; lastReadAt: string | null }[];
}
export interface ConnectApiMessage {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  isDeleted: boolean;
  parentId?: string | null;
  mentions: { userId: string }[];
  reactions: { userId: string; emoji: string }[];
  _count?: { replies: number };
}
export interface ConnectApiConversation {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  type: "DIRECT" | "GROUP" | "CHANNEL";
  visibility: string;
  teamId: string | null;
  createdById?: string;
  createdAt: string;
  description: string | null;
  isArchived: boolean;
  members?: { userId: string }[];
  messages?: { id: string; authorId: string; content: string; createdAt: string }[];
}
export interface ConnectSidebarState {
  favorites: { chats: string[]; teams: string[]; channels: string[] };
  recentChats: string[];
}
export interface SetConnectFavoriteInput {
  itemType: "chat" | "team" | "channel";
  itemId: string;
  isFavorite: boolean;
}
export interface UpdateConversationNotificationInput {
  muted?: boolean;
  notifyWhenAvailable?: boolean;
}

export interface ConnectOrganizationUser {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
}

const base = "/api/organization/connect";

export const connectService = {
  listUsers: (organizationId: string) => tenantRequest<ConnectOrganizationUser[]>(organizationId, `${base}/users`),
  getSidebar: (organizationId: string) => tenantRequest<ConnectSidebarState>(organizationId, `${base}/sidebar`),
  setSidebarFavorite: (organizationId: string, input: SetConnectFavoriteInput) =>
    tenantJsonRequest<ConnectSidebarState, SetConnectFavoriteInput>(
      organizationId,
      `${base}/sidebar/favorites`,
      "PUT",
      input,
    ),
  listConversations: (organizationId: string) => tenantRequest<ConnectApiConversation[]>(organizationId, `${base}/conversations`),
  createDirectConversation: (organizationId: string, userId: string) =>
    tenantJsonRequest<ConnectApiConversation, { userId: string }>(
      organizationId,
      `${base}/conversations/direct`,
      "POST",
      { userId },
    ),
  listChannels: (organizationId: string) => tenantRequest<ConnectApiConversation[]>(organizationId, `${base}/channels`),
  joinPublicChannel: (organizationId: string, channelId: string) =>
    tenantRequest<void>(organizationId, `${base}/channels/${pathSegment(channelId)}/join`, { method: "POST" }),
  createChannel: (organizationId: string, input: CreateChannelInput) =>
    tenantJsonRequest<ApiEntity, CreateChannelInput>(organizationId, `${base}/channels`, "POST", input),
  updateChannel: (organizationId: string, channelId: string, input: UpdateChannelInput) =>
    tenantJsonRequest<ApiEntity, UpdateChannelInput>(
      organizationId,
      `${base}/channels/${pathSegment(channelId)}`,
      "PATCH",
      input,
    ),
  addMember: (organizationId: string, channelId: string, userId: string) =>
    tenantJsonRequest<void, { userId: string }>(
      organizationId,
      `${base}/channels/${pathSegment(channelId)}/members`,
      "POST",
      { userId },
    ),
  removeMember: (organizationId: string, channelId: string, userId: string) =>
    tenantRequest<void>(organizationId, `${base}/channels/${pathSegment(channelId)}/members/${pathSegment(userId)}`, {
      method: "DELETE",
    }),
  listMessages: (organizationId: string, channelId: string, query: ListMessagesInput = {}) =>
    tenantRequest<MessagePage>(organizationId, `${base}/channels/${pathSegment(channelId)}/messages`, { query }),
  markMessagesRead: (organizationId: string, channelId: string, messageId?: string) =>
    tenantJsonRequest<{ lastReadAt: string | null }, { messageId?: string }>(
      organizationId,
      `${base}/channels/${pathSegment(channelId)}/read`,
      "POST",
      { messageId },
    ),
  updateConversationNotifications: (organizationId: string, channelId: string, input: UpdateConversationNotificationInput) =>
    tenantJsonRequest<ConnectSidebarState, UpdateConversationNotificationInput>(
      organizationId,
      `${base}/conversations/${pathSegment(channelId)}/notifications`,
      "PUT",
      input,
    ),
  removeConversationHistory: (organizationId: string, channelId: string) =>
    tenantRequest<void>(organizationId, `${base}/conversations/${pathSegment(channelId)}/history`, { method: "DELETE" }),
  createMessage: (organizationId: string, channelId: string, input: CreateMessageInput) =>
    tenantJsonRequest<ConnectApiMessage, CreateMessageInput>(
      organizationId,
      `${base}/channels/${pathSegment(channelId)}/messages`,
      "POST",
      input,
    ),
  updateMessage: (organizationId: string, messageId: string, input: Pick<CreateMessageInput, "content">) =>
    tenantJsonRequest<ConnectApiMessage, Pick<CreateMessageInput, "content">>(
      organizationId,
      `${base}/messages/${pathSegment(messageId)}`,
      "PATCH",
      input,
    ),
  deleteMessage: (organizationId: string, messageId: string) =>
    tenantRequest<void>(organizationId, `${base}/messages/${pathSegment(messageId)}`, { method: "DELETE" }),
  restoreMessage: (organizationId: string, messageId: string) =>
    tenantRequest<ConnectApiMessage>(organizationId, `${base}/messages/${pathSegment(messageId)}/restore`, { method: "POST" }),
  addReaction: (organizationId: string, messageId: string, emoji: string) =>
    tenantJsonRequest<void, { emoji: string }>(
      organizationId,
      `${base}/messages/${pathSegment(messageId)}/reactions`,
      "POST",
      { emoji },
    ),
  removeReaction: (organizationId: string, messageId: string, emoji: string) =>
    tenantRequest<void>(organizationId, `${base}/messages/${pathSegment(messageId)}/reactions/${pathSegment(emoji)}`, {
      method: "DELETE",
    }),
};
