import { Reflector } from "@nestjs/core";
import { ACCESS_REQUIREMENTS_KEY } from "../../../common/decorators/access.decorator";
import { OrganizationAccessController } from "./organization-access.controller";

describe("Member entitlement visibility", () => {
  it("returns feature states only, including disabled ones, without billing permissions", async () => {
    const entitlements = { listEntitlements: jest.fn().mockResolvedValue([
      { key: "connect.enabled", kind: "FEATURE", enabled: false, value: null },
      { key: "flow.enabled", kind: "FEATURE", enabled: true, value: null },
      { key: "max_users", kind: "LIMIT", enabled: true, value: 100 },
    ]) };
    const controller = new OrganizationAccessController(
      {} as never, {} as never, {} as never, entitlements as never, {} as never,
    );
    await expect(controller.getMyEntitlements({ organizationId: "org-a" } as never)).resolves.toEqual([
      { key: "connect.enabled", enabled: false }, { key: "flow.enabled", enabled: true },
    ]);
    expect(entitlements.listEntitlements).toHaveBeenCalledWith("org-a");
    expect(new Reflector().get(ACCESS_REQUIREMENTS_KEY, OrganizationAccessController.prototype.getMyEntitlements)).toBeUndefined();
  });
});
