import { EntitlementService } from "./entitlement.service";

function makePrisma() {
  return {
    entitlement: { findUnique: jest.fn(), findMany: jest.fn() },
    subscription: { findFirst: jest.fn() },
    organizationEntitlement: { findFirst: jest.fn() },
  };
}

function makeRedis() {
  return { getJson: jest.fn(), setJson: jest.fn(), deleteByPattern: jest.fn() };
}

const config = { entitlementCacheTtlSeconds: 60 };

describe("EntitlementService", () => {
  it("allows a feature included in an active subscription plan", async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    redis.getJson.mockResolvedValue(null);
    prisma.entitlement.findUnique.mockResolvedValue({ id: "entitlement-a", kind: "FEATURE" });
    prisma.subscription.findFirst.mockResolvedValue({
      planId: "plan-a",
      planRecord: { entitlements: [{ enabled: true, value: null }] },
    });
    prisma.organizationEntitlement.findFirst.mockResolvedValue(null);
    const service = new EntitlementService(prisma as never, redis as never, config as never);

    await expect(service.getEntitlement("org-a", "flow.enabled")).resolves.toEqual({ enabled: true, value: null });
  });

  it("does not grant a feature from an expired override", async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    redis.getJson.mockResolvedValue(null);
    prisma.entitlement.findUnique.mockResolvedValue({ id: "entitlement-a", kind: "FEATURE" });
    prisma.subscription.findFirst.mockResolvedValue(null);
    prisma.organizationEntitlement.findFirst.mockResolvedValue(null);
    const service = new EntitlementService(prisma as never, redis as never, config as never);

    await expect(service.hasFeature("org-a", "hrms.enabled")).resolves.toBe(false);
    expect(prisma.organizationEntitlement.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ OR: expect.arrayContaining([{ expiresAt: { gt: expect.any(Date) } }]) }),
      }),
    );
  });

  it("applies an organization limit override over the plan value", async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    redis.getJson.mockResolvedValue(null);
    prisma.entitlement.findUnique.mockResolvedValue({ id: "entitlement-a", kind: "LIMIT" });
    prisma.subscription.findFirst.mockResolvedValue({
      planId: "plan-a",
      planRecord: { entitlements: [{ enabled: true, value: 10 }] },
    });
    prisma.organizationEntitlement.findFirst.mockResolvedValue({ enabled: true, value: 25 });
    const service = new EntitlementService(prisma as never, redis as never, config as never);

    await expect(service.getLimit("org-a", "max_projects")).resolves.toBe(25);
  });

  it("falls back to the database when entitlement cache reads fail", async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    redis.getJson.mockRejectedValue(new Error("Redis unavailable"));
    redis.setJson.mockRejectedValue(new Error("Redis unavailable"));
    prisma.entitlement.findUnique.mockResolvedValue({ id: "entitlement-a", kind: "FEATURE" });
    prisma.subscription.findFirst.mockResolvedValue({
      planId: "plan-a",
      planRecord: { entitlements: [{ enabled: true, value: null }] },
    });
    prisma.organizationEntitlement.findFirst.mockResolvedValue(null);
    const service = new EntitlementService(prisma as never, redis as never, config as never);

    await expect(service.hasFeature("org-a", "flow.enabled")).resolves.toBe(true);
  });

  it("fails closed for a negative limit from a plan", async () => {
    const prisma = makePrisma();
    const redis = makeRedis();
    redis.getJson.mockResolvedValue(null);
    prisma.entitlement.findUnique.mockResolvedValue({ id: "entitlement-a", kind: "LIMIT" });
    prisma.subscription.findFirst.mockResolvedValue({
      planId: "plan-a",
      planRecord: { entitlements: [{ enabled: true, value: -1 }] },
    });
    prisma.organizationEntitlement.findFirst.mockResolvedValue(null);
    const service = new EntitlementService(prisma as never, redis as never, config as never);

    await expect(service.getLimit("org-a", "max_projects")).resolves.toBeNull();
  });
});
