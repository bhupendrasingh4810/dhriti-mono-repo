import { JwtService } from "@nestjs/jwt";
import { MetricsService } from "../../../../common/metrics/metrics.service";
import { SystemHealthServiceProvider } from "./system-health.service";

function setup() {
  const tx = {
    $executeRaw: jest.fn().mockResolvedValue(0),
    $queryRaw: jest.fn().mockResolvedValue([{ "?column?": 1 }]),
  };
  const prisma = { $transaction: jest.fn(async (callback: (client: typeof tx) => Promise<void>) => callback(tx)) };
  const redis = { raw: { ping: jest.fn().mockResolvedValue("PONG") } };
  const storage = { checkHealth: jest.fn().mockResolvedValue(undefined) };
  const metrics = new MetricsService();
  metrics.websocketInitialized();
  const config = {
    jwtAccessSecret: "test-access-signing-key-with-at-least-32-characters",
    brevo: null as { apiKey: string } | null,
  };
  const service = new SystemHealthServiceProvider(
    prisma as never,
    redis as never,
    metrics,
    storage as never,
    config as never,
    new JwtService(),
  );
  return { service, prisma, tx, redis, storage, metrics, config };
}
describe("Measured System Health snapshots", () => {
  beforeEach(() => jest.useFakeTimers({ doNotFake: ["performance", "nextTick", "setImmediate"] }));
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("preserves ten rows and reports unavailable services instead of fabricated metrics", async () => {
    const { service, prisma, storage, metrics } = setup();
    metrics.wsConnected();
    const report = await service.getSnapshot();
    expect(report.services).toHaveLength(10);
    expect(report.summary).toEqual({ operational: 6, degraded: 0, outage: 0, unavailable: 4 });
    expect(report.services.find((row) => row.id === "replica")).toMatchObject({
      status: "unavailable",
      uptimePercent: null,
      latencyMs: null,
      samples: 0,
    });
    expect(report.services.find((row) => row.id === "database")).toMatchObject({
      status: "operational",
      uptimePercent: 100,
      samples: 1,
    });
    expect(report.services.find((row) => row.id === "api")?.latencyMs).toBeNull();
    expect(report.resources.find((row) => row.id === "disk")?.value).toBeNull();
    expect(report.resources.find((row) => row.id === "network")?.value).toBeNull();
    for (const id of ["cpu", "memory"]) {
      const value = report.resources.find((row) => row.id === id)?.value;
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(100);
    }
    expect(report.connections).toMatchObject({ active: 1, changeLast5m: null });
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { maxWait: 1000, timeout: 4000 });
    expect(storage.checkHealth).toHaveBeenCalledWith(expect.any(AbortSignal));
  });

  it("coalesces concurrent readers and report downloads; refreshes once the 30-second cache expires", async () => {
    const { service, prisma } = setup();
    const first = service.getSnapshot(),
      second = service.getSnapshot();
    expect(first).toBe(second);
    const snapshot = await first;
    expect(await service.getSnapshot()).toBe(snapshot);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    jest.setSystemTime(Date.now() + 30000);
    const next = await service.getSnapshot();
    expect(next).not.toBe(snapshot);
    expect(prisma.$transaction).toHaveBeenCalledTimes(2);
  });

  it("contains provider failures in the snapshot and propagates outages to auth dependencies", async () => {
    const { service, tx, redis } = setup();
    tx.$queryRaw.mockRejectedValue(new Error("postgresql://do-not-expose-secret"));
    redis.raw.ping.mockRejectedValue(new Error("redis-secret"));
    const report = await service.getSnapshot();
    expect(report.services.find((row) => row.id === "database")?.status).toBe("outage");
    expect(report.services.find((row) => row.id === "auth")?.status).toBe("outage");
    expect(report.services.find((row) => row.id === "websocket")?.status).toBe("degraded");
    expect(JSON.stringify(report)).not.toContain("do-not-expose-secret");
    expect(JSON.stringify(report)).not.toContain("redis-secret");
  });

  it("reports denied S3 metadata access as unavailable rather than falsely claiming a storage outage", async () => {
    const { service, storage } = setup();
    storage.checkHealth.mockRejectedValue(
      Object.assign(new Error("private-bucket-name"), { $metadata: { httpStatusCode: 403 } }),
    );
    const report = await service.getSnapshot();
    expect(report.services.find((row) => row.id === "storage")).toMatchObject({
      status: "unavailable",
      samples: 0,
      uptimePercent: null,
    });
    expect(JSON.stringify(report)).not.toContain("private-bucket-name");
  });

  it("bounds probe waits to five seconds and does not accumulate unresolved Redis commands", async () => {
    const { service, redis } = setup();
    redis.raw.ping.mockImplementation(() => new Promise(() => undefined));
    const first = service.getSnapshot();
    await jest.advanceTimersByTimeAsync(5000);
    expect((await first).services.find((row) => row.id === "redis")?.status).toBe("outage");
    jest.setSystemTime(Date.now() + 30000);
    const second = service.getSnapshot();
    await jest.advanceTimersByTimeAsync(5000);
    expect((await second).services.find((row) => row.id === "redis")?.status).toBe("outage");
    expect(redis.raw.ping).toHaveBeenCalledTimes(1);
  });

  it("uses interval error rate and numeric p95 thresholds for degraded API status", async () => {
    const { service, metrics } = setup();
    metrics.recordHttpRequest("GET", "/test", 503, 50);
    expect((await service.getSnapshot()).services.find((row) => row.id === "api")).toMatchObject({
      status: "degraded",
      latencyMs: 50,
    });
    jest.setSystemTime(Date.now() + 30000);
    metrics.recordHttpRequest("GET", "/test", 200, 50);
    expect((await service.getSnapshot()).services.find((row) => row.id === "api")?.status).toBe("operational");
    jest.setSystemTime(Date.now() + 30000);
    metrics.recordHttpRequest("GET", "/test", 200, 500);
    expect((await service.getSnapshot()).services.find((row) => row.id === "api")?.status).toBe("degraded");
  });

  it("computes observed availability across outages and waits five minutes for a genuine connection delta", async () => {
    const { service, redis, metrics } = setup();
    await service.getSnapshot();
    jest.setSystemTime(Date.now() + 30000);
    redis.raw.ping.mockRejectedValueOnce(new Error("Unavailable"));
    expect((await service.getSnapshot()).services.find((row) => row.id === "redis")?.uptimePercent).toBe(50);
    jest.setSystemTime(Date.now() + 270000);
    metrics.wsConnected();
    const next = await service.getSnapshot();
    expect(next.connections.changeLast5m).toBe(1);
    expect(next.services.find((row) => row.id === "redis")?.uptimePercent).toBe(66.67);
  });

  it("uses a read-only email provider check when configured without sending email", async () => {
    const { service, config } = setup();
    config.brevo = { apiKey: "test-provider-key" };
    const fetch = jest.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 200 }));
    const report = await service.getSnapshot();
    expect(report.services.find((row) => row.id === "email")?.status).toBe("operational");
    expect(fetch).toHaveBeenCalledWith("https://api.brevo.com/v3/account", {
      headers: { "api-key": "test-provider-key" },
      redirect: "error",
      signal: expect.any(AbortSignal),
    });
  });

  it("stops automatic sampling on module teardown", async () => {
    const { service, prisma } = setup();
    service.onModuleInit();
    await jest.advanceTimersByTimeAsync(30000);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    service.onModuleDestroy();
    await jest.advanceTimersByTimeAsync(60000);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("expires observations older than 24 hours rather than presenting them as historical SLA uptime", async () => {
    const { service, redis } = setup();
    redis.raw.ping.mockRejectedValueOnce(new Error("Unavailable"));
    expect((await service.getSnapshot()).services.find((row) => row.id === "redis")?.uptimePercent).toBe(0);
    jest.setSystemTime(Date.now() + 25 * 60 * 60 * 1000);
    const report = await service.getSnapshot();
    expect(report.services.find((row) => row.id === "redis")).toMatchObject({ samples: 1, uptimePercent: 100 });
    expect(report.availabilityWindowStartedAt).toBe(report.timestamp);
    expect(report.connections.changeLast5m).toBeNull();
  });
});
