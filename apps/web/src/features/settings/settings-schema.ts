import type { AppSettingsKey, AppSettingsMap } from "@/services/app-settings.service";
import { APP_SETTINGS_LIMITS, APP_SETTINGS_PATTERNS } from "@dhriti/validation";

export type SettingsOption = { value: string; label: string };

type FieldBase<T> = {
  key: Extract<keyof T, string>;
  label: string;
  description?: string;
  /** Field is only editable while this boolean setting is on. */
  dependsOn?: Extract<keyof T, string>;
};

export type SettingsFieldConfig<T = Record<string, unknown>> = FieldBase<T> &
  (
    | { kind: "toggle" }
    | { kind: "number"; min: number; max: number; unit?: string; noLimitLabel?: string }
    | { kind: "select"; options: SettingsOption[]; nullLabel?: string }
    | { kind: "tags"; maxItems: number; maxLength: number; placeholder: string; pattern?: RegExp; patternHint?: string }
    | { kind: "multiselect"; optionsSource: "connectChannels"; maxItems: number; emptyLabel: string }
    | { kind: "weekdays" }
    | { kind: "hour"; min: number; max: number }
    | { kind: "time" }
    | { kind: "text"; maxLength: number; pattern?: RegExp; patternHint?: string; uppercase?: boolean }
  );

export type SettingsSectionConfig<T = Record<string, unknown>> = {
  id: string;
  title: string;
  description: string;
  fields: SettingsFieldConfig<T>[];
};

export type AppSettingsConfig<K extends AppSettingsKey = AppSettingsKey> = {
  app: K;
  title: string;
  description: string;
  sections: SettingsSectionConfig<AppSettingsMap[K]>[];
};

export const WEEKDAY_OPTIONS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 7, label: "Sun" },
] as const;

const options = (...values: Array<[string, string]>): SettingsOption[] =>
  values.map(([value, label]) => ({ value, label }));

