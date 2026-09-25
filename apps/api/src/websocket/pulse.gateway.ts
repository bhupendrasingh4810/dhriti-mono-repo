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
import { IsDateString, IsOptional, IsString, IsUUID } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { PulseService } from "../modules/pulse/pulse.service";

class CheckConflictPayload {
  @IsDateString()
  startsAt!: string;

  @IsDateString()
  endsAt!: string;

  @IsUUID()
  @IsOptional()
  excludeEventId?: string;
}

class RsvpUpdatePayload {
  @IsUUID()
  eventId!: string;

  @IsString()
  status!: string;
}

const orgRoom = (organizationId: string): string => `org:${organizationId}`;

@WebSocketGateway({ namespace: "/pulse", cors: { origin: true, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PulseGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PulseGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly pulse: PulseService,
  ) {}

  afterInit(): void {
    this.logger.log("Pulse WebSocket gateway initialised at namespace /pulse");
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const principal = await this.wsAuth.authenticate(socket);
      if (principal.organizationId) {
        await socket.join(orgRoom(principal.organizationId));
      }
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.emit("error", { code: "UNAUTHORIZED", message: "Authentication failed" });
      socket.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // No per-connection state to clean up for Pulse.
  }

  /**
   * Live calendar conflict check: the client sends a proposed time range and
   * receives the conflicting events for the current user.
   */
  @SubscribeMessage("schedule:check")
  async checkConflict(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: CheckConflictPayload,
  ): Promise<{ conflicts: unknown[] }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);

    const conflicts = await this.pulse.findConflicts(
      organizationId,
      principal.userId,
      payload.startsAt,
      payload.endsAt,
      payload.excludeEventId,
    );
    return { conflicts };
  }

  /** Broadcast an RSVP change so other clients update attendee counts. */
  @SubscribeMessage("event:rsvp-changed")
  rsvpChanged(@ConnectedSocket() socket: Socket, @MessageBody() payload: RsvpUpdatePayload): void {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    this.server.to(orgRoom(organizationId)).emit("event:rsvp-changed", {
      eventId: payload.eventId,
      userId: principal.userId,
      status: payload.status,
    });
  }

  private assertOrg(principal: WsPrincipal): string {
    if (!principal.organizationId) {
      throw new Error("No active organization on this connection");
    }
    return principal.organizationId;
  }
}
