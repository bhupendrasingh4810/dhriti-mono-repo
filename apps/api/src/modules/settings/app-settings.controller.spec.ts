import { AppSettingsController } from "./app-settings.controller";

describe("AppSettingsController capabilities", () => {
  it.each([true, false])(
    "returns the permission service's decision (%s), not a hardcoded role check",
    async (allowed) => {
      const permissions = { hasPermission: jest.fn().mockResolvedValue(allowed) };
      const controller = new AppSettingsController({} as never, {} as never, permissions as never);
      await expect(
        controller.access({ userId: "user-1" } as never, { organizationId: "org-1" } as never),
      ).resolves.toEqual({ canManage: allowed });
      expect(permissions.hasPermission).toHaveBeenCalledWith({
        userId: "user-1",
        organizationId: "org-1",
        permissionKey: "organization.settings.manage",
      });
    },
  );
});
