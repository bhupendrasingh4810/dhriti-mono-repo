import type {
  ConnectChannelAnalytics,
  ConnectChannelMembershipRow,
  ConnectDraftMessage,
  ConnectMentionFeedItem,
  ConnectPendingInvite,
  ConnectSidebarCustomSection,
  ConnectTag,
  ConnectTeamAnalytics,
} from "./types";

export const connectSidebarCustomSections: ConnectSidebarCustomSection[] = [
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
];

export const connectDraftMessages: ConnectDraftMessage[] = [
  {
    id: "draft_001",
    userId: "usr_001",
    conversationId: "channel_003",
    title: "Header alignment follow-up",
    content: "@[Priya Verma] please confirm the final header padding before I merge.",
    updatedAt: "2026-08-27T18:25:00Z",
  },
  {
    id: "draft_002",
    userId: "usr_001",
    conversationId: "chat_001",
    title: "Migration follow-up",
    content: "I will share the code block and rollout notes after standup.",
    updatedAt: "2026-08-27T19:10:00Z",
  },
];

export const connectMentionFeed: ConnectMentionFeedItem[] = [
  {
    id: "mention_001",
    messageId: "msg_004",
    conversationId: "channel_003",
    mentionedUserId: "usr_001",
    sourceType: "channel",
    sourceName: "Frontend",
    senderId: "usr_015",
    excerpt: "@[Aarav Sharma] can you review the API integration changes on the new header component?",
    unread: true,
    createdAt: "2026-08-26T14:10:00Z",
  },
  {
    id: "mention_002",
    messageId: "msg_006",
    conversationId: "channel_001",
    mentionedUserId: "usr_001",
    sourceType: "channel",
    sourceName: "General",
    senderId: "usr_002",
    excerpt: "@[Aarav Sharma] please review the deployment checklist before tonight.",
    unread: true,
    createdAt: "2026-08-26T18:42:00Z",
  },
  {
    id: "mention_003",
    messageId: "dm_004",
    conversationId: "chat_001",
    mentionedUserId: "usr_001",
    sourceType: "person",
    sourceName: "Priya Verma",
    sourceAvatar: "https://storage.googleapis.com/uxpilot-auth.appspot.com/avatars/avatar-1.jpg",
    senderId: "usr_002",
    excerpt: "@[Aarav Sharma] sharing the rollout plan in five minutes.",
    unread: false,
    createdAt: "2026-08-26T18:08:00Z",
  },
];

export const connectTags: ConnectTag[] = [
  { id: "tag_001", label: "Platform", tone: "info" },
  { id: "tag_002", label: "Incident", tone: "critical" },
  { id: "tag_003", label: "Release", tone: "warning" },
  { id: "tag_004", label: "Mentor", tone: "success" },
  { id: "tag_005", label: "Design System", tone: "neutral" },
];

export const connectChannelMemberships: Record<string, ConnectChannelMembershipRow[]> = {
  channel_001: [
    { userId: "usr_001", role: "owner", tags: ["tag_001", "tag_004"] },
    { userId: "usr_002", role: "owner", tags: ["tag_001"] },
    { userId: "usr_003", role: "member", tags: ["tag_001"] },
    { userId: "usr_005", role: "member", tags: ["tag_003"] },
    { userId: "usr_008", role: "guest", tags: ["tag_005"] },
    { userId: "usr_010", role: "member", tags: ["tag_003"] },
  ],
  channel_003: [
    { userId: "usr_003", role: "owner", tags: ["tag_005"] },
    { userId: "usr_004", role: "member", tags: ["tag_001"] },
    { userId: "usr_006", role: "member", tags: ["tag_005"] },
    { userId: "usr_009", role: "guest", tags: ["tag_004"] },
    { userId: "usr_015", role: "member", tags: ["tag_005"] },
  ],
};

