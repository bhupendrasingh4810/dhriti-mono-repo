import { Injectable } from "@nestjs/common";

interface Counter {
  [labels: string]: number;
}

export interface MetricsSnapshot {
  http: {
    requestCount: number;
    errorCount: number;
    errorRate: number;
    averageLatencyMs: number | null;
    p95LatencyMs: number | null;
  };
  redis: {
    cacheHits: number;
    cacheMisses: number;
    cacheHitRate: number | null;
    errors: number;
    averageCommandLatencyMs: number | null;
    usedMemoryBytes: number;
    evictedKeys: number;
  };
  websocket: { connections: number; messages: number };
  process: { uptimeSeconds: number; startedAt: string };
}

/**
 * Minimal in-process metrics registry that renders Prometheus text format.
 * Swap for prom-client / OpenTelemetry when you need push-based metrics or
 * richer instrumentation; the /metrics endpoint contract stays the same.
 */
@Injectable()
export class MetricsService {
  private readonly httpRequests: Counter = {};
  private readonly httpDurationBuckets: Record<string, number[]> = {};
  private billingWebhookRateLimitFailures = 0;
  private billingWebhookDeadLetters = 0;
  private redisCacheHits = 0;
  private redisCacheMisses = 0;
  private redisErrors = 0;
  private redisCommandDurationMsTotal = 0;
  private redisCommandCount = 0;
  private redisUsedMemoryBytes = 0;
  private redisEvictedKeys = 0;
  private wsConnections = 0;
  private wsMessages = 0;

  recordHttpRequest(method: string, route: string, status: number, durationMs: number): void {
    const key = `${method}|${route}|${status}`;
    this.httpRequests[key] = (this.httpRequests[key] ?? 0) + 1;

    const durationKey = `${method}|${route}`;
    (this.httpDurationBuckets[durationKey] ??= []).push(durationMs);
  }

  wsConnected(): void {
    this.wsConnections += 1;
  }

  wsDisconnected(): void {
    this.wsConnections = Math.max(0, this.wsConnections - 1);
  }

  billingWebhookRateLimitUnavailable(): void {
    this.billingWebhookRateLimitFailures += 1;
  }

  billingWebhookDeadLettered(count = 1): void {
    this.billingWebhookDeadLetters += count;
  }

  redisCacheHit(): void {
    this.redisCacheHits += 1;
  }

  redisCacheMiss(): void {
    this.redisCacheMisses += 1;
  }

  redisError(): void {
    this.redisErrors += 1;
  }

  recordRedisCommand(durationMs: number): void {
    this.redisCommandDurationMsTotal += durationMs;
    this.redisCommandCount += 1;
  }

  setRedisResourceStats(usedMemoryBytes: number, evictedKeys: number): void {
    this.redisUsedMemoryBytes = usedMemoryBytes;
    this.redisEvictedKeys = evictedKeys;
  }

  wsMessage(): void {
    this.wsMessages += 1;
  }

  snapshot(): MetricsSnapshot {
    const requests = Object.entries(this.httpRequests).reduce(
      (summary, [key, count]) => {
        const status = Number(key.split("|")[2]);
        summary.requestCount += count;
        if (status >= 500) {summary.errorCount += count;}
        return summary;
      },
      { requestCount: 0, errorCount: 0 },
    );
    const durations = Object.values(this.httpDurationBuckets).flat();
    const sortedDurations = [...durations].sort((left, right) => left - right);
    const p95Index = Math.max(0, Math.ceil(sortedDurations.length * 0.95) - 1);
    const cacheRequests = this.redisCacheHits + this.redisCacheMisses;
    const processUptimeSeconds = Math.floor(process.uptime());

    return {
      http: {
        requestCount: requests.requestCount,
        errorCount: requests.errorCount,
        errorRate: requests.requestCount === 0 ? 0 : requests.errorCount / requests.requestCount,
        averageLatencyMs:
          durations.length === 0 ? null : durations.reduce((total, duration) => total + duration, 0) / durations.length,
        p95LatencyMs: sortedDurations.length === 0 ? null : sortedDurations[p95Index],
      },
      redis: {
        cacheHits: this.redisCacheHits,
        cacheMisses: this.redisCacheMisses,
        cacheHitRate: cacheRequests === 0 ? null : this.redisCacheHits / cacheRequests,
        errors: this.redisErrors,
        averageCommandLatencyMs:
          this.redisCommandCount === 0 ? null : this.redisCommandDurationMsTotal / this.redisCommandCount,
        usedMemoryBytes: this.redisUsedMemoryBytes,
        evictedKeys: this.redisEvictedKeys,
      },
      websocket: { connections: this.wsConnections, messages: this.wsMessages },
      process: {
        uptimeSeconds: processUptimeSeconds,
        startedAt: new Date(Date.now() - processUptimeSeconds * 1000).toISOString(),
      },
    };
  }

