import { MetricsService } from "./metrics.service";

describe("MetricsService", () => {
  it("returns HTTP, Redis, and WebSocket values for the platform dashboard", () => {
    const metrics = new MetricsService();

    metrics.recordHttpRequest("GET", "/v1/health", 200, 10);
    metrics.recordHttpRequest("GET", "/v1/health", 503, 1100);
    metrics.redisCacheHit();
    metrics.redisCacheHit();
    metrics.redisCacheMiss();
    metrics.recordRedisCommand(5);
    metrics.setRedisResourceStats(1024, 2);
    metrics.wsConnected();
    metrics.wsMessage();

    expect(metrics.snapshot()).toMatchObject({
      http: { requestCount: 2, errorCount: 1, errorRate: 0.5, averageLatencyMs: 555, p95LatencyMs: 1100 },
      redis: { cacheHits: 2, cacheMisses: 1, cacheHitRate: 2 / 3, averageCommandLatencyMs: 5, usedMemoryBytes: 1024, evictedKeys: 2 },
      websocket: { connections: 1, messages: 1 },
    });
  });
});