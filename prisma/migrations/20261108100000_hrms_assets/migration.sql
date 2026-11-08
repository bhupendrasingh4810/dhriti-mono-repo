ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'MAINTENANCE';
ALTER TYPE "AssetStatus" ADD VALUE IF NOT EXISTS 'UNFIT';
CREATE TYPE "AssetCondition" AS ENUM ('NEW', 'GOOD', 'FAIR');
ALTER TABLE "hrms_assets"
  ADD COLUMN "customCategory" TEXT,
  ADD COLUMN "condition" "AssetCondition" NOT NULL DEFAULT 'GOOD';
UPDATE "hrms_assets" SET "serialNumber" = CONCAT('LEGACY-', "id"::text) WHERE "serialNumber" IS NULL;
ALTER TABLE "hrms_assets" ALTER COLUMN "serialNumber" SET NOT NULL;
CREATE INDEX "hrms_assets_organizationId_type_condition_status_idx" ON "hrms_assets"("organizationId", "type", "condition", "status");
