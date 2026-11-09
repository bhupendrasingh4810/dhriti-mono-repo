-- Align existing product administrator groups with the organization-level
-- capabilities granted to product administrators created after this migration.
INSERT INTO "organization_permission_group_permissions" ("permissionGroupId", "permissionId")
SELECT permission_group."id", permission."id"
FROM "organization_permission_groups" AS permission_group
CROSS JOIN "permissions" AS permission
WHERE permission_group."isSystem" = true
  AND permission_group."isActive" = true
  AND permission_group."deletedAt" IS NULL
  AND permission_group."name" ~ '_(connect|flow|hrms|pulse|atlas|cadence)_admins$'
  AND permission."key" IN (
    'organization.members.read',
    'organization.members.invite',
    'organization.members.remove',
    'organization.permissions.manage',
    'organization.settings.manage',
    'billing.subscription.read',
    'billing.subscription.manage'
  )
ON CONFLICT ("permissionGroupId", "permissionId") DO NOTHING;
