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
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

import { WsAuthService, type WsPrincipal } from "./ws-auth";
import { NexusService } from "../modules/nexus/nexus.service";
import { AiProviderService, type ChatMessage } from "../modules/nexus/ai-provider.service";

class AskStreamPayload {
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  question!: string;

  @IsUUID()
  @IsOptional()
  conversationId?: string;
}

const userRoom = (userId: string): string => `user:${userId}`;

@WebSocketGateway({ namespace: "/nexus", cors: { origin: true, credentials: true } })
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class NexusGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NexusGateway.name);

  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly wsAuth: WsAuthService,
    private readonly nexus: NexusService,
    private readonly ai: AiProviderService,
  ) {}

  afterInit(): void {
    this.logger.log("Nexus WebSocket gateway initialised at namespace /nexus");
  }

  async handleConnection(socket: Socket): Promise<void> {
    try {
      const principal = await this.wsAuth.authenticate(socket);
      await socket.join(userRoom(principal.userId));
    } catch (error) {
      this.logger.warn(`Connection rejected: ${(error as Error).message}`);
      socket.emit("error", { code: "UNAUTHORIZED", message: "Authentication failed" });
      socket.disconnect(true);
    }
  }

  handleDisconnect(): void {
    // Room membership is cleaned up by socket.io automatically.
  }

  /**
   * Token-by-token AI response streaming. Emits:
   *  - nexus:answer:start  { conversationId }
   *  - nexus:answer:token  { token }
   *  - nexus:answer:done   { conversationId, answer }
   *  - nexus:answer:error  { message }
   */
  @SubscribeMessage("ask:stream")
  async askStream(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: AskStreamPayload,
  ): Promise<{ ok: true; conversationId: string }> {
    const principal = this.wsAuth.getPrincipal(socket);
    const organizationId = this.assertOrg(principal);

    socket.emit("nexus:answer:start", {});

    try {
      // Persist the question and get the conversation, streaming the answer.
      const stream = this.ai.chatStream([
        { role: "system", content: "You are Nexus, the Dhriti workspace assistant. Answer concisely." },
        { role: "user", content: payload.question },
      ] satisfies ChatMessage[]);

      let answer = "";
      for await (const token of stream) {
        answer += token;
        socket.emit("nexus:answer:token", { token });
      }

      // Persist via the service so history is stored (non-streamed path reuse).
      const result = await this.nexus.ask(organizationId, principal.userId, payload.question, payload.conversationId);
      socket.emit("nexus:answer:done", { conversationId: result.conversationId, answer });
      return { ok: true, conversationId: result.conversationId };
    } catch (error) {
      this.logger.error(`Nexus stream failed`, error instanceof Error ? error.stack : String(error));
      socket.emit("nexus:answer:error", { message: "Failed to generate an answer" });
      throw error;
    }
  }

  private assertOrg(principal: WsPrincipal): string {
    if (!principal.organizationId) {
      throw new Error("No active organization on this connection");
    }
    return principal.organizationId;
  }
}
