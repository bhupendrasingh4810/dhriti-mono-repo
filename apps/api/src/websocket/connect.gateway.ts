import { HttpException, HttpStatus, Logger, UsePipes, ValidationPipe } from "@nestjs/common";
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
import type { Namespace, Server, Socket } from "socket.io";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { AppError } from "../common/errors/app-error";
import { ErrorCode } from "../common/errors/error-codes";
import { ConnectService } from "../modules/connect/connect.service";
import { MetricsService } from "../common/metrics/metrics.service";
import { ConnectAdapterLifecycleService } from "./connect/connect-adapter-lifecycle.service";
import { ConnectPresenceService } from "./connect/connect-presence.service";
import { ConnectPublisherService } from "./connect/connect-publisher.service";
import { ConnectRateLimitService } from "./connect/connect-rate-limit.service";
import { SessionRevocationSocketService } from "./session-revocation.service";
import {
  CallInviteEventDto,
  CallResponseEventDto,
  ChannelRoomEventDto,
  MarkChannelReadEventDto,
  PresenceSetEventDto,
  SendMessageEventDto,
  TypingEventDto,
} from "./connect/dto/connect-events.dto";
import { channelRoom, organizationRoom, userRoom } from "./connect/rooms";

const allowedOrigins = (process.env.CONNECT_SOCKET_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

@WebSocketGateway({
  namespace: "/connect",
  cors: { origin: allowedOrigins, credentials: true },
  transports: ["websocket", "polling"],
  allowEIO3: false,
})
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ConnectGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ConnectGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly connect: ConnectService,
    private readonly adapterLifecycle: ConnectAdapterLifecycleService,
    private readonly presence: ConnectPresenceService,
    private readonly publisher: ConnectPublisherService,
    private readonly rateLimit: ConnectRateLimitService,
    private readonly metrics: MetricsService,
    private readonly sessionRevocations: SessionRevocationSocketService,
  ) {}

  async afterInit(): Promise<void> {
    this.logger.log("Connect WebSocket gateway initialised at namespace /connect");
    this.publisher.bind(this.server);
    await this.adapterLifecycle.attach(this.server);
    this.sessionRevocations.bind(this.server as unknown as Namespace);
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const principal = await this.wsAuth.authenticate(socket);
      if (principal.organizationId) {
        const status = await this.presence.connected(principal.organizationId, principal.userId, socket.id);
        await socket.join(organizationRoom(principal.organizationId));
        await socket.join(userRoom(principal.organizationId, principal.userId));
        this.publisher.presenceChanged(principal.organizationId, principal.userId, status);
      }
      this.metrics.wsConnected();
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

    if (principal.organizationId) {
      const status = await this.presence.disconnected(principal.organizationId, principal.userId, socket.id);
      if (status) {
        this.publisher.presenceChanged(principal.organizationId, principal.userId, status);
      }
    }
    this.metrics.wsDisconnected();
  }

  // ---------------- Channels ----------------

  @SubscribeMessage("channel:join")
  async joinChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ChannelRoomEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "channel:join", async (principal, organizationId) => {
      await this.connect.getChannelForMember(organizationId, payload.channelId, principal.userId, true);
      await socket.join(channelRoom(organizationId, payload.channelId));
      return { ok: true };
    });
  }

  @SubscribeMessage("channel:leave")
  async leaveChannel(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ChannelRoomEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "channel:leave", async (principal, organizationId) => {
      await this.connect.getChannelForMember(organizationId, payload.channelId, principal.userId);
      await socket.leave(channelRoom(organizationId, payload.channelId));
      return { ok: true };
    });
  }

  // ---------------- Typing ----------------

  @SubscribeMessage("typing")
  async typing(@ConnectedSocket() socket: Socket, @MessageBody() payload: TypingEventDto): Promise<SocketAck> {
    return this.execute(socket, "typing", async (principal, organizationId) => {
      await this.connect.getChannelForMember(organizationId, payload.channelId, principal.userId, true);
      await this.presence.setTyping(organizationId, payload.channelId, principal.userId, payload.isTyping);
      this.publisher.typingChanged(organizationId, payload.channelId, socket.id, principal.userId, payload.isTyping);
      return { ok: true };
    });
  }

  // ---------------- Messages ----------------

  @SubscribeMessage("message:send")
  async sendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessageEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "message:send", async (principal, organizationId) => {
      const message = await this.connect.createMessage(organizationId, payload.channelId, principal.userId, {
        content: payload.content,
        parentId: payload.parentId,
        clientMessageId: payload.clientMessageId,
      });
      return { ok: true, message };
    });
  }

  // ---------------- Presence ----------------

  @SubscribeMessage("presence:set")
  async setPresence(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: PresenceSetEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "presence:set", async (principal, organizationId) => {
      await this.presence.setStatus(organizationId, principal.userId, payload.status);
      this.publisher.presenceChanged(organizationId, principal.userId, payload.status);
      return { ok: true };
    });
  }

  @SubscribeMessage("channel:mark-read")
  async markChannelRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MarkChannelReadEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "channel:mark-read", async (principal, organizationId) => {
      await this.connect.markChannelRead(organizationId, payload.channelId, principal.userId, payload.messageId);
      return { ok: true };
    });
  }

  // ---------------- Calls ----------------

  @SubscribeMessage("call:invite")
  async inviteCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: CallInviteEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "call:invite", async (principal, organizationId) => {
      const channel = await this.connect.getChannelForMember(organizationId, payload.channelId, principal.userId, true);
      const memberIds = await this.connect.getChannelMemberIds(organizationId, payload.channelId, principal.userId);
      const callerName = payload.callerName?.trim()
        || (await this.connect.getUserDisplayName(principal.userId)).trim()
        || principal.email
        || "Someone";
      const type = payload.type ?? payload.kind;
      if (!type) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "A call type is required", HttpStatus.BAD_REQUEST);
      }
      const scope = payload.scope === "meeting"
        ? "meeting"
        : channel.type === "DIRECT"
          ? "one-to-one"
          : channel.type === "GROUP"
            ? "group"
            : "channel";
      const invitation = {
        ...payload,
        type,
        scope,
        participantIds: memberIds,
        conversationName: channel.type === "DIRECT" ? "" : payload.conversationName,
        callerId: principal.userId,
        callerName,
      };
      await this.connect.createCallRecord(organizationId, payload.channelId, principal.userId, {
        callId: payload.callId,
        scope,
        type,
        participantIds: memberIds,
      });
      const recipients = memberIds.filter((userId) => userId !== principal.userId);
      if (scope === "group" || scope === "channel") {
        this.publisher.callAvailable(organizationId, recipients, invitation);
      } else {
        this.publisher.callInvitation(organizationId, recipients, invitation);
      }
      await this.connect.recordCallActivity(organizationId, payload.channelId, principal.userId, {
        callId: payload.callId,
        action: "initiated",
        type,
      });
      return { ok: true };
    });
  }

  @SubscribeMessage("call:respond")
  async respondToCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: CallResponseEventDto,
  ): Promise<SocketAck> {
    return this.execute(socket, "call:respond", async (principal, organizationId) => {
      const memberIds = await this.connect.getChannelMemberIds(organizationId, payload.channelId, principal.userId);
      const event = payload.action === "accept"
        ? "call:accepted"
        : payload.action === "reject"
          ? "call:rejected"
          : payload.action === "miss" || payload.action === "cancel"
            ? "call:cancelled"
            : "call:ended";
      if (payload.action === "leave") {
        const result = await this.connect.leaveSharedCall(organizationId, payload.channelId, principal.userId, payload.callId);
        this.publisher.callStatus(organizationId, memberIds, result.ended ? "call:ended" : "call:left", { ...payload, userId: principal.userId });
        return { ok: true };
      }
      await this.connect.updateCallRecord(organizationId, payload.channelId, principal.userId, {
            callId: payload.callId,
            action: payload.action,
            durationSeconds: payload.durationSeconds,
          });
      this.publisher.callStatus(organizationId, memberIds, event, { ...payload, userId: principal.userId });
      await this.connect.recordCallActivity(organizationId, payload.channelId, principal.userId, {
        callId: payload.callId,
        action: payload.action === "accept" ? "accepted" : payload.action === "reject" ? "declined" : payload.action === "miss" || payload.action === "cancel" ? "missed" : "ended",
        durationSeconds: payload.action === "end" ? payload.durationSeconds : undefined,
      });
      return { ok: true };
    });
  }

  // ---------------- Internals ----------------

  private assertOrg(principal: WsPrincipal): string {
    if (!principal.organizationId) {
      throw new AppError(ErrorCode.ORGANIZATION_REQUIRED, "An active organization is required", HttpStatus.BAD_REQUEST);
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

  private async execute(
    socket: Socket,
    eventName: string,
    action: (principal: WsPrincipal, organizationId: string) => Promise<SocketAck>,
  ): Promise<SocketAck> {
    try {
      const principal = this.wsAuth.getPrincipal(socket);
      const organizationId = this.assertOrg(principal);
      await this.rateLimit.assertAllowed(organizationId, principal.userId, eventName);
      this.metrics.wsMessage();
      return await action(principal, organizationId);
    } catch (error) {
      const response = this.errorAck(error);
      socket.emit("connect:error", response.error);
      return response;
    }
  }

  private errorAck(error: unknown): SocketErrorAck {
    if (error instanceof AppError) {
      return { ok: false, error: { code: error.code, message: error.message, status: error.getStatus() } };
    }
    if (error instanceof HttpException) {
      return {
        ok: false,
        error: { code: ErrorCode.VALIDATION_FAILED, message: error.message, status: error.getStatus() },
      };
    }
    this.logger.error("Connect Socket.IO event failed", error instanceof Error ? error.stack : undefined);
    return {
      ok: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "Unable to process Connect event",
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    };
  }
}

type SocketErrorAck = {
  ok: false;
  error: { code: ErrorCode; message: string; status: number };
};

type SocketAck = { ok: true; message?: unknown } | SocketErrorAck;
