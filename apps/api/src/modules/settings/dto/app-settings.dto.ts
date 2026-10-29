import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  AttendanceStatus,
  ChannelLayout,
  ChannelVisibility,
  ConnectPinPolicy,
  ConnectRecordingPolicy,
  ConnectSendShortcut,
  EventAvailability,
  EventPrivacy,
  IssuePriority,
  IssueStatus,
} from "@prisma/client";
import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { APP_SETTINGS_LIMITS, APP_SETTINGS_PATTERNS } from "@dhriti/validation";

const HH_MM = /^([01]\d|2[0-3]):[0-5]\d$/;
export const CONNECT_MANUAL_STATUSES = ["online", "away", "dnd", "offline"] as const;
export type ConnectManualStatus = (typeof CONNECT_MANUAL_STATUSES)[number];

// `@IsOptional()` lets `null` through; the service rejects `null` for any field
// that is not listed in NULLABLE_SETTINGS_FIELDS, where `null` means "no limit".
export const NULLABLE_SETTINGS_FIELDS = new Set([
  "messageEditWindowMinutes",
  "messageDeleteWindowMinutes",
  "messageRestoreWindowMinutes",
  "recordingRetentionDays",
  "messageRetentionDays",
  "defaultReminderMinutes",
  "maxMeetingAttendees",
  "maxEventDurationMinutes",
  "maxSharedUsersPerNote",
  "maxLeaveRequestDays",
  "maxTrainingParticipants",
  "manualStatus",
  "manualStatusExpiresAt",
  "preferredMicrophoneId",
  "preferredCameraId",
  "preferredSpeakerId",
  "preferredBackground",
]);

export class UpdateConnectSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() directMessagesEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() groupChatsEnabled?: boolean;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.connect.maxGroupChatMembers.min,
    maximum: APP_SETTINGS_LIMITS.connect.maxGroupChatMembers.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.maxGroupChatMembers.min)
  @Max(APP_SETTINGS_LIMITS.connect.maxGroupChatMembers.max)
  maxGroupChatMembers?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(APP_SETTINGS_LIMITS.connect.maxChannelIds)
  @ArrayUnique()
  @IsUUID("all", { each: true })
  defaultChannelIds?: string[];

  @ApiPropertyOptional({ enum: ChannelVisibility })
  @IsOptional()
  @IsEnum(ChannelVisibility)
  defaultChannelVisibility?: ChannelVisibility;
  @ApiPropertyOptional({ enum: ChannelLayout })
  @IsOptional()
  @IsEnum(ChannelLayout)
  defaultChannelLayout?: ChannelLayout;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(APP_SETTINGS_LIMITS.connect.channelNamePrefixes.maxItems)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(APP_SETTINGS_LIMITS.connect.channelNamePrefixes.minLength, { each: true })
  @MaxLength(APP_SETTINGS_LIMITS.connect.channelNamePrefixes.maxLength, { each: true })
  channelNamePrefixes?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() messageEditingEnabled?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.messageWindowsMinutes.min)
  @Max(APP_SETTINGS_LIMITS.connect.messageWindowsMinutes.max)
  messageEditWindowMinutes?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() messageDeletionEnabled?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.messageWindowsMinutes.min)
  @Max(APP_SETTINGS_LIMITS.connect.messageWindowsMinutes.max)
  messageDeleteWindowMinutes?: number | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.messageWindowsMinutes.min)
  @Max(APP_SETTINGS_LIMITS.connect.messageWindowsMinutes.max)
  messageRestoreWindowMinutes?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() adminsCanDeleteAnyMessage?: boolean;
  @ApiPropertyOptional({ enum: ConnectPinPolicy }) @IsOptional() @IsEnum(ConnectPinPolicy) pinPolicy?: ConnectPinPolicy;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.connect.maxMessageLength.min,
    maximum: APP_SETTINGS_LIMITS.connect.maxMessageLength.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.maxMessageLength.min)
  @Max(APP_SETTINGS_LIMITS.connect.maxMessageLength.max)
  maxMessageLength?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(APP_SETTINGS_LIMITS.connect.allowedReactions.maxItems)
  @ArrayUnique()
  @IsString({ each: true })
  @MinLength(APP_SETTINGS_LIMITS.connect.allowedReactions.minLength, { each: true })
  @MaxLength(APP_SETTINGS_LIMITS.connect.allowedReactions.maxLength, { each: true })
  allowedReactions?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() pollsEnabled?: boolean;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.connect.maxImageSizeKb.min,
    maximum: APP_SETTINGS_LIMITS.connect.maxImageSizeKb.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.maxImageSizeKb.min)
  @Max(APP_SETTINGS_LIMITS.connect.maxImageSizeKb.max)
  maxImageSizeKb?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(APP_SETTINGS_LIMITS.connect.allowedImageTypes.maxItems)
  @ArrayUnique()
  @Matches(APP_SETTINGS_PATTERNS.connect.imageMimeType, { each: true })
  @MaxLength(APP_SETTINGS_LIMITS.connect.allowedImageTypes.maxLength, { each: true })
  allowedImageTypes?: string[];

  @ApiPropertyOptional() @IsOptional() @IsBoolean() callsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() videoCallsEnabled?: boolean;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.connect.callRingTimeoutSeconds.min,
    maximum: APP_SETTINGS_LIMITS.connect.callRingTimeoutSeconds.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.callRingTimeoutSeconds.min)
  @Max(APP_SETTINGS_LIMITS.connect.callRingTimeoutSeconds.max)
  callRingTimeoutSeconds?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() recordingEnabled?: boolean;
  @ApiPropertyOptional({ enum: ConnectRecordingPolicy })
  @IsOptional()
  @IsEnum(ConnectRecordingPolicy)
  recordingPolicy?: ConnectRecordingPolicy;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() recordingRequiresConsent?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.retentionDays.min)
  @Max(APP_SETTINGS_LIMITS.connect.retentionDays.max)
  recordingRetentionDays?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() captionsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() transcriptionEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() customBackgroundsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() typingIndicatorsEnabled?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.connect.retentionDays.min)
  @Max(APP_SETTINGS_LIMITS.connect.retentionDays.max)
  messageRetentionDays?: number | null;
}

