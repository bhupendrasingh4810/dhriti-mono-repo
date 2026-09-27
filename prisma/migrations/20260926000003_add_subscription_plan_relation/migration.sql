ALTER TABLE "subscriptions"
  ADD COLUMN "planId" UUID;

CREATE INDEX "subscriptions_planId_status_idx" ON "subscriptions"("planId", "status");

ALTER TABLE "subscriptions"
  ADD CONSTRAINT "subscriptions_planId_fkey"
  FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;