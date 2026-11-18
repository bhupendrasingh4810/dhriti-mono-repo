import { randomUUID } from "node:crypto";
import { availableParallelism, totalmem } from "node:os";
import { performance } from "node:perf_hooks";
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { SystemHealthSnapshot, SystemHealthService } from "@dhriti/types";
import { PrismaService } from "../../../../database/prisma.service";
import { RedisService } from "../../../../redis/redis.service";
import { MetricsService } from "../../../../common/metrics/metrics.service";
import { ApiConfigService } from "../../../../config/config.service";
import { StorageService } from "../../../file/storage.service";

const INTERVAL_MS = 30000;
const TIMEOUT_MS = 5000;
const WINDOW_MS = 24 * 60 * 60 * 1000;
type Check = Omit<SystemHealthService, "uptimePercent" | "samples">;
interface Observation {
  at: number;
  states: Record<string, SystemHealthService["status"]>;
  connections: number;
}

@Injectable()
export class SystemHealthServiceProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SystemHealthServiceProvider.name);
  private readonly instanceId = randomUUID();
  private readonly processStartedAt = new Date(Date.now() - process.uptime() * 1000).toISOString();
  private timer?: NodeJS.Timeout;
  private snapshot?: SystemHealthSnapshot;
  private pending?: Promise<SystemHealthSnapshot>;
  private observations: Observation[] = [];
  private previousCpu = process.cpuUsage();
  private previousCpuAt = performance.now();
  private previousHttp = { requestCount: 0, errorCount: 0 };
  private readonly pendingProbes = new Map<string, Promise<unknown>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    private readonly storage: StorageService,
    private readonly config: ApiConfigService,
    private readonly jwt: JwtService,
  ) {}

  onModuleInit(): void {
    // Lazy first sample avoids probing dependencies before their module initialization finishes.
    this.timer = setInterval(() => {
      void this.getSnapshot().catch((error: unknown) =>
        this.logger.error("System health sampling failed", error instanceof Error ? error.stack : String(error)),
      );
    }, INTERVAL_MS);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** One shared in-flight sample and a 30s cache bound probe traffic independently of dashboard viewers. */
  getSnapshot(): Promise<SystemHealthSnapshot> {
    if (this.pending) {
      return this.pending;
    }
    if (this.snapshot && Date.now() - Date.parse(this.snapshot.timestamp) < INTERVAL_MS) {
      return Promise.resolve(this.snapshot);
    }
    this.pending = this.sample()
      .then((snapshot) => {
        this.snapshot = snapshot;
        return snapshot;
      })
      .finally(() => {
        this.pending = undefined;
      });
    return this.pending;
  }

  private async probe(
    id: string,
    name: string,
    detail: string,
    action: (signal: AbortSignal) => Promise<unknown>,
  ): Promise<Check> {
    const started = performance.now();
    const controller = new AbortController();
    let timer: NodeJS.Timeout | undefined;
    try {
      const deadline = new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Health probe timed out"));
        }, TIMEOUT_MS);
      });
      let actionPromise = this.pendingProbes.get(id);
      if (!actionPromise) {
        actionPromise = Promise.resolve()
          .then(() => action(controller.signal))
          .finally(() => {
            this.pendingProbes.delete(id);
          });
        this.pendingProbes.set(id, actionPromise);
      }
      await Promise.race([actionPromise, deadline]);
      const latencyMs = Math.round((performance.now() - started) * 10) / 10;
      return {
        id,
        name,
        status: latencyMs >= 500 ? "degraded" : "operational",
        latencyMs,
        checkedAt: new Date().toISOString(),
        detail,
      };
    } catch (error) {
      // Sanitized failure: provider errors can contain database URLs, bucket names or credentials.
      this.logger.warn(`System health probe failed: ${id}`);
      const permissionDenied =
        id === "storage" &&
        error instanceof Error &&
        "$metadata" in error &&
        error.$metadata !== null &&
        typeof error.$metadata === "object" &&
        "httpStatusCode" in error.$metadata &&
        error.$metadata.httpStatusCode === 403;
      return {
        id,
        name,
        status: permissionDenied ? "unavailable" : "outage",
        latencyMs: null,
        checkedAt: new Date().toISOString(),
        detail: permissionDenied
          ? "Bucket metadata access denied. Object storage availability cannot be determined from HeadBucket; verify monitor permissions."
          : "Read-only health check failed or exceeded its 5-second deadline. Check server/provider diagnostics.",
      };
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  }

  private async sample(): Promise<SystemHealthSnapshot> {
    const checkedAt = new Date().toISOString();
    const unavailable = (id: string, name: string, detail: string): Check => ({
      id,
      name,
      status: "unavailable",
      latencyMs: null,
      checkedAt,
      detail,
    });
    const brevo = this.config.brevo;
    const [database, redis, auth, storage, email] = await Promise.all([
      this.probe(
        "database",
        "Database (Primary)",
        "Read-only SELECT 1 against the configured primary database.",
        async () => {
          await this.prisma.$transaction(
            async (tx) => {
              await tx.$executeRaw`SET LOCAL statement_timeout = '3000ms'`;
              await tx.$queryRaw`SELECT 1`;
            },
            { maxWait: 1000, timeout: 4000 },
          );
        },
      ),
      this.probe("redis", "Redis Cache", "PING against the configured cache.", async () => {
        if ((await this.redis.raw.ping()) !== "PONG") {
          throw new Error("Unexpected cache health response");
        }
      }),
      this.probe(
        "auth",
        "Auth Service",
        "Local access-token signing and verification only; not a synthetic user login.",
        async () => {
          const token = await this.jwt.signAsync(
            { purpose: "health-probe" },
            { secret: this.config.jwtAccessSecret, expiresIn: 10 },
          );
          await this.jwt.verifyAsync(token, { secret: this.config.jwtAccessSecret });
        },
      ),
      this.probe(
        "storage",
        "File Storage (S3)",
        "Read-only HeadBucket; requires bucket metadata access. No objects are written.",
        (signal) => this.storage.checkHealth(signal),
      ),
      brevo
        ? this.probe(
            "email",
            "Email Service",
            "Read-only Brevo account API check; verifies provider access, not message delivery. No email is sent.",
            async (signal) => {
              const response = await fetch("https://api.brevo.com/v3/account", {
                headers: { "api-key": brevo.apiKey },
                redirect: "error",
                signal,
              });
              await response.body?.cancel();
              if (!response.ok) {
                throw new Error("Email provider check failed");
              }
            },
          )
        : unavailable("email", "Email Service", "Email delivery is not configured."),
    ]);
    const telemetry = this.metrics.snapshot();
    const requests = Math.max(0, telemetry.http.requestCount - this.previousHttp.requestCount);
    const errors = Math.max(0, telemetry.http.errorCount - this.previousHttp.errorCount);
    this.previousHttp = { requestCount: telemetry.http.requestCount, errorCount: telemetry.http.errorCount };
    const gatewayDegraded = (requests > 0 && errors / requests > 0.01) || (telemetry.http.p95LatencyMs ?? 0) >= 500;
    const checks: Check[] = [
      {
        id: "api",
        name: "API Gateway",
        status: gatewayDegraded ? "degraded" : "operational",
        latencyMs: telemetry.http.p95LatencyMs,
        checkedAt,
        detail:
          "This API instance. Degraded when interval HTTP 5xx exceeds 1% or instrumented process-lifetime p95 latency is at least 500ms. No traffic means latency is unavailable.",
      },
      {
        ...auth,
        ...(database.status === "outage" || redis.status === "outage"
          ? {
              status: "outage" as const,
              detail: "Authentication dependencies unavailable: database or Redis check failed.",
            }
          : {}),
      },
      database,
      unavailable(
        "replica",
        "Database (Replica)",
        "No independent replica connection is configured; the primary is not reported as a replica.",
      ),
      redis,
      storage,
      email,
      {
        id: "websocket",
        name: "WebSocket Server",
        status: this.metrics.isWebsocketInitialized()
          ? redis.status === "outage"
            ? "degraded"
            : "operational"
          : "unavailable",
        latencyMs: null,
        checkedAt,
        detail:
          "Local /connect gateway initialization and Redis dependency only; no end-to-end socket round-trip probe.",
      },
      unavailable(
        "search",
        "Search (Elasticsearch)",
        "This application uses PostgreSQL full-text search, not Elasticsearch. No Elasticsearch cluster is configured.",
      ),
      unavailable("cdn", "CDN", "No external CDN monitoring source is configured."),
    ];
    const now = Date.now();
    this.observations = this.observations.filter((entry) => entry.at >= now - WINDOW_MS);
    const fiveMinutesAgo = [...this.observations]
      .reverse()
      .find((entry) => entry.at <= now - 300000 && entry.at >= now - 360000);
    this.observations.push({
      at: now,
      states: Object.fromEntries(checks.map((check) => [check.id, check.status])),
      connections: telemetry.websocket.connections,
    });
    // Cache already limits samples to ~2880/day; the extra cap also bounds memory if wall-clock time moves backwards.
    this.observations = this.observations.slice(-2881);
    const services = checks.map((check): SystemHealthService => {
      const samples = this.observations.filter(
        (entry) => entry.states[check.id] !== undefined && entry.states[check.id] !== "unavailable",
      );
      const available = samples.filter((entry) => entry.states[check.id] !== "outage").length;
      return {
        ...check,
        samples: samples.length,
        uptimePercent:
          check.status === "unavailable" || !samples.length
            ? null
            : Math.round((available / samples.length) * 10000) / 100,
      };
    });
    const cpuAt = performance.now();
    const cpu = process.cpuUsage();
    const elapsedMicros = (cpuAt - this.previousCpuAt) * 1000;
    const cpuPercent =
      elapsedMicros > 0
        ? Math.min(
            100,
            Math.max(
              0,
              ((cpu.user + cpu.system - this.previousCpu.user - this.previousCpu.system) /
                elapsedMicros /
                availableParallelism()) *
                100,
            ),
          )
        : null;
    this.previousCpu = cpu;
    this.previousCpuAt = cpuAt;
    return {
      timestamp: new Date(now).toISOString(),
      instanceId: this.instanceId,
      processStartedAt: this.processStartedAt,
      sampleIntervalSeconds: 30,
      availabilityWindowStartedAt: new Date(this.observations[0].at).toISOString(),
      summary: {
        operational: checks.filter((check) => check.status === "operational").length,
        degraded: checks.filter((check) => check.status === "degraded").length,
        outage: checks.filter((check) => check.status === "outage").length,
        unavailable: checks.filter((check) => check.status === "unavailable").length,
      },
      services,
      resources: [
        {
          id: "cpu",
          label: "CPU Usage",
          value: cpuPercent === null ? null : Math.round(cpuPercent * 10) / 10,
          detail: "API process CPU time as a percentage of available logical CPU capacity over the sampling interval.",
        },
        {
          id: "memory",
          label: "Memory",
          value: Math.min(100, Math.round((process.memoryUsage().rss / totalmem()) * 1000) / 10),
          detail:
            "API process resident memory as a percentage of host-reported total RAM; not container-limit or fleet utilization.",
        },
        {
          id: "disk",
          label: "Disk I/O",
          value: null,
          detail: "Disk utilization requires an infrastructure metrics source; none is configured.",
        },
        {
          id: "network",
          label: "Network",
          value: null,
          detail:
            "Network utilization requires interface capacity and infrastructure telemetry; neither is configured.",
        },
      ],
      connections: {
        active: telemetry.websocket.connections,
        changeLast5m: fiveMinutesAgo ? telemetry.websocket.connections - fiveMinutesAgo.connections : null,
        detail:
          "Instrumented /connect WebSocket connections on this API instance, not HTTP, database, or fleet-wide connections. Five-minute delta appears after sufficient samples.",
      },
    };
  }
}
