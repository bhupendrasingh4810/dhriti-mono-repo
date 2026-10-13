import { ElementType } from "react";

export type ConnectSidebarSectionId = "quick-views" | "favorites" | "chats" | "teams";

export type ConnectSidebarMenuContext = {
  kind: "section" | "quick-view" | "team" | "channel" | "user" | "personal";
  id: string;
  label: string;
  sectionId?: ConnectSidebarSectionId;
  parentId?: string;
};

export type ConnectSidebarConversation = {
  id: string;
  userId?: string;
  name: string;
  type: "channel" | "direct" | "group";
  avatar?: string;
  unreadCount?: number;
  isSelfSpace?: boolean;
};

export type ConnectSidebarTeamChannel = {
  id: string;
  name: string;
  slug: string;
  isPrivate?: boolean;
};

export type ConnectSidebarTeamGroup = {
  id: string;
  label: string;
  icon?: ElementType;
  channels: ConnectSidebarTeamChannel[];
  isExpanded: boolean;
};

export type ConnectSidebarQuickView = {
  id: "mentions" | "threads" | "drafts";
  label: string;
  icon: ElementType;
  value: number;
};

export type ConversationUser = {
  id: string;
  displayName: string;
  avatar: string;
  jobTitle: string;
  location?: string;
};

export type ConversationAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};

export type PendingAttachment = ConversationAttachment;

export type ConversationReaction = {
  emoji: string;
  count: number;
  userIds: string[];
};

export type ConnectConversationMessage = {
  id: string;
  senderId: string;
  content: string;
  contentType: string;
  createdAt: string;
  status?: "sending" | "sent" | "delivered" | "read";
  quotedMessageId?: string;
  attachments?: ConversationAttachment[];
  reactions?: ConversationReaction[];
};

export type ConnectMentionUser = {
  id: string;
  displayName: string;
  avatar: string;
  subtitle?: string;
};

export type ConnectPendingAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
};
