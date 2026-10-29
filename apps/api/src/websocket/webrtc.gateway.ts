import { HttpStatus, Logger, UsePipes, ValidationPipe } from "@nestjs/common";
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
import { IsIn, IsString, IsUUID, MaxLength } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { ConnectService } from "../modules/connect/connect.service";
import { AppError } from "../common/errors/app-error";
import { ErrorCode } from "../common/errors/error-codes";

/**
 * WebRTC signaling for Connect audio/video calls. This gateway only relays
 * SDP offers/answers and ICE candidates between peers in a call room; it never
 * touches media. Joins the Connect namespace so call signaling lives with chat.
 */

class JoinCallPayload {
  @IsUUID()
  channelId!: string;
}

class SignalPayload {
  @IsUUID()
  channelId!: string;

  /** Target socket id to relay to (the peer). */
  @IsString()
  to!: string;

  @IsString()
  @MaxLength(65_536)
  data!: string; // SDP offer/answer or ICE candidate (JSON string)
}

class MediaStatePayload {
  @IsUUID()
  channelId!: string;

  @IsIn(["audio", "video", "screen"])
  kind!: "audio" | "video" | "screen";

  @IsIn(["on", "off"])
  state!: "on" | "off";
}

const callRoom = (channelId: string): string => `call:${channelId}`;
const allowedOrigins = (process.env.CONNECT_SOCKET_ALLOWED_ORIGINS ?? process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

interface CallParticipant {
  socketId: string;
  userId: string;
  joinedAt: number;
}

@WebSocketGateway({ namespace: "/connect", cors: { origin: allowedOrigins, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class WebRtcGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebRtcGateway.name);

  /** channelId -> active participants in the call. */
  private readonly calls = new Map<string, Map<string, CallParticipant>>();

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly connect: ConnectService,
  ) {}

  afterInit(): void {
    this.logger.log("WebRTC signaling ready on /connect namespace");
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      await this.wsAuth.authenticate(socket);
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.emit("error", { code: "UNAUTHORIZED", message: "Authentication failed" });
      socket.disconnect(true);
    }
  }

  handleDisconnect(socket: Socket): void {
    const principal = this.safePrincipal(socket);
    if (!principal) {
      return;
    }
    for (const [channelId, participants] of this.calls) {
      if (participants.delete(socket.id)) {
        socket.to(callRoom(channelId)).emit("call:peer-left", {
          channelId,
          userId: principal.userId,
          socketId: socket.id,
        });
        if (participants.size === 0) {
          this.calls.delete(channelId);
        }
      }
    }
  }

  @SubscribeMessage("call:join")
  async joinCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinCallPayload,
  ): Promise<{ ok: true; peers: Array<{ socketId: string; userId: string }> }> {
    const principal = await this.authorizeChannelMember(socket, payload.channelId);
    await socket.join(callRoom(payload.channelId));

    const room = this.calls.get(payload.channelId) ?? new Map<string, CallParticipant>();
    const participant: CallParticipant = { socketId: socket.id, userId: principal.userId, joinedAt: Date.now() };
    const peers = [...room.values()].map(({ socketId, userId }) => ({ socketId, userId }));
    room.set(socket.id, participant);
    this.calls.set(payload.channelId, room);

    socket.to(callRoom(payload.channelId)).emit("call:peer-joined", {
      channelId: payload.channelId,
      userId: principal.userId,
      socketId: socket.id,
    });

    return { ok: true, peers };
  }

  @SubscribeMessage("call:leave")
  async leaveCall(@ConnectedSocket() socket: Socket, @MessageBody() payload: JoinCallPayload): Promise<{ ok: true }> {
    const principal = await this.authorizeChannelMember(socket, payload.channelId);
    await socket.leave(callRoom(payload.channelId));
    const room = this.calls.get(payload.channelId);
    if (room?.delete(socket.id)) {
      socket.to(callRoom(payload.channelId)).emit("call:peer-left", {
        channelId: payload.channelId,
        userId: principal.userId,
        socketId: socket.id,
      });
    }
    return { ok: true };
  }

  /** Relay SDP offer/answer to a specific peer. */
  @SubscribeMessage("call:signal")
  async signal(@ConnectedSocket() socket: Socket, @MessageBody() payload: SignalPayload): Promise<{ ok: true }> {
    const principal = await this.authorizeChannelMember(socket, payload.channelId);
    const room = this.requireActiveParticipant(payload.channelId, socket.id);
    if (!room.has(payload.to)) {
      throw new AppError(ErrorCode.FORBIDDEN, "Signal target is not an active call participant", HttpStatus.FORBIDDEN);
    }
    this.server.to(payload.to).emit("call:signal", {
      channelId: payload.channelId,
      from: socket.id,
      userId: principal.userId,
      data: payload.data,
    });
    return { ok: true };
  }

  /** Broadcast mute/video/screen-share state to the call room. */
  @SubscribeMessage("call:media-state")
  async mediaState(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MediaStatePayload,
  ): Promise<{ ok: true }> {
    const principal = await this.authorizeChannelMember(socket, payload.channelId);
    this.requireActiveParticipant(payload.channelId, socket.id);
    socket.to(callRoom(payload.channelId)).emit("call:media-state", {
      channelId: payload.channelId,
      userId: principal.userId,
      kind: payload.kind,
      state: payload.state,
    });
    return { ok: true };
  }

  private async authorizeChannelMember(socket: Socket, channelId: string): Promise<WsPrincipal> {
    const principal = this.wsAuth.getPrincipal(socket);
    if (!principal.organizationId) {
      throw new AppError(ErrorCode.ORGANIZATION_REQUIRED, "An active organization is required", HttpStatus.BAD_REQUEST);
    }
    await this.connect.getChannelForMember(principal.organizationId, channelId, principal.userId, true);
    return principal;
  }

  private requireActiveParticipant(channelId: string, socketId: string): Map<string, CallParticipant> {
    const room = this.calls.get(channelId);
    if (!room?.has(socketId)) {
      throw new AppError(ErrorCode.FORBIDDEN, "Join the call before sending call events", HttpStatus.FORBIDDEN);
    }
    return room;
  }

  private safePrincipal(socket: Socket): WsPrincipal | null {
    try {
      return this.wsAuth.getPrincipal(socket);
    } catch {
      return null;
    }
  }
}
