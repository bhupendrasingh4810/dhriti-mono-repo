export type PresenceState = "online" | "away" | "busy" | "do_not_disturb" | "offline";

export type AvailabilityState =
  "available" | "busy" | "in_a_meeting" | "on_a_call" | "presenting" | "away" | "offline" | "do_not_disturb";

export type OrgRole = "admin" | "member" | "guest";

export type TeamVisibility = "public" | "private";

export type ChannelType = "standard" | "private" | "announcement";

export type ConversationType = "channel" | "direct" | "group";

export type MessageContentType =
  | "text"
  | "system"
  | "file"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "poll"
  | "location"
  | "meeting"
  | "call"
  | "sticker"
  | "announcement";

export type MessageDeliveryState = "sending" | "sent" | "delivered" | "read";

export type MentionType = "user" | "team" | "channel" | "everyone";

export type MeetingParticipantStatus = "accepted" | "tentative" | "declined" | "pending";

export type NotificationType = "mention" | "message" | "meeting" | "system";

export type AuditAction = "USER_ADDED" | "CHANNEL_CREATED" | "ROLE_UPDATED" | "ACCESS_GRANTED";

export type ConnectOrganization = {
  id: string;
  name: string;
  slug: string;
  logo: string;
  domain: string;
  industry: string;
  size: string;
  timezone: string;
  locale: string;
  createdAt: string;
  subscription: {
    plan: string;
    status: "active" | "inactive" | "trial";
    renewalDate: string;
  };
};

export type ConnectUser = {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  avatar: string;
  jobTitle: string;
  department: string;
  role: OrgRole;
  status: AvailabilityState;
  presence: PresenceState;
  location: string;
  timezone: string;
  lastSeen: string | null;
  phone?: string;
  createdAt: string;
};

export type ConnectTeam = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  avatar: string;
  visibility: TeamVisibility;
  ownerId: string;
  memberCount: number;
  createdAt: string;
};

export type ConnectTeamMember = {
  id: string;
  teamId: string;
  userId: string;
  role: "owner" | "member" | "guest";
  joinedAt: string;
};

export type ConnectChannel = {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  description: string;
  type: ChannelType;
  visibility: "team" | "private";
  isFavorite: boolean;
  isArchived: boolean;
  createdBy: string;
  createdAt: string;
  lastActivityAt: string;
};

export type ConnectAttachment = {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
};

export type ConnectPollOption = {
  id: string;
  text: string;
  votes: number;
};

export type ConnectPoll = {
  question: string;
  options: ConnectPollOption[];
  multipleChoice: boolean;
  expiresAt: string;
};

export type ConnectReaction = {
  emoji: string;
  count: number;
  userIds: string[];
};

export type ConnectMessage = {
  id: string;
  conversationType: ConversationType;
  conversationId: string;
  senderId: string;
  content: string;
  contentType: MessageContentType;
  createdAt: string;
  editedAt?: string | null;
  deletedAt?: string | null;
  isDeleted?: boolean;
  status?: MessageDeliveryState;
  isPinned?: boolean;
  replyCount?: number;
  reactionCount?: number;
  mentions?: string[];
  quotedMessageId?: string;
  attachments?: ConnectAttachment[];
  reactions?: ConnectReaction[];
  poll?: ConnectPoll;
};

