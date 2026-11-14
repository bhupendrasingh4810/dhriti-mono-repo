import { OrganizationAdminService } from "./organization.service";

function setup() {
  const prisma = {
    organizationMember: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: "member-a",
          userId: "user-a",
          status: "ACTIVE",
          isOwner: true,
          joinedAt: new Date("2026-11-14"),
          user: { name: "Jordan", email: "jordan@example.test", role: "EMPLOYEE" },
        },
      ]),
    },
    organizationTeamMember: { findMany: jest.fn().mockResolvedValue([]) },
  };
  return { prisma, service: new OrganizationAdminService(prisma as never, {} as never) };
}

describe("Organization member search", () => {
  it("scopes case-insensitive name/email search to the target organization and excludes deleted users", async () => {
    const { prisma, service } = setup();
    const result = await service.listMembers("org-b", " Jordan ");
    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org-b",
          deletedAt: null,
          user: {
            deletedAt: null,
            OR: [
              { name: { contains: "Jordan", mode: "insensitive" } },
              { email: { contains: "Jordan", mode: "insensitive" } },
            ],
          },
        },
      }),
    );
    expect(result[0]).toEqual(expect.objectContaining({ id: "member-a", name: "Jordan", role: "OWNER", teams: [] }));
    expect(prisma.organizationTeamMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: { in: ["user-a"] }, team: { organizationId: "org-b", deletedAt: null } },
      }),
    );
  });

  it("preserves unfiltered calls when search is absent or whitespace", async () => {
    const { prisma, service } = setup();
    await service.listMembers("org-b");
    await service.listMembers("org-b", "  ");
    expect(prisma.organizationMember.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org-b", deletedAt: null, user: { deletedAt: null } },
      }),
    );
  });
});
