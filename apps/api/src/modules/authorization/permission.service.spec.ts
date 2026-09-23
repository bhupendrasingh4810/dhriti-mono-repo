import { PermissionService } from "./permission.service";

function makePrisma() {
  return {
    organizationMember: { findFirst: jest.fn() },
    platformUserRoleAssignment: { findFirst: jest.fn(), findMany: jest.fn() },
    organizationPermissionGroupAssignment: { findMany: jest.fn() },
  };
}

describe("PermissionService", () => {
  it("denies a user without an active organization membership", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue(null);
    const service = new PermissionService(prisma as never);

    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "flow.project.read" })).resolves.toBe(false);
    expect(prisma.organizationPermissionGroupAssignment.findMany).not.toHaveBeenCalled();
  });

  it("allows an active platform role permission after confirming tenant membership", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.platformUserRoleAssignment.findFirst.mockResolvedValue({ userId: "user-a" });
    const service = new PermissionService(prisma as never);

    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "organization.members.invite" })).resolves.toBe(true);
    expect(prisma.platformUserRoleAssignment.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ userId: "user-a", revokedAt: null }) }));
    expect(prisma.organizationPermissionGroupAssignment.findMany).not.toHaveBeenCalled();
  });

  it("lists unique permissions from both platform and organization assignments", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.platformUserRoleAssignment.findMany.mockResolvedValue([{ platformRole: { permissions: [{ permission: { key: "billing.subscription.read" } }] } }]);
    prisma.organizationPermissionGroupAssignment.findMany.mockResolvedValue([{ permissionGroup: { permissions: [{ permission: { key: "organization.members.invite" } }, { permission: { key: "billing.subscription.read" } }] } }]);
    const service = new PermissionService(prisma as never);

    await expect(service.getUserPermissions("user-a", "org-a")).resolves.toEqual(["billing.subscription.read", "organization.members.invite"]);
  });

  it("ignores revoked assignments and allows an active organization-scoped assignment", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.organizationPermissionGroupAssignment.findMany.mockResolvedValue([{ scopeType: "ORGANIZATION", departmentId: null, teamId: null, flowProjectId: null }]);
    const service = new PermissionService(prisma as never);

    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "flow.project.read" })).resolves.toBe(true);
    expect(prisma.organizationPermissionGroupAssignment.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ organizationId: "org-a", revokedAt: null }) }));
  });

  it("enforces a Flow-project assignment scope", async () => {
    const prisma = makePrisma();
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "member-a" });
    prisma.organizationPermissionGroupAssignment.findMany.mockResolvedValue([{ scopeType: "FLOW_PROJECT", departmentId: null, teamId: null, flowProjectId: "project-a" }]);
    const service = new PermissionService(prisma as never);

    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "flow.issue.read", resource: { type: "FLOW_PROJECT", flowProjectId: "project-a" } })).resolves.toBe(true);
    await expect(service.hasPermission({ userId: "user-a", organizationId: "org-a", permissionKey: "flow.issue.read", resource: { type: "FLOW_PROJECT", flowProjectId: "project-b" } })).resolves.toBe(false);
  });
});