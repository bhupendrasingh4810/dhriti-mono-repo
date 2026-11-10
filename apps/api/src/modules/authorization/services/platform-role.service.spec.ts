import { AppError } from "../../../common/errors/app-error";
import { PlatformRoleService } from "./platform-role.service";

describe("PlatformRoleService", () => {
  function makeService() {
    const prisma = {
      permission: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
    };
    const audit = { record: jest.fn() };
    return {
      service: new PlatformRoleService(prisma as never, audit as never),
      prisma,
      audit,
    };
  }

  it("rejects deletion while a permission remains attached to a role or group", async () => {
    const { service, prisma } = makeService();
    prisma.permission.findUnique.mockResolvedValue({
      id: "permission-a",
      _count: { platformRolePermissions: 1, organizationGroupPermissions: 0 },
    });

    await expect(service.deletePermission("permission-a", "actor-a")).rejects.toBeInstanceOf(AppError);
    expect(prisma.permission.delete).not.toHaveBeenCalled();
  });

  it("deletes an unassigned permission and records the audit event", async () => {
    const { service, prisma, audit } = makeService();
    prisma.permission.findUnique.mockResolvedValue({
      id: "permission-a",
      _count: { platformRolePermissions: 0, organizationGroupPermissions: 0 },
    });

    await expect(service.deletePermission("permission-a", "actor-a")).resolves.toBeUndefined();
    expect(prisma.permission.delete).toHaveBeenCalledWith({ where: { id: "permission-a" } });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "iam.permission.deleted", resourceId: "permission-a" }),
    );
  });
});
