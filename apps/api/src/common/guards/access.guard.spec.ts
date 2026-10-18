import { ACCESS_REQUIREMENTS_KEY } from "../decorators/access.decorator";
import { AccessGuard } from "./access.guard";

function makeContext() {
  return {
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({
        user: { userId: "user-a" },
        organization: { organizationId: "org-a" },
        params: {},
      }),
    }),
  };
}

describe("AccessGuard", () => {
  const requirements = { entitlement: "hrms.enabled", permission: "hrms.employee.read" };

  function makeGuard() {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(requirements) };
    const entitlement = { assertFeatureEnabled: jest.fn() };
    const permissions = { assertPermission: jest.fn(), hasUnrestrictedPlatformAccess: jest.fn().mockResolvedValue(false) };
    const prisma = { issue: { findFirst: jest.fn() }, board: { findFirst: jest.fn() } };
    return {
      guard: new AccessGuard(reflector as never, entitlement as never, permissions as never, prisma as never),
      reflector,
      entitlement,
      permissions,
    };
  }

  it("allows an unrestricted platform user without requiring organization entitlements or explicit permissions", async () => {
    const { guard, entitlement, permissions } = makeGuard();
    permissions.hasUnrestrictedPlatformAccess.mockResolvedValue(true);
    await expect(guard.canActivate(makeContext() as never)).resolves.toBe(true);
    expect(permissions.hasUnrestrictedPlatformAccess).toHaveBeenCalledWith("user-a", "org-a");
    expect(entitlement.assertFeatureEnabled).not.toHaveBeenCalled();
    expect(permissions.assertPermission).not.toHaveBeenCalled();
  });

  it("rejects a disabled entitlement before evaluating permissions", async () => {
    const { guard, entitlement, permissions } = makeGuard();
    const denied = new Error("Feature is not entitled");
    entitlement.assertFeatureEnabled.mockRejectedValue(denied);

    await expect(guard.canActivate(makeContext() as never)).rejects.toThrow(denied);
    expect(entitlement.assertFeatureEnabled).toHaveBeenCalledWith("org-a", "hrms.enabled");
    expect(permissions.assertPermission).not.toHaveBeenCalled();
  });

  it("rejects when the user lacks the required organization permission", async () => {
    const { guard, entitlement, permissions } = makeGuard();
    const denied = new Error("Permission denied");
    permissions.assertPermission.mockRejectedValue(denied);

    await expect(guard.canActivate(makeContext() as never)).rejects.toThrow(denied);
    expect(entitlement.assertFeatureEnabled).toHaveBeenCalledWith("org-a", "hrms.enabled");
    expect(permissions.assertPermission).toHaveBeenCalledWith({
      userId: "user-a",
      organizationId: "org-a",
      permissionKey: "hrms.employee.read",
      resource: undefined,
    });
  });

  it("allows a request once entitlement and permission checks pass", async () => {
    const { guard, reflector, entitlement, permissions } = makeGuard();

    await expect(guard.canActivate(makeContext() as never)).resolves.toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ACCESS_REQUIREMENTS_KEY, expect.any(Array));
    expect(entitlement.assertFeatureEnabled).toHaveBeenCalledWith("org-a", "hrms.enabled");
    expect(permissions.assertPermission).toHaveBeenCalledWith({
      userId: "user-a",
      organizationId: "org-a",
      permissionKey: "hrms.employee.read",
      resource: undefined,
    });
  });
});
