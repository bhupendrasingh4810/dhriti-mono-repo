-- Replace per-product defaults with three organization-level roles. The role
-- metadata is authoritative; display names are intentionally not parsed by
-- application code.
CREATE TYPE "OrganizationSystemPermissionGroupRole" AS ENUM ('ADMINISTRATORS', 'MEMBERS', 'GUESTS');

ALTER TABLE "organization_permission_groups"
  ADD COLUMN "systemRole" "OrganizationSystemPermissionGroupRole";

-- Catalog rows created before productKey was populated still need entitlement
-- protection when they are attached to a permission group.
UPDATE "permissions"
SET "productKey" = split_part("key", '.', 1)
WHERE "productKey" IS NULL
  AND "key" ~ '^(connect|flow|hrms|pulse|atlas|cadence|nexus)\.';

INSERT INTO "organization_permission_groups" (
  "id", "organizationId", "name", "description", "isSystem", "systemRole", "updatedAt"
)
SELECT
  gen_random_uuid(),
  organization."id",
  role."name",
  'System default organization permission group',
  true,
  role."systemRole",
  CURRENT_TIMESTAMP
FROM "organizations" AS organization
CROSS JOIN (
  VALUES
    ('Administrators', 'ADMINISTRATORS'::"OrganizationSystemPermissionGroupRole"),
    ('Members', 'MEMBERS'::"OrganizationSystemPermissionGroupRole"),
    ('Guests', 'GUESTS'::"OrganizationSystemPermissionGroupRole")
) AS role("name", "systemRole")
WHERE organization."deletedAt" IS NULL
ON CONFLICT ("organizationId", "name") DO UPDATE
SET "isSystem" = true,
    "systemRole" = EXCLUDED."systemRole",
    "isActive" = true,
    "deletedAt" = NULL,
    "updatedAt" = CURRENT_TIMESTAMP;

-- Preserve the effective permissions of legacy system defaults before their
-- assignments are consolidated. Custom groups are never copied or deleted.
INSERT INTO "organization_permission_group_permissions" ("permissionGroupId", "permissionId")
SELECT DISTINCT replacement."id", legacy_permission."permissionId"
FROM "organization_permission_groups" AS legacy_group
JOIN "organization_permission_group_permissions" AS legacy_permission
  ON legacy_permission."permissionGroupId" = legacy_group."id"
JOIN "organization_permission_groups" AS replacement
  ON replacement."organizationId" = legacy_group."organizationId"
 AND replacement."systemRole" = CASE
   WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_admins$'
     THEN 'ADMINISTRATORS'::"OrganizationSystemPermissionGroupRole"
   WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_users$'
     THEN 'MEMBERS'::"OrganizationSystemPermissionGroupRole"
   ELSE 'GUESTS'::"OrganizationSystemPermissionGroupRole"
 END
WHERE legacy_group."isSystem" = true
  AND legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_(admins|users|guest)$'
ON CONFLICT ("permissionGroupId", "permissionId") DO NOTHING;

-- Fill role defaults for organizations that did not have legacy groups.
INSERT INTO "organization_permission_group_permissions" ("permissionGroupId", "permissionId")
SELECT permission_group."id", permission."id"
FROM "organization_permission_groups" AS permission_group
JOIN "permissions" AS permission ON permission."isAssignable" = true
WHERE permission_group."systemRole" = 'ADMINISTRATORS'
ON CONFLICT ("permissionGroupId", "permissionId") DO NOTHING;

INSERT INTO "organization_permission_group_permissions" ("permissionGroupId", "permissionId")
SELECT permission_group."id", permission."id"
FROM "organization_permission_groups" AS permission_group
JOIN "permissions" AS permission
  ON permission."isAssignable" = true
 AND (
   permission."key" = 'organization.members.read'
   OR (permission."productKey" IS NOT NULL AND permission."action" IN ('read', 'create', 'update', 'transition'))
 )
WHERE permission_group."systemRole" = 'MEMBERS'
ON CONFLICT ("permissionGroupId", "permissionId") DO NOTHING;

INSERT INTO "organization_permission_group_permissions" ("permissionGroupId", "permissionId")
SELECT permission_group."id", permission."id"
FROM "organization_permission_groups" AS permission_group
JOIN "permissions" AS permission
  ON permission."isAssignable" = true
 AND permission."productKey" IS NOT NULL
 AND permission."action" = 'read'
WHERE permission_group."systemRole" = 'GUESTS'
ON CONFLICT ("permissionGroupId", "permissionId") DO NOTHING;

