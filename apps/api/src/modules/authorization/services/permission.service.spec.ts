import { PermissionService } from "./permission.service";

function makePrisma() {
  return {
    user: { findFirst: jest.fn().mockResolvedValue(null) },
    permission: { findMany: jest.fn() },
    organizationMember: { findFirst: jest.fn() },
    platformUserRoleAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
    organizationPermissionGroupAssignment: { findMany: jest.fn() },
  };
}

describe("PermissionService", () => {
  it("returns the full permission catalog for an active platform administrator", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.user.findFirst.mockResolvedValue({ role: "PLATFORM_ADMIN" });
    prisma.permission.findMany.mockResolvedValue([{ key: "connect.channel.read" }, { key: "flow.project.read" }]);
    const service = new PermissionService(prisma as never);
    await expect(service.getUserPermissions("user-a", "org-a")).resolves.toEqual(["connect.channel.read", "flow.project.read"]);
  });

  it("does not grant administrator access to a missing or inactive user", async () => {
    const prisma = makePrisma();
    const service = new PermissionService(prisma as never);
    await expect(service.isPlatformAdministrator("user-a")).resolves.toBe(false);
    expect(prisma.platformUserRoleAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("does not grant administrator access without an active platform_admin assignment", async () => {
    const prisma = makePrisma();
    prisma.user.findFirst.mockResolvedValue({ role: "EMPLOYEE" });
    prisma.platformUserRoleAssignment.findFirst.mockResolvedValue(null);
    const service = new PermissionService(prisma as never);
    await expect(service.isPlatformAdministrator("user-a")).resolves.toBe(false);
  });

  it("does not bypass tenant membership for platform administrators", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    prisma.user.findFirst.mockResolvedValue({ role: "PLATFORM_ADMIN" });
    const service = new PermissionService(prisma as never);
    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "connect.channel.read" })).resolves.toBe(false);
    expect(prisma.user.findFirst).not.toHaveBeenCalled();
  });

  it("allows an active platform administrator after confirming tenant membership", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.user.findFirst.mockResolvedValue({ role: "PLATFORM_ADMIN" });
    const service = new PermissionService(prisma as never);
    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "connect.channel.read" })).resolves.toBe(true);
    expect(prisma.organizationPermissionGroupAssignment.findMany).not.toHaveBeenCalled();
  });

  it("recognizes a non-revoked platform_admin role assignment", async () => {
    const prisma = makePrisma();
    prisma.user.findFirst.mockResolvedValue({ role: "EMPLOYEE" });
    prisma.platformUserRoleAssignment.findFirst.mockResolvedValue({ userId: "user-a" });
    const service = new PermissionService(prisma as never);
    await expect(service.isPlatformAdministrator("user-a")).resolves.toBe(true);
    expect(prisma.platformUserRoleAssignment.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-a", revokedAt: null, platformRole: { key: "platform_admin" } },
      select: { userId: true },
    });
  });

  it("denies a user without an active organization membership", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    const service = new PermissionService(prisma as never);

    await expect(
      service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "flow.project.read" }),
    ).resolves.toBe(false);
    expect(prisma.organizationPermissionGroupAssignment.findMany).not.toHaveBeenCalled();
  });

  it("allows an active platform role permission after confirming tenant membership", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.platformUserRoleAssignment.findFirst.mockResolvedValue({ userId: "user-a" });
    const service = new PermissionService(prisma as never);

    await expect(
      service.hasPermission({
        userId: "user-a",
        organizationId: "org-a",
        permissionKey: "organization.members.invite",
      }),
    ).resolves.toBe(true);
    expect(prisma.platformUserRoleAssignment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: "user-a", revokedAt: null }) }),
    );
    expect(prisma.organizationPermissionGroupAssignment.findMany).not.toHaveBeenCalled();
  });

  it("lists unique permissions from both platform and organization assignments", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.platformUserRoleAssignment.findMany.mockResolvedValue([
      { platformRole: { permissions: [{ permission: { key: "billing.subscription.read" } }] } },
    ]);
    prisma.organizationPermissionGroupAssignment.findMany.mockResolvedValue([
      {
        permissionGroup: {
          permissions: [
            { permission: { key: "organization.members.invite" } },
            { permission: { key: "billing.subscription.read" } },
          ],
        },
      },
    ]);
    const service = new PermissionService(prisma as never);

    await expect(service.getUserPermissions("user-a", "org-a")).resolves.toEqual([
      "billing.subscription.read",
      "organization.members.invite",
    ]);
  });

  it("ignores revoked assignments and allows an active organization-scoped assignment", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.organizationPermissionGroupAssignment.findMany.mockResolvedValue([
      { scopeType: "ORGANIZATION", departmentId: null, teamId: null, flowProjectId: null },
    ]);
    const service = new PermissionService(prisma as never);

    await expect(
      service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "flow.project.read" }),
    ).resolves.toBe(true);
    expect(prisma.organizationPermissionGroupAssignment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a", revokedAt: null }) }),
    );
  });

  it("enforces a Flow-project assignment scope", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.organizationPermissionGroupAssignment.findMany.mockResolvedValue([
      { scopeType: "FLOW_PROJECT", departmentId: null, teamId: null, flowProjectId: "project-a" },
    ]);
    const service = new PermissionService(prisma as never);

    await expect(
      service.hasPermission({
        userId: "user-a",
        organizationId: "org-a",
        permissionKey: "flow.issue.read",
        resource: { type: "FLOW_PROJECT", flowProjectId: "project-a" },
      }),
    ).resolves.toBe(true);
    await expect(
      service.hasPermission({
        userId: "user-a",
        organizationId: "org-a",
        permissionKey: "flow.issue.read",
        resource: { type: "FLOW_PROJECT", flowProjectId: "project-b" },
      }),
    ).resolves.toBe(false);
  });
});
