import { PermissionService } from "./permission.service";

function setup() {
  const prisma = {
    organizationMember: { findFirst: jest.fn().mockResolvedValue({ isOwner: false }) },
    organizationPermissionGroupAssignment: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  return { prisma, service: new PermissionService(prisma as never) };
}

describe("Organization Control visibility", () => {
  it("allows an active owner without an administrator assignment", async () => {
    const { prisma, service } = setup();
    prisma.organizationMember.findFirst.mockResolvedValue({ isOwner: true });
    await expect(service.isOrganizationAdministrator("user-a", "org-a")).resolves.toBe(true);
    expect(prisma.organizationPermissionGroupAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("requires an active, unrevoked, organization-wide system administrator assignment", async () => {
    const { prisma, service } = setup();
    prisma.organizationPermissionGroupAssignment.findFirst.mockResolvedValue({ userId: "user-a" });
    await expect(service.isOrganizationAdministrator("user-a", "org-a")).resolves.toBe(true);
    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-a", organizationId: "org-a", status: "ACTIVE", deletedAt: null },
      select: { isOwner: true },
    });
    expect(prisma.organizationPermissionGroupAssignment.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org-a", userId: "user-a", revokedAt: null, scopeType: "ORGANIZATION",
        permissionGroup: {
          organizationId: "org-a", isSystem: true, systemRole: "ADMINISTRATORS", isActive: true, deletedAt: null,
        },
      },
      select: { userId: true },
    });
  });

  it("rejects ordinary members and inactive or missing memberships", async () => {
    const { prisma, service } = setup();
    await expect(service.isOrganizationAdministrator("user-a", "org-a")).resolves.toBe(false);
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    prisma.organizationPermissionGroupAssignment.findFirst.mockClear();
    await expect(service.isOrganizationAdministrator("user-a", "org-a")).resolves.toBe(false);
    expect(prisma.organizationPermissionGroupAssignment.findFirst).not.toHaveBeenCalled();
  });
});
