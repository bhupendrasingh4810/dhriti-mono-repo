import type { ElementType } from "react";
import type { Socket } from "socket.io-client";

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
  avatar?: string;
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
  isPinned?: boolean;
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

export type CallType = "audio" | "video";
export type CallScope = "one-to-one" | "group" | "channel" | "meeting";

export type CallContext = {
  conversationId: string;
  conversationName: string;
  participantIds: string[];
  callerName?: string;
  type: CallType;
  scope: CallScope;
};

export type ActiveCall = CallContext & {
  id: string;
  callerId?: string;
  callerName?: string;
  peerName?: string;
  direction: "incoming" | "outgoing";
  status: "ringing" | "accepted" | "unanswered" | "unavailable" | "declined";
  autoJoin?: boolean;
  minimized: boolean;
  onHold: boolean;
  joined: boolean;
};

export type CallControls = {
  startCall: (context: CallContext) => void;
  registerSocket: (socket: Socket | null) => void;
};

export type CallInvitation = {
  callId: string;
  channelId: string;
  conversationName: string;
  callerId: string;
  callerName?: string;
  type?: CallType;
  kind?: CallType;
  scope: CallScope;
  participantIds?: string[];
};

export type CallStatusEvent = {
  callId: string;
  channelId: string;
  userId: string;
};

export type CallPanel = "people" | "chat" | "settings" | "notes" | "apps" | null;

export type CallChatMessage = {
  author: string;
  text: string;
  time: string;
};

export type SessionType = "call" | "meeting";
export type CallLayout = "Gallery" | "Spotlight" | "Together";

export type RecordingMetadata = {
  callId: string;
  initiator: string;
  startedAt: string;
  endedAt: string;
  participants: string[];
  storageUrl: string;
  durationSeconds: number;
  processingStatus: "processing";
};

export type ConnectDetailFile = {
  id: string;
  originalName: string;
  size: number;
};

export type ConnectDetailMeeting = {
  id: string;
  title: string;
};

export type DetailIconKind = "chevron" | "close" | "file" | "link" | "meeting" | "members" | "pinned";

export type ConnectHeaderSearchItem = {
  id: string;
  title: string;
  description?: string;
};

export type ConnectMentionsFilter = "unread" | "channels" | "chats";

export type ConnectMentionsViewItem = {
  id: string;
  messageId: string;
  conversationId: string;
  sourceType: "channel" | "person";
  sourceName: string;
  sourceAvatar?: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  excerpt: string;
  unread: boolean;
  createdAt: string;
};

export type ConnectMentionsViewMessage = {
  id: string;
  senderId: string;
  createdAt: string;
  content: string;
};

export type IconName =
  | "add"
  | "bell"
  | "bold"
  | "check"
  | "code"
  | "close"
  | "document"
  | "edit"
  | "highlight"
  | "italic"
  | "link"
  | "list"
  | "mail"
  | "more"
  | "numbered-list"
  | "open"
  | "priority"
  | "quote"
  | "send"
  | "smile"
  | "strikethrough"
  | "table"
  | "text-size"
  | "underline"
  | "video";

export type ConnectReactionUser = {
  id: string;
  avatar: string;
  displayName: string;
  jobTitle: string;
};

export type DetailIconName =
  | "chat"
  | "organization"
  | "video"
  | "phone"
  | "available"
  | "time"
  | "mail"
  | "location"
  | "chevronUp"
  | "chevronDown";

export type MentionHoverState = { anchorEl: HTMLElement; userId: string };
export type ReactionHoverState = { anchorEl: HTMLElement; emoji: string; userIds: string[] };

export type ConnectMessage = { id: string; content: string };
export type ConnectUser = { id: string; displayName: string };