const connect: AppSettingsConfig<"connect"> = {
  app: "connect",
  title: "Connect settings",
  description: "Control how people chat, share posts, and call each other across your organization.",
  sections: [
    {
      id: "conversations",
      title: "Conversations",
      description: "Who can start direct and group chats, and which channels new members join.",
      fields: [
        {
          key: "directMessagesEnabled",
          kind: "toggle",
          label: "Direct messages",
          description: "Allow one-to-one chats.",
        },
        { key: "groupChatsEnabled", kind: "toggle", label: "Group chats", description: "Allow ad-hoc group chats." },
        {
          key: "maxGroupChatMembers",
          kind: "number",
          label: "Maximum group chat members",
          ...APP_SETTINGS_LIMITS.connect.maxGroupChatMembers,
          unit: "members",
          dependsOn: "groupChatsEnabled",
        },
        {
          key: "defaultChannelIds",
          kind: "multiselect",
          label: "Default channels",
          description: "Members join these public channels automatically the first time they open Connect.",
          optionsSource: "connectChannels",
          maxItems: APP_SETTINGS_LIMITS.connect.maxChannelIds,
          emptyLabel: "No public channels yet",
        },
        { key: "typingIndicatorsEnabled", kind: "toggle", label: "Typing indicators" },
      ],
    },
    {
      id: "channels",
      title: "Channels",
      description: "Defaults and naming rules for new channels.",
      fields: [
        {
          key: "defaultChannelVisibility",
          kind: "select",
          label: "Default visibility",
          options: options(["PUBLIC", "Public"], ["PRIVATE", "Private"]),
        },
        {
          key: "defaultChannelLayout",
          kind: "select",
          label: "Default layout",
          options: options(["THREADS", "Threads"], ["POSTS", "Posts"]),
        },
        {
          key: "channelNamePrefixes",
          kind: "tags",
          label: "Required name prefixes",
          description: "When set, new channel names must start with one of these prefixes.",
          maxItems: APP_SETTINGS_LIMITS.connect.channelNamePrefixes.maxItems,
          maxLength: APP_SETTINGS_LIMITS.connect.channelNamePrefixes.maxLength,
          placeholder: "e.g. team-",
        },
      ],
    },
    {
      id: "messages",
      title: "Messages",
      description: "Editing, deletion, pinning, and content limits.",
      fields: [
        { key: "messageEditingEnabled", kind: "toggle", label: "Allow editing messages" },
        {
          key: "messageEditWindowMinutes",
          kind: "number",
          label: "Edit window",
          ...APP_SETTINGS_LIMITS.connect.messageWindowsMinutes,
          unit: "minutes",
          noLimitLabel: "Any time",
          dependsOn: "messageEditingEnabled",
        },
        { key: "messageDeletionEnabled", kind: "toggle", label: "Allow deleting messages" },
        {
          key: "messageDeleteWindowMinutes",
          kind: "number",
          label: "Delete window",
          ...APP_SETTINGS_LIMITS.connect.messageWindowsMinutes,
          unit: "minutes",
          noLimitLabel: "Any time",
          dependsOn: "messageDeletionEnabled",
        },
        {
          key: "messageRestoreWindowMinutes",
          kind: "number",
          label: "Restore window",
          description: "How long a deleted message can be restored.",
          ...APP_SETTINGS_LIMITS.connect.messageWindowsMinutes,
          unit: "minutes",
          noLimitLabel: "Any time",
          dependsOn: "messageDeletionEnabled",
        },
        {
          key: "adminsCanDeleteAnyMessage",
          kind: "toggle",
          label: "Moderators can delete any message",
          description: "Channel admins and settings managers can remove messages from others.",
        },
        {
          key: "pinPolicy",
          kind: "select",
          label: "Who can pin in channels",
          options: options(["EVERYONE", "Everyone"], ["CHANNEL_ADMINS", "Channel admins"]),
        },
        {
          key: "maxMessageLength",
          kind: "number",
          label: "Maximum message length",
          ...APP_SETTINGS_LIMITS.connect.maxMessageLength,
          unit: "characters",
        },
        { key: "pollsEnabled", kind: "toggle", label: "Polls" },
        {
          key: "allowedReactions",
          kind: "tags",
          label: "Allowed reactions",
          description: "Leave empty to allow every reaction.",
          maxItems: APP_SETTINGS_LIMITS.connect.allowedReactions.maxItems,
          maxLength: APP_SETTINGS_LIMITS.connect.allowedReactions.maxLength,
          placeholder: "Add an emoji",
        },
      ],
    },
    {
      id: "media",
      title: "Images",
      description: "Limits for images shared in posts.",
      fields: [
        {
          key: "maxImageSizeKb",
          kind: "number",
          label: "Maximum image size",
          ...APP_SETTINGS_LIMITS.connect.maxImageSizeKb,
          unit: "KB",
        },
        {
          key: "allowedImageTypes",
          kind: "tags",
          label: "Allowed image types",
          maxItems: APP_SETTINGS_LIMITS.connect.allowedImageTypes.maxItems,
          maxLength: APP_SETTINGS_LIMITS.connect.allowedImageTypes.maxLength,
          placeholder: "image/png",
          pattern: APP_SETTINGS_PATTERNS.connect.imageMimeType,
          patternHint: "Use a MIME type such as image/png.",
        },
      ],
    },
    {
      id: "calls",
      title: "Calls and recordings",
      description: "Audio, video, recording, and in-call features.",
      fields: [
        { key: "callsEnabled", kind: "toggle", label: "Calls" },
        { key: "videoCallsEnabled", kind: "toggle", label: "Video", dependsOn: "callsEnabled" },
        {
          key: "callRingTimeoutSeconds",
          kind: "number",
          label: "Ring timeout",
          ...APP_SETTINGS_LIMITS.connect.callRingTimeoutSeconds,
          unit: "seconds",
          dependsOn: "callsEnabled",
        },
        { key: "captionsEnabled", kind: "toggle", label: "Live captions", dependsOn: "callsEnabled" },
        { key: "transcriptionEnabled", kind: "toggle", label: "Transcription", dependsOn: "callsEnabled" },
        { key: "customBackgroundsEnabled", kind: "toggle", label: "Custom backgrounds", dependsOn: "callsEnabled" },
        { key: "recordingEnabled", kind: "toggle", label: "Recording", dependsOn: "callsEnabled" },
        {
          key: "recordingPolicy",
          kind: "select",
          label: "Who can record",
          options: options(["CALL_INITIATOR", "Call initiator"], ["ANY_PARTICIPANT", "Any participant"]),
          dependsOn: "recordingEnabled",
        },
        {
          key: "recordingRequiresConsent",
          kind: "toggle",
          label: "Require participant consent",
          dependsOn: "recordingEnabled",
        },
        {
          key: "recordingRetentionDays",
          kind: "number",
          label: "Keep recordings for",
          ...APP_SETTINGS_LIMITS.connect.retentionDays,
          unit: "days",
          noLimitLabel: "Forever",
          dependsOn: "recordingEnabled",
        },
      ],
    },
    {
      id: "retention",
      title: "Retention",
      description: "Messages and posts older than this are permanently cleared. This cannot be undone.",
      fields: [
        {
          key: "messageRetentionDays",
          kind: "number",
          label: "Keep messages for",
          ...APP_SETTINGS_LIMITS.connect.retentionDays,
          unit: "days",
          noLimitLabel: "Forever",
        },
      ],
    },
  ],
};

