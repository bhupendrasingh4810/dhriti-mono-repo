import { PlatformRolesGuard } from "./platform-roles.guard";

function makeContext() {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({ getRequest: () => ({ user: { userId: "user-a" } }) }),
  };
}

describe("PlatformRolesGuard", () => {
  function makeGuard() {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(["PLATFORM_ADMIN"]) };
    const prisma = {
      userAuth: { findUnique: jest.fn() },
      platformUserRoleAssignment: { findFirst: jest.fn() },
    };
    return { guard: new PlatformRolesGuard(reflector as never, prisma as never), prisma };
  }

  it("allows a flagged platform employee access to platform endpoints", async () => {
    const { guard, prisma } = makeGuard();
    prisma.userAuth.findUnique.mockResolvedValue({ user: { role: "EMPLOYEE", isPlatformUser: true } });

    await expect(guard.canActivate(makeContext() as never)).resolves.toBe(true);
    expect(prisma.platformUserRoleAssignment.findFirst).not.toHaveBeenCalled();
  });

  it("denies a user without the platform-user flag before checking assignments", async () => {
    const { guard, prisma } = makeGuard();
    prisma.userAuth.findUnique.mockResolvedValue({ user: { role: "EMPLOYEE", isPlatformUser: false } });

    await expect(guard.canActivate(makeContext() as never)).rejects.toThrow("Platform staff access required");
    expect(prisma.platformUserRoleAssignment.findFirst).not.toHaveBeenCalled();
  });
});