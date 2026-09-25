import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";

import { channelRoom, organizationRoom } from "./rooms";
import type { PresenceStatus } from "./dto/connect-events.dto";

@Injectable()
export class ConnectPublisherService {
  private server: Server | null = null;

  bind(server: Server): void {
    this.server = server;
  }

  presenceChanged(organizationId: string, userId: string, status: PresenceStatus): void {
    this.serverOrThrow().to(organizationRoom(organizationId)).emit("presence:changed", { userId, status });
  }

  typingChanged(organizationId: string, channelId: string, socketId: string, userId: string, isTyping: boolean): void {
    this.serverOrThrow()
      .except(socketId)
      .to(channelRoom(organizationId, channelId))
      .emit("typing", { channelId, userId, isTyping });
  }

  messageCreated(organizationId: string, channelId: string, message: unknown): void {
    this.serverOrThrow().to(channelRoom(organizationId, channelId)).emit("message:created", message);
  }

  channelRead(organizationId: string, channelId: string, userId: string): void {
    this.serverOrThrow().to(channelRoom(organizationId, channelId)).emit("channel:marked-read", { channelId, userId });
  }

  private serverOrThrow(): Server {
    if (!this.server) {
      throw new Error("Connect Socket.IO publisher is not initialized");
    }
    return this.server;
  }
}
