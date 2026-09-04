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
import { IsIn, IsString, IsUUID } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";

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

interface CallParticipant {
  socketId: string;
  userId: string;
  joinedAt: number;
}

@WebSocketGateway({ namespace: "/connect", cors: { origin: true, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class WebRtcGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebRtcGateway.name);

  /** channelId -> active participants in the call. */
  private readonly calls = new Map<string, Map<string, CallParticipant>>();

  @WebSocketServer()
  private server!: Server;

  constructor(private readonly wsAuth: WsAuthService) {}

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
    const principal = this.wsAuth.getPrincipal(socket);
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
  async leaveCall(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinCallPayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
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
  signal(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SignalPayload,
  ): void {
    const principal = this.wsAuth.getPrincipal(socket);
    this.server.to(payload.to).emit("call:signal", {
      channelId: payload.channelId,
      from: socket.id,
      userId: principal.userId,
      data: payload.data,
    });
  }

  /** Broadcast mute/video/screen-share state to the call room. */
  @SubscribeMessage("call:media-state")
  mediaState(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: MediaStatePayload,
  ): void {
    const principal = this.wsAuth.getPrincipal(socket);
    socket.to(callRoom(payload.channelId)).emit("call:media-state", {
      channelId: payload.channelId,
      userId: principal.userId,
      kind: payload.kind,
      state: payload.state,
    });
  }

  private safePrincipal(socket: Socket): WsPrincipal | null {
    try {
      return this.wsAuth.getPrincipal(socket);
    } catch {
      return null;
    }
  }
}
