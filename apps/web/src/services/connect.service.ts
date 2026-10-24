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
  imageUrl?: string;
  layout?: "THREADS" | "POSTS";
}
export interface CreateConnectTeamInput {
  name: string;
  slug: string;
  description?: string;
  visibility?: "PUBLIC" | "PRIVATE";
}
export interface ConnectTeam {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  visibility: string;
  admins: string[];
  users: string[];
}
export interface ConnectTeamDetails {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  channels: Array<{ id: string; name: string; slug: string; visibility: string; createdAt: string }>;
  members: Array<{
    id: string;
    name: string;
    avatarUrl: string | null;
    jobTitle: string | null;
    location: string | null;
    role: "ADMIN" | "MEMBER";
    joinedAt: string;
  }>;
}
export interface UpdateChannelInput {
  name?: string;
  topic?: string;
  description?: string;
  isArchived?: boolean;
  imageUrl?: string;
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
  pinnedMessages: ConnectApiMessage[];
  pinnedCount: number;
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
  pinnedAt?: string | null;
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
  imageUrl: string | null;
  layout: "THREADS" | "POSTS";
  admins?: string[];
  isArchived: boolean;
  members?: { userId: string }[];
  messages?: { id: string; authorId: string; content: string; createdAt: string }[];
}

export interface ConnectPostPollOption {
  id: string;
  content: string;
  position: number;
  voteCount: number;
}

export interface ConnectPostPoll {
  id: string;
  allowsVoteChanges: boolean;
  closesAt: string | null;
  options: ConnectPostPollOption[];
  currentVote: { id: string; pollOptionId: string } | null;
}

export interface ConnectPost {
  id: string;
  authorId: string;
  title: string | null;
  content: string;
  contentHtml: string | null;
  imageUrl: string | null;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  createdAt: string;
  poll: ConnectPostPoll | null;
  isUnread?: boolean;
  comments: ConnectPostComment[];
  reactions: ConnectPostReaction[];
}

export interface ConnectPostComment {
  id: string;
  authorId: string;
  content: string;
  createdAt: string;
  author: { id: string; name: string; avatarUrl: string | null };
  reactions: ConnectPostReaction[];
}

export interface ConnectPostReaction {
  userId: string;
  emoji: string;
}

