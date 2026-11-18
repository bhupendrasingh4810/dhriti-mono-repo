ALTER TABLE "security_events" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'dhriti', ADD COLUMN "externalId" TEXT;
CREATE UNIQUE INDEX "security_events_source_externalId_key" ON "security_events"("source", "externalId");
ALTER TABLE "blocked_ips" ADD COLUMN "reason" TEXT NOT NULL DEFAULT 'Legacy block', ADD COLUMN "expiresAt" TIMESTAMP(3);
CREATE INDEX "blocked_ips_expiresAt_idx" ON "blocked_ips"("expiresAt");
CREATE TABLE "security_alert_deliveries" (
  "id" UUID NOT NULL,
  "eventId" UUID NOT NULL,
  "channel" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "leaseUntil" TIMESTAMP(3),
  "leaseToken" UUID,
  "deliveredAt" TIMESTAMP(3),
  "lastError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "security_alert_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "security_alert_deliveries_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "security_events"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "security_alert_deliveries_eventId_channel_destination_key" ON "security_alert_deliveries"("eventId", "channel", "destination");
CREATE INDEX "security_alert_deliveries_deliveredAt_availableAt_idx" ON "security_alert_deliveries"("deliveredAt", "availableAt");
