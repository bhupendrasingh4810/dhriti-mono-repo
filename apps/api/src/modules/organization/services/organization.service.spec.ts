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
});
