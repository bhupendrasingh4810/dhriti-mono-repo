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
import { IsUUID } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { CadenceService } from "../modules/cadence/cadence.service";

class SessionPayload {
  @IsUUID()
  sessionId!: string;
}

class VotePayload {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  cardId!: string;
}

class PhasePayload {
  @IsUUID()
  sessionId!: string;

  @IsUUID()
  phase!: string;
}

const sessionRoom = (sessionId: string): string => `cadence:${sessionId}`;

@WebSocketGateway({ namespace: "/cadence", cors: { origin: true, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CadenceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(CadenceGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly cadence: CadenceService,
  ) {}

  afterInit(): void {
    this.logger.log("Cadence WebSocket gateway initialised at namespace /cadence");
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

  handleDisconnect(): void {
    // Room membership cleaned up automatically.
  }

  @SubscribeMessage("session:join")
  async joinSession(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SessionPayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    // Authorize: the session must exist in the org.
    await this.cadence.getSession(organizationId, payload.sessionId, principal.userId);
    await socket.join(sessionRoom(payload.sessionId));
    return { ok: true };
  }

  @SubscribeMessage("session:leave")
  async leaveSession(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SessionPayload,
  ): Promise<{ ok: true }> {
    await socket.leave(sessionRoom(payload.sessionId));
    return { ok: true };
  }

  /** Anonymous voting sync: broadcast a vote change without exposing the voter. */
  @SubscribeMessage("card:vote")
  async vote(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: VotePayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    await this.cadence.vote(organizationId, payload.sessionId, payload.cardId, principal.userId);

    // Broadcast only the count delta; the voter's identity stays private.
    this.server.to(sessionRoom(payload.sessionId)).emit("card:vote-changed", {
      sessionId: payload.sessionId,
      cardId: payload.cardId,
    });
    return { ok: true };
  }

  @SubscribeMessage("card:unvote")
  async unvote(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: VotePayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    await this.cadence.unvote(organizationId, payload.sessionId, payload.cardId, principal.userId);
    this.server.to(sessionRoom(payload.sessionId)).emit("card:vote-changed", {
      sessionId: payload.sessionId,
      cardId: payload.cardId,
    });
    return { ok: true };
  }

  /** Facilitator phase transition broadcast. */
  @SubscribeMessage("session:phase")
  async setPhase(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: PhasePayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    const updated = await this.cadence.setPhase(
      organizationId,
      payload.sessionId,
      principal.userId,
      payload.phase as never,
    );

    this.server.to(sessionRoom(payload.sessionId)).emit("session:phase-changed", {
      sessionId: payload.sessionId,
      phase: updated.phase,
    });
    return { ok: true };
  }

  private assertOrg(principal: WsPrincipal): string {
    if (!principal.organizationId) {
      throw new Error("No active organization on this connection");
    }
    return principal.organizationId;
  }
}
