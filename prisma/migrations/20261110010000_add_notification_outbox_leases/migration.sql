-- The lease columns may already exist on databases previously synchronized with db push.
ALTER TABLE "notification_outbox"
  ADD COLUMN IF NOT EXISTS "leaseToken" UUID,
  ADD COLUMN IF NOT EXISTS "leaseUntil" TIMESTAMP(3);

ALTER TABLE "notification_outbox"
  DROP CONSTRAINT IF EXISTS "notification_outbox_status_check",
  ADD CONSTRAINT "notification_outbox_status_check"
    CHECK ("status" IN ('PENDING', 'PROCESSING', 'PROCESSED', 'SKIPPED', 'FAILED'));
