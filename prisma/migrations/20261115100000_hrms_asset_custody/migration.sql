ALTER TABLE "hrms_assets"
  ALTER COLUMN "serialNumber" DROP NOT NULL,
  ADD COLUMN "assetTag" VARCHAR(100),
  ADD COLUMN "categoryId" UUID,
  ADD COLUMN "brand" VARCHAR(120),
  ADD COLUMN "model" VARCHAR(120),
  ADD COLUMN "specifications" TEXT,
  ADD COLUMN "custodianEmployeeId" UUID,
  ADD COLUMN "purchaseDate" DATE,
  ADD COLUMN "purchaseCost" DECIMAL(18,3),
  ADD COLUMN "currency" VARCHAR(3),
  ADD COLUMN "vendor" VARCHAR(200),
  ADD COLUMN "warrantyExpiresOn" DATE,
  ADD COLUMN "expectedReturnDate" DATE,
  ADD COLUMN "acknowledgedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1;
-- Deterministic asset tags identify legacy records; no custody events or acknowledgements are fabricated.
UPDATE "hrms_assets" SET "assetTag" = 'LEGACY-' || "id"::text;
ALTER TABLE "hrms_assets" ALTER COLUMN "assetTag" SET NOT NULL;
CREATE UNIQUE INDEX "hrms_assets_organizationId_assetTag_key" ON "hrms_assets"("organizationId", "assetTag");
CREATE TABLE "hrms_asset_categories" (
  "id" UUID NOT NULL PRIMARY KEY,
  "organizationId" UUID NOT NULL,
  "name" VARCHAR(100) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX "hrms_asset_categories_organizationId_name_key" ON "hrms_asset_categories"("organizationId", "name");
ALTER TABLE "hrms_assets" ADD CONSTRAINT "hrms_assets_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "hrms_asset_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE TABLE "hrms_asset_events" (
  "id" UUID NOT NULL PRIMARY KEY,
  "organizationId" UUID NOT NULL,
  "assetId" UUID NOT NULL,
  "action" VARCHAR(32) NOT NULL,
  "actorUserId" UUID NOT NULL,
  "employeeId" UUID,
  "employeeName" TEXT,
  "condition" TEXT,
  "notes" TEXT NOT NULL DEFAULT '',
  "expectedReturnDate" DATE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_asset_events_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hrms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "hrms_asset_events_organizationId_assetId_createdAt_idx" ON "hrms_asset_events"("organizationId", "assetId", "createdAt");
