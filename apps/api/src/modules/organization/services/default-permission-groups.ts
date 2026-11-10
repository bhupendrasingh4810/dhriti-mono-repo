import { OrganizationSystemPermissionGroupRole, type Prisma } from "@prisma/client";

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
 * The system role is durable metadata; names are display-only and must never
 * be used to infer a group's authorization behavior.
 */
export async function assignDefaultPermissionGroupPermissions(
  transaction: Prisma.TransactionClient,
  organizationId: string,
): Promise<void> {
  const [groups, permissions] = await Promise.all([
    transaction.organizationPermissionGroup.findMany({
      where: { organizationId, isSystem: true, isActive: true, deletedAt: null },
      select: { id: true, systemRole: true },
    }),
    transaction.permission.findMany({ where: { isAssignable: true }, select: { id: true, key: true, productKey: true } }),
  ]);
  const permissionIdsByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));
  const assignments = groups.flatMap((group) => {
    if (!group.systemRole) {
      return [];
    }
    const productPermissions = permissions.filter((permission) => permission.productKey !== null);
    // Keep default groups least-privileged: only product admins receive destructive,
    // approval, and administration actions by default. Entitlement checks still
    // gate product endpoints even when a group contains the permission.
    const allowed = group.systemRole === OrganizationSystemPermissionGroupRole.ADMINISTRATORS
      ? [...productPermissions.map((permission) => permission.key), ...organizationAdministratorPermissions]
      : group.systemRole === OrganizationSystemPermissionGroupRole.MEMBERS
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
 * Assigns the Members default group, replacing any active organization group.
 * The database partial unique index makes this invariant durable; the ordered
 * updates make the operation repeatable during member activation.
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
      systemRole: OrganizationSystemPermissionGroupRole.MEMBERS,
    },
    select: { id: true },
  });
  const group = groups[0];
  if (!group) {return;}
  await transaction.organizationPermissionGroupAssignment.updateMany({
    where: { organizationId, userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await transaction.organizationPermissionGroupAssignment.create({
    data: {
      organizationId,
      permissionGroupId: group.id,
      userId,
      scopeType: "ORGANIZATION",
      assignedByUserId,
    },
  });
}