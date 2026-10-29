-- CreateEnum
CREATE TYPE "ConnectPinPolicy" AS ENUM ('EVERYONE', 'CHANNEL_ADMINS');

-- CreateEnum
CREATE TYPE "ConnectRecordingPolicy" AS ENUM ('CALL_INITIATOR', 'ANY_PARTICIPANT');

-- CreateEnum
CREATE TYPE "ConnectSendShortcut" AS ENUM ('ENTER', 'MOD_ENTER');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'DIRECT_MESSAGE';
ALTER TYPE "NotificationType" ADD VALUE 'CALL';

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "deletedById" UUID;

-- CreateTable
CREATE TABLE "connect_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "directMessagesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "groupChatsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxGroupChatMembers" INTEGER NOT NULL DEFAULT 100,
    "defaultChannelIds" UUID[] DEFAULT ARRAY[]::UUID[],
    "defaultChannelVisibility" "ChannelVisibility" NOT NULL DEFAULT 'PUBLIC',
    "defaultChannelLayout" "ChannelLayout" NOT NULL DEFAULT 'THREADS',
    "channelNamePrefixes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "messageEditingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messageEditWindowMinutes" INTEGER,
    "messageDeletionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messageDeleteWindowMinutes" INTEGER,
    "messageRestoreWindowMinutes" INTEGER,
    "adminsCanDeleteAnyMessage" BOOLEAN NOT NULL DEFAULT true,
    "pinPolicy" "ConnectPinPolicy" NOT NULL DEFAULT 'EVERYONE',
    "maxMessageLength" INTEGER NOT NULL DEFAULT 10000,
    "allowedReactions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "pollsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxImageSizeKb" INTEGER NOT NULL DEFAULT 2048,
    "allowedImageTypes" TEXT[] DEFAULT ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[],
    "callsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "videoCallsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "callRingTimeoutSeconds" INTEGER NOT NULL DEFAULT 30,
    "recordingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "recordingPolicy" "ConnectRecordingPolicy" NOT NULL DEFAULT 'CALL_INITIATOR',
    "recordingRequiresConsent" BOOLEAN NOT NULL DEFAULT true,
    "recordingRetentionDays" INTEGER,
    "captionsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "transcriptionEnabled" BOOLEAN NOT NULL DEFAULT true,
    "customBackgroundsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "typingIndicatorsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "messageRetentionDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "connect_user_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "manualStatus" VARCHAR(20),
    "manualStatusExpiresAt" TIMESTAMP(3),
    "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
    "quietHoursStart" VARCHAR(5) NOT NULL DEFAULT '22:00',
    "quietHoursEnd" VARCHAR(5) NOT NULL DEFAULT '08:00',
    "quietHoursDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7]::INTEGER[],
    "sendShortcut" "ConnectSendShortcut" NOT NULL DEFAULT 'ENTER',
    "desktopNotificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "soundsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "callRingtoneEnabled" BOOLEAN NOT NULL DEFAULT true,
    "preferredMicrophoneId" VARCHAR(255),
    "preferredCameraId" VARCHAR(255),
    "preferredSpeakerId" VARCHAR(255),
    "preferredBackground" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "defaultIssueStatus" "IssueStatus" NOT NULL DEFAULT 'BACKLOG',
    "defaultIssuePriority" "IssuePriority" NOT NULL DEFAULT 'NONE',
    "issueListPageSize" INTEGER NOT NULL DEFAULT 100,
    "maxIssueEstimate" INTEGER NOT NULL DEFAULT 1000,
    "maxIssueDescriptionLength" INTEGER NOT NULL DEFAULT 20000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flow_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atlas_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "pagesPublishedByDefault" BOOLEAN NOT NULL DEFAULT false,
    "maxPageHierarchyDepth" INTEGER NOT NULL DEFAULT 100,
    "maxPageContentLength" INTEGER NOT NULL DEFAULT 100000,
    "maxSpaceDescriptionLength" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atlas_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nexus_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "conversationHistoryLimit" INTEGER NOT NULL DEFAULT 40,
    "summarizationMessageLimit" INTEGER NOT NULL DEFAULT 200,
    "conversationListSize" INTEGER NOT NULL DEFAULT 50,
    "taskListSize" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nexus_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cadence_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "anonymousFeedbackByDefault" BOOLEAN NOT NULL DEFAULT true,
    "allowVoteChanges" BOOLEAN NOT NULL DEFAULT true,
    "maxCardContentLength" INTEGER NOT NULL DEFAULT 2000,
    "sessionListSize" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cadence_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pulse_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4]::INTEGER[],
    "workingHoursStart" INTEGER NOT NULL DEFAULT 9,
    "workingHoursEnd" INTEGER NOT NULL DEFAULT 18,
    "defaultEventAvailability" "EventAvailability" NOT NULL DEFAULT 'BUSY',
    "defaultEventPrivacy" "EventPrivacy" NOT NULL DEFAULT 'DEFAULT',
    "defaultReminderMinutes" INTEGER,
    "onlineMeetingsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "maxMeetingAttendees" INTEGER,
    "maxEventDurationMinutes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pulse_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "sharingEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultShareCanEdit" BOOLEAN NOT NULL DEFAULT false,
    "defaultShareCanDelete" BOOLEAN NOT NULL DEFAULT false,
    "maxSharedUsersPerNote" INTEGER,
    "maxNoteContentLength" INTEGER NOT NULL DEFAULT 100000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_organization_settings" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "maxLeaveRequestDays" INTEGER,
    "allowHalfDayLeave" BOOLEAN NOT NULL DEFAULT true,
    "defaultAttendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "defaultPayrollCurrency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "maxTrainingParticipants" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_organization_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "connect_organization_settings_organizationId_key" ON "connect_organization_settings"("organizationId");

-- CreateIndex
CREATE INDEX "connect_user_settings_userId_idx" ON "connect_user_settings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "connect_user_settings_organizationId_userId_key" ON "connect_user_settings"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "flow_organization_settings_organizationId_key" ON "flow_organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "atlas_organization_settings_organizationId_key" ON "atlas_organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "nexus_organization_settings_organizationId_key" ON "nexus_organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "cadence_organization_settings_organizationId_key" ON "cadence_organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "pulse_organization_settings_organizationId_key" ON "pulse_organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "notes_organization_settings_organizationId_key" ON "notes_organization_settings"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_organization_settings_organizationId_key" ON "hrms_organization_settings"("organizationId");

-- AddForeignKey
ALTER TABLE "connect_organization_settings" ADD CONSTRAINT "connect_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_user_settings" ADD CONSTRAINT "connect_user_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "connect_user_settings" ADD CONSTRAINT "connect_user_settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "flow_organization_settings" ADD CONSTRAINT "flow_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atlas_organization_settings" ADD CONSTRAINT "atlas_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nexus_organization_settings" ADD CONSTRAINT "nexus_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cadence_organization_settings" ADD CONSTRAINT "cadence_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pulse_organization_settings" ADD CONSTRAINT "pulse_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes_organization_settings" ADD CONSTRAINT "notes_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_organization_settings" ADD CONSTRAINT "hrms_organization_settings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