export class UpdateConnectUserSettingsDto {
  @ApiPropertyOptional({ enum: CONNECT_MANUAL_STATUSES, nullable: true })
  @IsOptional()
  @IsIn(CONNECT_MANUAL_STATUSES)
  manualStatus?: ConnectManualStatus | null;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsDateString() manualStatusExpiresAt?: string | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() quietHoursEnabled?: boolean;
  @ApiPropertyOptional({ example: "22:00" }) @IsOptional() @Matches(HH_MM) quietHoursStart?: string;
  @ApiPropertyOptional({ example: "08:00" }) @IsOptional() @Matches(HH_MM) quietHoursEnd?: string;

  @ApiPropertyOptional({ type: [Number], description: "ISO weekdays, 1 = Monday ... 7 = Sunday" })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(APP_SETTINGS_LIMITS.connect.quietHoursDays.maxItems)
  @IsInt({ each: true })
  @Min(APP_SETTINGS_LIMITS.connect.quietHoursDays.minDay, { each: true })
  @Max(APP_SETTINGS_LIMITS.connect.quietHoursDays.maxDay, { each: true })
  quietHoursDays?: number[];

  @ApiPropertyOptional({ enum: ConnectSendShortcut })
  @IsOptional()
  @IsEnum(ConnectSendShortcut)
  sendShortcut?: ConnectSendShortcut;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() desktopNotificationsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() soundsEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() callRingtoneEnabled?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(APP_SETTINGS_LIMITS.connect.preferredDeviceIdMaxLength)
  preferredMicrophoneId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(APP_SETTINGS_LIMITS.connect.preferredDeviceIdMaxLength)
  preferredCameraId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(APP_SETTINGS_LIMITS.connect.preferredDeviceIdMaxLength)
  preferredSpeakerId?: string | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(APP_SETTINGS_LIMITS.connect.preferredBackgroundMaxLength)
  preferredBackground?: string | null;
}