export interface CreateConnectPostInput {
  title?: string;
  content: string;
  contentHtml?: string;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  backgroundColor?: string;
  poll?: {
    options: Array<{ content: string }>;
    allowsVoteChanges: boolean;
    closesAt: string;
  };
}
export interface UpdateConnectPostInput {
  title?: string | null;
  content?: string;
  contentHtml?: string;
  imageUrl?: string | null;
  backgroundImageUrl?: string | null;
  backgroundColor?: string;
}
export interface ConnectSidebarState {
  favorites: { chats: string[]; teams: string[]; channels: string[] };
  recentChats: string[];
  settings: ConnectSidebarSettings;
}
export interface ConnectSidebarSettings {
  mentions?: "always" | "unread" | "hidden";
  threads?: "always" | "unread" | "hidden";
  drafts?: "visible" | "hidden";
  favoritesFilter?: "all" | "unread";
  chatsFilter?: "all" | "unread";
  hiddenConversationIds?: string[];
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
export interface ConnectOrganizationUsersPage {
  users: ConnectOrganizationUser[];
  nextCursor: string | null;
}

const base = "/api/organization/connect";

export const connectService = {
  listUsers: (organizationId: string) => tenantRequest<ConnectOrganizationUser[]>(organizationId, `${base}/users`),
  searchUsers: (organizationId: string, query: string) =>
    tenantRequest<ConnectOrganizationUser[]>(organizationId, `${base}/users/search`, { query: { q: query, limit: 10 } }),
  listRecentUserSearches: (organizationId: string) =>
    tenantRequest<ConnectOrganizationUser[]>(organizationId, `${base}/users/recent-searches`),
  recordUserSearch: (organizationId: string, userId: string) =>
    tenantJsonRequest<ConnectOrganizationUser, { userId: string }>(
      organizationId,
      `${base}/users/recent-searches`,
      "POST",
      { userId },
    ),
  listUsersPage: (organizationId: string, cursor?: string) =>
    tenantRequest<ConnectOrganizationUsersPage>(organizationId, `${base}/users/paged`, {
      query: { limit: 12, ...(cursor ? { cursor } : {}) },
    }),
  getSidebar: (organizationId: string) => tenantRequest<ConnectSidebarState>(organizationId, `${base}/sidebar`),
  updateSidebarSettings: (organizationId: string, input: ConnectSidebarSettings) =>
    tenantJsonRequest<ConnectSidebarState, ConnectSidebarSettings>(
      organizationId,
      `${base}/sidebar/settings`,
      "PUT",
      input,
    ),
  setSidebarFavorite: (organizationId: string, input: SetConnectFavoriteInput) =>
    tenantJsonRequest<ConnectSidebarState, SetConnectFavoriteInput>(
      organizationId,
      `${base}/sidebar/favorites`,
      "PUT",
      input,
    ),
  listConversations: (organizationId: string) =>
    tenantRequest<ConnectApiConversation[]>(organizationId, `${base}/conversations`),
  createDirectConversation: (organizationId: string, userId: string) =>
    tenantJsonRequest<ConnectApiConversation, { userId: string }>(
      organizationId,
      `${base}/conversations/direct`,
      "POST",
      { userId },
    ),
  listChannels: (organizationId: string) => tenantRequest<ConnectApiConversation[]>(organizationId, `${base}/channels`),
  listTeams: (organizationId: string) => tenantRequest<ConnectTeam[]>(organizationId, `${base}/teams`),
  getTeam: (organizationId: string, teamId: string) =>
    tenantRequest<ConnectTeamDetails>(organizationId, `${base}/teams/${pathSegment(teamId)}`),
  createTeam: (organizationId: string, input: CreateConnectTeamInput) =>
    tenantJsonRequest<ConnectTeam, CreateConnectTeamInput>(organizationId, `${base}/teams`, "POST", input),
  addTeamMember: (organizationId: string, teamId: string, userId: string) =>
    tenantJsonRequest<void, { userId: string }>(
      organizationId,
      `${base}/teams/${pathSegment(teamId)}/members`,
      "POST",
      { userId },
    ),
  leaveTeam: (organizationId: string, teamId: string) =>
    tenantRequest<void>(organizationId, `${base}/teams/${pathSegment(teamId)}/leave`, { method: "POST" }),
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
  deleteChannel: (organizationId: string, channelId: string) =>
    tenantRequest<void>(organizationId, `${base}/channels/${pathSegment(channelId)}`, { method: "DELETE" }),
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
  updateConversationNotifications: (
    organizationId: string,
    channelId: string,
    input: UpdateConversationNotificationInput,
  ) =>
    tenantJsonRequest<ConnectSidebarState, UpdateConversationNotificationInput>(
      organizationId,
      `${base}/conversations/${pathSegment(channelId)}/notifications`,
      "PUT",
      input,
    ),
  listPosts: (organizationId: string, channelId: string) =>
    tenantRequest<ConnectPost[]>(organizationId, `${base}/channels/${pathSegment(channelId)}/posts`),
  createPost: (organizationId: string, channelId: string, input: CreateConnectPostInput) =>
    tenantJsonRequest<ConnectPost, CreateConnectPostInput>(organizationId, `${base}/channels/${pathSegment(channelId)}/posts`, "POST", input),
  deletePost: (organizationId: string, postId: string) =>
    tenantRequest<void>(organizationId, `${base}/posts/${pathSegment(postId)}`, { method: "DELETE" }),
  updatePost: (organizationId: string, postId: string, input: UpdateConnectPostInput) =>
    tenantJsonRequest<ConnectPost, UpdateConnectPostInput>(
      organizationId,
      `${base}/posts/${pathSegment(postId)}`,
      "PATCH",
      input,
    ),
  createPostComment: (organizationId: string, postId: string, content: string) =>
    tenantJsonRequest<ConnectPostComment, { content: string }>(
      organizationId,
      `${base}/posts/${pathSegment(postId)}/comments`,
      "POST",
      { content },
    ),
  addPostReaction: (organizationId: string, postId: string, emoji: string) =>
    tenantJsonRequest<void, { emoji: string }>(organizationId, `${base}/posts/${pathSegment(postId)}/reactions`, "POST", {
      emoji,
    }),
  removePostReaction: (organizationId: string, postId: string, emoji: string) =>
    tenantRequest<void>(organizationId, `${base}/posts/${pathSegment(postId)}/reactions/${pathSegment(emoji)}`, {
      method: "DELETE",
    }),
  deletePostComment: (organizationId: string, commentId: string) =>
    tenantRequest<void>(organizationId, `${base}/comments/${pathSegment(commentId)}`, { method: "DELETE" }),
  updatePostComment: (organizationId: string, commentId: string, content: string) =>
    tenantJsonRequest<ConnectPostComment, { content: string }>(organizationId, `${base}/comments/${pathSegment(commentId)}`, "PATCH", {
      content,
    }),
  addPostCommentReaction: (organizationId: string, commentId: string, emoji: string) =>
    tenantJsonRequest<void, { emoji: string }>(organizationId, `${base}/comments/${pathSegment(commentId)}/reactions`, "POST", {
      emoji,
    }),
  removePostCommentReaction: (organizationId: string, commentId: string, emoji: string) =>
    tenantRequest<void>(organizationId, `${base}/comments/${pathSegment(commentId)}/reactions/${pathSegment(emoji)}`, {
      method: "DELETE",
    }),
  voteOnPoll: (organizationId: string, pollId: string, optionId: string) =>
    tenantJsonRequest<ConnectPost, { optionId: string }>(organizationId, `${base}/polls/${pathSegment(pollId)}/votes`, "POST", { optionId }),
  removeConversationHistory: (organizationId: string, channelId: string) =>
    tenantRequest<void>(organizationId, `${base}/conversations/${pathSegment(channelId)}/history`, {
      method: "DELETE",
    }),
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
  toggleMessagePin: (organizationId: string, messageId: string) =>
    tenantRequest<ConnectApiMessage>(organizationId, `${base}/messages/${pathSegment(messageId)}/pin`, { method: "POST" }),
  deleteMessage: (organizationId: string, messageId: string) =>
    tenantRequest<void>(organizationId, `${base}/messages/${pathSegment(messageId)}`, { method: "DELETE" }),
  restoreMessage: (organizationId: string, messageId: string) =>
    tenantRequest<ConnectApiMessage>(organizationId, `${base}/messages/${pathSegment(messageId)}/restore`, {
      method: "POST",
    }),
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
