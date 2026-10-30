import { Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import { WebSocketGateway, WebSocketServer, type OnGatewayConnection } from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";
import type Redis from "ioredis";
import { RedisService } from "../redis/redis.service";
import { PrismaService } from "../database/prisma.service";
import { NOTIFICATION_UPDATES_CHANNEL } from "../modules/notification/notification-worker.service";
import { WsAuthService } from "./ws-auth";

@WebSocketGateway({ namespace: "/notifications", cors: { origin: true, credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnModuleInit, OnModuleDestroy {
  @WebSocketServer()
  private server!: Namespace;
  private readonly logger = new Logger(NotificationsGateway.name);
  private subscriber?: Redis;
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly auth: WsAuthService,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    this.subscriber = this.redis.raw.duplicate({ lazyConnect: true });
    await this.subscriber.connect();
    await this.subscriber.subscribe(NOTIFICATION_UPDATES_CHANNEL);
    this.subscriber.on("message", (_channel, message) => {
      try {
        const event: unknown = JSON.parse(message);
        if (
          !event ||
          typeof event !== "object" ||
          !("organizationId" in event) ||
          !("userId" in event) ||
          typeof event.organizationId !== "string" ||
          typeof event.userId !== "string"
        ) {
          throw new Error("Malformed notification invalidation");
        }
        // Every instance subscribes; emit only to local sockets to avoid duplicate fan-out.
        this.server?.local.to(`${event.organizationId}:${event.userId}`).emit("notifications:changed", {});
      } catch (error) {
        this.logger.error("Invalid notification update", error instanceof Error ? error.stack : String(error));
      }
    });
    this.timer = setInterval(() => {
      void this.revalidateConnections();
    }, 60000);
    this.timer.unref();
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const principal = await this.auth.authenticate(socket);
      const member =
        principal.organizationId &&
        (await this.prisma.organizationMember.findFirst({
          where: {
            organizationId: principal.organizationId,
            userId: principal.userId,
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { id: true },
        }));
      if (!member) {
        throw new Error("Active organization membership required");
      }
      await socket.join(`${principal.organizationId}:${principal.userId}`);
    } catch (error) {
      this.logger.warn(`Notification socket rejected: ${error instanceof Error ? error.message : String(error)}`);
      socket.disconnect(true);
    }
  }

  private async revalidateConnections(): Promise<void> {
    try {
      // Reauthentication enforces token expiry, session revocation and membership changes.
      for (const socket of this.server.sockets.values()) {
        await this.handleConnection(socket);
      }
    } catch (error) {
      this.logger.error(
        "Notification socket revalidation failed",
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.subscriber?.quit();
  }
}