export const connectChannelAnalytics: ConnectChannelAnalytics[] = [
  {
    channelId: "channel_001",
    periods: {
      last7Days: [
        { label: "Mon", activeUsers: 18, meetings: 1, engagement: 72 },
        { label: "Tue", activeUsers: 21, meetings: 2, engagement: 80 },
        { label: "Wed", activeUsers: 19, meetings: 1, engagement: 76 },
        { label: "Thu", activeUsers: 24, meetings: 3, engagement: 88 },
        { label: "Fri", activeUsers: 17, meetings: 1, engagement: 69 },
      ],
      last30Days: [
        { label: "Week 1", activeUsers: 84, meetings: 7, engagement: 74 },
        { label: "Week 2", activeUsers: 91, meetings: 9, engagement: 79 },
        { label: "Week 3", activeUsers: 88, meetings: 8, engagement: 77 },
        { label: "Week 4", activeUsers: 94, meetings: 10, engagement: 83 },
      ],
      last90Days: [
        { label: "Jun", activeUsers: 240, meetings: 22, engagement: 70 },
        { label: "Jul", activeUsers: 264, meetings: 25, engagement: 78 },
        { label: "Aug", activeUsers: 281, meetings: 29, engagement: 84 },
      ],
    },
    summary: {
      activeUsers: 24,
      posts: 164,
      replies: 342,
      avgResponseHours: 1.8,
    },
    engagementKpi: {
      replyRate: 84,
      reactionRate: 67,
      meetingConversionRate: 28,
    },
  },
  {
    channelId: "channel_003",
    periods: {
      last7Days: [
        { label: "Mon", activeUsers: 9, meetings: 0, engagement: 61 },
        { label: "Tue", activeUsers: 12, meetings: 1, engagement: 68 },
        { label: "Wed", activeUsers: 10, meetings: 1, engagement: 70 },
        { label: "Thu", activeUsers: 14, meetings: 2, engagement: 82 },
        { label: "Fri", activeUsers: 11, meetings: 1, engagement: 66 },
      ],
      last30Days: [
        { label: "Week 1", activeUsers: 41, meetings: 2, engagement: 60 },
        { label: "Week 2", activeUsers: 46, meetings: 4, engagement: 68 },
        { label: "Week 3", activeUsers: 48, meetings: 5, engagement: 74 },
        { label: "Week 4", activeUsers: 52, meetings: 6, engagement: 79 },
      ],
      last90Days: [
        { label: "Jun", activeUsers: 128, meetings: 8, engagement: 58 },
        { label: "Jul", activeUsers: 144, meetings: 12, engagement: 69 },
        { label: "Aug", activeUsers: 158, meetings: 15, engagement: 77 },
      ],
    },
    summary: {
      activeUsers: 14,
      posts: 93,
      replies: 188,
      avgResponseHours: 2.4,
    },
    engagementKpi: {
      replyRate: 76,
      reactionRate: 54,
      meetingConversionRate: 19,
    },
  },
];

export const connectTeamAnalytics: ConnectTeamAnalytics[] = [
  { teamId: "team_001", activeMembers: 24, activeChannels: 5, weeklyMessages: 482, weeklyMeetings: 11 },
  { teamId: "team_002", activeMembers: 12, activeChannels: 2, weeklyMessages: 146, weeklyMeetings: 4 },
  { teamId: "team_003", activeMembers: 8, activeChannels: 1, weeklyMessages: 74, weeklyMeetings: 3 },
  { teamId: "team_004", activeMembers: 15, activeChannels: 2, weeklyMessages: 131, weeklyMeetings: 5 },
  { teamId: "team_005", activeMembers: 9, activeChannels: 1, weeklyMessages: 66, weeklyMeetings: 2 },
];

export const connectPendingInvites: ConnectPendingInvite[] = [
  {
    id: "invite_001",
    teamId: "team_001",
    email: "new.architect@acmetech.com",
    invitedBy: "usr_001",
    invitedAt: "2026-08-24T13:10:00Z",
    status: "pending",
  },
  {
    id: "invite_002",
    teamId: "team_002",
    email: "contract.pm@acmetech.com",
    invitedBy: "usr_004",
    invitedAt: "2026-08-21T09:20:00Z",
    status: "pending",
  },
];
