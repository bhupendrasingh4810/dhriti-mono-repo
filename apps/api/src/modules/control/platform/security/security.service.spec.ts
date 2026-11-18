import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { SecurityService } from "./security.service";
import { canonicalIp } from "./ip-address";
import { SecurityEventsDto } from "./security.dto";
import { SecurityIntegrationsService } from "./security-integrations.service";

function setup() {
  const prisma = {
    securityEvent: {
      count: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    blockedIp: { count: jest.fn(), findMany: jest.fn(), upsert: jest.fn(), deleteMany: jest.fn() },
    user: { count: jest.fn() },
    organization: { count: jest.fn() },
    organizationOidc: { count: jest.fn() },
    auditLog: { create: jest.fn(), findMany: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (operation: Promise<unknown>[] | ((tx: typeof prisma) => unknown)) =>
    Array.isArray(operation) ? Promise.all(operation) : operation(prisma),
  );
  const redis = { incrementWithExpiry: jest.fn() };
  const config = { securityIntegrations: { emails: [] } };
  const integrations = new SecurityIntegrationsService(prisma as never, redis as never, config as never, {} as never);
  return { prisma, redis, service: new SecurityService(prisma as never, redis as never, integrations) };
}

describe("Security Center persistence", () => {
  it("canonicalizes equivalent addresses and rejects invalid input", () => {
    expect(canonicalIp("::ffff:192.0.2.1")).toBe("192.0.2.1");
    expect(canonicalIp("0:0:0:0:0:ffff:c000:201")).toBe("192.0.2.1");
    expect(canonicalIp("2001:0db8:0:0:0:0:0:1")).toBe("2001:db8::1");
    expect(() => canonicalIp("192.0.2.1/24")).toThrow(BadRequestException);
    expect(() => canonicalIp("fe80::1%eth0")).toThrow(BadRequestException);
  });

  it("returns real metrics with a non-overlapping organization MFA breakdown", async () => {
    const { prisma, service } = setup();
    prisma.securityEvent.count.mockResolvedValue(4);
    prisma.blockedIp.count.mockResolvedValue(2);
    prisma.user.count.mockResolvedValueOnce(8).mockResolvedValueOnce(3);
    prisma.organization.count.mockResolvedValueOnce(6).mockResolvedValueOnce(2).mockResolvedValueOnce(1);
    prisma.organizationOidc.count.mockResolvedValue(1);
    expect(await service.overview()).toEqual({
      activeThreats: 4,
      blockedIps: 2,
      mfaAdoption: 38,
      ssoOrgs: 1,
      mfaStatus: { enforced: 2, optional: 1, none: 3, total: 6 },
    });
  });

  it("handles a genuinely empty database without NaN percentages", async () => {
    const { prisma, service } = setup();
    for (const model of [
      prisma.securityEvent,
      prisma.blockedIp,
      prisma.user,
      prisma.organization,
      prisma.organizationOidc,
    ]) {
      model.count.mockResolvedValue(0);
    }
    expect(await service.overview()).toMatchObject({ mfaAdoption: 0, mfaStatus: { none: 0, total: 0 } });
  });

  it("pages events deterministically and counts the whole collection", async () => {
    const { prisma, service } = setup();
    prisma.securityEvent.findMany.mockResolvedValue([{ id: "event" }]);
    prisma.securityEvent.count.mockResolvedValue(25);
    const query = Object.assign(new SecurityEventsDto(), { page: 2, limit: 20 });
    expect(await service.events(query)).toEqual({
      items: [{ id: "event" }],
      pagination: { page: 2, limit: 20, total: 25, totalPages: 2 },
    });
    expect(prisma.securityEvent.findMany).toHaveBeenCalledWith({
      skip: 20,
      where: {},
      take: 20,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    });
  });

  it("resolves once and audits only the actual transition", async () => {
    const { prisma, service } = setup();
    prisma.securityEvent.findUnique.mockResolvedValue({ id: "event" });
    prisma.securityEvent.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await service.resolve("event", "admin");
    await service.resolve("event", "admin");
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.securityEvent.updateMany).toHaveBeenCalledWith({
      where: { id: "event", resolvedAt: null },
      data: { resolvedAt: expect.any(Date), resolvedById: "admin" },
    });
  });

  it("does not claim to resolve a missing event", async () => {
    const { prisma, service } = setup();
    prisma.securityEvent.findUnique.mockResolvedValue(null);
    await expect(service.resolve("missing", "admin")).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.auditLog.create).not.toHaveBeenCalled();
  });

  it("prevents self-blocking through IPv4-mapped aliases", async () => {
    const { prisma, service } = setup();
    await expect(
      service.block("192.0.2.1", "admin", "::ffff:192.0.2.1", { reason: "Investigation" }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.blockedIp.upsert).not.toHaveBeenCalled();
  });

  it("persists and audits block/unblock using canonical addresses", async () => {
    const { prisma, service } = setup();
    await service.block("::ffff:192.0.2.2", "admin", "192.0.2.1", { reason: "Investigation" });
    expect(prisma.blockedIp.upsert).toHaveBeenCalledWith({
      where: { ipAddress: "192.0.2.2" },
      create: { ipAddress: "192.0.2.2", createdById: "admin", reason: "Investigation", expiresAt: null },
      update: { createdById: "admin", createdAt: expect.any(Date), reason: "Investigation", expiresAt: null },
    });
    await service.unblock("192.0.2.2", "admin");
    expect(prisma.blockedIp.deleteMany).toHaveBeenCalledWith({ where: { ipAddress: "192.0.2.2" } });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(2);
  });

  it("emits exactly one brute-force event at five failures in ten minutes, without storing credentials", async () => {
    const { prisma, redis, service } = setup();
    for (let count = 1; count <= 7; count++) {
      redis.incrementWithExpiry.mockResolvedValueOnce(count);
      await service.failedLogin("::ffff:192.0.2.2");
    }
    expect(redis.incrementWithExpiry).toHaveBeenCalledWith("security:failed-login:192.0.2.2", 600);
    expect(prisma.securityEvent.create).toHaveBeenCalledTimes(1);
    expect(prisma.securityEvent.create).toHaveBeenCalledWith({
      data: {
        severity: "high",
        type: "Brute Force",
        description: expect.stringContaining("5 rejected"),
        ipAddress: "192.0.2.2",
        deliveries: { create: [] },
      },
    });
  });

  it("uses the same severity/status/IP/date filters for data and count", async () => {
    const { prisma, service } = setup();
    prisma.securityEvent.findMany.mockResolvedValue([]);
    prisma.securityEvent.count.mockResolvedValue(0);
    await service.events(
      Object.assign(new SecurityEventsDto(), {
        severity: "critical",
        status: "resolved",
        ipAddress: "::ffff:192.0.2.2",
        from: "2026-11-01T00:00:00Z",
        to: "2026-11-18T23:59:59Z",
      }),
    );
    const where = {
      severity: "critical",
      resolvedAt: { not: null },
      ipAddress: "192.0.2.2",
      createdAt: { gte: new Date("2026-11-01T00:00:00Z"), lte: new Date("2026-11-18T23:59:59Z") },
    };
    expect(prisma.securityEvent.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
    expect(prisma.securityEvent.count).toHaveBeenCalledWith({ where });
    await expect(
      service.events(Object.assign(new SecurityEventsDto(), { from: "2026-11-19", to: "2026-11-18" })),
    ).rejects.toThrow(BadRequestException);
  });

  it("rejects missing reasons and past/invalid block expiries before writing", async () => {
    const { service, prisma } = setup();
    for (const options of [
      { reason: " " },
      { reason: "Test", expiresAt: "2000-01-01T00:00:00Z" },
      { reason: "Test", expiresAt: "invalid" },
    ]) {
      await expect(service.block("192.0.2.2", "admin", "192.0.2.1", options)).rejects.toThrow(BadRequestException);
    }
    expect(prisma.blockedIp.upsert).not.toHaveBeenCalled();
  });

  it("persists future expiry, excludes expired blocks in both metrics and list, and records the reason", async () => {
    const { service, prisma } = setup();
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    await service.block("192.0.2.2", "admin", "192.0.2.1", { reason: "  WAF finding  ", expiresAt });
    expect(prisma.blockedIp.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ reason: "WAF finding", expiresAt: new Date(expiresAt) }),
      }),
    );
    prisma.blockedIp.findMany.mockResolvedValue([]);
    prisma.blockedIp.count.mockResolvedValue(0);
    await service.blocked(new SecurityEventsDto());
    expect(prisma.blockedIp.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }] },
      }),
    );
    await service.overview();
    expect(prisma.blockedIp.count).toHaveBeenLastCalledWith({
      where: { OR: [{ expiresAt: null }, { expiresAt: { gt: expect.any(Date) } }] },
    });
  });

  it("returns event details with bounded chronological audit history", async () => {
    const { service, prisma } = setup();
    prisma.securityEvent.findUnique.mockResolvedValue({ id: "event", ipAddress: "192.0.2.2", createdAt: new Date() });
    prisma.auditLog.findMany.mockResolvedValue([{ id: "latest" }, { id: "earlier" }]);
    expect(await service.event("event")).toMatchObject({
      timeline: [{ id: "earlier" }, { id: "latest" }],
      hasMoreTimeline: false,
    });
    prisma.securityEvent.findUnique.mockResolvedValue(null);
    await expect(service.event("missing")).rejects.toThrow(NotFoundException);
  });
});
