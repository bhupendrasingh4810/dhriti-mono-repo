ALTER TABLE "notifications"
  ALTER COLUMN "created_at" SET DEFAULT timezone('UTC', CURRENT_TIMESTAMP);
ALTER TABLE "notification_outbox"
  ALTER COLUMN "availableAt" SET DEFAULT timezone('UTC', CURRENT_TIMESTAMP),
  ALTER COLUMN "createdAt" SET DEFAULT timezone('UTC', CURRENT_TIMESTAMP);
ALTER TABLE "notification_deliveries"
  ALTER COLUMN "availableAt" SET DEFAULT timezone('UTC', CURRENT_TIMESTAMP),
  ALTER COLUMN "createdAt" SET DEFAULT timezone('UTC', CURRENT_TIMESTAMP);
ALTER INDEX "notifications_userId_isRead_createdAt_idx"
  RENAME TO "notifications_recipient_id_is_read_created_at_idx";
ALTER INDEX "notifications_organizationId_createdAt_idx"
  RENAME TO "notifications_organizationId_created_at_idx";
ALTER TABLE "notifications" RENAME CONSTRAINT "notifications_userId_fkey" TO "notifications_recipient_id_fkey";
CREATE INDEX "notifications_organizationId_recipient_id_created_at_id_idx"
  ON "notifications"("organizationId", "recipient_id", "created_at", "id");
CREATE INDEX "notifications_organizationId_recipient_id_is_seen_idx"
  ON "notifications"("organizationId", "recipient_id", "is_seen");
