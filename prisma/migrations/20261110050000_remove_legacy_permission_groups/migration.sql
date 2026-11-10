-- Retire pre-existing custom and legacy groups while preserving the three
-- system-role defaults introduced by the organization permission-group refactor.
CREATE TEMP TABLE "_legacy_permission_group_assignments" ON COMMIT DROP AS
SELECT assignment."organizationId", assignment."userId"
FROM "organization_permission_group_assignments" AS assignment
JOIN "organization_permission_groups" AS permission_group
  ON permission_group."id" = assignment."permissionGroupId"
WHERE permission_group."createdAt" < CURRENT_DATE
  AND permission_group."systemRole" IS NULL
  AND permission_group."deletedAt" IS NULL
  AND assignment."revokedAt" IS NULL;

UPDATE "organization_permission_group_assignments" AS assignment
SET "revokedAt" = CURRENT_TIMESTAMP
FROM "organization_permission_groups" AS permission_group
WHERE assignment."permissionGroupId" = permission_group."id"
  AND permission_group."createdAt" < CURRENT_DATE
  AND permission_group."systemRole" IS NULL
  AND permission_group."deletedAt" IS NULL
  AND assignment."revokedAt" IS NULL;

INSERT INTO "organization_permission_group_assignments" (
  "id", "organizationId", "permissionGroupId", "userId", "scopeType"
)
SELECT
  gen_random_uuid(),
  legacy."organizationId",
  members_group."id",
  legacy."userId",
  'ORGANIZATION'::"OrganizationPermissionScope"
FROM "_legacy_permission_group_assignments" AS legacy
JOIN "organization_permission_groups" AS members_group
  ON members_group."organizationId" = legacy."organizationId"
 AND members_group."systemRole" = 'MEMBERS'
 AND members_group."isActive" = true
 AND members_group."deletedAt" IS NULL
ON CONFLICT DO NOTHING;

UPDATE "organization_permission_groups"
SET "deletedAt" = CURRENT_TIMESTAMP,
    "isActive" = false,
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "createdAt" < CURRENT_DATE
  AND "systemRole" IS NULL
  AND "deletedAt" IS NULL;
