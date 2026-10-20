CREATE TYPE "ConnectRecordingStatus" AS ENUM ('PENDING_CONSENT', 'READY', 'RECORDING', 'PROCESSING', 'COMPLETE', 'DELETED');

CREATE TABLE "connect_call_recordings" (
    "id" UUID NOT NULL,
    "callId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "requestedById" UUID NOT NULL,
    "participantConsents" JSONB NOT NULL,
    "status" "ConnectRecordingStatus" NOT NULL DEFAULT 'PENDING_CONSENT',
    "storageUrl" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "connect_call_recordings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_call_recordings_callId_key" ON "connect_call_recordings"("callId");
CREATE INDEX "connect_call_recordings_organizationId_createdAt_idx" ON "connect_call_recordings"("organizationId", "createdAt");
ALTER TABLE "connect_call_recordings" ADD CONSTRAINT "connect_call_recordings_callId_fkey" FOREIGN KEY ("callId") REFERENCES "connect_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;