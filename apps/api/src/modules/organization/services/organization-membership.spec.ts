import { ErrorCode } from "../../../common/errors/error-codes";
import { assertUserHasNoOtherActiveOrganizationMembership } from "./organization-membership";

describe("assertUserHasNoOtherActiveOrganizationMembership", () => {
  const currentOrganizationId = "11111111-1111-4111-8111-111111111111";

  it("allows a user with no other active organization membership", async () => {
    const client = { organizationMember: { findFirst: jest.fn().mockResolvedValue(null) } };

    await expect(
      assertUserHasNoOtherActiveOrganizationMembership(client as never, "user-a", currentOrganizationId),
    ).resolves.toBeUndefined();
  });

  it("rejects activation when the user belongs to another organization", async () => {
    const client = {
      organizationMember: {
        findFirst: jest.fn().mockResolvedValue({ organizationId: "22222222-2222-4222-8222-222222222222" }),
      },
    };

    await expect(
      assertUserHasNoOtherActiveOrganizationMembership(client as never, "user-a", currentOrganizationId),
    ).rejects.toMatchObject({
      code: ErrorCode.USER_ALREADY_BELONGS_TO_ORGANIZATION,
    });
    expect(client.organizationMember.findFirst).toHaveBeenCalledWith({
      where: {
        userId: "user-a",
        organizationId: { not: currentOrganizationId },
        deletedAt: null,
        status: { in: ["INVITED", "ACTIVE", "SUSPENDED"] },
        organization: { deletedAt: null },
      },
      select: { organizationId: true },
    });
  });
});