-- Select exactly one active assignment per active member. Owners and legacy
-- administrators win, followed by members, then guests; a custom assignment
-- remains selected when it is the user's only active assignment. Its scope is
-- retained. Legacy system assignments are redirected to the matching default.
CREATE TEMP TABLE "_selected_organization_permission_assignments" ON COMMIT DROP AS
SELECT DISTINCT ON (member."organizationId", member."userId")
  assignment."id",
  assignment."organizationId",
  assignment."userId",
  CASE
    WHEN member."isOwner" OR member_user."role" IN ('PLATFORM_ADMIN', 'ADMIN', 'ORG_ADMIN')
      THEN administrator_group."id"
    WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_admins$'
      THEN administrator_group."id"
    WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_users$'
      THEN member_group."id"
    WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_guest$'
      THEN guest_group."id"
    ELSE assignment."permissionGroupId"
  END AS "permissionGroupId"
FROM "organization_members" AS member
JOIN "users" AS member_user ON member_user."id" = member."userId"
JOIN "organization_permission_group_assignments" AS assignment
  ON assignment."organizationId" = member."organizationId"
 AND assignment."userId" = member."userId"
 AND assignment."revokedAt" IS NULL
JOIN "organization_permission_groups" AS legacy_group ON legacy_group."id" = assignment."permissionGroupId"
JOIN "organization_permission_groups" AS administrator_group
  ON administrator_group."organizationId" = member."organizationId"
 AND administrator_group."systemRole" = 'ADMINISTRATORS'
JOIN "organization_permission_groups" AS member_group
  ON member_group."organizationId" = member."organizationId"
 AND member_group."systemRole" = 'MEMBERS'
JOIN "organization_permission_groups" AS guest_group
  ON guest_group."organizationId" = member."organizationId"
 AND guest_group."systemRole" = 'GUESTS'
WHERE member."status" = 'ACTIVE'
  AND member."deletedAt" IS NULL
  AND member_user."deletedAt" IS NULL
ORDER BY member."organizationId", member."userId",
  CASE
    WHEN member."isOwner" OR member_user."role" IN ('PLATFORM_ADMIN', 'ADMIN', 'ORG_ADMIN')
      OR legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_admins$' THEN 3
    WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_users$' THEN 2
    WHEN legacy_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence|nexus)_guest$' THEN 1
    ELSE 0
  END DESC,
  assignment."createdAt" DESC,
  assignment."id" DESC;

UPDATE "organization_permission_group_assignments" AS assignment
SET "revokedAt" = CURRENT_TIMESTAMP
WHERE assignment."revokedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "_selected_organization_permission_assignments" AS selected
    WHERE selected."id" = assignment."id"
  );

UPDATE "organization_permission_group_assignments" AS assignment
SET "permissionGroupId" = selected."permissionGroupId"
FROM "_selected_organization_permission_assignments" AS selected
WHERE assignment."id" = selected."id";

-- Active members without a legacy assignment receive their deterministic
-- organization default. Inactive memberships are deliberately not assigned.
INSERT INTO "organization_permission_group_assignments" (
  "organizationId", "permissionGroupId", "userId", "scopeType"
)
SELECT member."organizationId",
  CASE
    WHEN member."isOwner" OR member_user."role" IN ('PLATFORM_ADMIN', 'ADMIN', 'ORG_ADMIN') THEN administrator_group."id"
    WHEN member_user."role" = 'GUEST' THEN guest_group."id"
    ELSE member_group."id"
  END,
  member."userId",
  'ORGANIZATION'::"OrganizationPermissionScope"
FROM "organization_members" AS member
JOIN "users" AS member_user ON member_user."id" = member."userId"
JOIN "organization_permission_groups" AS administrator_group
  ON administrator_group."organizationId" = member."organizationId"
 AND administrator_group."systemRole" = 'ADMINISTRATORS'
JOIN "organization_permission_groups" AS member_group
  ON member_group."organizationId" = member."organizationId"
 AND member_group."systemRole" = 'MEMBERS'
JOIN "organization_permission_groups" AS guest_group
  ON guest_group."organizationId" = member."organizationId"
 AND guest_group."systemRole" = 'GUESTS'
WHERE member."status" = 'ACTIVE'
  AND member."deletedAt" IS NULL
  AND member_user."deletedAt" IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM "organization_permission_group_assignments" AS assignment
    WHERE assignment."organizationId" = member."organizationId"
      AND assignment."userId" = member."userId"
      AND assignment."revokedAt" IS NULL
  );

CREATE UNIQUE INDEX "organization_permission_groups_organizationId_systemRole_active_key"
  ON "organization_permission_groups" ("organizationId", "systemRole")
  WHERE "systemRole" IS NOT NULL AND "deletedAt" IS NULL;

CREATE UNIQUE INDEX "organization_permission_group_assignments_one_active_per_member_key"
  ON "organization_permission_group_assignments" ("organizationId", "userId")
  WHERE "revokedAt" IS NULL;
