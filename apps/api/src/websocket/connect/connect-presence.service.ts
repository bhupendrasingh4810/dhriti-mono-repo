import { Injectable } from "@nestjs/common";

import { ApiConfigService } from "../../config/config.service";
import { RedisService } from "../../redis/redis.service";
import type { PresenceStatus } from "./dto/connect-events.dto";

@Injectable()
export class ConnectPresenceService {
  constructor(
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
  ) {}

  async connected(organizationId: string, userId: string, socketId: string): Promise<PresenceStatus> {
    const ttl = this.config.connectSocket.presenceTtlSeconds;
    await this.redis.raw.sadd(this.socketKey(organizationId, userId), socketId);
    await this.redis.raw.expire(this.socketKey(organizationId, userId), ttl);

    const current = await this.redis.raw.get(this.statusKey(organizationId, userId));
    if (this.isPresenceStatus(current) && current !== "offline") {
      await this.redis.raw.expire(this.statusKey(organizationId, userId), ttl);
      return current;
    }

    await this.redis.raw.set(this.statusKey(organizationId, userId), "online", "EX", ttl);
    return "online";
  }

  async disconnected(organizationId: string, userId: string, socketId: string): Promise<PresenceStatus | null> {
    const ttl = this.config.connectSocket.presenceTtlSeconds;
    const sockets = this.socketKey(organizationId, userId);
    await this.redis.raw.srem(sockets, socketId);
    const remaining = await this.redis.raw.scard(sockets);
    if (remaining > 0) {
      await this.redis.raw.expire(sockets, ttl);
      return null;
    }

    await this.redis.raw.del(sockets, this.statusKey(organizationId, userId));
    return "offline";
  }

  async setStatus(organizationId: string, userId: string, status: PresenceStatus): Promise<void> {
    await this.redis.raw.set(
      this.statusKey(organizationId, userId),
      status,
      "EX",
      this.config.connectSocket.presenceTtlSeconds,
    );
  }

  async setTyping(organizationId: string, channelId: string, userId: string, isTyping: boolean): Promise<void> {
    const key = `connect:typing:${organizationId}:${channelId}:${userId}`;
    if (!isTyping) {
      await this.redis.raw.del(key);
      return;
    }
    await this.redis.raw.set(key, "1", "EX", this.config.connectSocket.typingTtlSeconds);
  }

  private socketKey(organizationId: string, userId: string): string {
    return `connect:presence:${organizationId}:${userId}:sockets`;
  }

  private statusKey(organizationId: string, userId: string): string {
    return `connect:presence:${organizationId}:${userId}:status`;
  }

  private isPresenceStatus(value: string | null): value is PresenceStatus {
    return value === "online" || value === "away" || value === "dnd" || value === "in-meeting" || value === "offline";
  }
}
