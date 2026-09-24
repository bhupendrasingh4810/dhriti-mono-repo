import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

import { MetricsService } from "../common/metrics/metrics.service";
import { ApiConfigService } from "../config/config.service";

const incrementWithExpiryScript = [
  "local count = redis.call('INCR', KEYS[1])",
  "if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end",
  "return count",
].join("\n");

// Redis service for managing Redis connections and operations.
// Provides methods for interacting with Redis, including JSON storage and pattern-based deletion.
// This service handles connection lifecycle and provides utility methods for common Redis operations.
// Example usage:
// const redisService = new RedisService(config);
// await redisService.setJson("key", { foo: "bar" }, 3600);
// const value = await redisService.getJson<{ foo: string }>("key");
// await redisService.delete("key");
// await redisService.deleteByPattern("prefix:*");
// Note: Ensure that the Redis server is running and accessible via the provided URL.
// Make sure to inject this service properly in your NestJS modules to manage Redis connections effectively.
// This service should be used as a singleton to avoid multiple Redis connections.

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private telemetryTimer: NodeJS.Timeout | undefined;

  constructor(
    private readonly config: ApiConfigService,
    private readonly metrics: MetricsService,
  ) {
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      enableOfflineQueue: false,
    });

    this.client.on("error", (error: Error) => {
      this.metrics.redisError();
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    await this.refreshResourceStats();
    this.telemetryTimer = setInterval(
      () => void this.refreshResourceStats(),
      this.config.redis.metricsIntervalSeconds * 1000,
    );
  }

  async onModuleDestroy(): Promise<void> {
    if (this.telemetryTimer) {
      clearInterval(this.telemetryTimer);
    }
    await this.client.quit();
  }

  // Provides direct access to the raw Redis client instance.
  get raw(): Redis {
    return this.client;
  }

  // Retrieves a JSON value from Redis by key. Returns null if the key does not exist or the value is not valid JSON.
  async getJson<T>(key: string): Promise<T | null> {
    return this.observe(async () => {
      const raw = await this.client.get(key);
      if (raw === null) {
        this.metrics.redisCacheMiss();
        return null;
      }
      this.metrics.redisCacheHit();
      return JSON.parse(raw) as T;
    });
  }

  // Stores a JSON value in Redis under the specified key with a required TTL in seconds.
  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const payload = JSON.stringify(value);
    await this.observe(() => this.client.set(key, payload, "EX", ttlSeconds));
  }

  // Deletes one or more keys from Redis. Returns the number of keys that were deleted.
  async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.client.del(...keys);
  }

  async incrementWithExpiry(key: string, ttlSeconds: number): Promise<number> {
    const result = await this.observe(() => this.client.eval(incrementWithExpiryScript, 1, key, ttlSeconds));
    return Number(result);
  }

  // Deletes all keys matching the given pattern from Redis. Returns the number of keys that were deleted.
  async deleteByPattern(pattern: string): Promise<number> {
    return this.observe(async () => {
      let cursor = "0";
      let deleted = 0;
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", this.config.redis.scanCount);
        cursor = nextCursor;
        if (keys.length > 0) {
          deleted += await this.client.del(...keys);
        }
      } while (cursor !== "0");
      return deleted;
    });
  }

  private async observe<T>(operation: () => Promise<T>): Promise<T> {
    const startedAt = performance.now();
    try {
      return await operation();
    } catch (error) {
      this.metrics.redisError();
      throw error;
    } finally {
      this.metrics.recordRedisCommand(performance.now() - startedAt);
    }
  }

  private async refreshResourceStats(): Promise<void> {
    try {
      const [memory, stats] = await Promise.all([this.client.info("memory"), this.client.info("stats")]);
      this.metrics.setRedisResourceStats(
        this.infoValue(memory, "used_memory"),
        this.infoValue(stats, "evicted_keys"),
      );
    } catch (error) {
      this.metrics.redisError();
      this.logger.warn(`Unable to collect Redis resource statistics: ${(error as Error).message}`);
    }
  }

  private infoValue(info: string, field: string): number {
    const match = info.match(new RegExp(`^${field}:(\\d+)$`, "m"));
    return match ? Number(match[1]) : 0;
  }
}
