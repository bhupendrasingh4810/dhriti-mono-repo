import { AppError } from "../../../common/errors/app-error";
import { OrganizationService } from "./organization.service";

describe("OrganizationService membership lifecycle", () => {
  const activeOwner = {
    id: "owner-a",
    organizationId: "org-a",
    userId: "user-a",
    isOwner: true,
    status: "ACTIVE",
    deletedAt: null,
  };

  function serviceWith(transaction: Record<string, unknown>) {
    const prisma = {
      organizationMember: { findFirst: jest.fn().mockResolvedValue(activeOwner) },
      $transaction: jest.fn(async (callback: (client: Record<string, unknown>) => Promise<unknown>) =>
        callback(transaction),
      ),
    };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const entitlements = {};
    return { service: new OrganizationService(prisma as never, audit as never, entitlements as never), audit };
  }

  it("prevents removal of the last active owner", async () => {
    const transaction = {
      organizationMember: { count: jest.fn().mockResolvedValue(1), update: jest.fn() },
      teamMember: { deleteMany: jest.fn() },
      groupMember: { deleteMany: jest.fn() },
    };
    const { service, audit } = serviceWith(transaction);

    await expect(service.removeMember("org-a", "owner-a", "actor-a")).rejects.toBeInstanceOf(AppError);
    expect(transaction.organizationMember.update).not.toHaveBeenCalled();
    expect(audit.record).not.toHaveBeenCalled();
  });

  it("transfers ownership between active members before the former owner is removed", async () => {
    const transaction = {
      organizationMember: {
        findFirst: jest.fn().mockResolvedValueOnce({ id: "owner-a" }).mockResolvedValueOnce({ id: "owner-b" }),
        update: jest.fn().mockResolvedValue({}),
      },
    };
    const { service, audit } = serviceWith(transaction);

    await expect(service.transferOwnership("org-a", "owner-a", "owner-b", "actor-a")).resolves.toBeUndefined();
    expect(transaction.organizationMember.update).toHaveBeenNthCalledWith(1, {
      where: { id: "owner-b" },
      data: { isOwner: true },
    });
    expect(transaction.organizationMember.update).toHaveBeenNthCalledWith(2, {
      where: { id: "owner-a" },
      data: { isOwner: false },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "iam.member.ownership_transferred", organizationId: "org-a" }),
    );
  });

  it("creates app permission groups and grants the creator admin access", async () => {
    const organization = { id: "org-new", name: "Northwind" };
    const apps = ["connect", "flow", "hrms", "pulse", "atlas", "cadence"];
    const expectedGroupNames = apps.flatMap((app) => [
      `Northwind_${app}_admins`,
      `Northwind_${app}_users`,
      `Northwind_${app}_guest`,
    ]);
    const adminGroups = apps.map((app, index) => ({ id: `admin-group-${index}`, name: `Northwind_${app}_admins` }));
    const transaction = {
      organization: { create: jest.fn().mockResolvedValue(organization) },
      organizationMember: { findFirst: jest.fn().mockResolvedValue(null) },
      onBoardingProfile: { upsert: jest.fn().mockResolvedValue({}) },
      permission: { findUnique: jest.fn().mockResolvedValue({ id: "manage-permission" }) },
      organizationPermissionGroup: {
        createMany: jest.fn().mockResolvedValue({ count: 18 }),
        findMany: jest.fn().mockResolvedValue(adminGroups),
      },
      organizationPermissionGroupPermission: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
      organizationPermissionGroupAssignment: { createMany: jest.fn().mockResolvedValue({ count: 6 }) },
    };
    const prisma = {
      organization: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn(async (callback: (client: typeof transaction) => Promise<unknown>) =>
        callback(transaction),
      ),
    };
    const service = new OrganizationService(prisma as never, {} as never, {} as never);

    await expect(service.createOrganization("owner-1", { name: " Northwind ", slug: "northwind" })).resolves.toEqual(
      organization,
    );

    const createdGroups = transaction.organizationPermissionGroup.createMany.mock.calls[0][0].data as Array<{
      name: string;
      isSystem: boolean;
    }>;
    expect(createdGroups.map(({ name }) => name)).toEqual(expectedGroupNames);
    expect(createdGroups.every(({ isSystem }) => isSystem)).toBe(true);
    expect(transaction.organizationPermissionGroupPermission.createMany).toHaveBeenCalledWith({
      data: adminGroups.map(({ id }) => ({ permissionGroupId: id, permissionId: "manage-permission" })),
    });
    expect(transaction.organizationPermissionGroupAssignment.createMany).toHaveBeenCalledWith({
      data: adminGroups.map(({ id }) => ({
        organizationId: organization.id,
        permissionGroupId: id,
        userId: "owner-1",
        scopeType: "ORGANIZATION",
        assignedByUserId: "owner-1",
      })),
    });
  });
});
