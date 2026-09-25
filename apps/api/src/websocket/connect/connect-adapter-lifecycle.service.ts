import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import { createAdapter } from "@socket.io/redis-adapter";
import type Redis from "ioredis";
import type { Server } from "socket.io";

import { RedisService } from "../../redis/redis.service";

@Injectable()
export class ConnectAdapterLifecycleService implements OnModuleDestroy {
  private readonly logger = new Logger(ConnectAdapterLifecycleService.name);
  private pubClient: Redis | null = null;
  private subClient: Redis | null = null;

  constructor(private readonly redis: RedisService) {}

  async attach(server: Server): Promise<void> {
    if (this.pubClient || this.subClient) {
      return;
    }

    const pubClient = this.redis.raw.duplicate({ lazyConnect: true });
    const subClient = this.redis.raw.duplicate({ lazyConnect: true });
    try {
      await Promise.all([pubClient.connect(), subClient.connect()]);
      server.adapter(createAdapter(pubClient, subClient));
      this.pubClient = pubClient;
      this.subClient = subClient;
      this.logger.log("Connect Socket.IO Redis adapter attached");
    } catch (error) {
      await Promise.allSettled([pubClient.quit(), subClient.quit()]);
      this.logger.warn(`Connect Socket.IO Redis adapter unavailable: ${(error as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.allSettled([
      this.pubClient?.quit() ?? Promise.resolve(),
      this.subClient?.quit() ?? Promise.resolve(),
    ]);
  }
}