const flow: AppSettingsConfig<"flow"> = {
  app: "flow",
  title: "Flow settings",
  description: "Defaults and limits for work items.",
  sections: [
    {
      id: "defaults",
      title: "Work item defaults",
      description: "Applied when a new work item doesn't specify a value.",
      fields: [
        {
          key: "defaultIssueStatus",
          kind: "select",
          label: "Default status",
          options: options(
            ["BACKLOG", "Backlog"],
            ["TODO", "To do"],
            ["IN_PROGRESS", "In progress"],
            ["IN_REVIEW", "In review"],
            ["DONE", "Done"],
            ["CANCELLED", "Cancelled"],
          ),
        },
        {
          key: "defaultIssuePriority",
          kind: "select",
          label: "Default priority",
          options: options(
            ["NONE", "None"],
            ["LOW", "Low"],
            ["MEDIUM", "Medium"],
            ["HIGH", "High"],
            ["URGENT", "Urgent"],
          ),
        },
      ],
    },
    {
      id: "limits",
      title: "Limits",
      description: "Keep work items focused and lists fast.",
      fields: [
        {
          key: "issueListPageSize",
          kind: "number",
          label: "Work items per page",
          ...APP_SETTINGS_LIMITS.flow.issueListPageSize,
          unit: "items",
        },
        {
          key: "maxIssueEstimate",
          kind: "number",
          label: "Maximum estimate",
          ...APP_SETTINGS_LIMITS.flow.maxIssueEstimate,
          unit: "points",
        },
        {
          key: "maxIssueDescriptionLength",
          kind: "number",
          label: "Maximum description length",
          ...APP_SETTINGS_LIMITS.flow.maxIssueDescriptionLength,
          unit: "characters",
        },
      ],
    },
  ],
};