export type ConnectReply = {
  id: string;
  messageId: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export type ConnectConversation = {
  id: string;
  type: ConversationType;
  organizationId: string;
  name: string;
  avatar?: string;
  teamId?: string | null;
  layout?: "THREADS" | "POSTS";
  channelId?: string | null;
  createdBy: string;
  createdAt: string;
  participants: string[];
  adminUserIds?: string[];
  lastMessageAt: string;
  unreadCount: number;
  isFavorite: boolean;
  muted: boolean;
  pinned: boolean;
  archived: boolean;
  description?: string;
  isReadOnly?: boolean;
};

export type ConnectFile = {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  extension: string;
  uploadedBy: string;
  uploadedAt: string;
  storagePath: string;
  conversationId?: string;
};

export type ConnectMeeting = {
  id: string;
  title: string;
  organizerId: string;
  description: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: "scheduled" | "completed" | "cancelled";
  meetingUrl: string;
  participants: Array<{
    userId: string;
    status: MeetingParticipantStatus;
  }>;
};

export type ConnectCall = {
  id: string;
  type: "audio" | "video";
  initiatedBy: string;
  participants: string[];
  status: "completed" | "missed" | "ongoing";
  startedAt: string;
  endedAt: string | null;
  duration: number;
};

export type ConnectNotification = {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  sourceId: string;
  isRead: boolean;
  createdAt: string;
};

export type ConnectUserSettings = {
  userId: string;
  settings: {
    theme: "light" | "dark" | "system";
    language: string;
    timezone: string;
    notifications: {
      desktop: boolean;
      email: boolean;
      mobile: boolean;
      mentions: boolean;
      directMessages: boolean;
      channelMessages: boolean;
      meetingReminders: boolean;
    };
    privacy: {
      readReceipts: boolean;
      typingIndicators: boolean;
      showPresence: boolean;
    };
    chat: {
      compactMode: boolean;
      enterToSend: boolean;
      showPreviews: boolean;
    };
  };
};

export type ConnectContact = {
  id: string;
  ownerId: string;
  contactUserId: string;
  favorite: boolean;
  createdAt: string;
};

export type ConnectPinnedItem = {
  id: string;
  conversationId: string;
  messageId: string;
  pinnedBy: string;
  pinnedAt: string;
};

export type ConnectSavedMessage = {
  id: string;
  userId: string;
  messageId: string;
  savedAt: string;
};

export type ConnectSearchResult = {
  id: string;
  type: "message" | "file" | "person" | "channel";
  title: string;
  description: string;
  conversation?: string;
  sender?: string;
  timestamp?: string;
  sourceId: string;
};

export type ConnectSidebarState = {
  currentUser: string;
  favorites: {
    chats: string[];
    teams: string[];
    channels: string[];
  };
  recentChats: string[];
  unread: Record<string, number>;
  mentions: Record<string, number>;
  quickViews: {
    mentions: "always" | "unread";
    threads: "always" | "unread";
    drafts: "visible" | "hidden";
  };
  sectionFilters: {
    favorites: "all" | "unread";
    chats: "all" | "unread";
  };
  expandedTeams: Record<string, boolean>;
  hiddenConversationIds: string[];
  customSections: ConnectSidebarCustomSection[];
};

export type ConnectSidebarCustomSection = {
  id: string;
  name: string;
  emoji?: string;
  conversationIds: string[];
  createdBy: string;
  createdAt: string;
};

export type ConnectDraftMessage = {
  id: string;
  userId: string;
  conversationId: string;
  title: string;
  content: string;
  updatedAt: string;
};

export type ConnectMentionFeedItem = {
  id: string;
  messageId: string;
  conversationId: string;
  mentionedUserId: string;
  sourceType: "channel" | "person";
  sourceName: string;
  sourceAvatar?: string;
  senderId: string;
  excerpt: string;
  unread: boolean;
  createdAt: string;
};

export type ConnectTag = {
  id: string;
  label: string;
  tone: "neutral" | "info" | "success" | "warning" | "critical";
};

export type ConnectChannelMembershipRow = {
  userId: string;
  role: "owner" | "member" | "guest";
  tags: string[];
};

export type ConnectChannelAnalyticsPoint = {
  label: string;
  activeUsers: number;
  meetings: number;
  engagement: number;
};

export type ConnectChannelAnalytics = {
  channelId: string;
  periods: {
    last7Days: ConnectChannelAnalyticsPoint[];
    last30Days: ConnectChannelAnalyticsPoint[];
    last90Days: ConnectChannelAnalyticsPoint[];
  };
  summary: {
    activeUsers: number;
    posts: number;
    replies: number;
    avgResponseHours: number;
  };
  engagementKpi: {
    replyRate: number;
    reactionRate: number;
    meetingConversionRate: number;
  };
};

export type ConnectTeamAnalytics = {
  teamId: string;
  activeMembers: number;
  activeChannels: number;
  weeklyMessages: number;
  weeklyMeetings: number;
};

export type ConnectPendingInvite = {
  id: string;
  teamId: string;
  email: string;
  invitedBy: string;
  invitedAt: string;
  status: "pending" | "accepted" | "expired";
};

export type ConnectRolePermission = {
  id: string;
  name: string;
  permissions: string[];
};

export type ConnectAuditLog = {
  id: string;
  organizationId: string;
  actorId: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, string>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
};