export class UpdateFlowSettingsDto {
  @ApiPropertyOptional({ enum: IssueStatus }) @IsOptional() @IsEnum(IssueStatus) defaultIssueStatus?: IssueStatus;
  @ApiPropertyOptional({ enum: IssuePriority })
  @IsOptional()
  @IsEnum(IssuePriority)
  defaultIssuePriority?: IssuePriority;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.flow.issueListPageSize.min,
    maximum: APP_SETTINGS_LIMITS.flow.issueListPageSize.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.flow.issueListPageSize.min)
  @Max(APP_SETTINGS_LIMITS.flow.issueListPageSize.max)
  issueListPageSize?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.flow.maxIssueEstimate.min,
    maximum: APP_SETTINGS_LIMITS.flow.maxIssueEstimate.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.flow.maxIssueEstimate.min)
  @Max(APP_SETTINGS_LIMITS.flow.maxIssueEstimate.max)
  maxIssueEstimate?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.flow.maxIssueDescriptionLength.min,
    maximum: APP_SETTINGS_LIMITS.flow.maxIssueDescriptionLength.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.flow.maxIssueDescriptionLength.min)
  @Max(APP_SETTINGS_LIMITS.flow.maxIssueDescriptionLength.max)
  maxIssueDescriptionLength?: number;
}

export class UpdateAtlasSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() pagesPublishedByDefault?: boolean;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.atlas.maxPageHierarchyDepth.min,
    maximum: APP_SETTINGS_LIMITS.atlas.maxPageHierarchyDepth.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.atlas.maxPageHierarchyDepth.min)
  @Max(APP_SETTINGS_LIMITS.atlas.maxPageHierarchyDepth.max)
  maxPageHierarchyDepth?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.atlas.maxPageContentLength.min,
    maximum: APP_SETTINGS_LIMITS.atlas.maxPageContentLength.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.atlas.maxPageContentLength.min)
  @Max(APP_SETTINGS_LIMITS.atlas.maxPageContentLength.max)
  maxPageContentLength?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.atlas.maxSpaceDescriptionLength.min,
    maximum: APP_SETTINGS_LIMITS.atlas.maxSpaceDescriptionLength.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.atlas.maxSpaceDescriptionLength.min)
  @Max(APP_SETTINGS_LIMITS.atlas.maxSpaceDescriptionLength.max)
  maxSpaceDescriptionLength?: number;
}

export class UpdateNexusSettingsDto {
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.nexus.conversationHistoryLimit.min,
    maximum: APP_SETTINGS_LIMITS.nexus.conversationHistoryLimit.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.nexus.conversationHistoryLimit.min)
  @Max(APP_SETTINGS_LIMITS.nexus.conversationHistoryLimit.max)
  conversationHistoryLimit?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.nexus.summarizationMessageLimit.min,
    maximum: APP_SETTINGS_LIMITS.nexus.summarizationMessageLimit.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.nexus.summarizationMessageLimit.min)
  @Max(APP_SETTINGS_LIMITS.nexus.summarizationMessageLimit.max)
  summarizationMessageLimit?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.nexus.conversationListSize.min,
    maximum: APP_SETTINGS_LIMITS.nexus.conversationListSize.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.nexus.conversationListSize.min)
  @Max(APP_SETTINGS_LIMITS.nexus.conversationListSize.max)
  conversationListSize?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.nexus.taskListSize.min,
    maximum: APP_SETTINGS_LIMITS.nexus.taskListSize.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.nexus.taskListSize.min)
  @Max(APP_SETTINGS_LIMITS.nexus.taskListSize.max)
  taskListSize?: number;
}

export class UpdateCadenceSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() anonymousFeedbackByDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowVoteChanges?: boolean;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.cadence.maxCardContentLength.min,
    maximum: APP_SETTINGS_LIMITS.cadence.maxCardContentLength.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.cadence.maxCardContentLength.min)
  @Max(APP_SETTINGS_LIMITS.cadence.maxCardContentLength.max)
  maxCardContentLength?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.cadence.sessionListSize.min,
    maximum: APP_SETTINGS_LIMITS.cadence.sessionListSize.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.cadence.sessionListSize.min)
  @Max(APP_SETTINGS_LIMITS.cadence.sessionListSize.max)
  sessionListSize?: number;
}

