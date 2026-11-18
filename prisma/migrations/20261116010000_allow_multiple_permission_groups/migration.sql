DROP INDEX IF EXISTS "organization_permission_group_assignments_one_active_per_member_key";

CREATE UNIQUE INDEX "organization_permission_group_assignments_one_active_per_group_member_key"
  ON "organization_permission_group_assignments" ("organizationId", "permissionGroupId", "userId")
  WHERE "revokedAt" IS NULL;
