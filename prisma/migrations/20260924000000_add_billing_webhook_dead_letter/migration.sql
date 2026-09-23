ALTER TYPE "BillingWebhookEventStatus" ADD VALUE IF NOT EXISTS 'DEAD_LETTER';

ALTER TABLE "billing_webhook_events"
    ADD COLUMN IF NOT EXISTS "deadLetteredAt" TIMESTAMP(3);