const atlas: AppSettingsConfig<"atlas"> = {
  app: "atlas",
  title: "Atlas settings",
  description: "Publishing defaults and structure limits for knowledge spaces.",
  sections: [
    {
      id: "publishing",
      title: "Publishing",
      description: "How new pages start out.",
      fields: [
        {
          key: "pagesPublishedByDefault",
          kind: "toggle",
          label: "Publish new pages immediately",
          description: "When off, new pages start as drafts.",
        },
      ],
    },
    {
      id: "limits",
      title: "Limits",
      description: "Size and depth limits for spaces and pages.",
      fields: [
        {
          key: "maxPageHierarchyDepth",
          kind: "number",
          label: "Maximum page depth",
          ...APP_SETTINGS_LIMITS.atlas.maxPageHierarchyDepth,
          unit: "levels",
        },
        {
          key: "maxPageContentLength",
          kind: "number",
          label: "Maximum page length",
          ...APP_SETTINGS_LIMITS.atlas.maxPageContentLength,
          unit: "characters",
        },
        {
          key: "maxSpaceDescriptionLength",
          kind: "number",
          label: "Maximum space description",
          ...APP_SETTINGS_LIMITS.atlas.maxSpaceDescriptionLength,
          unit: "characters",
        },
      ],
    },
  ],
};

const nexus: AppSettingsConfig<"nexus"> = {
  app: "nexus",
  title: "Nexus settings",
  description: "How much context the assistant uses and how much history it shows.",
  sections: [
    {
      id: "assistant",
      title: "Assistant context",
      description: "Larger values give richer answers but take longer.",
      fields: [
        {
          key: "conversationHistoryLimit",
          kind: "number",
          label: "Conversation memory",
          ...APP_SETTINGS_LIMITS.nexus.conversationHistoryLimit,
          unit: "messages",
        },
        {
          key: "summarizationMessageLimit",
          kind: "number",
          label: "Messages per summary",
          ...APP_SETTINGS_LIMITS.nexus.summarizationMessageLimit,
          unit: "messages",
        },
      ],
    },
    {
      id: "lists",
      title: "Lists",
      description: "How many items appear in Nexus lists.",
      fields: [
        {
          key: "conversationListSize",
          kind: "number",
          label: "Conversations shown",
          ...APP_SETTINGS_LIMITS.nexus.conversationListSize,
          unit: "items",
        },
        {
          key: "taskListSize",
          kind: "number",
          label: "Tasks shown",
          ...APP_SETTINGS_LIMITS.nexus.taskListSize,
          unit: "items",
        },
      ],
    },
  ],
};

const cadence: AppSettingsConfig<"cadence"> = {
  app: "cadence",
  title: "Cadence settings",
  description: "Retrospective defaults and voting rules.",
  sections: [
    {
      id: "feedback",
      title: "Feedback",
      description: "Defaults for new retrospective sessions.",
      fields: [
        { key: "anonymousFeedbackByDefault", kind: "toggle", label: "Anonymous feedback by default" },
        { key: "allowVoteChanges", kind: "toggle", label: "Allow people to remove their votes" },
        {
          key: "maxCardContentLength",
          kind: "number",
          label: "Maximum card length",
          ...APP_SETTINGS_LIMITS.cadence.maxCardContentLength,
          unit: "characters",
        },
      ],
    },
    {
      id: "lists",
      title: "Lists",
      description: "How many sessions appear in lists.",
      fields: [
        {
          key: "sessionListSize",
          kind: "number",
          label: "Sessions shown",
          ...APP_SETTINGS_LIMITS.cadence.sessionListSize,
          unit: "items",
        },
      ],
    },
  ],
};

