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
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { IssueStatus } from "@prisma/client";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { FlowService } from "../modules/flow/flow.service";

class JoinProjectPayload {
  @IsUUID()
  projectId!: string;
}

class MoveIssuePayload {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  issueId!: string;

  @IsEnum(IssueStatus)
  status!: IssueStatus;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;
}

class IssueChangedPayload {
  @IsUUID()
  projectId!: string;

  @IsUUID()
  issueId!: string;
}

const projectRoom = (projectId: string): string => `flow:project:${projectId}`;

@WebSocketGateway({ namespace: "/flow", cors: { origin: true, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class FlowGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(FlowGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly flow: FlowService,
  ) {}

  afterInit(): void {
    this.logger.log("Flow WebSocket gateway initialised at namespace /flow");
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const principal = await this.wsAuth.authenticate(socket);
      if (principal.organizationId) {
        await socket.join(`org:${principal.organizationId}`);
      }
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.emit("error", { code: "UNAUTHORIZED", message: "Authentication failed" });
      socket.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // No per-connection state for Flow.
  }

  @SubscribeMessage("project:join")
  async joinProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinProjectPayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);
    await this.flow.getProject(organizationId, payload.projectId);
    await socket.join(projectRoom(payload.projectId));
    return { ok: true };
  }

  @SubscribeMessage("project:leave")
  async leaveProject(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinProjectPayload,
  ): Promise<{ ok: true }> {
    await socket.leave(projectRoom(payload.projectId));
    return { ok: true };
  }

  /** Kanban drag-and-drop: persist the move and broadcast to the board. */
  @SubscribeMessage("issue:move")
  async moveIssue(@ConnectedSocket() socket: Socket, @MessageBody() payload: MoveIssuePayload): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);

    const issue = await this.flow.moveIssue(organizationId, payload.issueId, principal.userId, {
      status: payload.status,
      position: payload.position,
    });

    this.server.to(projectRoom(payload.projectId)).emit("issue:moved", {
      projectId: payload.projectId,
      issue: {
        id: issue.id,
        status: issue.status,
        position: issue.position,
        assigneeId: issue.assigneeId,
      },
    });
    return { ok: true };
  }

  /** Generic issue-updated broadcast so other clients refetch the issue. */
  @SubscribeMessage("issue:changed")
  issueChanged(@ConnectedSocket() socket: Socket, @MessageBody() payload: IssueChangedPayload): void {
    socket.to(projectRoom(payload.projectId)).emit("issue:changed", {
      projectId: payload.projectId,
      issueId: payload.issueId,
    });
  }

  private assertOrg(principal: WsPrincipal): string {
    if (!principal.organizationId) {
      throw new Error("No active organization on this connection");
    }
    return principal.organizationId;
  }
}
