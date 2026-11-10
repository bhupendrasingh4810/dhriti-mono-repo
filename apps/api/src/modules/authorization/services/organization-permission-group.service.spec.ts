import { AppError } from "../../../common/errors/app-error";
import { OrganizationPermissionGroupService } from "./organization-permission-group.service";

describe("OrganizationPermissionGroupService", () => {
  function makeService() {
    const transaction = {
      organizationPermissionGroupAssignment: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({ id: "assignment-new" }),
      },
    };
    const prisma = {
      organizationPermissionGroup: {
        findFirst: jest.fn().mockResolvedValue({ id: "group-a", permissions: [] }),
      },
      permission: { findFirst: jest.fn() },
      organizationMember: { findFirst: jest.fn().mockResolvedValue({ id: "member-a" }) },
      $transaction: jest.fn(async (callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const entitlements = { hasFeature: jest.fn() };
    return {
      service: new OrganizationPermissionGroupService(
        prisma as never,
        { record: jest.fn() } as never,
        {} as never,
        entitlements as never,
      ),
      prisma,
      transaction,
      entitlements,
    };
  }

  it("rejects attaching a product permission when the organization lacks its entitlement", async () => {
    const { service, prisma, entitlements } = makeService();
    prisma.permission.findFirst.mockResolvedValue({ id: "permission-a", productKey: "flow" });
    entitlements.hasFeature.mockResolvedValue(false);

    await expect(service.attachPermission("org-a", "group-a", "permission-a", "actor-a")).rejects.toBeInstanceOf(AppError);
    expect(entitlements.hasFeature).toHaveBeenCalledWith("org-a", "flow.enabled");
  });

  it("replaces every active group assignment before assigning the selected group", async () => {
    const { service, transaction } = makeService();

    await expect(service.assign("org-a", "group-a", "user-a", "actor-a", {})).resolves.toEqual({ id: "assignment-new" });
    expect(transaction.organizationPermissionGroupAssignment.updateMany).toHaveBeenCalledWith({
      where: { organizationId: "org-a", userId: "user-a", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(transaction.organizationPermissionGroupAssignment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ organizationId: "org-a", permissionGroupId: "group-a", userId: "user-a" }),
    });
  });
});
