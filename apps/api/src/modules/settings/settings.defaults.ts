import { HttpStatus } from "@nestjs/common";
import type { ConnectOrganizationSettings } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { AppSettingsKey, AppSettingsMap, AppSettingsService } from "./app-settings.service";

/** Mirrors the column defaults in prisma/parts/settings.prisma. */
export const DEFAULT_CONNECT_SETTINGS: Omit<
  ConnectOrganizationSettings,
  "id" | "organizationId" | "createdAt" | "updatedAt"
> = {
  directMessagesEnabled: true,
  groupChatsEnabled: true,
  maxGroupChatMembers: 100,
  defaultChannelIds: [],
  defaultChannelVisibility: "PUBLIC",
  defaultChannelLayout: "THREADS",
  channelNamePrefixes: [],
  messageEditingEnabled: true,
  messageEditWindowMinutes: null,
  messageDeletionEnabled: true,
  messageDeleteWindowMinutes: null,
  messageRestoreWindowMinutes: null,
  adminsCanDeleteAnyMessage: true,
  pinPolicy: "EVERYONE",
  maxMessageLength: 10000,
  allowedReactions: [],
  pollsEnabled: true,
  maxImageSizeKb: 2048,
  allowedImageTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  callsEnabled: true,
  videoCallsEnabled: true,
  callRingTimeoutSeconds: 30,
  recordingEnabled: true,
  recordingPolicy: "CALL_INITIATOR",
  recordingRequiresConsent: true,
  recordingRetentionDays: null,
  retentionEnabledAt: null,
  captionsEnabled: true,
  transcriptionEnabled: true,
  customBackgroundsEnabled: true,
  typingIndicatorsEnabled: true,
  messageRetentionDays: null,
};

export type ConnectPolicy = typeof DEFAULT_CONNECT_SETTINGS;

type SettingsColumns<T> = Omit<T, "id" | "organizationId" | "createdAt" | "updatedAt">;

export const DEFAULT_APP_SETTINGS: { [K in AppSettingsKey]: SettingsColumns<AppSettingsMap[K]> } = {
  connect: DEFAULT_CONNECT_SETTINGS,
  flow: {
    defaultIssueStatus: "BACKLOG",
    defaultIssuePriority: "NONE",
    issueListPageSize: 100,
    maxIssueEstimate: 1000,
    maxIssueDescriptionLength: 20000,
  },
  atlas: {
    pagesPublishedByDefault: false,
    maxPageHierarchyDepth: 100,
    maxPageContentLength: 100000,
    maxSpaceDescriptionLength: 1000,
  },
  nexus: {
    conversationHistoryLimit: 40,
    summarizationMessageLimit: 200,
    conversationListSize: 50,
    taskListSize: 50,
  },
  cadence: {
    anonymousFeedbackByDefault: true,
    allowVoteChanges: true,
    maxCardContentLength: 2000,
    sessionListSize: 100,
  },
  pulse: {
    workingDays: [1, 2, 3, 4],
    workingHoursStart: 9,
    workingHoursEnd: 18,
    defaultEventAvailability: "BUSY",
    defaultEventPrivacy: "DEFAULT",
    defaultReminderMinutes: null,
    onlineMeetingsEnabled: true,
    maxMeetingAttendees: null,
    maxEventDurationMinutes: null,
  },
  notes: {
    sharingEnabled: true,
    defaultShareCanEdit: false,
    defaultShareCanDelete: false,
    maxSharedUsersPerNote: null,
    maxNoteContentLength: 100000,
  },
  hrms: {
    maxLeaveRequestDays: null,
    allowHalfDayLeave: true,
    defaultAttendanceStatus: "PRESENT",
    defaultPayrollCurrency: "USD",
    maxTrainingParticipants: null,
  },
};

/** Reads the current policy; a missing provider must fail dependency resolution. */
export async function resolveAppSettings<K extends AppSettingsKey>(
  settings: AppSettingsService,
  app: K,
  organizationId: string,
): Promise<SettingsColumns<AppSettingsMap[K]>> {
  return settings.get(app, organizationId);
}

export function settingsPolicyError(message: string, status: HttpStatus = HttpStatus.FORBIDDEN) {
  return new AppError(
    status === HttpStatus.FORBIDDEN ? ErrorCode.FORBIDDEN : ErrorCode.VALIDATION_FAILED,
    message,
    status,
  );
}
