-- Immutable publication snapshots and tenant-scoped runtime state.
DO $$
BEGIN
  CREATE TYPE "HrmsWorkflowInstanceStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'REJECTED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "HrmsWorkflowAssignmentStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED', 'SKIPPED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "HrmsWorkflowEventType" AS ENUM ('INITIATED', 'ASSIGNED', 'APPROVED', 'REJECTED', 'COMPLETED', 'TRANSITIONED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "hrms_workflow_definition_versions" (
  "id" UUID NOT NULL,
  "definitionId" UUID NOT NULL,
  "version" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "stages" JSONB NOT NULL,
  "transitions" JSONB NOT NULL,
  "publishedByUserId" UUID NOT NULL,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_workflow_definition_versions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_workflow_definition_versions_definitionId_version_key" UNIQUE ("definitionId", "version"),
  CONSTRAINT "hrms_workflow_definition_versions_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "hrms_workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Existing published records predate snapshots; preserve their persisted JSON as version 1.
INSERT INTO "hrms_workflow_definition_versions" ("id", "definitionId", "version", "name", "description", "stages", "transitions", "publishedByUserId", "publishedAt")
SELECT gen_random_uuid(), "id", "version", "name", "description", "stages", "transitions", "createdByUserId", COALESCE("publishedAt", "createdAt")
FROM "hrms_workflow_definitions"
WHERE "status" = 'ACTIVE'
ON CONFLICT ("definitionId", "version") DO NOTHING;

CREATE TABLE IF NOT EXISTS "hrms_workflow_instances" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "definitionId" UUID NOT NULL,
  "definitionVersionId" UUID NOT NULL,
  "definitionVersion" INTEGER NOT NULL,
  "status" "HrmsWorkflowInstanceStatus" NOT NULL DEFAULT 'ACTIVE',
  "currentStageId" TEXT NOT NULL,
  "context" JSONB NOT NULL DEFAULT '{}',
  "definitionSnapshot" JSONB NOT NULL,
  "initiatedByUserId" UUID NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_workflow_instances_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_workflow_instances_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hrms_workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "hrms_workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "hrms_workflow_instances_definitionVersionId_fkey" FOREIGN KEY ("definitionVersionId") REFERENCES "hrms_workflow_definition_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_workflow_instances_organizationId_status_idx" ON "hrms_workflow_instances"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "hrms_workflow_instances_organizationId_definitionId_idx" ON "hrms_workflow_instances"("organizationId", "definitionId");
CREATE INDEX IF NOT EXISTS "hrms_workflow_instances_organizationId_currentStageId_idx" ON "hrms_workflow_instances"("organizationId", "currentStageId");

CREATE TABLE IF NOT EXISTS "hrms_workflow_assignments" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "instanceId" UUID NOT NULL,
  "stageId" TEXT NOT NULL,
  "assigneeUserId" UUID NOT NULL,
  "status" "HrmsWorkflowAssignmentStatus" NOT NULL DEFAULT 'PENDING',
  "actedAt" TIMESTAMP(3),
  "comment" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_workflow_assignments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_workflow_assignments_instanceId_stageId_assigneeUserId_key" UNIQUE ("instanceId", "stageId", "assigneeUserId"),
  CONSTRAINT "hrms_workflow_assignments_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "hrms_workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_workflow_assignments_organizationId_assigneeUserId_status_idx" ON "hrms_workflow_assignments"("organizationId", "assigneeUserId", "status");
CREATE INDEX IF NOT EXISTS "hrms_workflow_assignments_instanceId_stageId_status_idx" ON "hrms_workflow_assignments"("instanceId", "stageId", "status");

CREATE TABLE IF NOT EXISTS "hrms_workflow_events" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "instanceId" UUID NOT NULL,
  "type" "HrmsWorkflowEventType" NOT NULL,
  "actorUserId" UUID,
  "stageId" TEXT,
  "previousState" JSONB,
  "nextState" JSONB,
  "comment" TEXT,
  "evidence" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_workflow_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_workflow_events_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "hrms_workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "hrms_workflow_events_organizationId_instanceId_createdAt_idx" ON "hrms_workflow_events"("organizationId", "instanceId", "createdAt");
