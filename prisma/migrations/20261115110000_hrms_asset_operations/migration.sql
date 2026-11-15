-- CreateTable
-- The workforce catalog key already exists in seed. Preserve existing administrators' access on upgrade.
INSERT INTO "permissions" ("id", "key", "resource", "action", "productKey", "description")
VALUES ('b1430030-ae72-4f41-bfba-397936372e7b', 'hrms.workforce.manage', 'hrms.workforce', 'manage', 'hrms', 'Manage HRMS workforce')
ON CONFLICT ("key") DO NOTHING;
INSERT INTO "organization_permission_group_permissions" ("permissionGroupId", "permissionId")
SELECT grants."permissionGroupId", target."id"
FROM "organization_permission_group_permissions" grants
JOIN "permissions" old ON old."id" = grants."permissionId" AND old."key" = 'hrms.employee.manage'
CROSS JOIN "permissions" target WHERE target."key" = 'hrms.workforce.manage'
ON CONFLICT DO NOTHING;
INSERT INTO "platform_role_permissions" ("platformRoleId", "permissionId")
SELECT grants."platformRoleId", target."id"
FROM "platform_role_permissions" grants
JOIN "permissions" old ON old."id" = grants."permissionId" AND old."key" = 'hrms.employee.manage'
CROSS JOIN "permissions" target WHERE target."key" = 'hrms.workforce.manage'
ON CONFLICT DO NOTHING;

CREATE TABLE "hrms_asset_attachments" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "fileId" UUID NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "kind" VARCHAR(32) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "hrms_asset_attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_requests" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "managerUserId" UUID,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "decisionById" UUID,
    "decisionNote" TEXT,
    "replacementAssetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_asset_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_maintenance" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "fault" TEXT NOT NULL,
    "vendor" VARCHAR(200),
    "cost" DECIMAL(18,3),
    "currency" VARCHAR(3),
    "status" VARCHAR(32) NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "revision" INTEGER NOT NULL DEFAULT 1,
    "openedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "hrms_asset_maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_accessories" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "outstanding" INTEGER NOT NULL DEFAULT 0,
    "condition" VARCHAR(16) NOT NULL DEFAULT 'GOOD',
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hrms_asset_accessories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_clearance_overrides" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_asset_clearance_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_imports" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "rows" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "appliedAt" TIMESTAMP(3),

    CONSTRAINT "hrms_asset_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_stock_checks" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "status" VARCHAR(16) NOT NULL DEFAULT 'OPEN',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "hrms_asset_stock_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_stock_items" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "checkId" UUID NOT NULL,
    "assetId" UUID NOT NULL,
    "expectedLocation" TEXT,
    "expectedHolderId" UUID,
    "observedLocation" TEXT,
    "result" VARCHAR(32) NOT NULL DEFAULT 'UNCHECKED',
    "note" TEXT,
    "checkedById" UUID,
    "resolution" TEXT,
    "resolvedById" UUID,
    "revision" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "hrms_asset_stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_procurement" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "estimatedCost" DECIMAL(18,3) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "revision" INTEGER NOT NULL DEFAULT 1,
    "requestedById" UUID NOT NULL,
    "decidedById" UUID,
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_asset_procurement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_asset_depreciation" (
    "organizationId" UUID NOT NULL,
    "method" VARCHAR(32) NOT NULL DEFAULT 'DISABLED',
    "usefulLifeMonths" INTEGER,
    "residualPercent" DECIMAL(6,3),
    "revision" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_asset_depreciation_pkey" PRIMARY KEY ("organizationId")
);

-- CreateIndex
CREATE UNIQUE INDEX "hrms_asset_attachments_fileId_key" ON "hrms_asset_attachments"("fileId");

-- CreateIndex
CREATE INDEX "hrms_asset_attachments_organizationId_assetId_idx" ON "hrms_asset_attachments"("organizationId", "assetId");

-- CreateIndex
CREATE INDEX "hrms_asset_requests_organizationId_status_idx" ON "hrms_asset_requests"("organizationId", "status");

-- CreateIndex
CREATE INDEX "hrms_asset_requests_organizationId_employeeId_idx" ON "hrms_asset_requests"("organizationId", "employeeId");

-- CreateIndex
CREATE INDEX "hrms_asset_maintenance_organizationId_status_idx" ON "hrms_asset_maintenance"("organizationId", "status");

-- CreateIndex
CREATE INDEX "hrms_asset_accessories_organizationId_assetId_idx" ON "hrms_asset_accessories"("organizationId", "assetId");

-- CreateIndex
CREATE INDEX "hrms_asset_clearance_overrides_organizationId_employeeId_cr_idx" ON "hrms_asset_clearance_overrides"("organizationId", "employeeId", "createdAt");

-- CreateIndex
CREATE INDEX "hrms_asset_imports_organizationId_actorUserId_idx" ON "hrms_asset_imports"("organizationId", "actorUserId");

-- CreateIndex
CREATE INDEX "hrms_asset_stock_checks_organizationId_createdAt_idx" ON "hrms_asset_stock_checks"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "hrms_asset_stock_items_organizationId_checkId_idx" ON "hrms_asset_stock_items"("organizationId", "checkId");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_asset_stock_items_checkId_assetId_key" ON "hrms_asset_stock_items"("checkId", "assetId");

-- CreateIndex
CREATE INDEX "hrms_asset_procurement_organizationId_status_idx" ON "hrms_asset_procurement"("organizationId", "status");

-- AddForeignKey
ALTER TABLE "hrms_asset_attachments" ADD CONSTRAINT "hrms_asset_attachments_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hrms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_asset_attachments" ADD CONSTRAINT "hrms_asset_attachments_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_asset_requests" ADD CONSTRAINT "hrms_asset_requests_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hrms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_asset_maintenance" ADD CONSTRAINT "hrms_asset_maintenance_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hrms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_asset_accessories" ADD CONSTRAINT "hrms_asset_accessories_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hrms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_asset_stock_items" ADD CONSTRAINT "hrms_asset_stock_items_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "hrms_asset_stock_checks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_asset_stock_items" ADD CONSTRAINT "hrms_asset_stock_items_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "hrms_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
