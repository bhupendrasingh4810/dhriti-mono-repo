CREATE TABLE "organization_bank_accounts" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "label" TEXT NOT NULL,
  "accountHolder" TEXT NOT NULL,
  "bankName" TEXT NOT NULL,
  "countryCode" VARCHAR(2) NOT NULL,
  "currency" VARCHAR(3) NOT NULL,
  "accountType" TEXT NOT NULL,
  "accountDetailsEncrypted" TEXT NOT NULL,
  "lastFour" VARCHAR(4) NOT NULL,
  "formatCheck" TEXT NOT NULL,
  "reviewStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "createdById" UUID NOT NULL,
  "reviewedById" UUID,
  "reviewedAt" TIMESTAMP(3),
  "reviewEvidenceEncrypted" TEXT,
  "archivedAt" TIMESTAMP(3),
  "archivedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "organization_bank_accounts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "organization_bank_accounts_organizationId_fkey" FOREIGN KEY ("organizationId")
    REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "organization_bank_accounts_organizationId_createdAt_idx"
  ON "organization_bank_accounts"("organizationId", "createdAt");
