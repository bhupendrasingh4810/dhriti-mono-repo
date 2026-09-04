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
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { AtlasService } from "../modules/atlas/atlas.service";

class JoinPagePayload {
  @IsUUID()
  pageId!: string;
}

class CursorPayload {
  @IsUUID()
  pageId!: string;

  @IsInt()
  @Min(0)
  @Max(200000)
  from!: number;

  @IsInt()
  @Min(0)
  @Max(200000)
  to!: number;
}

class EditPayload {
  @IsUUID()
  pageId!: string;

  @IsString()
  @IsOptional()
  content?: string;
}

const pageRoom = (pageId: string): string => `page:${pageId}`;

interface EditorPresence {
  userId: string;
  socketId: string;
  from: number;
  to: number;
}

@WebSocketGateway({ namespace: "/atlas", cors: { origin: true, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AtlasGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(AtlasGateway.name);

  /** pageId -> editors currently in the room with their cursor positions. */
  private readonly editors = new Map<string, Map<string, EditorPresence>>();

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly atlas: AtlasService,
  ) {}

  afterInit(): void {
    this.logger.log("Atlas WebSocket gateway initialised at namespace /atlas");
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
    // Remove the socket from every page room and broadcast the departure.
    for (const [pageId, roomEditors] of this.editors) {
      if (roomEditors.delete(socket.id)) {
        socket.to(pageRoom(pageId)).emit("page:editor-left", { pageId, userId: principal.userId });
        if (roomEditors.size === 0) {
          this.editors.delete(pageId);
        }
      }
    }
  }

  @SubscribeMessage("page:join")
  async joinPage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinPagePayload,
  ): Promise<{ ok: true; editors: EditorPresence[] }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);

    // Authorize: the page must exist in the org (content read access).
    await this.atlas.getPage(organizationId, payload.pageId);

    await socket.join(pageRoom(payload.pageId));
    const room = this.editors.get(payload.pageId) ?? new Map<string, EditorPresence>();
    const presence: EditorPresence = { userId: principal.userId, socketId: socket.id, from: 0, to: 0 };
    room.set(socket.id, presence);
    this.editors.set(payload.pageId, room);

    socket.to(pageRoom(payload.pageId)).emit("page:editor-joined", {
      pageId: payload.pageId,
      userId: principal.userId,
    });

    return { ok: true, editors: [...room.values()] };
  }

  @SubscribeMessage("page:leave")
  async leavePage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: JoinPagePayload,
  ): Promise<{ ok: true }> {
    const principal = this.wsAuth.getPrincipal(socket);
    await socket.leave(pageRoom(payload.pageId));
    const room = this.editors.get(payload.pageId);
    if (room?.delete(socket.id)) {
      socket.to(pageRoom(payload.pageId)).emit("page:editor-left", {
        pageId: payload.pageId,
        userId: principal.userId,
      });
    }
    return { ok: true };
  }

  @SubscribeMessage("page:cursor")
  cursor(@ConnectedSocket() socket: Socket, @MessageBody() payload: CursorPayload): void {
    const principal = this.wsAuth.getPrincipal(socket);
    const room = this.editors.get(payload.pageId);
    const editor = room?.get(socket.id);
    if (editor) {
      editor.from = payload.from;
      editor.to = payload.to;
    }
    socket.to(pageRoom(payload.pageId)).emit("page:cursor", {
      pageId: payload.pageId,
      userId: principal.userId,
      from: payload.from,
      to: payload.to,
    });
  }

  /**
   * Collaborative edit broadcast. The client sends the latest content; we
   * broadcast it to other editors. Persistence happens via the REST update
   * endpoint (versioned), so this is purely real-time sync.
   */
  @SubscribeMessage("page:edit")
  edit(@ConnectedSocket() socket: Socket, @MessageBody() payload: EditPayload): void {
    const principal = this.wsAuth.getPrincipal(socket);
    socket.to(pageRoom(payload.pageId)).emit("page:edit", {
      pageId: payload.pageId,
      userId: principal.userId,
      content: payload.content,
    });
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