export class UpdatePulseSettingsDto {
  @ApiPropertyOptional({ type: [Number], description: "ISO weekdays, 1 = Monday ... 7 = Sunday" })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(APP_SETTINGS_LIMITS.pulse.workingDays.maxItems)
  @IsInt({ each: true })
  @Min(APP_SETTINGS_LIMITS.pulse.workingDays.minDay, { each: true })
  @Max(APP_SETTINGS_LIMITS.pulse.workingDays.maxDay, { each: true })
  workingDays?: number[];

  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.pulse.workingHoursStart.min,
    maximum: APP_SETTINGS_LIMITS.pulse.workingHoursStart.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.pulse.workingHoursStart.min)
  @Max(APP_SETTINGS_LIMITS.pulse.workingHoursStart.max)
  workingHoursStart?: number;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.pulse.workingHoursEnd.min,
    maximum: APP_SETTINGS_LIMITS.pulse.workingHoursEnd.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.pulse.workingHoursEnd.min)
  @Max(APP_SETTINGS_LIMITS.pulse.workingHoursEnd.max)
  workingHoursEnd?: number;
  @ApiPropertyOptional({ enum: EventAvailability })
  @IsOptional()
  @IsEnum(EventAvailability)
  defaultEventAvailability?: EventAvailability;
  @ApiPropertyOptional({ enum: EventPrivacy }) @IsOptional() @IsEnum(EventPrivacy) defaultEventPrivacy?: EventPrivacy;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.pulse.defaultReminderMinutes.min)
  @Max(APP_SETTINGS_LIMITS.pulse.defaultReminderMinutes.max)
  defaultReminderMinutes?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() onlineMeetingsEnabled?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.pulse.maxMeetingAttendees.min)
  @Max(APP_SETTINGS_LIMITS.pulse.maxMeetingAttendees.max)
  maxMeetingAttendees?: number | null;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.pulse.maxEventDurationMinutes.min)
  @Max(APP_SETTINGS_LIMITS.pulse.maxEventDurationMinutes.max)
  maxEventDurationMinutes?: number | null;
}

export class UpdateNotesSettingsDto {
  @ApiPropertyOptional() @IsOptional() @IsBoolean() sharingEnabled?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() defaultShareCanEdit?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() defaultShareCanDelete?: boolean;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.notes.maxSharedUsersPerNote.min)
  @Max(APP_SETTINGS_LIMITS.notes.maxSharedUsersPerNote.max)
  maxSharedUsersPerNote?: number | null;
  @ApiPropertyOptional({
    minimum: APP_SETTINGS_LIMITS.notes.maxNoteContentLength.min,
    maximum: APP_SETTINGS_LIMITS.notes.maxNoteContentLength.max,
  })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.notes.maxNoteContentLength.min)
  @Max(APP_SETTINGS_LIMITS.notes.maxNoteContentLength.max)
  maxNoteContentLength?: number;
}

export class UpdateHrmsSettingsDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.hrms.maxLeaveRequestDays.min)
  @Max(APP_SETTINGS_LIMITS.hrms.maxLeaveRequestDays.max)
  maxLeaveRequestDays?: number | null;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() allowHalfDayLeave?: boolean;
  @ApiPropertyOptional({ enum: AttendanceStatus })
  @IsOptional()
  @IsEnum(AttendanceStatus)
  defaultAttendanceStatus?: AttendanceStatus;
  @ApiPropertyOptional({ example: "USD" })
  @IsOptional()
  @Matches(APP_SETTINGS_PATTERNS.hrms.defaultPayrollCurrency)
  defaultPayrollCurrency?: string;
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsInt()
  @Min(APP_SETTINGS_LIMITS.hrms.maxTrainingParticipants.min)
  @Max(APP_SETTINGS_LIMITS.hrms.maxTrainingParticipants.max)
  maxTrainingParticipants?: number | null;
}
