import { Injectable } from "@nestjs/common";
import type { Server } from "socket.io";

import { channelRoom, organizationRoom, userRoom } from "./rooms";
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

  messageCreated(organizationId: string, channelId: string, userIds: string[], message: unknown): void {
    const server = this.serverOrThrow();
    for (const userId of userIds) {
      server.to(userRoom(organizationId, userId)).emit("message:created", { channelId, message });
    }
  }

  sidebarFavoritesChanged(organizationId: string, userId: string, favorites: unknown): void {
    this.server?.to(userRoom(organizationId, userId)).emit("sidebar:favorites-changed", { favorites });
  }

  publishToUsers(organizationId: string, userIds: string[], event: string, payload: unknown): void {
    for (const userId of new Set(userIds)) {
      this.server?.to(userRoom(organizationId, userId)).emit(event, payload);
    }
  }

  chatActivityChanged(organizationId: string, userIds: string[], activity: unknown): void {
    for (const userId of userIds) {
      this.server?.to(userRoom(organizationId, userId)).emit("sidebar:chat-activity", activity);
    }
  }

  groupCreated(organizationId: string, userIds: string[], group: unknown): void {
    const server = this.serverOrThrow();
    for (const userId of new Set(userIds)) {
      server.to(userRoom(organizationId, userId)).emit("group:created", { group });
    }
  }

  groupDeleted(organizationId: string, userIds: string[], channelId: string): void {
    const server = this.serverOrThrow();
    for (const userId of new Set(userIds)) {
      server.to(userRoom(organizationId, userId)).emit("group:deleted", { channelId });
    }
  }

  groupAdminAssigned(organizationId: string, userId: string, channelId: string): void {
    this.serverOrThrow().to(userRoom(organizationId, userId)).emit("group:admin-assigned", { channelId });
  }

  channelRead(organizationId: string, channelId: string, userId: string): void {
    this.serverOrThrow().to(channelRoom(organizationId, channelId)).emit("channel:marked-read", { channelId, userId });
  }

  callInvitation(organizationId: string, userIds: string[], invitation: unknown): void {
    this.publishToUsers(organizationId, userIds, "call:incoming", invitation);
  }

  callAvailable(organizationId: string, userIds: string[], invitation: unknown): void {
    this.publishToUsers(organizationId, userIds, "call:available", invitation);
  }

  callStatus(organizationId: string, userIds: string[], event: "call:accepted" | "call:rejected" | "call:cancelled" | "call:left" | "call:ended", status: unknown): void {
    this.publishToUsers(organizationId, userIds, event, status);
  }

  private serverOrThrow(): Server {
    if (!this.server) {
      throw new Error("Connect Socket.IO publisher is not initialized");
    }
    return this.server;
  }
}
