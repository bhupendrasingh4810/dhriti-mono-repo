CREATE TABLE "subscription_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "subscriptionId" UUID NOT NULL,
  "previousPlanId" UUID,
  "planId" UUID,
  "previousStatus" "SubscriptionStatus",
  "status" "SubscriptionStatus" NOT NULL,
  "reason" TEXT,
  "actorUserId" UUID,
  "providerEventId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "subscription_history_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_history_providerEventId_key" ON "subscription_history"("providerEventId");
CREATE INDEX "subscription_history_organizationId_createdAt_idx" ON "subscription_history"("organizationId", "createdAt");

ALTER TABLE "subscription_history"
  ADD CONSTRAINT "subscription_history_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subscription_history"
  ADD CONSTRAINT "subscription_history_subscriptionId_fkey"
  FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;