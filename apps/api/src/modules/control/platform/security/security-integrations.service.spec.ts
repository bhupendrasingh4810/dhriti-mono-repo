import { createHmac } from "node:crypto";
import { Prisma } from "@prisma/client";
import { ConflictException, HttpException, ServiceUnavailableException, UnauthorizedException } from "@nestjs/common";
import { SecurityIntegrationsService } from "./security-integrations.service";

function setup() {
  const prisma = {
    securityEvent: {
      create: jest.fn().mockResolvedValue({ id: "event" }),
      upsert: jest.fn().mockResolvedValue({ id: "event" }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: "event" }),
    },
    securityAlertDelivery: { update: jest.fn(), updateMany: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    auditLog: { create: jest.fn() },
  };
  prisma.$transaction.mockImplementation((operation: Promise<unknown>[] | ((tx: typeof prisma) => unknown)) =>
    Array.isArray(operation) ? Promise.all(operation) : operation(prisma),
  );
  const redis = { incrementWithExpiry: jest.fn().mockResolvedValue(1) };
  const config = {
    securityIntegrations: {
      emails: ["security@example.test"],
      webhookUrl: "https://collector.example.test/events",
      webhookSecret: "example-webhook-signing-secret-for-tests",
      ingestToken: "example-ingestion-token-for-tests",
    },
  };
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  return {
    prisma,
    redis,
    config,
    email,
    service: new SecurityIntegrationsService(prisma as never, redis as never, config as never, email as never),
  };
}
const input = {
  source: "waf",
  externalId: "finding-1",
  severity: "critical" as const,
  type: "WAF alert",
  description: "Suspicious request",
  ipAddress: "192.0.2.2",
};
const job = {
  id: "delivery",
  channel: "WEBHOOK",
  destination: "https://collector.example.test/events",
  attempts: 1,
  event: { id: "event", ...input, createdAt: new Date("2026-11-18T00:00:00Z") },
};
afterEach(() => jest.restoreAllMocks());

