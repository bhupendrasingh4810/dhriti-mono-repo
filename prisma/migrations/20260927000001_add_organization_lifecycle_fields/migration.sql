CREATE TYPE "OrganizationType" AS ENUM ('COMPANY', 'NON_PROFIT', 'EDUCATIONAL', 'GOVERNMENT', 'PERSONAL', 'OTHER');

ALTER TABLE "organizations"
  ADD COLUMN "type" "OrganizationType",
  ADD COLUMN "countryCode" TEXT,
  ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en-IN',
  ADD COLUMN "activatedAt" TIMESTAMP(3),
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3);