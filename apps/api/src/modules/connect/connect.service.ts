import { HttpStatus, Injectable } from "@nestjs/common";
import type { Channel, Message, MessageReaction, User } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import type { CreateChannelDto, UpdateChannelDto } from "./dto/channel.dto";
import type { CreateMessageDto, UpdateMessageDto } from "./dto/message.dto";

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
  ) {}

  // ---------------- Channels ----------------

  async listChannels(organizationId: string, userId: string): Promise<Channel[]> {
    // Public channels + private channels the user is a member of.
    return this.prisma.channel.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isArchived: false,
        OR: [
          { visibility: "PUBLIC" },
          { members: { some: { userId } } },
        ],
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async createChannel(
    organizationId: string,
    creatorUserId: string,
    dto: CreateChannelDto,
  ): Promise<Channel> {
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

  async getChannelForMember(organizationId: string, channelId: string, userId: string): Promise<Channel> {
    const channel = await this.prisma.channel.findFirst({
      where: { id: channelId, organizationId, deletedAt: null },
    });
    if (!channel) {
      throw new AppError(ErrorCode.CHANNEL_NOT_FOUND, "Channel not found", HttpStatus.NOT_FOUND);
    }

    if (channel.visibility === "PRIVATE") {
      const member = await this.prisma.channelMember.findUnique({
        where: { channelId_userId: { channelId, userId } },
      });
      if (!member) {
        throw new AppError(ErrorCode.FORBIDDEN, "You are not a member of this private channel", HttpStatus.FORBIDDEN);
      }
    }
    return channel;
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
    await this.getChannelForMember(organizationId, channelId, actorUserId);
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User is not an active organization member", HttpStatus.BAD_REQUEST);
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
    options: { cursor?: string; limit?: number },
  ): Promise<{ messages: MessageWithMeta[]; nextCursor: string | null }> {
    await this.getChannelForMember(organizationId, channelId, userId);

    const limit = Math.min(options.limit ?? 50, 100);
    const messages = await this.prisma.message.findMany({
      where: { organizationId, channelId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(options.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: this.messageInclude,
    });

    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    return {
      messages: page,
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
    };
  }

  async createMessage(
    organizationId: string,
    channelId: string,
    authorId: string,
    dto: CreateMessageDto,
  ): Promise<MessageWithMeta> {
    await this.getChannelForMember(organizationId, channelId, authorId);

    if (dto.parentId) {
      const parent = await this.prisma.message.findFirst({
        where: { id: dto.parentId, channelId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) {
        throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Parent message not found", HttpStatus.BAD_REQUEST);
      }
    }

    const mentionUserIds = await this.resolveMentions(channelId, dto.content, dto.mentionUserIds);

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
    return message;
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

    const mentionUserIds = await this.resolveMentions(message.channelId, dto.content, undefined);

    return this.prisma.message.update({
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
  }

  async deleteMessage(organizationId: string, messageId: string, userId: string): Promise<void> {
    const message = await this.getMessage(organizationId, messageId);
    if (message.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author can delete a message", HttpStatus.FORBIDDEN);
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      action: "connect.message.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "Message",
      resourceId: messageId,
    });
  }

  // ---------------- Reactions ----------------

  async addReaction(
    organizationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    const message = await this.getMessage(organizationId, messageId);
    await this.getChannelForMember(organizationId, message.channelId, userId);

    await this.prisma.messageReaction.upsert({
      where: { messageId_userId_emoji: { messageId, userId, emoji } },
      create: { messageId, userId, emoji },
      update: {},
    });
  }

  async removeReaction(
    organizationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void> {
    await this.getMessage(organizationId, messageId);
    await this.prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
  }

  async markChannelRead(organizationId: string, channelId: string, userId: string): Promise<void> {
    await this.getChannelForMember(organizationId, channelId, userId);
    await this.prisma.channelMember.update({
      where: { channelId_userId: { channelId, userId } },
      data: { lastReadAt: new Date() },
    });
  }

  // ---------------- Internals ----------------

  private readonly messageInclude = {
    author: { select: { id: true, name: true, avatarUrl: true } },
    mentions: { select: { userId: true } },
    reactions: { select: { userId: true, emoji: true } },
    _count: { select: { replies: true } },
  } as const;

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
    channelId: string,
    content: string,
    explicitIds: string[] | undefined,
  ): Promise<string[]> {
    const ids = new Set<string>(explicitIds ?? []);

    const tokens = content.match(/@([a-zA-Z0-9._-]+)/g) ?? [];
    if (tokens.length > 0) {
      const names = tokens.map((token) => token.slice(1).toLowerCase());
      const users = await this.prisma.user.findMany({
        where: { deletedAt: null },
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
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { organizationId: true },
    });
    const valid = await this.prisma.organizationMember.findMany({
      where: { organizationId: channel?.organizationId, userId: { in: [...ids] }, deletedAt: null },
      select: { userId: true },
    });
    return valid.map((row) => row.userId);
  }
}
