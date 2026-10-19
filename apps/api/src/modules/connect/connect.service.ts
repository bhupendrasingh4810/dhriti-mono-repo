import { HttpStatus, Injectable } from "@nestjs/common";
import type { Channel, Message, MessageReaction, User, Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";
import type { CreateChannelDto, UpdateChannelDto } from "./dto/channel.dto";
import type { CreateMessageDto, UpdateMessageDto } from "./dto/message.dto";
import type { UpdateSidebarSettingsDto } from "./dto/sidebar.dto";

type SidebarFavoriteType = "chat" | "team" | "channel";
type SidebarFavorites = { chats: string[]; teams: string[]; channels: string[] };

function toSidebarPreferences(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function toStringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export type MessageWithMeta = Message & {
  author: Pick<User, "id" | "name" | "avatarUrl">;
  mentions: Array<{ userId: string }>;
  reactions: Array<Pick<MessageReaction, "userId" | "emoji">>;
  _count: { replies: number };
};

interface IdempotentMessageDelegate {
  upsert(args: {
    where: {
      organizationId_channelId_clientMessageId: {
        organizationId: string;
        channelId: string;
        clientMessageId: string;
      };
    };
    create: {
      organizationId: string;
      channelId: string;
      authorId: string;
      clientMessageId: string;
      parentId: string | null;
      content: string;
      mentions: { create: Array<{ userId: string }> };
    };
    update: Record<string, never>;
    include: object;
  }): Promise<MessageWithMeta>;
}

@Injectable()
export class ConnectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly publisher: ConnectPublisherService,
  ) {}

  async getUserDisplayName(userId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { name: true },
    });

    return user?.name ?? "Someone";
  }

  async getSidebar(organizationId: string, userId: string) {
    await this.assertOrganizationMember(organizationId, userId);
    const record = await this.prisma.connectSidebarPreference.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { preferences: true },
    });
    const preferences = toSidebarPreferences(record?.preferences);
    const favoriteValues = toSidebarPreferences(preferences.favorites);

    return {
      favorites: {
        chats: toStringList(favoriteValues.chats),
        teams: toStringList(favoriteValues.teams),
        channels: toStringList(favoriteValues.channels),
      },
      recentChats: toStringList(preferences.recentChats),
      settings: toSidebarPreferences(preferences.settings),
      savedMessageIds: toStringList(preferences.savedMessageIds),
      followedThreadIds: toStringList(preferences.followedThreadIds),
    };
  }

  async setSidebarFavorite(
    organizationId: string,
    userId: string,
    input: { itemType: SidebarFavoriteType; itemId: string; isFavorite: boolean },
  ): Promise<{ favorites: SidebarFavorites; recentChats: string[] }> {
    if (input.itemType === "team") {
      const team = await this.prisma.team.findFirst({
        where: { id: input.itemId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!team) throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.NOT_FOUND);
    } else {
      const channel = await this.getChannelForMember(organizationId, input.itemId, userId);
      const expectedTypes = input.itemType === "chat" ? ["DIRECT", "GROUP"] : ["CHANNEL"];
      if (!expectedTypes.includes(channel.type)) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Item type does not match the Connect resource", HttpStatus.BAD_REQUEST);
      }
    }

    const updated = await this.mutatePreferences(organizationId, userId, (current) => {
    const currentFavorites = toSidebarPreferences(current.favorites);
    const key = input.itemType === "chat" ? "chats" : input.itemType === "team" ? "teams" : "channels";
    const items = new Set(toStringList(currentFavorites[key]));
    if (input.isFavorite) items.add(input.itemId);
    else items.delete(input.itemId);

    const favorites: SidebarFavorites = {
      chats: toStringList(currentFavorites.chats),
      teams: toStringList(currentFavorites.teams),
      channels: toStringList(currentFavorites.channels),
    };
    favorites[key] = [...items];
    return { ...current, favorites };
    });

    this.publisher.sidebarFavoritesChanged(organizationId, userId, updated.favorites);
    return this.getSidebar(organizationId, userId);
  }

  async updateSidebarSettings(organizationId: string, userId: string, settings: UpdateSidebarSettingsDto) {
    await this.assertOrganizationMember(organizationId, userId);
    const conversationIds = new Set([
      ...(settings.hiddenConversationIds ?? []),
      ...(settings.customSections ?? []).flatMap((section) => section.conversationIds),
    ]);
    for (const channelId of conversationIds) {
      await this.getChannelForMember(organizationId, channelId, userId, true);
    }
    for (const teamId of settings.expandedTeamIds ?? []) {
      const membership = await this.prisma.teamMember.findFirst({
        where: { teamId, userId, team: { organizationId, deletedAt: null } },
        select: { id: true },
      });
      if (!membership) throw new AppError(ErrorCode.FORBIDDEN, "Team is not accessible", HttpStatus.FORBIDDEN);
    }
    const patch = Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== undefined));
    const updated = await this.mutatePreferences(organizationId, userId, (current) => ({
      ...current,
      settings: { ...toSidebarPreferences(current.settings), ...patch },
    }));
    this.publisher.publishToUsers(organizationId, [userId], "sidebar:settings-changed", { settings: updated.settings });
    return this.getSidebar(organizationId, userId);
  }

  async setPersonalMessage(organizationId: string, userId: string, messageId: string, kind: "saved" | "followed", enabled: boolean) {
    const message = await this.getMessage(organizationId, messageId);
    await this.getChannelForMember(organizationId, message.channelId, userId, true);
    const key = kind === "saved" ? "savedMessageIds" : "followedThreadIds";
    const targetId = kind === "followed" ? message.parentId ?? message.id : message.id;
    const updated = await this.mutatePreferences(organizationId, userId, (current) => {
      const ids = new Set(toStringList(current[key]));
      if (enabled) ids.add(targetId);
      else ids.delete(targetId);
      if (ids.size > 500) throw new AppError(ErrorCode.VALIDATION_FAILED, "Personal message limit reached", HttpStatus.BAD_REQUEST);
      return { ...current, [key]: [...ids] };
    });
    this.publisher.publishToUsers(organizationId, [userId], "sidebar:personal-messages-changed", { [key]: updated[key] });
    return this.getSidebar(organizationId, userId);
  }

  async listConversations(organizationId: string, userId: string) {
    await this.assertOrganizationMember(organizationId, userId);
    const conversations = await this.prisma.channel.findMany({
      where: {
        organizationId,
        type: { in: ["DIRECT", "GROUP"] },
        deletedAt: null,
        members: { some: { userId } },
      },
      include: {
        members: { select: { userId: true } },
        messages: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { id: true, authorId: true, content: true, createdAt: true },
        },
      },
    });

    return conversations.sort((left, right) =>
      (right.messages[0]?.createdAt.getTime() ?? right.createdAt.getTime())
        - (left.messages[0]?.createdAt.getTime() ?? left.createdAt.getTime()),
    );
  }

  async listUsers(organizationId: string) {
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        deletedAt: null,
        user: { deletedAt: null },
      },
      select: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return memberships.map(({ user }) => user);
  }

  async createDirectConversation(organizationId: string, creatorUserId: string, otherUserId: string) {
    if (creatorUserId === otherUserId) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "A direct conversation requires another user", HttpStatus.BAD_REQUEST);
    }

    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        userId: { in: [creatorUserId, otherUserId] },
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { userId: true },
    });
    if (members.length !== 2) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "Both users must be active organization members", HttpStatus.BAD_REQUEST);
    }

    const candidates = await this.prisma.channel.findMany({
      where: {
        organizationId,
        type: "DIRECT",
        deletedAt: null,
        AND: [
          { members: { some: { userId: creatorUserId } } },
          { members: { some: { userId: otherUserId } } },
        ],
      },
      include: { members: { select: { userId: true } } },
    });
    const existing = candidates.find((conversation) => conversation.members.length === 2);
    if (existing) return existing;

    return this.prisma.channel.create({
      data: {
        organizationId,
        name: "Direct conversation",
        type: "DIRECT",
        visibility: "PRIVATE",
        createdById: creatorUserId,
        members: { create: [{ userId: creatorUserId }, { userId: otherUserId }] },
      },
      include: { members: { select: { userId: true } } },
    });
  }

  // ---------------- Channels ----------------

  async listChannels(organizationId: string, userId: string): Promise<Channel[]> {
    await this.assertOrganizationMember(organizationId, userId);
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId, team: { organizationId, deletedAt: null } },
      select: { teamId: true },
    });
    return this.prisma.channel.findMany({
      where: {
        organizationId,
        type: "CHANNEL",
        deletedAt: null,
        isArchived: false,
        OR: [{ visibility: "PUBLIC" }, { members: { some: { userId } } }],
        AND: [{ OR: [{ teamId: null }, { teamId: { in: teamMemberships.map(({ teamId }) => teamId) } }] }],
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createChannel(organizationId: string, creatorUserId: string, dto: CreateChannelDto): Promise<Channel> {
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: dto.teamId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!team) {
        throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.BAD_REQUEST);
      }
    }

    if (dto.slug) {
      const slugTaken = await this.prisma.channel.findUnique({
        where: { organizationId_slug: { organizationId, slug: dto.slug } },
        select: { id: true },
      });
      if (slugTaken) {
        throw new AppError(
          ErrorCode.CHANNEL_SLUG_TAKEN,
          "A channel with this slug already exists",
          HttpStatus.CONFLICT,
        );
      }
    }

    const channel = await this.prisma.channel.create({
      data: {
        organizationId,
        teamId: dto.teamId ?? null,
        name: dto.name.trim(),
        slug: dto.slug ?? null,
        type: dto.type ?? "CHANNEL",
        visibility: dto.visibility ?? "PUBLIC",
        topic: dto.topic ?? null,
        description: dto.description ?? null,
        createdById: creatorUserId,
        members: { create: { userId: creatorUserId } },
      },
    });

    await this.audit.record({
      action: "connect.channel.created",
      organizationId,
      actorUserId: creatorUserId,
      resourceType: "Channel",
      resourceId: channel.id,
    });
    return channel;
  }

  async getChannelForMember(
    organizationId: string,
    channelId: string,
    userId: string,
    requireChannelMembership = false,
  ): Promise<Channel> {
    await this.assertOrganizationMember(organizationId, userId);
    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, organizationId, deletedAt: null },
    });
    if (!channel) {
      throw new AppError(ErrorCode.CHANNEL_NOT_FOUND, "Channel not found", HttpStatus.NOT_FOUND);
    }

    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    });
    if ((channel.visibility === "PRIVATE" || channel.type !== "CHANNEL" || requireChannelMembership) && !member) {
      throw new AppError(ErrorCode.FORBIDDEN, "You are not a member of this channel", HttpStatus.FORBIDDEN);
    }

    if (channel.teamId) {
      const teamMember = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: channel.teamId, userId } },
        select: { id: true },
      });
      if (!teamMember) {
        throw new AppError(ErrorCode.FORBIDDEN, "You are not a member of this channel's team", HttpStatus.FORBIDDEN);
      }
    }
    return channel;
  }

  async getChannelMemberIds(organizationId: string, channelId: string, userId: string): Promise<string[]> {
    await this.getChannelForMember(organizationId, channelId, userId, true);

    const members = await this.prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true },
    });

    return members.map((member) => member.userId);
  }

  async joinPublicChannel(organizationId: string, channelId: string, userId: string): Promise<void> {
    const channel = await this.getChannelForMember(organizationId, channelId, userId);
    if (channel.type !== "CHANNEL" || channel.visibility !== "PUBLIC") {
      throw new AppError(ErrorCode.FORBIDDEN, "Only public channels can be joined directly", HttpStatus.FORBIDDEN);
    }
    await this.prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });
  }

  async updateChannel(
    organizationId: string,
    channelId: string,
    userId: string,
    dto: UpdateChannelDto,
  ): Promise<Channel> {
    await this.getChannelForMember(organizationId, channelId, userId);
    return this.prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
    });
  }

  async addMember(organizationId: string, channelId: string, actorUserId: string, userId: string): Promise<void> {
    const channel = await this.getChannelForMember(organizationId, channelId, actorUserId);
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "User is not an active organization member",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (channel.teamId) {
      const teamMember = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: channel.teamId, userId } },
        select: { id: true },
      });
      if (!teamMember) {
        throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User must be a member of the channel's team", HttpStatus.BAD_REQUEST);
      }
    }
    await this.prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId },
      update: {},
    });
  }

  async removeMember(organizationId: string, channelId: string, actorUserId: string, userId: string): Promise<void> {
    await this.getChannelForMember(organizationId, channelId, actorUserId);
    await this.prisma.channelMember.deleteMany({ where: { channelId, userId } });
  }

  // ---------------- Messages ----------------

  async listMessages(
    organizationId: string,
    channelId: string,
    userId: string,
    options: { cursor?: string; limit?: number; initial?: "unread"; after?: string },
  ) {
    await this.getChannelForMember(organizationId, channelId, userId, true);

    const members = await this.prisma.channelMember.findMany({
      where: { channelId }, select: { userId: true, lastReadAt: true },
    });
    const lastReadAt = members.find((member) => member.userId === userId)?.lastReadAt;
    const firstUnread = options.initial === "unread"
      ? await this.prisma.message.findFirst({
          where: { organizationId, channelId, deletedAt: null, authorId: { not: userId }, ...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}) },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }], select: { id: true },
        })
      : null;
    const cursorId = options.after ?? options.cursor;
    if (cursorId) {
      const cursorMessage = await this.getMessage(organizationId, cursorId);
      if (cursorMessage.channelId !== channelId) {
        throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Message cursor not found in this channel", HttpStatus.NOT_FOUND);
      }
    }
    const forward = Boolean(options.after || firstUnread);
    const limit = Math.min(options.limit ?? 50, 100);
    const messages = await this.prisma.message.findMany({
      where: { organizationId, channelId, deletedAt: null },
      orderBy: [{ createdAt: forward ? "asc" : "desc" }, { id: forward ? "asc" : "desc" }],
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : firstUnread ? { cursor: { id: firstUnread.id } } : {}),
      include: this.messageInclude,
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    return {
      messages: page,
      nextCursor: forward ? (page[0]?.id ?? null) : hasMore ? (page[page.length - 1]?.id ?? null) : null,
      newerCursor: forward && hasMore ? (page[page.length - 1]?.id ?? null) : null,
      firstUnreadId: firstUnread?.id ?? null,
      readReceipts: members,
    };
  }

  async createMessage(
    organizationId: string,
    channelId: string,
    authorId: string,
    dto: CreateMessageDto,
  ): Promise<MessageWithMeta> {
    const channel = await this.getChannelForMember(organizationId, channelId, authorId, true);

    if (dto.parentId) {
      const parent = await this.prisma.message.findFirst({
        where: { id: dto.parentId, channelId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) {
        throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Parent message not found", HttpStatus.BAD_REQUEST);
      }
    }

    const mentionUserIds = await this.resolveMentions(organizationId, dto.content, dto.mentionUserIds);

    const message = dto.clientMessageId
      ? await (this.prisma.message as unknown as IdempotentMessageDelegate).upsert({
          where: {
            organizationId_channelId_clientMessageId: {
              organizationId,
              channelId,
              clientMessageId: dto.clientMessageId,
            },
          },
          create: {
            organizationId,
            channelId,
            authorId,
            clientMessageId: dto.clientMessageId,
            parentId: dto.parentId ?? null,
            content: dto.content,
            mentions: { create: mentionUserIds.map((userId) => ({ userId })) },
          },
          update: {},
          include: this.messageInclude,
        })
      : await this.prisma.message.create({
          data: {
            organizationId,
            channelId,
            authorId,
            parentId: dto.parentId ?? null,
            content: dto.content,
            mentions: { create: mentionUserIds.map((userId) => ({ userId })) },
          },
          include: this.messageInclude,
        });

    if (message.authorId !== authorId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Message idempotency key belongs to another user", HttpStatus.FORBIDDEN);
    }

    await this.audit.record({
      action: "connect.message.created",
      organizationId,
      actorUserId: authorId,
      resourceType: "Message",
      resourceId: message.id,
      metadata: { channelId, mentions: mentionUserIds.length },
    });
    const recipientUserIds = await this.getRecipientUserIds(organizationId, channel);
    this.publisher.messageCreated(organizationId, channelId, recipientUserIds, message);
    if (channel.type === "DIRECT" || channel.type === "GROUP") {
      await Promise.all(recipientUserIds.map((userId) => this.recordRecentChat(organizationId, userId, channelId)));
      this.publisher.chatActivityChanged(organizationId, recipientUserIds, {
        channelId,
        messageId: message.id,
        senderId: authorId,
        createdAt: message.createdAt,
      });
    }
    return message;
  }

  private async getRecipientUserIds(organizationId: string, channel: Channel): Promise<string[]> {
    const channelMembers = await this.prisma.channelMember.findMany({ where: { channelId: channel.id }, select: { userId: true } });
    const organizationMembers = channelMembers.length > 0
      ? await this.prisma.organizationMember.findMany({
          where: {
            organizationId,
            userId: { in: channelMembers.map(({ userId }) => userId) },
            status: "ACTIVE",
            deletedAt: null,
          },
          select: { userId: true },
        })
      : [];
    const eligibleMembers = channel.teamId
      ? await this.prisma.teamMember.findMany({
          where: {
            teamId: channel.teamId,
            userId: { in: organizationMembers.map(({ userId }) => userId) },
          },
          select: { userId: true },
        })
      : organizationMembers;
    return eligibleMembers.map(({ userId }) => userId);
  }

  async updateMessage(
    organizationId: string,
    messageId: string,
    userId: string,
    dto: UpdateMessageDto,
  ): Promise<MessageWithMeta> {
    const message = await this.getMessage(organizationId, messageId);
    if (message.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author can edit a message", HttpStatus.FORBIDDEN);
    }
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);

    const mentionUserIds = await this.resolveMentions(organizationId, dto.content, undefined);

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        content: dto.content,
        isEdited: true,
        editedAt: new Date(),
        mentions: {
          deleteMany: {},
          create: mentionUserIds.map((mentionedUserId) => ({ userId: mentionedUserId })),
        },
      },
      include: this.messageInclude,
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:updated", { channelId: channel.id, message: updated });
    return updated;
  }

  async deleteMessage(organizationId: string, messageId: string, userId: string): Promise<void> {
    const message = await this.getMessage(organizationId, messageId);
    if (message.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author can delete a message", HttpStatus.FORBIDDEN);
    }
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), isDeleted: true },
    });

    await this.audit.record({
      action: "connect.message.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "Message",
      resourceId: messageId,
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:deleted", { channelId: channel.id, messageId, isDeleted: true });
  }

  async restoreMessage(organizationId: string, messageId: string, userId: string): Promise<MessageWithMeta> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, organizationId },
    });
    if (!message) {
      throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Message not found", HttpStatus.NOT_FOUND);
    }
    if (message.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author can restore a message", HttpStatus.FORBIDDEN);
    }
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);
    const restored = await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: null, isDeleted: false },
      include: this.messageInclude,
    });
    await this.audit.record({
      action: "connect.message.restored",
      organizationId,
      actorUserId: userId,
      resourceType: "Message",
      resourceId: messageId,
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:updated", { channelId: channel.id, message: restored });
    return restored;
  }

  // ---------------- Reactions ----------------

  async addReaction(organizationId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.getMessage(organizationId, messageId);
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);

    await this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:reaction-changed", { channelId: channel.id, messageId, userId, emoji, added: true });
  }

  async removeReaction(organizationId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.getMessage(organizationId, messageId);
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);
    await this.prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:reaction-changed", { channelId: channel.id, messageId, userId, emoji, added: false });
  }

  async markChannelRead(organizationId: string, channelId: string, userId: string, messageId?: string) {
    const channel = await this.getChannelForMember(organizationId, channelId, userId, true);
    const message = await this.prisma.message.findFirst({
      where: { organizationId, channelId, deletedAt: null, ...(messageId ? { id: messageId } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true },
    });
    if (!message) {
      if (messageId) throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Message not found", HttpStatus.NOT_FOUND);
      return null;
    }
    await this.prisma.channelMember.updateMany({
      where: { channelId, userId, OR: [{ lastReadAt: null }, { lastReadAt: { lt: message.createdAt } }] },
      data: { lastReadAt: message.createdAt },
    });
    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } }, select: { lastReadAt: true },
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "channel:marked-read", {
      channelId, userId, lastReadAt: member?.lastReadAt ?? null,
    });
    return member?.lastReadAt ?? null;
  }

  // ---------------- Internals ----------------

  private readonly messageInclude = {
    author: { select: { id: true, name: true, avatarUrl: true } },
    mentions: { select: { userId: true } },
    reactions: { select: { userId: true, emoji: true } },
    _count: { select: { replies: true } },
  } as const;

  private async recordRecentChat(organizationId: string, userId: string, channelId: string): Promise<void> {
    await this.mutatePreferences(organizationId, userId, (current) => ({
      ...current,
      recentChats: [channelId, ...toStringList(current.recentChats).filter((id) => id !== channelId)].slice(0, 100),
    }));
  }

  private async mutatePreferences(organizationId: string, userId: string, mutate: (current: Record<string, unknown>) => Record<string, unknown>) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`connect-sidebar:${organizationId}:${userId}`}, 0))`;
      const record = await transaction.connectSidebarPreference.findUnique({
        where: { organizationId_userId: { organizationId, userId } },
      });
      const preferences = mutate(toSidebarPreferences(record?.preferences));
      await transaction.connectSidebarPreference.upsert({
        where: { organizationId_userId: { organizationId, userId } },
        create: { organizationId, userId, preferences: preferences as Prisma.InputJsonObject },
        update: { preferences: preferences as Prisma.InputJsonObject },
      });
      return preferences;
    });
  }

  private async getMessage(organizationId: string, messageId: string): Promise<Message> {
    const message = await this.prisma.message.findFirst({
      where: { id: messageId, organizationId, deletedAt: null },
    });
    if (!message) {
      throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Message not found", HttpStatus.NOT_FOUND);
    }
    return message;
  }

  /**
   * Resolves mentioned users from explicit ids plus @name/@email tokens found
   * in the content, restricted to members of the channel's organization.
   */
  private async resolveMentions(
    organizationId: string,
    content: string,
    explicitIds: string[] | undefined,
  ): Promise<string[]> {
    const ids = new Set<string>(explicitIds ?? []);

    const tokens = content.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
    if (tokens.length > 0) {
      const names = tokens.map((token) => token.slice(1).toLowerCase());
      const users = await this.prisma.user.findMany({
        where: {
          deletedAt: null,
          memberships: { some: { organizationId, status: "ACTIVE", deletedAt: null } },
        },
        select: { id: true, name: true, email: true },
      });
      for (const user of users) {
        const emailHandle = user.email.split("@")[0]?.toLowerCase();
        const nameHandle = user.name.toLowerCase().replace(/\s+/g, "-");
        if (names.includes(emailHandle) || names.includes(nameHandle)) {
          ids.add(user.id);
        }
      }
    }

    if (ids.size === 0) {
      return [];
    }

    // Only org members of the channel can be mentioned.
    const valid = await this.prisma.organizationMember.findMany({
      where: { organizationId, userId: { in: [...ids] }, status: "ACTIVE", deletedAt: null },
      select: { userId: true },
    });
    return valid.map((row) => row.userId);
  }

  private async assertOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User is not an active organization member", HttpStatus.FORBIDDEN);
    }
  }
}