  render(): string {
    const lines: string[] = ["# HELP http_requests_total Total HTTP requests", "# TYPE http_requests_total counter"];

    for (const [key, value] of Object.entries(this.httpRequests)) {
      const [method, route, status] = key.split("|");
      lines.push(`http_requests_total{method="${method}",route="${route}",status="${status}"} ${value}`);
    }

    lines.push(
      "# HELP http_request_duration_ms_avg Average HTTP request duration in ms",
      "# TYPE http_request_duration_ms_avg gauge",
    );
    for (const [key, durations] of Object.entries(this.httpDurationBuckets)) {
      const [method, route] = key.split("|");
      const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
      lines.push(`http_request_duration_ms_avg{method="${method}",route="${route}"} ${Math.round(avg * 100) / 100}`);
    }

    lines.push(
      "# HELP websocket_connections Current WebSocket connections",
      "# TYPE websocket_connections gauge",
      `websocket_connections ${this.wsConnections}`,
      "# HELP websocket_messages_total Total WebSocket messages",
      "# TYPE websocket_messages_total counter",
      `websocket_messages_total ${this.wsMessages}`,
      "# HELP billing_webhook_rate_limit_unavailable_total Billing webhook requests accepted while rate limiting is unavailable",
      "# TYPE billing_webhook_rate_limit_unavailable_total counter",
      `billing_webhook_rate_limit_unavailable_total ${this.billingWebhookRateLimitFailures}`,
      "# HELP billing_webhook_dead_letters_total Billing webhook events moved to the dead-letter state",
      "# TYPE billing_webhook_dead_letters_total counter",
      `billing_webhook_dead_letters_total ${this.billingWebhookDeadLetters}`,
      "# HELP redis_cache_hits_total Redis cache hits",
      "# TYPE redis_cache_hits_total counter",
      `redis_cache_hits_total ${this.redisCacheHits}`,
      "# HELP redis_cache_misses_total Redis cache misses",
      "# TYPE redis_cache_misses_total counter",
      `redis_cache_misses_total ${this.redisCacheMisses}`,
      "# HELP redis_errors_total Redis command and connection errors",
      "# TYPE redis_errors_total counter",
      `redis_errors_total ${this.redisErrors}`,
      "# HELP redis_command_duration_ms_sum Redis command latency in milliseconds",
      "# TYPE redis_command_duration_ms_sum counter",
      `redis_command_duration_ms_sum ${this.redisCommandDurationMsTotal}`,
      "# HELP redis_command_duration_ms_count Redis commands observed",
      "# TYPE redis_command_duration_ms_count counter",
      `redis_command_duration_ms_count ${this.redisCommandCount}`,
      "# HELP redis_used_memory_bytes Redis used memory",
      "# TYPE redis_used_memory_bytes gauge",
      `redis_used_memory_bytes ${this.redisUsedMemoryBytes}`,
      "# HELP redis_evicted_keys_total Redis evicted keys",
      "# TYPE redis_evicted_keys_total counter",
      `redis_evicted_keys_total ${this.redisEvictedKeys}`,
    );

    return `${lines.join("\n")}\n`;
  }

  reset(): void {
    for (const key of Object.keys(this.httpRequests)) {
      delete this.httpRequests[key];
    }
    for (const key of Object.keys(this.httpDurationBuckets)) {
      delete this.httpDurationBuckets[key];
    }
    this.wsConnections = 0;
    this.wsMessages = 0;
    this.billingWebhookRateLimitFailures = 0;
    this.billingWebhookDeadLetters = 0;
    this.redisCacheHits = 0;
    this.redisCacheMisses = 0;
    this.redisErrors = 0;
    this.redisCommandDurationMsTotal = 0;
    this.redisCommandCount = 0;
    this.redisUsedMemoryBytes = 0;
    this.redisEvictedKeys = 0;
  }
}
