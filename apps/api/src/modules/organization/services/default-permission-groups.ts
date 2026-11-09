import type { Prisma } from "@prisma/client";

/**
 * Organization-level capabilities required by every product administrator.
 *
 * These are deliberately separate from product-scoped permissions so each
 * product admin can manage organization membership, settings, and billing.
 */
const organizationAdministratorPermissions = [
  "organization.members.read",
  "organization.members.invite",
  "organization.members.remove",
  "organization.permissions.manage",
  "organization.settings.manage",
  "billing.subscription.read",
  "billing.subscription.manage",
];

/**
 * Seeds permissions for system groups created with a new organization.
 *
 * Group names follow `<organization>_<product>_<role>`. Product administrators
 * receive every assignable product permission and the organization management
 * permissions required to administer that product. Users receive standard work
 * actions, while guests remain read-only. This only seeds newly created
 * organizations; existing organizations require an explicit backfill.
 */
export async function assignDefaultPermissionGroupPermissions(
  transaction: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  const [groups, permissions] = await Promise.all([
    transaction.organizationPermissionGroup.findMany({
      where: { organizationId, isSystem: true, isActive: true, deletedAt: null },
      select: { id: true, name: true },
    }),
    transaction.permission.findMany({ where: { isAssignable: true }, select: { id: true, key: true } }),
  ]);
  const permissionIdsByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));
  const assignments = groups.flatMap((group) => {
    const match = group.name.match(/_(connect|flow|hrms|pulse|atlas|cadence)_(admins|users|guest)$/);
    if (!match) {
      return [];
    }
    const [, product, groupType] = match;
    const productPermissions = permissions.filter((permission) => permission.key.startsWith(`${product}.`));
    // Keep default groups least-privileged: only product admins receive destructive,
    // approval, and administration actions by default.
    const allowed = groupType === "admins"
      ? [...productPermissions.map((permission) => permission.key), ...organizationAdministratorPermissions]
      : groupType === "users"
        ? productPermissions
          .filter((permission) => ["read", "create", "update", "transition"].includes(permission.key.split(".").at(-1) ?? ""))
          .map((permission) => permission.key)
        : productPermissions.filter((permission) => permission.key.endsWith(".read")).map((permission) => permission.key);
    return allowed.flatMap((key) => {
      const permissionId = permissionIdsByKey.get(key);
      return permissionId ? [{ permissionGroupId: group.id, permissionId }] : [];
    });
  });
  if (assignments.length > 0) {
    await transaction.organizationPermissionGroupPermission.createMany({ data: assignments, skipDuplicates: true });
  }
}

/**
 * Grants a newly created user every active system `<product>_users` group.
 *
 * Existing active memberships are preserved, revoked memberships are restored,
 * and only groups without an assignment are inserted. The operation is safe to
 * repeat within the organization-creation transaction.
 */
export async function assignDefaultUserPermissionGroups(
  transaction: Prisma.TransactionClient,
  organizationId: string,
  userId: string,
  assignedByUserId: string,
): Promise<void> {
  const groups = await transaction.organizationPermissionGroup.findMany({
    where: {
      organizationId,
      isSystem: true,
      isActive: true,
      deletedAt: null,
      name: { endsWith: "_users" },
    },
    select: { id: true },
  });
  if (groups.length === 0) {return;}

  const assignmentWhere = {
    organizationId,
    userId,
    permissionGroupId: { in: groups.map(({ id }) => id) },
    scopeType: "ORGANIZATION" as const,
  };
  const existing = await transaction.organizationPermissionGroupAssignment.findMany({
    where: assignmentWhere,
    select: { permissionGroupId: true },
  });
  await transaction.organizationPermissionGroupAssignment.updateMany({
    where: { ...assignmentWhere, revokedAt: { not: null } },
    data: { revokedAt: null, assignedByUserId },
  });
  const existingGroupIds = new Set(existing.map(({ permissionGroupId }) => permissionGroupId));
  const missingGroups = groups.filter(({ id }) => !existingGroupIds.has(id));
  if (missingGroups.length > 0) {
    await transaction.organizationPermissionGroupAssignment.createMany({
      data: missingGroups.map(({ id }) => ({
        organizationId,
        permissionGroupId: id,
        userId,
        scopeType: "ORGANIZATION",
        assignedByUserId,
      })),
    });
  }
}