const pulse: AppSettingsConfig<"pulse"> = {
  app: "pulse",
  title: "Pulse settings",
  description: "Working hours, event defaults, and meeting limits.",
  sections: [
    {
      id: "hours",
      title: "Working hours",
      description: "Shown on everyone's calendar and used for scheduling.",
      fields: [
        { key: "workingDays", kind: "weekdays", label: "Working days" },
        {
          key: "workingHoursStart",
          kind: "hour",
          label: "Day starts",
          ...APP_SETTINGS_LIMITS.pulse.workingHoursStart,
        },
        { key: "workingHoursEnd", kind: "hour", label: "Day ends", ...APP_SETTINGS_LIMITS.pulse.workingHoursEnd },
      ],
    },
    {
      id: "events",
      title: "Event defaults",
      description: "Applied when a new event doesn't specify a value.",
      fields: [
        {
          key: "defaultEventAvailability",
          kind: "select",
          label: "Show as",
          options: options(["BUSY", "Busy"], ["FREE", "Free"]),
        },
        {
          key: "defaultEventPrivacy",
          kind: "select",
          label: "Privacy",
          options: options(["DEFAULT", "Default"], ["PRIVATE", "Private"]),
        },
        {
          key: "defaultReminderMinutes",
          kind: "number",
          label: "Reminder",
          ...APP_SETTINGS_LIMITS.pulse.defaultReminderMinutes,
          unit: "minutes before",
          noLimitLabel: "No reminder",
        },
      ],
    },
    {
      id: "meetings",
      title: "Meetings",
      description: "Online meetings and size limits.",
      fields: [
        { key: "onlineMeetingsEnabled", kind: "toggle", label: "Online meetings" },
        {
          key: "maxMeetingAttendees",
          kind: "number",
          label: "Maximum attendees",
          ...APP_SETTINGS_LIMITS.pulse.maxMeetingAttendees,
          unit: "people",
          noLimitLabel: "No limit",
        },
        {
          key: "maxEventDurationMinutes",
          kind: "number",
          label: "Maximum event length",
          description: "All-day events are not limited.",
          ...APP_SETTINGS_LIMITS.pulse.maxEventDurationMinutes,
          unit: "minutes",
          noLimitLabel: "No limit",
        },
      ],
    },
  ],
};

const notes: AppSettingsConfig<"notes"> = {
  app: "notes",
  title: "Notes settings",
  description: "Sharing rules and size limits for personal notes.",
  sections: [
    {
      id: "sharing",
      title: "Sharing",
      description: "Whether notes can be shared and what new collaborators can do.",
      fields: [
        { key: "sharingEnabled", kind: "toggle", label: "Allow sharing notes" },
        {
          key: "defaultShareCanEdit",
          kind: "toggle",
          label: "Collaborators can edit by default",
          dependsOn: "sharingEnabled",
        },
        {
          key: "defaultShareCanDelete",
          kind: "toggle",
          label: "Collaborators can delete by default",
          dependsOn: "sharingEnabled",
        },
        {
          key: "maxSharedUsersPerNote",
          kind: "number",
          label: "Maximum collaborators per note",
          ...APP_SETTINGS_LIMITS.notes.maxSharedUsersPerNote,
          unit: "people",
          noLimitLabel: "No limit",
          dependsOn: "sharingEnabled",
        },
      ],
    },
    {
      id: "limits",
      title: "Limits",
      description: "Size limits for note content.",
      fields: [
        {
          key: "maxNoteContentLength",
          kind: "number",
          label: "Maximum note length",
          ...APP_SETTINGS_LIMITS.notes.maxNoteContentLength,
          unit: "characters",
        },
      ],
    },
  ],
};

const hrms: AppSettingsConfig<"hrms"> = {
  app: "hrms",
  title: "HRMS settings",
  description: "Leave, attendance, payroll, and training defaults.",
  sections: [
    {
      id: "leave",
      title: "Leave",
      description: "Rules for leave requests.",
      fields: [
        {
          key: "maxLeaveRequestDays",
          kind: "number",
          label: "Maximum days per request",
          ...APP_SETTINGS_LIMITS.hrms.maxLeaveRequestDays,
          unit: "days",
          noLimitLabel: "No limit",
        },
        { key: "allowHalfDayLeave", kind: "toggle", label: "Allow half-day leave" },
      ],
    },
    {
      id: "attendance-payroll",
      title: "Attendance and payroll",
      description: "Defaults for new records.",
      fields: [
        {
          key: "defaultAttendanceStatus",
          kind: "select",
          label: "Default attendance status",
          options: options(
            ["PRESENT", "Present"],
            ["ABSENT", "Absent"],
            ["LATE", "Late"],
            ["HALF_DAY", "Half day"],
            ["WORK_FROM_HOME", "Work from home"],
            ["ON_LEAVE", "On leave"],
            ["HOLIDAY", "Holiday"],
          ),
        },
        {
          key: "defaultPayrollCurrency",
          kind: "text",
          label: "Default payroll currency",
          maxLength: APP_SETTINGS_LIMITS.hrms.defaultPayrollCurrencyLength,
          pattern: APP_SETTINGS_PATTERNS.hrms.defaultPayrollCurrency,
          patternHint: "Use a three-letter ISO code such as USD.",
          uppercase: true,
        },
      ],
    },
    {
      id: "training",
      title: "Training",
      description: "Limits for training sessions.",
      fields: [
        {
          key: "maxTrainingParticipants",
          kind: "number",
          label: "Maximum participants",
          ...APP_SETTINGS_LIMITS.hrms.maxTrainingParticipants,
          unit: "people",
          noLimitLabel: "No limit",
        },
      ],
    },
  ],
};

