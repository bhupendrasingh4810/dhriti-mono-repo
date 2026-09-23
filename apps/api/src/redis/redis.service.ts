import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

import { ApiConfigService } from "../config/config.service";

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
  private readonly config: ApiConfigService;

  constructor(config: ApiConfigService) {
    this.config = config;
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
      enableOfflineQueue: false,
    });

    this.client.on("error", (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  // Provides direct access to the raw Redis client instance.
  get raw(): Redis {
    return this.client;
  }

  // Retrieves a JSON value from Redis by key. Returns null if the key does not exist or the value is not valid JSON.
  // Stores a JSON value in Redis under the specified key with an optional TTL (time-to-live) in seconds.
  // If TTL is not provided, the key will persist until explicitly deleted.
  // Deletes one or more keys from Redis. Returns the number of keys that were deleted.
  // Deletes all keys matching the given pattern from Redis. Returns the number of keys that were deleted.
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  // Stores a JSON value in Redis under the specified key with an optional TTL (time-to-live) in seconds.
  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await this.client.set(key, payload, "EX", ttlSeconds);
      return;
    }
    await this.client.set(key, payload);
  }

  // Deletes one or more keys from Redis. Returns the number of keys that were deleted.
  async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.client.del(...keys);
  }
  // Deletes all keys matching the given pattern from Redis. Returns the number of keys that were deleted.
  async deleteByPattern(pattern: string): Promise<number> {
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
  }
}
