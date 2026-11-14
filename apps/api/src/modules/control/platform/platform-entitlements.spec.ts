import { validate } from "class-validator";
import { Reflector } from "@nestjs/core";
import { PLATFORM_ROLES_KEY } from "../../../common/decorators/platform-roles.decorator";
import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { UpdateOrganizationEntitlementDto } from "./dto/platform.dto";

const feature = { id: "feature-a", key: "hrms.enabled", name: "HRMS", kind: "FEATURE" };
const limit = { id: "limit-a", key: "max_users", name: "Maximum users", kind: "LIMIT" };

function setup() {
  const prisma = {
    organization: { findFirst: jest.fn().mockResolvedValue({ id: "org-a" }) },
    entitlement: {
      findMany: jest.fn().mockResolvedValue([feature, limit]),
      findUnique: jest.fn().mockResolvedValue(feature),
    },
  };
  const entitlements = {
    getEntitlement: jest.fn().mockResolvedValue({ enabled: false, value: null }),
    setOrganizationOverride: jest.fn(),
  };
  const audit = { record: jest.fn() };
  const service = new PlatformService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    audit as never,
    entitlements as never,
  );
  return { service, prisma, entitlements, audit };
}

describe("Platform organization entitlements", () => {
  it("lists all definitions, including disabled or unassigned entitlements", async () => {
    const { service, entitlements } = setup();
    await expect(service.listOrganizationEntitlements("org-a")).resolves.toEqual([
      { ...feature, enabled: false, value: null },
      { ...limit, enabled: false, value: null },
    ]);
    expect(entitlements.getEntitlement).toHaveBeenCalledWith("org-a", "hrms.enabled");
    expect(entitlements.getEntitlement).toHaveBeenCalledWith("org-a", "max_users");
  });

  it("rejects nonexistent or deleted organizations before reading or writing entitlements", async () => {
    const { service, prisma, entitlements } = setup();
    prisma.organization.findFirst.mockResolvedValue(null);
    await expect(service.listOrganizationEntitlements("missing")).rejects.toThrow("Organization not found");
    await expect(
      service.updateOrganizationEntitlement("missing", "admin", {
        key: feature.key,
        enabled: true,
      }),
    ).rejects.toThrow("Organization not found");
    expect(prisma.organization.findFirst).toHaveBeenCalledWith({
      where: { id: "missing", deletedAt: null },
      select: { id: true },
    });
    expect(entitlements.setOrganizationOverride).not.toHaveBeenCalled();
  });

  it("saves a tenant-scoped override via the shared cache-invalidating writer and records the actor", async () => {
    const { service, entitlements, audit } = setup();
    entitlements.getEntitlement.mockResolvedValue({ enabled: true, value: null });
    await expect(
      service.updateOrganizationEntitlement("org-b", "admin-a", {
        key: feature.key,
        enabled: true,
      }),
    ).resolves.toEqual({ ...feature, enabled: true, value: null });
    expect(entitlements.setOrganizationOverride).toHaveBeenCalledWith("org-b", "admin-a", {
      key: feature.key,
      enabled: true,
      value: undefined,
      reason: "Platform administrator update",
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-b",
        actorUserId: "admin-a",
        action: "control.org.entitlement-changed",
      }),
    );
  });

  it("requires a numeric value for enabled limits and accepts zero", async () => {
    const { service, prisma, entitlements } = setup();
    prisma.entitlement.findUnique.mockResolvedValue(limit);
    await expect(
      service.updateOrganizationEntitlement("org-a", "admin", {
        key: limit.key,
        enabled: true,
      }),
    ).rejects.toThrow("An enabled limit requires a value");
    expect(entitlements.setOrganizationOverride).not.toHaveBeenCalled();
    await service.updateOrganizationEntitlement("org-a", "admin", { key: limit.key, enabled: true, value: 0 });
    expect(entitlements.setOrganizationOverride).toHaveBeenCalledWith(
      "org-a",
      "admin",
      expect.objectContaining({ value: 0 }),
    );
  });

  it("allows explicit disabling and rejects unknown catalog keys", async () => {
    const { service, prisma, entitlements } = setup();
    await service.updateOrganizationEntitlement("org-a", "admin", { key: feature.key, enabled: false });
    expect(entitlements.setOrganizationOverride).toHaveBeenCalledWith(
      "org-a",
      "admin",
      expect.objectContaining({ enabled: false }),
    );
    prisma.entitlement.findUnique.mockResolvedValue(null);
    await expect(
      service.updateOrganizationEntitlement("org-a", "admin", {
        key: "unknown",
        enabled: true,
      }),
    ).rejects.toThrow("Unknown entitlement");
  });

  it.each([-1, 0.5, 2147483648])("rejects invalid limit %s at the request boundary", async (value) => {
    const dto = Object.assign(new UpdateOrganizationEntitlementDto(), { key: limit.key, enabled: true, value });
    expect((await validate(dto)).some((error) => error.property === "value")).toBe(true);
  });

  it("requires an explicit boolean and platform-admin route metadata", async () => {
    const dto = Object.assign(new UpdateOrganizationEntitlementDto(), { key: feature.key });
    expect((await validate(dto)).some((error) => error.property === "enabled")).toBe(true);
    const reflector = new Reflector();
    for (const handler of [
      PlatformController.prototype.listOrganizationEntitlements,
      PlatformController.prototype.updateOrganizationEntitlement,
    ]) {
      expect(reflector.get(PLATFORM_ROLES_KEY, handler)).toEqual(["PLATFORM_ADMIN"]);
    }
  });
});
