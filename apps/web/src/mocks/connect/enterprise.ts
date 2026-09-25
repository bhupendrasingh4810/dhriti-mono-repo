import type {
  ConnectAuditLog,
  ConnectCall,
  ConnectContact,
  ConnectFile,
  ConnectMeeting,
  ConnectNotification,
  ConnectPinnedItem,
  ConnectRolePermission,
  ConnectSavedMessage,
  ConnectSearchResult,
  ConnectSidebarState,
  ConnectUserSettings,
} from "./types";

export const connectFiles: ConnectFile[] = [
  {
    id: "file_001",
    name: "engineering-roadmap.pdf",
    originalName: "Engineering Roadmap.pdf",
    mimeType: "application/pdf",
    size: 2840000,
    extension: ".pdf",
    uploadedBy: "usr_003",
    uploadedAt: "2026-08-26T09:05:00Z",
    storagePath: "/mock/files/engineering-roadmap.pdf",
    conversationId: "channel_001",
  },
  {
    id: "file_002",
    name: "architecture-diagram.png",
    originalName: "Architecture Diagram.png",
    mimeType: "image/png",
    size: 1280000,
    extension: ".png",
    uploadedBy: "usr_001",
    uploadedAt: "2026-08-25T14:20:00Z",
    storagePath: "/mock/files/architecture-diagram.png",
    conversationId: "channel_004",
  },
  {
    id: "file_003",
    name: "q3-planning.xlsx",
    originalName: "Q3 Planning.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 840000,
    extension: ".xlsx",
    uploadedBy: "usr_002",
    uploadedAt: "2026-08-24T11:10:00Z",
    storagePath: "/mock/files/q3-planning.xlsx",
    conversationId: "channel_005",
  },
];

export const connectMeetings: ConnectMeeting[] = [
  {
    id: "meeting_001",
    title: "Q3 Engineering Planning",
    organizerId: "usr_002",
    description: "Planning session for Q3 engineering initiatives.",
    startTime: "2026-08-27T10:00:00Z",
    endTime: "2026-08-27T11:00:00Z",
    timezone: "Asia/Kolkata",
    status: "scheduled",
    meetingUrl: "/meet/meeting_001",
    participants: [
      { userId: "usr_001", status: "accepted" },
      { userId: "usr_002", status: "accepted" },
      { userId: "usr_003", status: "tentative" },
      { userId: "usr_005", status: "accepted" },
    ],
  },
];

export const connectCalls: ConnectCall[] = [
  {
    id: "call_001",
    type: "video",
    initiatedBy: "usr_001",
    participants: ["usr_001", "usr_002"],
    status: "completed",
    startedAt: "2026-08-26T15:00:00Z",
    endedAt: "2026-08-26T15:42:00Z",
    duration: 2520,
  },
  {
    id: "call_002",
    type: "audio",
    initiatedBy: "usr_003",
    participants: ["usr_003", "usr_005"],
    status: "missed",
    startedAt: "2026-08-26T12:20:00Z",
    endedAt: null,
    duration: 0,
  },
];

export const connectNotifications: ConnectNotification[] = [
  {
    id: "notification_001",
    userId: "usr_001",
    type: "mention",
    title: "Rahul mentioned you",
    message: "Can you review the API changes?",
    sourceId: "msg_700",
    isRead: false,
    createdAt: "2026-08-26T18:20:00Z",
  },
  {
    id: "notification_002",
    userId: "usr_001",
    type: "message",
    title: "New message from Priya",
    message: "The deployment is ready.",
    sourceId: "dm_003",
    isRead: false,
    createdAt: "2026-08-26T18:10:00Z",
  },
  {
    id: "notification_003",
    userId: "usr_001",
    type: "meeting",
    title: "Meeting starting soon",
    message: "Q3 Engineering Planning starts in 15 minutes.",
    sourceId: "meeting_001",
    isRead: true,
    createdAt: "2026-08-26T09:45:00Z",
  },
];

export const connectUserSettings: ConnectUserSettings = {
  userId: "usr_001",
  settings: {
    theme: "system",
    language: "en",
    timezone: "Asia/Kolkata",
    notifications: {
      desktop: true,
      email: true,
      mobile: true,
      mentions: true,
      directMessages: true,
      channelMessages: true,
      meetingReminders: true,
    },
    privacy: {
      readReceipts: true,
      typingIndicators: true,
      showPresence: true,
    },
    chat: {
      compactMode: false,
      enterToSend: true,
      showPreviews: true,
    },
  },
};

