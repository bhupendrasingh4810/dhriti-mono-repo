export type ConnectOrganizationSettings = {
  directMessagesEnabled: boolean;
  groupChatsEnabled: boolean;
  maxGroupChatMembers: number;
  defaultChannelIds: string[];
  defaultChannelVisibility: "PUBLIC" | "PRIVATE";
  defaultChannelLayout: "THREADS" | "POSTS";
  channelNamePrefixes: string[];
  messageEditingEnabled: boolean;
  messageEditWindowMinutes: number | null;
  messageDeletionEnabled: boolean;
  messageDeleteWindowMinutes: number | null;
  messageRestoreWindowMinutes: number | null;
  adminsCanDeleteAnyMessage: boolean;
  pinPolicy: "EVERYONE" | "CHANNEL_ADMINS";
  maxMessageLength: number;
  allowedReactions: string[];
  pollsEnabled: boolean;
  maxImageSizeKb: number;
  allowedImageTypes: string[];
  callsEnabled: boolean;
  videoCallsEnabled: boolean;
  callRingTimeoutSeconds: number;
  recordingEnabled: boolean;
  recordingPolicy: "CALL_INITIATOR" | "ANY_PARTICIPANT";
  recordingRequiresConsent: boolean;
  recordingRetentionDays: number | null;
  captionsEnabled: boolean;
  transcriptionEnabled: boolean;
  customBackgroundsEnabled: boolean;
  typingIndicatorsEnabled: boolean;
  messageRetentionDays: number | null;
  /** Read-only timestamp for the server-enforced retention grace period. */
  retentionEnabledAt: string | null;
};

export type ConnectManualStatus = "online" | "away" | "dnd" | "offline";

export type ConnectUserSettings = {
  manualStatus: ConnectManualStatus | null;
  manualStatusExpiresAt: string | null;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  quietHoursDays: number[];
  sendShortcut: "ENTER" | "MOD_ENTER";
  desktopNotificationsEnabled: boolean;
  soundsEnabled: boolean;
  callRingtoneEnabled: boolean;
  preferredMicrophoneId: string | null;
  preferredCameraId: string | null;
  preferredSpeakerId: string | null;
  preferredBackground: string | null;
};

export type FlowOrganizationSettings = {
  defaultIssueStatus: "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
  defaultIssuePriority: "URGENT" | "HIGH" | "MEDIUM" | "LOW" | "NONE";
  issueListPageSize: number;
  maxIssueEstimate: number;
  maxIssueDescriptionLength: number;
};

export type AtlasOrganizationSettings = {
  pagesPublishedByDefault: boolean;
  maxPageHierarchyDepth: number;
  maxPageContentLength: number;
  maxSpaceDescriptionLength: number;
};

export type NexusOrganizationSettings = {
  conversationHistoryLimit: number;
  summarizationMessageLimit: number;
  conversationListSize: number;
  taskListSize: number;
};

export type CadenceOrganizationSettings = {
  anonymousFeedbackByDefault: boolean;
  allowVoteChanges: boolean;
  maxCardContentLength: number;
  sessionListSize: number;
};

export type PulseOrganizationSettings = {
  workingDays: number[];
  workingHoursStart: number;
  workingHoursEnd: number;
  defaultEventAvailability: "FREE" | "BUSY";
  defaultEventPrivacy: "DEFAULT" | "PRIVATE";
  defaultReminderMinutes: number | null;
  onlineMeetingsEnabled: boolean;
  maxMeetingAttendees: number | null;
  maxEventDurationMinutes: number | null;
};

export type NotesOrganizationSettings = {
  sharingEnabled: boolean;
  defaultShareCanEdit: boolean;
  defaultShareCanDelete: boolean;
  maxSharedUsersPerNote: number | null;
  maxNoteContentLength: number;
};

export type HrmsOrganizationSettings = {
  maxLeaveRequestDays: number | null;
  allowHalfDayLeave: boolean;
  defaultAttendanceStatus: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "WORK_FROM_HOME" | "ON_LEAVE" | "HOLIDAY";
  defaultPayrollCurrency: string;
  maxTrainingParticipants: number | null;
};

export type AppSettingsMap = {
  connect: ConnectOrganizationSettings;
  flow: FlowOrganizationSettings;
  atlas: AtlasOrganizationSettings;
  nexus: NexusOrganizationSettings;
  cadence: CadenceOrganizationSettings;
  pulse: PulseOrganizationSettings;
  notes: NotesOrganizationSettings;
  hrms: HrmsOrganizationSettings;
};

export type AppSettingsKey = keyof AppSettingsMap;

export type AppSettingsUpdateMap = Omit<AppSettingsMap, "connect"> & {
  connect: Omit<ConnectOrganizationSettings, "retentionEnabledAt">;
};

export type SettingsAccess = { canManage: boolean };

export type NotificationType =
  | "MENTION"
  | "ASSIGNMENT"
  | "DUE_DATE"
  | "MEETING_REMINDER"
  | "COMMENT"
  | "SYSTEM"
  | "MESSAGE"
  | "DIRECT_MESSAGE"
  | "CALL";

export type NotificationPreference = { type: NotificationType; inApp: boolean; email: boolean; push: boolean };
