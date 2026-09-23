DO $$
BEGIN
    CREATE TYPE "BillingWebhookEventStatus" AS ENUM ('PROCESSING', 'SUCCEEDED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "billing_webhook_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "provider" TEXT NOT NULL,
    "providerEventId" TEXT NOT NULL,
    "organizationId" UUID,
    "providerCreatedAt" TIMESTAMP(3) NOT NULL,
    "status" "BillingWebhookEventStatus" NOT NULL DEFAULT 'PROCESSING',
    "payloadHash" TEXT NOT NULL,
    "eventData" JSONB NOT NULL,
    "attemptCount" INTEGER NOT NULL DEFAULT 1,
    "processingStartedAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "errorCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "billing_webhook_events_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "billing_webhook_events"
    ADD COLUMN IF NOT EXISTS "processingStartedAt" TIMESTAMP(3),
    ADD COLUMN IF NOT EXISTS "nextRetryAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "billing_webhook_events_provider_providerEventId_key"
    ON "billing_webhook_events"("provider", "providerEventId");
CREATE INDEX IF NOT EXISTS "billing_webhook_events_organizationId_status_idx"
    ON "billing_webhook_events"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "billing_webhook_events_status_nextRetryAt_idx"
    ON "billing_webhook_events"("status", "nextRetryAt");

DO $$
BEGIN
    ALTER TABLE "billing_webhook_events"
        ADD CONSTRAINT "billing_webhook_events_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;