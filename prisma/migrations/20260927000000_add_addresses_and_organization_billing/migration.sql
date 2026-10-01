CREATE TYPE "EnabledProduct" AS ENUM ('FLOW', 'CONNECT', 'ATLAS', 'NEXUS', 'PULSE');

ALTER TABLE "organizations"
  ADD COLUMN "primaryEmail" TEXT,
  ADD COLUMN "enabledProducts" "EnabledProduct"[] NOT NULL DEFAULT ARRAY[]::"EnabledProduct"[],
  ADD COLUMN "description" TEXT,
  ADD COLUMN "notes" TEXT,
  ADD COLUMN "seats" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "billingLegalEntityName" TEXT,
  ADD COLUMN "billingGstin" TEXT,
  ADD COLUMN "billingAddressId" UUID,
  ADD COLUMN "invoiceContactEmails" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "paymentProviderIds" JSONB;

CREATE TABLE "addresses" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID,
  "userId" UUID,
  "label" TEXT NOT NULL DEFAULT 'primary',
  "recipientName" TEXT,
  "line1" TEXT NOT NULL,
  "line2" TEXT,
  "city" TEXT NOT NULL,
  "state" TEXT,
  "postalCode" TEXT,
  "countryCode" TEXT NOT NULL,
  "phoneNumber" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "addresses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "addresses_owner_check" CHECK (("organizationId" IS NOT NULL) <> ("userId" IS NOT NULL))
);

CREATE UNIQUE INDEX "organizations_billingAddressId_key" ON "organizations"("billingAddressId");
CREATE INDEX "organizations_primaryEmail_idx" ON "organizations"("primaryEmail");
CREATE INDEX "organizations_billingGstin_idx" ON "organizations"("billingGstin");
CREATE INDEX "addresses_organizationId_idx" ON "addresses"("organizationId");
CREATE INDEX "addresses_userId_idx" ON "addresses"("userId");

ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "addresses"
  ADD CONSTRAINT "addresses_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organizations"
  ADD CONSTRAINT "organizations_billingAddressId_fkey"
  FOREIGN KEY ("billingAddressId") REFERENCES "addresses"("id") ON DELETE SET NULL ON UPDATE CASCADE;