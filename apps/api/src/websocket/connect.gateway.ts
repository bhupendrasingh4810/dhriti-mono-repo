import { Logger, UsePipes, ValidationPipe } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Server, Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { IsBoolean, IsIn, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { ConnectService } from "../modules/connect/connect.service";
import { RedisService } from "../redis/redis.service";

// ------------------------------------------------------------------
// Event payloads (validated)
// ------------------------------------------------------------------

class JoinChannelPayload {
  @IsUUID()
  channelId!: string;
}

class TypingPayload {
  @IsUUID()
  channelId!: string;

  @IsBoolean()
  isTyping!: boolean;
}

class SendMessagePayload {
  @IsUUID()
  channelId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string;

  @IsUUID()
  parentId?: string;
}

class PresencePayload {
  @IsIn(["online", "away", "dnd", "in-meeting", "offline"])
  status!: "online" | "away" | "dnd" | "in-meeting" | "offline";
}

// ------------------------------------------------------------------
// Room naming helpers
// ------------------------------------------------------------------

const channelRoom = (channelId: string): string => `channel:${channelId}`;
const orgRoom = (organizationId: string): string => `org:${organizationId}`;

type PresenceStatus = "online" | "away" | "dnd" | "in-meeting" | "offline";

@WebSocketGateway({
  namespace: "/connect",
  cors: { origin: true, credentials: true },
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ConnectGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ConnectGateway.name);

  /** userId -> set of connected socket ids (supports multi-tab). */
  private readonly onlineSockets = new Map<string, Set<string>>();
  /** userId -> presence status. */
  private readonly presence = new Map<string, PresenceStatus>();

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly connect: ConnectService,
    private readonly redis: RedisService,
  ) {}

  afterInit(): void {
    this.logger.log("Connect WebSocket gateway initialised at namespace /connect");
    this.attachRedisAdapter();
  }

  /**
   * Attach the Redis pub/sub adapter so multiple API replicas share rooms and
   * broadcasts. Falls back to in-memory if Redis is briefly unavailable.
   */
  private attachRedisAdapter(): void {
    try {
      const pubClient = this.redis.raw.duplicate({ lazyConnect: false });
      const subClient = this.redis.raw.duplicate({ lazyConnect: false });
      this.server.adapter(createAdapter(pubClient, subClient));
      this.logger.log("Socket.io Redis adapter attached");
    } catch (error) {
      this.logger.warn(
        `Redis adapter not attached (in-memory only): ${(error as Error).message}`,
      );
    }
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const principal = await this.wsAuth.authenticate(socket);
      this.trackConnection(principal, socket);

      if (principal.organizationId) {
        await socket.join(orgRoom(principal.organizationId));
        this.broadcastPresence(principal.organizationId, principal.userId, this.presenceOf(principal.userId));
      }
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.emit("error", { code: "UNAUTHORIZED", message: "Authentication failed" });
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket): Promise<void> {
    const principal = this.safePrincipal(socket);
    if (!principal) {
      return;
    }

    this.untrackConnection(principal, socket);
    if (principal.organizationId && !this.onlineSockets.has(principal.userId)) {
      this.presence.set(principal.userId, "offline");
      this.broadcastPresence(principal.organizationId, principal.userId, "offline");
    }
  }

  // ---------------- Channels ----------------

  @SubscribeMessage("channel:join")
  async joinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinChannelPayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    this.assertOrg(principal);
    await this.connect.getChannelForMember(
      principal.organizationId as string,
      payload.channelId,
      principal.userId,
    );
    await socket.join(channelRoom(payload.channelId));
    return { ok: true };
  }

  @SubscribeMessage("channel:leave")
  async leaveChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinChannelPayload,
  ): Promise<{ ok: true }> {
    await socket.leave(channelRoom(payload.channelId));
    return { ok: true };
  }

  // ---------------- Typing ----------------

  @SubscribeMessage("typing")
  async typing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TypingPayload,
  ): Promise<void> {
    const principal = this.wsAuth.getPrincipal(socket);
    socket.to(channelRoom(payload.channelId)).emit("typing", {
      channelId: payload.channelId,
      userId: principal.userId,
      isTyping: payload.isTyping,
    });
  }

  // ---------------- Messages ----------------

  @SubscribeMessage("message:send")
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<{ ok: true; message: unknown }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);

    const message = await this.connect.createMessage(organizationId, payload.channelId, principal.userId, {
      content: payload.content,
      parentId: payload.parentId,
    });

    this.server.to(channelRoom(payload.channelId)).emit("message:created", message);
    return { ok: true, message };
  }

  // ---------------- Presence ----------------

  @SubscribeMessage("presence:set")
  setPresence(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: PresencePayload,
  ): void {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    this.presence.set(principal.userId, payload.status);
    this.broadcastPresence(organizationId, principal.userId, payload.status);
  }

  // ---------------- Internals ----------------

  private trackConnection(principal: WsPrincipal, socket: Socket): void {
    const sockets = this.onlineSockets.get(principal.userId) ?? new Set<string>();
    sockets.add(socket.id);
    this.onlineSockets.set(principal.userId, sockets);
    if (!this.presence.has(principal.userId)) {
      this.presence.set(principal.userId, "online");
    }
  }

  private untrackConnection(principal: WsPrincipal, socket: Socket): void {
    const sockets = this.onlineSockets.get(principal.userId);
    if (!sockets) {
      return;
    }
    sockets.delete(socket.id);
    if (sockets.size === 0) {
      this.onlineSockets.delete(principal.userId);
    }
  }

  private presenceOf(userId: string): PresenceStatus {
    return this.onlineSockets.has(userId) ? (this.presence.get(userId) ?? "online") : "offline";
  }

  private broadcastPresence(organizationId: string, userId: string, status: PresenceStatus): void {
    this.server.to(orgRoom(organizationId)).emit("presence:changed", { userId, status });
  }

  private assertOrg(principal: WsPrincipal): string {
    if (!principal.organizationId) {
      throw new Error("No active organization on this connection");
    }
    return principal.organizationId;
  }

  private safePrincipal(socket: Socket): WsPrincipal | null {
    try {
      return this.wsAuth.getPrincipal(socket);
    } catch {
      return null;
    }
  }
}
