CREATE TYPE "ConnectCallScope" AS ENUM ('ONE_TO_ONE', 'GROUP', 'CHANNEL', 'MEETING');
CREATE TYPE "ConnectCallType" AS ENUM ('AUDIO', 'VIDEO');
CREATE TYPE "ConnectCallStatus" AS ENUM ('RINGING', 'ACTIVE', 'ENDED', 'DECLINED', 'MISSED', 'CANCELLED');

CREATE TABLE "connect_calls" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "channelId" UUID NOT NULL,
    "initiatedById" UUID NOT NULL,
    "scope" "ConnectCallScope" NOT NULL,
    "type" "ConnectCallType" NOT NULL,
    "status" "ConnectCallStatus" NOT NULL DEFAULT 'RINGING',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    CONSTRAINT "connect_calls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "connect_call_participants" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3),
    "leftAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "connect_call_participants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_call_participants_callId_userId_key" ON "connect_call_participants"("callId", "userId");
CREATE INDEX "connect_calls_organizationId_startedAt_idx" ON "connect_calls"("organizationId", "startedAt");
CREATE INDEX "connect_calls_channelId_startedAt_idx" ON "connect_calls"("channelId", "startedAt");
CREATE INDEX "connect_call_participants_userId_createdAt_idx" ON "connect_call_participants"("userId", "createdAt");

ALTER TABLE "connect_calls" ADD CONSTRAINT "connect_calls_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "connect_call_participants" ADD CONSTRAINT "connect_call_participants_callId_fkey" FOREIGN KEY ("callId") REFERENCES "connect_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;