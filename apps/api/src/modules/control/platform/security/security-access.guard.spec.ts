import { ForbiddenException } from "@nestjs/common";
import { SecurityAccessGuard } from "./security-access.guard";
import { IpBlockGuard } from "./ip-block.guard";

const context = (request: unknown) => ({
  getType: () => "http",
  switchToHttp: () => ({ getRequest: () => request }),
});
describe("Security Center request guards", () => {
  it.each([
    { isPlatformUser: false, role: "PLATFORM_ADMIN" },
    { isPlatformUser: true, role: "EMPLOYEE" },
    { isPlatformUser: true, role: "EMPLOYEE", auth: { platformRole: "SUPPORT" } },
    { isPlatformUser: true, role: "PLATFORM_ADMIN", status: "SUSPENDED" },
    { isPlatformUser: true, role: "PLATFORM_ADMIN", deletedAt: new Date() },
  ])("rejects unauthorized staff %#", async (record) => {
    const prisma = {
      user: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ status: "ACTIVE", deletedAt: null, platformRoleAssignments: [], ...record }),
      },
    };
    await expect(
      new SecurityAccessGuard(prisma as never).canActivate(context({ user: { userId: "user" } }) as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it.each([
    { role: "PLATFORM_ADMIN" },
    { auth: { platformRole: "SECURITY" } },
    { platformRoleAssignments: [{ userId: "user" }] },
  ])("allows an authorized security operator %#", async (record) => {
    const prisma = {
      user: {
        findUnique: jest.fn().mockResolvedValue({
          isPlatformUser: true,
          status: "ACTIVE",
          deletedAt: null,
          role: "EMPLOYEE",
          platformRoleAssignments: [],
          ...record,
        }),
      },
    };
    await expect(
      new SecurityAccessGuard(prisma as never).canActivate(context({ user: { userId: "user" } }) as never),
    ).resolves.toBe(true);
  });

  it("denies public and authenticated HTTP routes from a blocked IP, ignoring spoofed forwarded headers", async () => {
    const prisma = { blockedIp: { findUnique: jest.fn().mockResolvedValue({ ipAddress: "192.0.2.1" }) } };
    const guard = new IpBlockGuard(prisma as never);
    await expect(
      guard.canActivate(context({ ip: "::ffff:192.0.2.1", headers: { "x-forwarded-for": "192.0.2.9" } }) as never),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.blockedIp.findUnique).toHaveBeenCalledWith({ where: { ipAddress: "192.0.2.1" } });
    prisma.blockedIp.findUnique.mockResolvedValue(null);
    await expect(guard.canActivate(context({ ip: "192.0.2.1" }) as never)).resolves.toBe(true);
  });
});
