import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import Redis from "ioredis";

import { ApiConfigService } from "../config/config.service";

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ApiConfigService) {
    this.client = new Redis(config.redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 3,
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

  get raw(): Redis {
    return this.client;
  }

  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    if (raw === null) {
      return null;
    }
    return JSON.parse(raw) as T;
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const payload = JSON.stringify(value);
    if (ttlSeconds !== undefined) {
      await this.client.set(key, payload, "EX", ttlSeconds);
      return;
    }
    await this.client.set(key, payload);
  }

  async delete(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return this.client.del(...keys);
  }

  async deleteByPattern(pattern: string): Promise<number> {
    let cursor = "0";
    let deleted = 0;
    do {
      const [nextCursor, keys] = await this.client.scan(cursor, "MATCH", pattern, "COUNT", 200);
      cursor = nextCursor;
      if (keys.length > 0) {
        deleted += await this.client.del(...keys);
      }
    } while (cursor !== "0");
    return deleted;
  }
}
