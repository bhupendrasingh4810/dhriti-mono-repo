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
  /** ISO weekdays (1 = Mon); also consumed by Pulse. Daily hours come from each employee's shift. */
  workingDays: number[];
  maxLeaveRequestDays: number | null;
  allowHalfDayLeave: boolean;
  /** Lets HR/admins (hrms.leave.manage) file leave or comp-off for another employee. */
  leaveOnBehalfEnabled: boolean;
  /** Leave must start at least this many days after it is requested. */
  leaveMinNoticeDays: number;
  /** Maximum days a leave may be back-dated (null = no limit). */
  leaveBackdateLimitDays: number | null;
  /** Grants a birthday leave type (usable in the employee's birth month). */
  birthdayLeaveEnabled: boolean;
  birthdayLeaveDays: number;
  /** Grants a yearly quota of optional leave (for optional/restricted holidays). */
  optionalLeaveEnabled: boolean;
  optionalLeaveDays: number;
  defaultAttendanceStatus: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "WORK_FROM_HOME" | "ON_LEAVE" | "HOLIDAY";
  defaultPayrollCurrency: string;
  maxTrainingParticipants: number | null;
  /** Clock in/out opens this many minutes before the employee's shift starts. */
  attendanceClockInWindowMinutes: number;
  /** Clocking in more than this many minutes after shift start is recorded as LATE. */
  attendanceLateAfterMinutes: number;
  missedClockInAlertEnabled: boolean;
  /** Minutes after shift start with no clock-in before the global alert starts ringing. */
  missedClockInAlertMinutes: number;
  missedClockInAlertRepeatSeconds: number;
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
  | "CALL"
  | "NOTES_SHARED"
  | "NOTES_ACCESS_REQUEST"
  | "NOTES_ACCESS_DECISION"
  | "PULSE_INVITATION"
  | "PULSE_EVENT_UPDATE"
  | "FLOW_ASSIGNMENT"
  | "FLOW_COMMENT"
  | "FLOW_DUE_DATE"
  | "ATLAS_SHARED"
  | "ATLAS_COMMENT"
  | "ATLAS_MENTION"
  | "CADENCE_INVITATION"
  | "CADENCE_REMINDER"
  | "CADENCE_RESULTS"
  | "HRMS_LEAVE_REQUEST"
  | "HRMS_LEAVE_DECISION"
  | "HRMS_PAYROLL"
  | "CONTROL_MEMBERSHIP"
  | "CONTROL_ROLE_CHANGE"
  | "CONTROL_SETTINGS_CHANGE";

export type NotificationPreference = { type: NotificationType; inApp: boolean; email: boolean; push: boolean };
