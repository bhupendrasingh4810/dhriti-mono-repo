ALTER TABLE "notifications" RENAME COLUMN "userId" TO "recipient_id";
ALTER TABLE "notifications" RENAME COLUMN "isRead" TO "is_read";
ALTER TABLE "notifications" RENAME COLUMN "readAt" TO "read_at";
ALTER TABLE "notifications" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "notifications"
  ADD COLUMN "actor_id" UUID,
  ADD COLUMN "source_type" TEXT NOT NULL DEFAULT 'system',
  ADD COLUMN "source_id" UUID,
  ADD COLUMN "event_id" UUID,
  ADD COLUMN "payload" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "is_seen" BOOLEAN NOT NULL DEFAULT false;
UPDATE "notifications" SET "payload" = jsonb_build_object('title', "title", 'body', "body", 'url', "linkUrl"),
  "is_seen" = "is_read";
CREATE UNIQUE INDEX "notifications_event_id_key" ON "notifications"("event_id");

CREATE TABLE "notification_outbox" (
  "id" UUID PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "recipientId" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "actorId" UUID,
  "sourceType" TEXT NOT NULL,
  "sourceId" UUID,
  "type" "NotificationType" NOT NULL,
  "payload" JSONB NOT NULL,
  "dedupKey" TEXT UNIQUE,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processedAt" TIMESTAMP(3)
);
ALTER TABLE "notification_outbox" ADD CONSTRAINT "notification_outbox_status_check"
  CHECK ("status" IN ('PENDING', 'PROCESSED', 'FAILED', 'SKIPPED'));
CREATE INDEX "notification_outbox_status_availableAt_idx" ON "notification_outbox"("status", "availableAt");
CREATE TABLE "notification_deliveries" (
  "id" UUID PRIMARY KEY,
  "notificationId" UUID NOT NULL REFERENCES "notifications"("id") ON DELETE CASCADE,
  "channel" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseToken" UUID,
  "leaseUntil" TIMESTAMP(3),
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notification_deliveries_notificationId_channel_key" UNIQUE ("notificationId", "channel")
);
CREATE INDEX "notification_deliveries_status_availableAt_idx" ON "notification_deliveries"("status", "availableAt");
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_status_check"
  CHECK ("status" IN ('PENDING', 'PROCESSING', 'SENT', 'SUPPRESSED', 'FAILED'));
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_channel_check"
  CHECK ("channel" IN ('REALTIME', 'EMAIL'));
