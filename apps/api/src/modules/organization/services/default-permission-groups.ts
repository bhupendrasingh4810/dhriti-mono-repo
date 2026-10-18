import type { Prisma } from "@prisma/client";

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
  if (groups.length === 0) return;

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