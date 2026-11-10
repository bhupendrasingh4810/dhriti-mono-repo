-- CreateEnum
DO $$
BEGIN
    CREATE TYPE "HrmsWorkflowDefinitionStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "hrms_workflow_definitions" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "HrmsWorkflowDefinitionStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "stages" JSONB NOT NULL,
    "transitions" JSONB NOT NULL,
    "templateKey" VARCHAR(64),
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdByUserId" UUID NOT NULL,
    "updatedByUserId" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "hrms_workflow_definitions_organizationId_status_idx" ON "hrms_workflow_definitions"("organizationId", "status");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "hrms_workflow_definitions_organizationId_isTemplate_status_idx" ON "hrms_workflow_definitions"("organizationId", "isTemplate", "status");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "hrms_workflow_definitions_organizationId_templateKey_key" ON "hrms_workflow_definitions"("organizationId", "templateKey");

-- AddForeignKey
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'hrms_workflow_definitions_organizationId_fkey'
    ) THEN
        ALTER TABLE "hrms_workflow_definitions"
        ADD CONSTRAINT "hrms_workflow_definitions_organizationId_fkey"
        FOREIGN KEY ("organizationId") REFERENCES "organizations"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