export const APP_SETTINGS_CONFIG: { [K in AppSettingsKey]: AppSettingsConfig<K> } = {
  connect,
  flow,
  atlas,
  nexus,
  cadence,
  pulse,
  notes,
  hrms,
};

/** Returns the field-level error for a draft value, or null when valid. */
export function validateSettingsField(field: SettingsFieldConfig, value: unknown): string | null {
  switch (field.kind) {
    case "number":
      if (value === null) {
        return field.noLimitLabel ? null : `${field.label} is required.`;
      }
      if (typeof value !== "number" || !Number.isInteger(value)) {
        return `${field.label} must be a whole number.`;
      }
      return value < field.min || value > field.max ? `Use a value from ${field.min} to ${field.max}.` : null;
    case "text":
      return field.pattern && !field.pattern.test(String(value ?? "")) ? (field.patternHint ?? "Invalid value.") : null;
    case "weekdays":
      if (!Array.isArray(value) || value.length < APP_SETTINGS_LIMITS.pulse.workingDays.minItems) {
        return "Select at least one day.";
      }
      if (value.length > APP_SETTINGS_LIMITS.pulse.workingDays.maxItems) {
        return `Select at most ${APP_SETTINGS_LIMITS.pulse.workingDays.maxItems} days.`;
      }
      if (
        value.some(
          (day) =>
            !Number.isInteger(day) ||
            day < APP_SETTINGS_LIMITS.pulse.workingDays.minDay ||
            day > APP_SETTINGS_LIMITS.pulse.workingDays.maxDay,
        )
      ) {
        return "Select valid weekdays.";
      }
      return null;
    case "tags":
      if (!Array.isArray(value)) return `${field.label} must be a list.`;
      if (value.length > field.maxItems) return `Add at most ${field.maxItems} items.`;
      if (
        value.some(
          (item) =>
            typeof item !== "string" ||
            item.length < 1 ||
            item.length > field.maxLength ||
            (field.pattern !== undefined && !field.pattern.test(item)),
        )
      ) {
        return field.patternHint ?? `Each ${field.label.toLowerCase()} item must be 1–${field.maxLength} characters.`;
      }
      return null;
    default:
      return null;
  }
}

/** Cross-field rules that mirror the API's validation. */
export function validateSettingsDraft(app: AppSettingsKey, draft: Record<string, unknown>): string | null {
  if (app === "pulse" && Number(draft.workingHoursStart) >= Number(draft.workingHoursEnd)) {
    return "Working hours must end after they start.";
  }
  if (app === "connect" && Array.isArray(draft.allowedImageTypes) && draft.allowedImageTypes.length === 0) {
    return "Allow at least one image type.";
  }
  return null;
}

/** Returns only the keys whose values differ from the saved settings. */
export function settingsChanges<T extends object>(saved: T, draft: T): Partial<T> {
  const changes: Partial<T> = {};
  for (const key of Object.keys(draft) as Array<keyof T>) {
    if (JSON.stringify(saved[key]) !== JSON.stringify(draft[key])) {
      changes[key] = draft[key];
    }
  }
  return changes;
}