export const connectContacts: ConnectContact[] = [
  {
    id: "contact_001",
    ownerId: "usr_001",
    contactUserId: "usr_002",
    favorite: true,
    createdAt: "2026-01-10T10:00:00Z",
  },
  {
    id: "contact_002",
    ownerId: "usr_001",
    contactUserId: "usr_003",
    favorite: true,
    createdAt: "2026-01-11T10:00:00Z",
  },
  {
    id: "contact_003",
    ownerId: "usr_001",
    contactUserId: "usr_004",
    favorite: false,
    createdAt: "2026-02-01T10:00:00Z",
  },
];

export const connectPinnedItems: ConnectPinnedItem[] = [
  {
    id: "pin_001",
    conversationId: "channel_001",
    messageId: "msg_001",
    pinnedBy: "usr_001",
    pinnedAt: "2026-08-26T09:00:00Z",
  },
];

export const connectSavedMessages: ConnectSavedMessage[] = [
  { id: "saved_001", userId: "usr_001", messageId: "msg_002", savedAt: "2026-08-26T10:20:00Z" },
  { id: "saved_002", userId: "usr_001", messageId: "dm_003", savedAt: "2026-08-26T16:40:00Z" },
];

export const connectSearchResults: ConnectSearchResult[] = [
  {
    id: "search_001",
    type: "message",
    title: "API migration",
    description: "The migration has been deployed to staging.",
    conversation: "Platform Migration",
    sender: "Rahul Mehta",
    timestamp: "2026-08-26T17:30:00Z",
    sourceId: "gmsg_001",
  },
  {
    id: "search_002",
    type: "file",
    title: "Engineering Roadmap.pdf",
    description: "Engineering roadmap for Q3",
    sender: "Rahul Mehta",
    timestamp: "2026-08-26T09:05:00Z",
    sourceId: "file_001",
  },
  {
    id: "search_003",
    type: "person",
    title: "Priya Verma",
    description: "Engineering Manager",
    sourceId: "usr_002",
  },
];

export const connectSidebarState: ConnectSidebarState = {
  currentUser: "usr_001",
  favorites: {
    chats: ["chat_001", "chat_002"],
    teams: ["team_001"],
    channels: ["channel_001", "channel_002", "channel_003"],
  },
  recentChats: ["chat_001", "chat_101", "chat_002", "chat_102", "channel_001", "channel_003"],
  unread: {
    chat_001: 2,
    chat_101: 7,
    channel_001: 3,
    channel_003: 12,
  },
  mentions: {
    channel_001: 2,
    channel_003: 1,
  },
  quickViews: {
    mentions: "always",
    threads: "always",
    drafts: "visible",
  },
  sectionFilters: {
    favorites: "all",
    chats: "all",
  },
  expandedTeams: {
    team_001: true,
    team_002: false,
    team_003: false,
    team_004: false,
    team_005: false,
  },
  hiddenConversationIds: [],
  customSections: [
    {
      id: "section_001",
      name: "Launch Watch",
      emoji: "🚀",
      conversationIds: ["channel_005", "chat_101"],
      createdBy: "usr_001",
      createdAt: "2026-08-20T09:15:00Z",
    },
    {
      id: "section_002",
      name: "Personal Notes",
      emoji: "📝",
      conversationIds: ["personal_usr_001"],
      createdBy: "usr_001",
      createdAt: "2026-08-22T08:05:00Z",
    },
  ],
};

export const connectRolePermissions: ConnectRolePermission[] = [
  {
    id: "role_admin",
    name: "Administrator",
    permissions: [
      "organization.read",
      "organization.update",
      "users.read",
      "users.create",
      "users.update",
      "users.delete",
      "teams.create",
      "teams.update",
      "teams.delete",
      "channels.create",
      "channels.update",
      "channels.delete",
      "messages.delete",
      "files.delete",
    ],
  },
  {
    id: "role_member",
    name: "Member",
    permissions: [
      "organization.read",
      "users.read",
      "teams.read",
      "channels.read",
      "channels.create",
      "messages.create",
      "messages.edit",
      "messages.delete.own",
      "files.upload",
      "meetings.create",
    ],
  },
  {
    id: "role_guest",
    name: "Guest",
    permissions: ["teams.read", "channels.read", "messages.read", "messages.create"],
  },
];

export const connectAuditLogs: ConnectAuditLog[] = [
  {
    id: "audit_001",
    organizationId: "org_001",
    actorId: "usr_001",
    action: "USER_ADDED",
    resourceType: "user",
    resourceId: "usr_010",
    metadata: { email: "john.doe@acmetech.com" },
    ipAddress: "10.10.20.15",
    userAgent: "Chrome",
    createdAt: "2026-08-26T08:20:00Z",
  },
  {
    id: "audit_002",
    organizationId: "org_001",
    actorId: "usr_002",
    action: "CHANNEL_CREATED",
    resourceType: "channel",
    resourceId: "channel_005",
    metadata: { channelName: "Release Planning" },
    createdAt: "2026-08-25T12:30:00Z",
  },
];
