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
      user: { findFirst: jest.fn().mockResolvedValue(null) },
      organization: { findFirst: jest.fn().mockResolvedValue({ id: organizationId }) },
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate(context() as never)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("allows an active platform administrator without organization membership", async () => {
    const prisma = {
      organizationMember: { findFirst: jest.fn().mockResolvedValue(null) },
      userSession: { findFirst: jest.fn().mockResolvedValue({ organizationId }) },
      user: { findFirst: jest.fn().mockResolvedValue({ role: "PLATFORM_ADMIN" }) },
      organization: { findFirst: jest.fn().mockResolvedValue({ id: organizationId }) },
    };
    const request: {
      user: { userId: string; organizationId: string; sessionId: string };
      headers: Record<string, string>;
      organization?: { organizationId: string; memberId: string | null; role: string };
    } = {
      user: { userId: "user-a", organizationId, sessionId: "session-a" },
      headers: {},
    };
    const guard = new TenantGuard(prisma as never);

    await expect(guard.canActivate({ switchToHttp: () => ({ getRequest: () => request }) } as never)).resolves.toBe(true);
    expect(request.organization).toEqual({ organizationId, memberId: null, role: "PLATFORM_ADMIN" });
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
});
