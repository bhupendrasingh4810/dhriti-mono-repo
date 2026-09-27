CREATE TYPE "BillingInterval" AS ENUM ('MONTH', 'YEAR', 'CUSTOM');

CREATE TABLE "plan_prices" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "planId" UUID NOT NULL,
  "currency" TEXT NOT NULL,
  "interval" "BillingInterval" NOT NULL,
  "amountMinor" INTEGER NOT NULL,
  "provider" TEXT,
  "providerPriceId" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "plan_prices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "plan_prices_planId_currency_interval_key" ON "plan_prices"("planId", "currency", "interval");
ALTER TABLE "plan_prices" ADD CONSTRAINT "plan_prices_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;