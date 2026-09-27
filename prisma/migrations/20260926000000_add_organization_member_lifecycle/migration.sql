DO $$
BEGIN
  CREATE TYPE "OrganizationMemberStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "organization_members"
  ADD COLUMN IF NOT EXISTS "status" "OrganizationMemberStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "isOwner" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "removedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "organization_members_organizationId_status_isOwner_idx"
  ON "organization_members"("organizationId", "status", "isOwner");