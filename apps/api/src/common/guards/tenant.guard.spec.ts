import { ForbiddenException } from "@nestjs/common";

import { TenantGuard } from "./tenant.guard";

const organizationId = "11111111-1111-4111-8111-111111111111";

function context(activeOrganizationId: string | null = organizationId) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId: "user-a", organizationId: activeOrganizationId, sessionId: "session-a" },
        headers: {},
      }),
    }),
  };
}

describe("TenantGuard", () => {
  it("creates context only for an active membership", async () => {
    const prisma = {
      organizationMember: {
        findFirst: jest
          .fn()
          .mockResolvedValue({ id: "member-a", user: { role: "EMPLOYEE" }, organization: { deletedAt: null } }),
      },
      userSession: { findFirst: jest.fn().mockResolvedValue({ organizationId }) },
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate(context() as never)).resolves.toBe(true);
    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ status: "ACTIVE" }) }),
    );
  });

  it("denies a suspended or removed membership", async () => {
    const prisma = {
      organizationMember: { findFirst: jest.fn().mockResolvedValue(null) },
      userSession: { findFirst: jest.fn().mockResolvedValue({ organizationId }) },
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate(context() as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("does not allow a platform administrator without organization membership", async () => {
    const prisma = {
      organizationMember: { findFirst: jest.fn().mockResolvedValue(null) },
      userSession: { findFirst: jest.fn().mockResolvedValue({ organizationId }) },
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate(context() as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("rejects an invalid organization identifier before querying membership", async () => {
    const prisma = {
      organizationMember: { findFirst: jest.fn() },
      userSession: { findFirst: jest.fn().mockResolvedValue({ organizationId: "not-a-uuid" }) },
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate(context(null) as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.organizationMember.findFirst).not.toHaveBeenCalled();
  });

  it("rejects an organization header that differs from the authenticated session", async () => {
    const prisma = {
      organizationMember: { findFirst: jest.fn() },
      userSession: { findFirst: jest.fn().mockResolvedValue({ organizationId }) },
    };
    const request = {
      user: { userId: "user-a", organizationId, sessionId: "session-a" },
      headers: { "x-organization-id": "22222222-2222-4222-8222-222222222222" },
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) } as never)).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.organizationMember.findFirst).not.toHaveBeenCalled();
  });
});
