import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import type Redis from "ioredis";
import type { Namespace, Socket } from "socket.io";

import { SESSION_REVOCATION_CHANNEL } from "../common/auth/session-revocation";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class SessionRevocationSocketService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SessionRevocationSocketService.name);
  private namespace: Namespace | null = null;
  private subscriber: Redis | null = null;

  constructor(private readonly redis: RedisService) {}

  async onModuleInit(): Promise<void> {
    const subscriber = this.redis.raw.duplicate({ lazyConnect: true });
    try {
      await subscriber.connect();
      await subscriber.subscribe(SESSION_REVOCATION_CHANNEL);
      subscriber.on("message", (channel, sessionId) => {
        if (channel === SESSION_REVOCATION_CHANNEL) {this.disconnectSession(sessionId);}
      });
      this.subscriber = subscriber;
    } catch (error) {
      await subscriber.quit();
      this.logger.warn(`Session revocation listener unavailable: ${(error as Error).message}`);
    }
  }

  bind(namespace: Namespace): void {
    this.namespace = namespace;
  }

  async onModuleDestroy(): Promise<void> {
    await this.subscriber?.quit();
  }

  private disconnectSession(sessionId: string): void {
    for (const socket of this.namespace?.sockets.values() ?? []) {
      if (this.sessionId(socket) !== sessionId) {continue;}
      socket.emit("session:revoked", { message: "Your session has been revoked." });
      socket.disconnect(true);
    }
  }

  private sessionId(socket: Socket): string | undefined {
    const data = socket.data as { principal?: { sessionId?: string } };
    return data.principal?.sessionId;
  }
}