describe("Security integration delivery", () => {
  it("atomically queues critical email and webhook intents; provider retries use a unique source/event key", async () => {
    const { prisma, service } = setup();
    await service.recordEvent(input);
    expect(prisma.securityEvent.upsert).toHaveBeenCalledWith({
      where: { source_externalId: { source: "waf", externalId: "finding-1" } },
      update: {},
      create: {
        ...input,
        deliveries: {
          create: [
            { channel: "EMAIL", destination: "security@example.test" },
            { channel: "WEBHOOK", destination: job.destination },
          ],
        },
      },
    });
  });
  it("exports low-severity events without sending email alerts", async () => {
    const { prisma, service } = setup();
    await service.recordEvent({ ...input, severity: "low" });
    expect(prisma.securityEvent.upsert.mock.calls[0][0].create.deliveries.create).toEqual([
      { channel: "WEBHOOK", destination: job.destination },
    ]);
  });
  it("recovers only the source/event unique-key race, without masking other database errors", async () => {
    const { prisma, service } = setup();
    prisma.securityEvent.upsert.mockRejectedValueOnce(
      new Prisma.PrismaClientKnownRequestError("Concurrent import", {
        code: "P2002",
        clientVersion: "test",
        meta: { target: ["source", "externalId"] },
      }),
    );
    await expect(service.recordEvent(input)).resolves.toEqual({ id: "event" });
    expect(prisma.securityEvent.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { source_externalId: { source: input.source, externalId: input.externalId } },
    });
    prisma.securityEvent.upsert.mockRejectedValueOnce(new Error("Database unavailable"));
    await expect(service.recordEvent(input)).rejects.toThrow("Database unavailable");
  });
  it("does not create fake delivery jobs when integrations are unconfigured", async () => {
    const { config, service, prisma } = setup();
    config.securityIntegrations.emails = [];
    config.securityIntegrations.webhookUrl = "";
    expect(service.status()).toEqual({ email: false, webhook: false, ingestion: true });
    await service.recordEvent(input);
    expect(prisma.securityEvent.upsert.mock.calls[0][0].create.deliveries.create).toEqual([]);
  });
  it("requires integration credentials before rate limiting or storing inbound events", async () => {
    const { service, prisma, redis, config } = setup();
    await expect(service.ingest(input, "Bearer invalid", "192.0.2.1")).rejects.toThrow(UnauthorizedException);
    expect(prisma.securityEvent.upsert).not.toHaveBeenCalled();
    expect(redis.incrementWithExpiry).not.toHaveBeenCalled();
    const auth = `Bearer ${config.securityIntegrations.ingestToken}`;
    await expect(service.ingest(input, auth, "192.0.2.1")).resolves.toEqual({ id: "event" });
    redis.incrementWithExpiry.mockResolvedValue(121);
    await expect(service.ingest(input, auth, "192.0.2.1")).rejects.toThrow(HttpException);
    config.securityIntegrations.ingestToken = "";
    await expect(service.ingest(input, auth, "192.0.2.1")).rejects.toThrow(ServiceUnavailableException);
  });
  it("signs actual outbound bytes and denies redirects with a network timeout", async () => {
    const { service, prisma, config } = setup();
    prisma.$queryRaw.mockResolvedValue([job]);
    prisma.securityAlertDelivery.update.mockResolvedValue(job);
    const send = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));
    await expect(service.deliverNext()).resolves.toBe(true);
    expect(send).toHaveBeenCalledTimes(1);
    const [url, options] = send.mock.calls[0];
    expect(url).toBe(job.destination);
    const headers = options?.headers as Record<string, string>;
    expect(headers["X-Dhriti-Signature"]).toBe(
      createHmac("sha256", config.securityIntegrations.webhookSecret)
        .update(`${headers["X-Dhriti-Timestamp"]}.${options?.body}`)
        .digest("hex"),
    );
    expect(options).toMatchObject({ redirect: "error", signal: expect.any(AbortSignal) });
    expect(prisma.securityAlertDelivery.updateMany).toHaveBeenCalledWith({
      where: { id: job.id, leaseToken: expect.any(String) },
      data: expect.objectContaining({ deliveredAt: expect.any(Date), lastError: null, leaseToken: null }),
    });
    expect(prisma.securityAlertDelivery.update.mock.calls[0][0].data.leaseToken).toBe(
      prisma.securityAlertDelivery.updateMany.mock.calls[0][0].where.leaseToken,
    );
  });
  it("persists explicit delivery failures for retry without leaking provider bodies or credentials", async () => {
    const { service, prisma } = setup();
    prisma.$queryRaw.mockResolvedValue([job]);
    prisma.securityAlertDelivery.update.mockResolvedValue({ ...job, attempts: 3 });
    jest.spyOn(globalThis, "fetch").mockRejectedValue(new Error("secret-token-do-not-log"));
    await service.deliverNext();
    expect(prisma.securityAlertDelivery.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          deliveredAt: null,
          lastError: "Delivery failed; check provider connectivity and configuration",
          availableAt: expect.any(Date),
        }),
      }),
    );
    const retry = prisma.securityAlertDelivery.updateMany.mock.calls[0][0].data.availableAt.getTime();
    expect(retry - Date.now()).toBeGreaterThan(239000);
  });
  it("uses configured email delivery and refuses removed destinations", async () => {
    const { service, prisma, email, config } = setup();
    prisma.$queryRaw.mockResolvedValue([job]);
    prisma.securityAlertDelivery.update.mockResolvedValue({
      ...job,
      channel: "EMAIL",
      destination: "security@example.test",
    });
    await service.deliverNext();
    expect(email.send).toHaveBeenCalledWith(expect.objectContaining({ to: [{ email: "security@example.test" }] }), {
      requireConfigured: true,
      sensitive: true,
    });
    config.securityIntegrations.emails = [];
    await service.deliverNext();
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(prisma.securityAlertDelivery.updateMany).toHaveBeenLastCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ deliveredAt: null, lastError: "Email destination is no longer configured" }),
      }),
    );
  });
  it("returns without sending when another worker owns the available jobs", async () => {
    const { service, prisma, email } = setup();
    prisma.$queryRaw.mockResolvedValue([]);
    await expect(service.deliverNext()).resolves.toBe(false);
    expect(email.send).not.toHaveBeenCalled();
  });
  it("audits a manual retry and refuses to reset delivered or actively leased jobs", async () => {
    const { prisma, service } = setup();
    prisma.securityAlertDelivery.updateMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });
    await service.retry("delivery", "admin");
    expect(prisma.securityAlertDelivery.updateMany).toHaveBeenCalledWith({
      where: {
        id: "delivery",
        deliveredAt: null,
        lastError: { not: null },
        OR: [{ leaseUntil: null }, { leaseUntil: { lte: expect.any(Date) } }],
      },
      data: { attempts: 0, availableAt: expect.any(Date), lastError: null, leaseToken: null, leaseUntil: null },
    });
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    await expect(service.retry("delivery", "admin")).rejects.toThrow(ConflictException);
    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
  });
});
