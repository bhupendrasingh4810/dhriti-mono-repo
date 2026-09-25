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
}
export interface MessagePage extends CursorPage<ApiEntity> {
  messages: ApiEntity[];
}

const base = "/api/organization/connect";

export const connectService = {
  listChannels: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/channels`),
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
  createMessage: (organizationId: string, channelId: string, input: CreateMessageInput) =>
    tenantJsonRequest<ApiEntity, CreateMessageInput>(
      organizationId,
      `${base}/channels/${pathSegment(channelId)}/messages`,
      "POST",
      input,
    ),
  updateMessage: (organizationId: string, messageId: string, input: Pick<CreateMessageInput, "content">) =>
    tenantJsonRequest<ApiEntity, Pick<CreateMessageInput, "content">>(
      organizationId,
      `${base}/messages/${pathSegment(messageId)}`,
      "PATCH",
      input,
    ),
  deleteMessage: (organizationId: string, messageId: string) =>
    tenantRequest<void>(organizationId, `${base}/messages/${pathSegment(messageId)}`, { method: "DELETE" }),
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
