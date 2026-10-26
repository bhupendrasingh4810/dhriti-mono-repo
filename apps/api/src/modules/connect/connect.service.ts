import { HttpStatus, Injectable } from "@nestjs/common";
import type { Channel, ConnectCallScope, ConnectCallStatus, ConnectCallType, Message, MessageReaction, Poll, PollOption, PollVote, Post, PostComment, PostCommentReaction, PostReaction, Team, User, Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import { EntitlementService } from "../authorization/services/entitlement.service";
import { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";
import { ConnectPresenceService } from "../../websocket/connect/connect-presence.service";
import type { CreateChannelDto, UpdateChannelDto } from "./dto/channel.dto";
import type { CreateConnectTeamDto, UpdateConnectTeamDto } from "./dto/team.dto";
import type { CreateMessageDto, UpdateMessageDto } from "./dto/message.dto";
import type { CreatePollDto, CreatePostDto, UpdatePostDto } from "./dto/post.dto";
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
  poll: (Poll & {
    options: Array<PollOption & { _count: { votes: number } }>;
    votes: Array<Pick<PollVote, "id" | "pollOptionId">>;
  }) | null;
};

type PostWithPoll = Post & {
  author: Pick<User, "id" | "name" | "avatarUrl">;
  comments: Array<PostComment & {
    author: Pick<User, "id" | "name" | "avatarUrl">;
    reactions: Array<Pick<PostCommentReaction, "userId" | "emoji">>;
  }>;
  reactions: Array<Pick<PostReaction, "userId" | "emoji">>;
  poll: (Poll & {
    options: Array<PollOption & { _count: { votes: number } }>;
    votes: Array<Pick<PollVote, "id" | "pollOptionId">>;
  }) | null;
};

type ChannelWithMembers = Channel & {
  members: Array<{ userId: string; role: "ADMIN" | "MEMBER" }>;
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
      poll?: {
        create: {
          allowsVoteChanges: boolean;
          closesAt: Date | null;
          options: { create: Array<{ content: string; position: number }> };
        };
      };
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
    private readonly entitlements: EntitlementService,
    private readonly presence?: ConnectPresenceService,
  ) {}

  async getUserDisplayName(userId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { name: true },
    });

    return user?.name?.trim() || "Someone";
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
      if (!team) {throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.NOT_FOUND);}
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
      if (input.isFavorite) {items.add(input.itemId);}
      else {items.delete(input.itemId);}

      const favorites: SidebarFavorites = {
        chats: toStringList(currentFavorites.chats),
        teams: toStringList(currentFavorites.teams),
        channels: toStringList(currentFavorites.channels),
      };
      favorites[key] = [...items];
      const recentChats = input.itemType === "chat" && input.isFavorite
        ? toStringList(current.recentChats).filter((id) => id !== input.itemId)
        : toStringList(current.recentChats);
      return { ...current, favorites, recentChats };
    });

    this.publisher.sidebarFavoritesChanged(organizationId, userId, updated.favorites);
    return this.getSidebar(organizationId, userId);
  }

  async updateConversationNotifications(
    organizationId: string,
    channelId: string,
    userId: string,
    input: { muted?: boolean; notifyWhenAvailable?: boolean },
  ) {
    await this.getChannelForMember(organizationId, channelId, userId, true);
    const updated = await this.mutatePreferences(organizationId, userId, (current) => {
      const settings = toSidebarPreferences(current.settings);
      const notifications = toSidebarPreferences(settings.conversationNotifications);
      return {
        ...current,
        settings: {
          ...settings,
          conversationNotifications: {
            ...notifications,
            [channelId]: { ...toSidebarPreferences(notifications[channelId]), ...input },
          },
        },
      };
    });
    this.publisher.publishToUsers(organizationId, [userId], "sidebar:settings-changed", { settings: updated.settings });
    return this.getSidebar(organizationId, userId);
  }

  async removeConversationHistory(organizationId: string, channelId: string, userId: string): Promise<void> {
    const channel = await this.getChannelForMember(organizationId, channelId, userId, true);
    if (channel.type !== "DIRECT") {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Only direct conversations can be removed from history", HttpStatus.BAD_REQUEST);
    }
    await this.mutatePreferences(organizationId, userId, (current) => {
      const settings = toSidebarPreferences(current.settings);
      const favorites = toSidebarPreferences(current.favorites);
      return {
        ...current,
        recentChats: toStringList(current.recentChats).filter((id) => id !== channelId),
        favorites: { ...favorites, chats: toStringList(favorites.chats).filter((id) => id !== channelId) },
        settings: {
          ...settings,
          hiddenConversationIds: [...new Set([...toStringList(settings.hiddenConversationIds), channelId])],
        },
      };
    });
    this.publisher.publishToUsers(organizationId, [userId], "sidebar:chat-activity", { channelId });
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
      if (!membership) {throw new AppError(ErrorCode.FORBIDDEN, "Team is not accessible", HttpStatus.FORBIDDEN);}
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
      if (enabled) {ids.add(targetId);}
      else {ids.delete(targetId);}
      if (ids.size > 500) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Personal message limit reached", HttpStatus.BAD_REQUEST);}
      return { ...current, [key]: [...ids] };
    });
    this.publisher.publishToUsers(organizationId, [userId], "sidebar:personal-messages-changed", { [key]: updated[key] });
    return this.getSidebar(organizationId, userId);
  }

  async listConversations(organizationId: string, userId: string) {
    await this.assertOrganizationMember(organizationId, userId);
    const preferences = await this.prisma.connectSidebarPreference.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { preferences: true },
    });
    const hiddenConversationIds = toStringList(toSidebarPreferences(toSidebarPreferences(preferences?.preferences).settings).hiddenConversationIds);
    const conversations = await this.prisma.channel.findMany({
      where: {
        organizationId,
        type: { in: ["DIRECT", "GROUP"] },
        deletedAt: null,
        id: { notIn: hiddenConversationIds },
        members: { some: { userId } },
      },
      include: {
        members: { select: { userId: true, leftAt: true } },
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
    return Promise.all(memberships.map(async ({ user }) => ({
      ...user,
      presence: this.presence ? await this.presence.getStatus(organizationId, user.id) : "offline",
    })));
  }

  async searchUsers(organizationId: string, actorUserId: string, query: string, requestedLimit?: number) {
    const limit = Math.min(Math.max(requestedLimit ?? 10, 1), 20);
    const search = query.trim();
    if (!search) {
      return [];
    }

    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        userId: { not: actorUserId },
        status: "ACTIVE",
        deletedAt: null,
        user: {
          deletedAt: null,
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      select: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { user: { name: "asc" } },
      take: limit,
    });

    return memberships.map(({ user }) => user);
  }

  async listRecentUserSearches(organizationId: string, actorUserId: string) {
    const searches = await this.prisma.connectUserSearch.findMany({
      where: { organizationId, actorUserId, targetUserId: { not: actorUserId }, targetUser: { deletedAt: null } },
      orderBy: { lastSelectedAt: "desc" },
      take: 10,
      select: {
        targetUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
    return searches.map(({ targetUser }) => targetUser);
  }

  async recordUserSearch(organizationId: string, actorUserId: string, targetUserId: string) {
    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        organizationId,
        userId: targetUserId,
        status: "ACTIVE",
        deletedAt: null,
        user: { deletedAt: null },
      },
      select: { userId: true },
    });
    if (!membership) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User is not an active organization member", HttpStatus.BAD_REQUEST);
    }

    const search = await this.prisma.connectUserSearch.upsert({
      where: {
        organizationId_actorUserId_targetUserId: { organizationId, actorUserId, targetUserId },
      },
      create: { organizationId, actorUserId, targetUserId },
      update: { selectionCount: { increment: 1 }, lastSelectedAt: new Date() },
      select: {
        targetUser: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
    });
    return search.targetUser;
  }

  async listUsersPage(organizationId: string, cursor?: string, requestedLimit?: number) {
    const limit = Math.min(Math.max(requestedLimit ?? 12, 1), 50);
    const memberships = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        status: "ACTIVE",
        deletedAt: null,
        user: { deletedAt: null },
      },
      select: {
        id: true,
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { createdAt: "asc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    const page = memberships.slice(0, limit);

    return {
      users: page.map(({ user }) => user),
      nextCursor: memberships.length > limit ? page[page.length - 1]?.id ?? null : null,
    };
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
    if (existing) {
      await this.mutatePreferences(organizationId, creatorUserId, (current) => {
        const settings = toSidebarPreferences(current.settings);
        return {
          ...current,
          settings: { ...settings, hiddenConversationIds: toStringList(settings.hiddenConversationIds).filter((id) => id !== existing.id) },
        };
      });
      return existing;
    }

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

  async createGroupConversation(organizationId: string, creatorUserId: string, userIds: string[]) {
    return this.createPrivateGroupConversation(organizationId, creatorUserId, userIds, 3);
  }

  /**
   * A meeting may have one invitee, so unlike the user-created group endpoint
   * it deliberately permits the organizer plus one attendee.
   */
  async createMeetingConversation(organizationId: string, creatorUserId: string, userIds: string[]) {
    return this.createPrivateGroupConversation(organizationId, creatorUserId, userIds, 2);
  }

  private async createPrivateGroupConversation(
    organizationId: string,
    creatorUserId: string,
    userIds: string[],
    minimumMembers: number,
  ) {
    const memberIds = [...new Set([creatorUserId, ...userIds])];
    if (memberIds.length < minimumMembers) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        minimumMembers === 2
          ? "A meeting conversation requires at least one attendee"
          : "A group conversation requires at least three members",
        HttpStatus.BAD_REQUEST,
      );
    }
    const members = await this.prisma.organizationMember.findMany({
      where: {
        organizationId,
        userId: { in: memberIds },
        status: "ACTIVE",
        deletedAt: null,
      },
      select: { userId: true, user: { select: { name: true } } },
    });
    if (members.length !== memberIds.length) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "All group members must be active organization members", HttpStatus.BAD_REQUEST);
    }
    const namesById = new Map(members.map((member) => [member.userId, member.user.name]));
    const name = memberIds
      .filter((userId) => userId !== creatorUserId)
      .map((userId) => namesById.get(userId))
      .filter((memberName): memberName is string => Boolean(memberName))
      .join(", ");

    const group = await this.prisma.channel.create({
      data: {
        organizationId,
        name: name || "Group conversation",
        type: "GROUP",
        visibility: "PRIVATE",
        createdById: creatorUserId,
        members: { create: memberIds.map((userId) => ({ userId, role: userId === creatorUserId ? "ADMIN" : "MEMBER" })) },
      },
      include: { members: { select: { userId: true } } },
    });
    this.publisher.groupCreated(organizationId, memberIds, group);
    return group;
  }

  // ---------------- Channels ----------------

  async listTeams(organizationId: string, userId: string) {
    await this.assertOrganizationMember(organizationId, userId);
    const teams = await this.prisma.team.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [{ visibility: "PUBLIC" }, { members: { some: { userId } } }],
      },
      include: { members: { select: { userId: true, role: true } } },
      orderBy: { createdAt: "asc" },
    });
    return teams.map((team) => this.serializeTeam(team));
  }

  async getTeamDetails(organizationId: string, teamId: string, userId: string) {
    await this.assertOrganizationMember(organizationId, userId);
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        organizationId,
        deletedAt: null,
        OR: [{ visibility: "PUBLIC" }, { members: { some: { userId } } }],
      },
      include: {
        channels: {
          where: { deletedAt: null, isArchived: false, type: "CHANNEL" },
          select: { id: true, name: true, slug: true, visibility: true, createdAt: true },
          orderBy: { createdAt: "asc" },
        },
        members: {
          select: {
            userId: true,
            role: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                profile: { select: { jobTitle: true } },
                hrmsProfile: { select: { officeLocation: true, location: true } },
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!team) {throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.NOT_FOUND);}

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      visibility: team.visibility,
      channels: team.channels,
      members: team.members.map((member) => ({
        id: member.user.id,
        name: member.user.name,
        avatarUrl: member.user.avatarUrl,
        jobTitle: member.user.profile?.jobTitle ?? null,
        location: member.user.hrmsProfile?.officeLocation ?? member.user.hrmsProfile?.location ?? null,
        role: member.role,
        joinedAt: member.createdAt,
      })),
    };
  }

  async createTeam(organizationId: string, creatorUserId: string, dto: CreateConnectTeamDto) {
    await this.assertOrganizationMember(organizationId, creatorUserId);
    const slugTaken = await this.prisma.team.findUnique({
      where: { organizationId_slug: { organizationId, slug: dto.slug } },
      select: { id: true },
    });
    if (slugTaken) {throw new AppError(ErrorCode.TEAM_SLUG_TAKEN, "A team with this slug already exists", HttpStatus.CONFLICT);}

    const teamCount = await this.prisma.team.count({ where: { organizationId, deletedAt: null } });
    await this.entitlements.assertWithinLimit(organizationId, "max_teams", teamCount + 1);

    const team = await this.prisma.team.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        slug: dto.slug,
        description: dto.description?.trim() || null,
        visibility: dto.visibility ?? "PUBLIC",
        members: { create: { userId: creatorUserId, role: "ADMIN" } },
      },
      include: { members: { select: { userId: true, role: true } } },
    });
    await this.audit.record({ action: "connect.team.created", organizationId, actorUserId: creatorUserId, resourceType: "Team", resourceId: team.id });
    return this.serializeTeam(team);
  }

  async updateTeam(organizationId: string, teamId: string, actorUserId: string, dto: UpdateConnectTeamDto) {
    await this.requireTeamAdmin(organizationId, teamId, actorUserId);
    const team = await this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.visibility !== undefined ? { visibility: dto.visibility } : {}),
      },
      include: { members: { select: { userId: true, role: true } } },
    });
    return this.serializeTeam(team);
  }

  async deleteTeam(organizationId: string, teamId: string, actorUserId: string): Promise<void> {
    await this.requireTeamAdmin(organizationId, teamId, actorUserId);
    await this.prisma.team.update({ where: { id: teamId }, data: { deletedAt: new Date() } });
  }

  async upsertTeamMember(organizationId: string, teamId: string, actorUserId: string, userId: string, role: "ADMIN" | "MEMBER"): Promise<void> {
    await this.requireTeamAdmin(organizationId, teamId, actorUserId);
    await this.assertOrganizationMember(organizationId, userId);
    await this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId, role },
      update: { role },
    });
  }

  async removeTeamMember(organizationId: string, teamId: string, actorUserId: string, userId: string): Promise<void> {
    await this.requireTeamAdmin(organizationId, teamId, actorUserId);
    const membership = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } }, select: { role: true } });
    if (membership?.role === "ADMIN") {
      const adminCount = await this.prisma.teamMember.count({ where: { teamId, role: "ADMIN" } });
      if (adminCount === 1) {throw new AppError(ErrorCode.FORBIDDEN, "A team must have at least one admin", HttpStatus.BAD_REQUEST);}
    }
    await this.prisma.teamMember.deleteMany({ where: { teamId, userId } });
  }

  async leaveTeam(organizationId: string, teamId: string, userId: string): Promise<void> {
    const membership = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, team: { organizationId, deletedAt: null } },
      select: { role: true },
    });
    if (!membership) {throw new AppError(ErrorCode.FORBIDDEN, "You are not a member of this team", HttpStatus.FORBIDDEN);}
    if (membership.role === "ADMIN") {
      const adminCount = await this.prisma.teamMember.count({ where: { teamId, role: "ADMIN" } });
      if (adminCount === 1) {throw new AppError(ErrorCode.FORBIDDEN, "Assign another team admin before leaving", HttpStatus.BAD_REQUEST);}
    }
    await this.prisma.teamMember.delete({ where: { teamId_userId: { teamId, userId } } });
  }

  async listChannels(organizationId: string, userId: string) {
    await this.assertOrganizationMember(organizationId, userId);
    const teamMemberships = await this.prisma.teamMember.findMany({
      where: { userId, team: { organizationId, deletedAt: null } },
      select: { teamId: true },
    });
    const channels = await this.prisma.channel.findMany({
      where: {
        organizationId,
        type: "CHANNEL",
        deletedAt: null,
        isArchived: false,
        OR: [{ visibility: "PUBLIC" }, { members: { some: { userId } } }],
        AND: [{
          OR: [
            { teamId: null },
            { teamId: { in: teamMemberships.map(({ teamId }) => teamId) } },
            { team: { is: { visibility: "PUBLIC", deletedAt: null } } },
          ],
        }],
      },
      orderBy: { createdAt: "asc" },
      include: { members: { select: { userId: true, role: true } } },
    });
    return channels.map((channel) => this.serializeChannel(channel));
  }

  async createChannel(organizationId: string, creatorUserId: string, dto: CreateChannelDto) {
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
        layout: dto.layout ?? "THREADS",
        topic: dto.topic ?? null,
        description: dto.description ?? null,
        imageUrl: dto.imageUrl ?? null,
        createdById: creatorUserId,
        members: { create: { userId: creatorUserId, role: "ADMIN" } },
      },
      include: { members: { select: { userId: true, role: true } } },
    });

    await this.audit.record({
      action: "connect.channel.created",
      organizationId,
      actorUserId: creatorUserId,
      resourceType: "Channel",
      resourceId: channel.id,
    });
    return this.serializeChannel(channel);
  }

  async getChannelForMember(
    organizationId: string,
    channelId: string,
    userId: string,
    requireChannelMembership = false,
  ): Promise<Channel> {
    await this.assertOrganizationMember(organizationId, userId);
    const channelRecord = await this.prisma.channel.findFirst({
      where: { id: channelId, organizationId, deletedAt: null },
      include: { team: { select: { visibility: true, deletedAt: true } } },
    });
    if (!channelRecord) {
      throw new AppError(ErrorCode.CHANNEL_NOT_FOUND, "Channel not found", HttpStatus.NOT_FOUND);
    }
    const { team, ...channel } = channelRecord;

    const member = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true },
    });
    const canAccessPublicChannel = requireChannelMembership && channel.type === "CHANNEL" && channel.visibility === "PUBLIC";
    if ((channel.visibility === "PRIVATE" || channel.type !== "CHANNEL" || (requireChannelMembership && !canAccessPublicChannel)) && !member) {
      throw new AppError(ErrorCode.FORBIDDEN, "You are not a member of this channel", HttpStatus.FORBIDDEN);
    }

    if (channel.teamId) {
      const teamMember = await this.prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: channel.teamId, userId } },
        select: { id: true },
      });
      if ((!team || team.deletedAt || team.visibility === "PRIVATE") && !teamMember) {
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
  ) {
    await this.getChannelForMember(organizationId, channelId, userId);
    const channel = await this.prisma.channel.update({
      where: { id: channelId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.topic !== undefined ? { topic: dto.topic } : {}),
        ...(dto.layout !== undefined ? { layout: dto.layout } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.isArchived !== undefined ? { isArchived: dto.isArchived } : {}),
      },
      include: { members: { select: { userId: true, role: true } } },
    });
    return this.serializeChannel(channel);
  }

  async deleteChannel(organizationId: string, channelId: string, userId: string): Promise<void> {
    const channel = await this.requireChannelAdmin(organizationId, channelId, userId);
    const memberIds = channel.type === "GROUP"
      ? (await this.prisma.channelMember.findMany({ where: { channelId }, select: { userId: true } })).map((member) => member.userId)
      : [];
    await this.prisma.channel.update({
      where: { id: channelId },
      data: { deletedAt: new Date(), isArchived: true, slug: null },
    });
    await this.audit.record({
      action: "connect.channel.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "Channel",
      resourceId: channelId,
    });
    if (channel.type === "GROUP") {
      this.publisher.groupDeleted(organizationId, memberIds, channelId);
    }
  }

  async upsertChannelMember(organizationId: string, channelId: string, actorUserId: string, userId: string, role: "ADMIN" | "MEMBER"): Promise<void> {
    const channel = await this.requireChannelAdmin(organizationId, channelId, actorUserId);
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
    const existingMember = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { id: true, leftAt: true },
    });
    await this.prisma.channelMember.upsert({
      where: { channelId_userId: { channelId, userId } },
      create: { channelId, userId, role },
      update: { role, leftAt: null },
    });
    if (channel.type === "GROUP" && (!existingMember || existingMember.leftAt)) {
      await this.createGroupMembershipLog(organizationId, channelId, actorUserId, userId, "added");
      this.publisher.groupCreated(organizationId, [userId], { id: channelId });
    }
  }

  async removeMember(organizationId: string, channelId: string, actorUserId: string, userId: string): Promise<void> {
    const channel = await this.requireChannelAdmin(organizationId, channelId, actorUserId);
    const membership = await this.prisma.channelMember.findUnique({ where: { channelId_userId: { channelId, userId } }, select: { role: true } });
    if (membership?.role === "ADMIN") {
      const adminCount = await this.prisma.channelMember.count({ where: { channelId, role: "ADMIN" } });
      if (adminCount === 1) {throw new AppError(ErrorCode.FORBIDDEN, "A channel must have at least one admin", HttpStatus.BAD_REQUEST);}
    }
    if (channel.type === "GROUP") {
      await this.prisma.channelMember.update({
        where: { channelId_userId: { channelId, userId } },
        data: { leftAt: new Date() },
      });
    } else {
      await this.prisma.channelMember.deleteMany({ where: { channelId, userId } });
    }
    if (channel.type === "GROUP") {
      await this.createGroupMembershipLog(organizationId, channelId, actorUserId, userId, "removed");
    }
  }

  async leaveGroupConversation(organizationId: string, channelId: string, userId: string, newAdminUserId?: string): Promise<void> {
    const channel = await this.getChannelForMember(organizationId, channelId, userId, true);
    if (channel.type !== "GROUP") {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Only group members can leave a group", HttpStatus.BAD_REQUEST);
    }
    const remainingMembers = await this.prisma.channelMember.findMany({
      where: { channelId, userId: { not: userId }, leftAt: null },
      orderBy: { createdAt: "asc" },
      select: { userId: true },
    });
    await this.prisma.$transaction(async (transaction) => {
      if (channel.createdById === userId) {
        if (!newAdminUserId || !remainingMembers.some((member) => member.userId === newAdminUserId)) {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Select an active group participant to become admin", HttpStatus.BAD_REQUEST);
        }
        await transaction.channel.update({
          where: { id: channelId },
          data: { createdById: newAdminUserId },
        });
        await transaction.channelMember.update({
          where: { channelId_userId: { channelId, userId: newAdminUserId } },
          data: { role: "ADMIN" },
        });
      }
      await transaction.channelMember.update({
        where: { channelId_userId: { channelId, userId } },
        data: { leftAt: new Date() },
      });
    });
    if (channel.createdById === userId && newAdminUserId) {
      this.publisher.groupAdminAssigned(organizationId, newAdminUserId, channelId);
    }
    await this.createGroupMembershipLog(organizationId, channelId, userId, userId, "left");
  }

  private async createGroupMembershipLog(
    organizationId: string,
    channelId: string,
    actorUserId: string,
    subjectUserId: string,
    action: "added" | "removed" | "left",
  ) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...new Set([actorUserId, subjectUserId])] } },
      select: { id: true, name: true },
    });
    const names = new Map(users.map((user) => [user.id, user.name]));
    const subjectName = names.get(subjectUserId) ?? "A member";
    const content =
      action === "left"
        ? `${subjectName} left the group`
        : `${names.get(actorUserId) ?? "An admin"} ${action} ${subjectName}${action === "added" ? " to the group" : " from the group"}`;
    const message = await this.prisma.message.create({
      data: { organizationId, channelId, authorId: actorUserId, content, isSystem: true },
    });
    const recipients = await this.prisma.channelMember.findMany({
      where: { channelId },
      select: { userId: true },
    });
    this.publisher.publishToUsers(
      organizationId,
      recipients.map((member) => member.userId),
      "message:created",
      { channelId, message },
    );
  }

  // ---------------- Messages ----------------

  async listPosts(organizationId: string, channelId: string, userId: string) {
    await this.getChannelForMember(organizationId, channelId, userId, true);
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { lastReadAt: true },
    });
    const posts = await this.prisma.post.findMany({
      where: { organizationId, channelId, deletedAt: null },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      include: this.postInclude(userId),
    });
    return posts.map((post) => ({
      ...this.serializePost(post),
      isUnread: post.authorId !== userId && (!membership?.lastReadAt || post.createdAt > membership.lastReadAt),
    }));
  }

  async createPost(organizationId: string, channelId: string, authorId: string, dto: CreatePostDto) {
    const channel = await this.getChannelForMember(organizationId, channelId, authorId, true);
    const closesAt = dto.poll?.closesAt ? new Date(dto.poll.closesAt) : null;
    if (closesAt && closesAt <= new Date()) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll closing time must be in the future", HttpStatus.BAD_REQUEST);
    }
    if (dto.poll) {
      const optionContent = dto.poll.options.map((option) => option.content.trim().toLocaleLowerCase());
      if (new Set(optionContent).size !== optionContent.length) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll options must be unique", HttpStatus.BAD_REQUEST);
      }
    }
    const post = await this.prisma.post.create({
      data: {
        organizationId, channelId, authorId, title: dto.title?.trim() || null, content: dto.content,
        contentHtml: dto.contentHtml ?? null, imageUrl: dto.imageUrl ?? null,
        backgroundImageUrl: dto.backgroundImageUrl ?? null, backgroundColor: dto.backgroundColor ?? null,
        ...(dto.poll ? {
          poll: {
            create: {
              allowsVoteChanges: dto.poll.allowsVoteChanges ?? false, closesAt,
              options: { create: dto.poll.options.map((option, position) => ({ content: option.content.trim(), position })) },
            },
          },
        } : {}),
      },
      include: this.postInclude(authorId),
    });
    await this.audit.record({
      action: "connect.post.created", organizationId, actorUserId: authorId, resourceType: "Post", resourceId: post.id,
      metadata: { channelId, hasPoll: Boolean(dto.poll) },
    });
    const serialized = this.serializePost(post);
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "post:created", { channelId, post: serialized });
    return serialized;
  }

  async deletePost(organizationId: string, postId: string, authorId: string): Promise<void> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, organizationId, authorId, deletedAt: null },
      select: { id: true },
    });
    if (!post) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Post not found", HttpStatus.NOT_FOUND);
    }

    await this.prisma.post.update({
      where: { id: postId },
      data: { deletedAt: new Date() },
    });
    await this.audit.record({
      action: "connect.post.deleted",
      organizationId,
      actorUserId: authorId,
      resourceType: "Post",
      resourceId: postId,
    });
  }

  async updatePost(organizationId: string, postId: string, authorId: string, dto: UpdatePostDto) {
    const post = await this.getPost(organizationId, postId);
    if (post.authorId !== authorId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author can edit a post", HttpStatus.FORBIDDEN);
    }
    await this.getChannelForMember(organizationId, post.channelId, authorId, true);
    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title?.trim() || null } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.contentHtml !== undefined ? { contentHtml: dto.contentHtml } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
        ...(dto.backgroundImageUrl !== undefined ? { backgroundImageUrl: dto.backgroundImageUrl } : {}),
        ...(dto.backgroundColor !== undefined ? { backgroundColor: dto.backgroundColor } : {}),
      },
      include: this.postInclude(authorId),
    });
    await this.audit.record({
      action: "connect.post.updated",
      organizationId,
      actorUserId: authorId,
      resourceType: "Post",
      resourceId: postId,
    });
    return this.serializePost(updated);
  }

  async createPostComment(organizationId: string, postId: string, authorId: string, content: string) {
    const post = await this.getPost(organizationId, postId);
    await this.getChannelForMember(organizationId, post.channelId, authorId, true);
    const comment = await this.prisma.postComment.create({
      data: { organizationId, postId, authorId, content: content.trim() },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: { select: { userId: true, emoji: true } },
      },
    });
    await this.audit.record({
      action: "connect.post.comment.created",
      organizationId,
      actorUserId: authorId,
      resourceType: "Post",
      resourceId: postId,
      metadata: { commentId: comment.id },
    });
    return comment;
  }

  async addPostReaction(organizationId: string, postId: string, userId: string, emoji: string): Promise<void> {
    const post = await this.getPost(organizationId, postId);
    await this.getChannelForMember(organizationId, post.channelId, userId, true);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.postReaction.deleteMany({ where: { postId, userId } });
      await transaction.postReaction.create({ data: { postId, userId, emoji } });
    });
    await this.audit.record({
      action: "connect.post.reaction.added",
      organizationId,
      actorUserId: userId,
      resourceType: "Post",
      resourceId: postId,
      metadata: { emoji },
    });
  }

  async deletePostComment(organizationId: string, commentId: string, userId: string): Promise<void> {
    const comment = await this.getPostComment(organizationId, commentId);
    await this.getChannelForMember(organizationId, comment.post.channelId, userId, true);
    if (comment.authorId !== userId && comment.post.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the comment owner or post author can delete this comment", HttpStatus.FORBIDDEN);
    }
    await this.prisma.postComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
    await this.audit.record({
      action: "connect.post.comment.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "PostComment",
      resourceId: commentId,
      metadata: { postId: comment.postId },
    });
  }

  async updatePostComment(organizationId: string, commentId: string, userId: string, content: string) {
    const comment = await this.getPostComment(organizationId, commentId);
    if (comment.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the comment owner can edit this comment", HttpStatus.FORBIDDEN);
    }
    await this.getChannelForMember(organizationId, comment.post.channelId, userId, true);
    const updated = await this.prisma.postComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: { select: { userId: true, emoji: true } },
      },
    });
    await this.audit.record({
      action: "connect.post.comment.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "PostComment",
      resourceId: commentId,
    });
    return updated;
  }

  async addPostCommentReaction(organizationId: string, commentId: string, userId: string, emoji: string): Promise<void> {
    const comment = await this.getPostComment(organizationId, commentId);
    await this.getChannelForMember(organizationId, comment.post.channelId, userId, true);
    await this.prisma.$transaction(async (transaction) => {
      await transaction.postCommentReaction.deleteMany({ where: { commentId, userId } });
      await transaction.postCommentReaction.create({ data: { commentId, userId, emoji } });
    });
  }

  async removePostCommentReaction(organizationId: string, commentId: string, userId: string, emoji: string): Promise<void> {
    const comment = await this.getPostComment(organizationId, commentId);
    await this.getChannelForMember(organizationId, comment.post.channelId, userId, true);
    await this.prisma.postCommentReaction.deleteMany({ where: { commentId, userId, emoji } });
  }

  async removePostReaction(organizationId: string, postId: string, userId: string, emoji: string): Promise<void> {
    const post = await this.getPost(organizationId, postId);
    await this.getChannelForMember(organizationId, post.channelId, userId, true);
    await this.prisma.postReaction.deleteMany({ where: { postId, userId, emoji } });
    await this.audit.record({
      action: "connect.post.reaction.removed",
      organizationId,
      actorUserId: userId,
      resourceType: "Post",
      resourceId: postId,
      metadata: { emoji },
    });
  }

  async votePoll(organizationId: string, pollId: string, userId: string, optionId: string) {
    const poll = await this.prisma.poll.findFirst({
      where: {
        id: pollId,
        OR: [
          { post: { organizationId, deletedAt: null } },
          { message: { organizationId, deletedAt: null } },
        ],
      },
      include: { post: { select: { channelId: true } }, message: { select: { channelId: true } } },
    });
    if (!poll) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll not found", HttpStatus.NOT_FOUND);}
    const channelId = poll.post?.channelId ?? poll.message?.channelId;
    if (!channelId) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll owner not found", HttpStatus.NOT_FOUND);}
    const channel = await this.getChannelForMember(organizationId, channelId, userId, true);
    if (poll.closesAt && poll.closesAt <= new Date()) {
      throw new AppError(ErrorCode.FORBIDDEN, "This poll is closed", HttpStatus.FORBIDDEN);
    }
    const option = await this.prisma.pollOption.findFirst({ where: { id: optionId, pollId }, select: { id: true } });
    if (!option) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll option not found", HttpStatus.BAD_REQUEST);}
    const existingVote = await this.prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId, userId } }, select: { id: true, pollOptionId: true },
    });
    if (existingVote && existingVote.pollOptionId !== optionId && !poll.allowsVoteChanges) {
      throw new AppError(ErrorCode.FORBIDDEN, "This poll does not allow vote changes", HttpStatus.FORBIDDEN);
    }
    if (!existingVote || existingVote.pollOptionId !== optionId) {
      await this.prisma.pollVote.upsert({
        where: { pollId_userId: { pollId, userId } },
        create: { pollId, pollOptionId: optionId, userId },
        update: { pollOptionId: optionId },
      });
    }
    const post = poll.postId ? await this.prisma.post.findFirst({
      where: { id: poll.postId, organizationId, deletedAt: null }, include: this.postInclude(userId),
    }) : null;
    const message = poll.messageId ? await this.prisma.message.findFirst({
      where: { id: poll.messageId, organizationId, deletedAt: null }, include: this.messageInclude(userId),
    }) : null;
    if (!post && !message) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll owner not found", HttpStatus.NOT_FOUND);}
    await this.audit.record({
      action: "connect.poll.voted", organizationId, actorUserId: userId, resourceType: "Poll", resourceId: pollId,
      metadata: { postId: post?.id, messageId: message?.id, optionId },
    });
    const serialized = post ? this.serializePost(post) : this.serializeMessage(message!);
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "poll:vote-changed", {
      channelId: channel.id, postId: post?.id, messageId: message?.id, poll: serialized.poll,
    });
    return serialized;
  }

  async listMessages(
    organizationId: string,
    channelId: string,
    userId: string,
    options: { cursor?: string; limit?: number; initial?: "unread"; after?: string },
  ) {
    await this.getChannelForMember(organizationId, channelId, userId, true);

    const members = await this.prisma.channelMember.findMany({
      where: { channelId }, select: { userId: true, lastReadAt: true, leftAt: true },
    });
    const viewerMembership = members.find((member) => member.userId === userId);
    const lastReadAt = viewerMembership?.lastReadAt;
    const historyCutoff = viewerMembership?.leftAt;
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
      where: { organizationId, channelId, deletedAt: null, ...(historyCutoff ? { createdAt: { lte: historyCutoff } } : {}) },
      orderBy: [{ createdAt: forward ? "asc" : "desc" }, { id: forward ? "asc" : "desc" }],
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : firstUnread ? { cursor: { id: firstUnread.id } } : {}),
      include: this.messageInclude(userId),
    });

    const [pinnedMessages, pinnedCount] = await Promise.all([
      this.prisma.message.findMany({
        where: { organizationId, channelId, deletedAt: null, pinnedAt: { not: null } },
        orderBy: [{ pinnedAt: "desc" }, { id: "desc" }],
        include: this.messageInclude(userId),
      }),
      this.prisma.message.count({
        where: { organizationId, channelId, deletedAt: null, pinnedAt: { not: null } },
      }),
    ]);
    const hasMore = messages.length > limit;
    const page = hasMore ? messages.slice(0, limit) : messages;
    return {
      messages: page.map((message) => this.serializeMessage(message)),
      pinnedMessages: pinnedMessages.map((message) => this.serializeMessage(message)),
      pinnedCount,
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
  ) {
    const channel = await this.getChannelForMember(organizationId, channelId, authorId, true);
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId: authorId } },
      select: { leftAt: true },
    });
    if (channel.type === "GROUP" && membership?.leftAt) {
      throw new AppError(ErrorCode.FORBIDDEN, "Former group members can only view previous messages", HttpStatus.FORBIDDEN);
    }

    if (dto.parentId) {
      const parent = await this.prisma.message.findFirst({
        where: { id: dto.parentId, channelId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!parent) {
        throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Parent message not found", HttpStatus.BAD_REQUEST);
      }
    }
    this.assertValidPoll(dto.poll);

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
            ...(dto.poll ? { poll: { create: this.createPollData(dto.poll) } } : {}),
          },
          update: {},
          include: this.messageInclude(authorId),
        })
      : await this.prisma.message.create({
          data: {
            organizationId,
            channelId,
            authorId,
            parentId: dto.parentId ?? null,
            content: dto.content,
            mentions: { create: mentionUserIds.map((userId) => ({ userId })) },
            ...(dto.poll ? { poll: { create: this.createPollData(dto.poll) } } : {}),
          },
          include: this.messageInclude(authorId),
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
    return this.serializeMessage(message);
  }

  async recordCallActivity(
    organizationId: string,
    channelId: string,
    actorUserId: string,
    details: {
      callId: string;
      action: "initiated" | "accepted" | "declined" | "missed" | "ended";
      type?: "audio" | "video";
      durationSeconds?: number;
    },
  ): Promise<MessageWithMeta> {
    const channel = await this.getChannelForMember(organizationId, channelId, actorUserId, true);
    const actor = await this.prisma.user.findFirst({
      where: { id: actorUserId, deletedAt: null },
      select: { name: true },
    });
    const type = details.type ?? "audio";
    const duration = details.durationSeconds === undefined
      ? ""
      : ` · ${Math.floor(details.durationSeconds / 60)}:${String(details.durationSeconds % 60).padStart(2, "0")}`;
    const description = details.action === "initiated"
      ? `${actor?.name ?? "Someone"} started a ${type} call`
      : details.action === "accepted"
        ? `${actor?.name ?? "Someone"} accepted the call`
        : details.action === "declined"
          ? `${actor?.name ?? "Someone"} declined the call`
          : details.action === "missed"
            ? `Missed ${type} call`
            : `${actor?.name ?? "Someone"} ended the call${duration}`;
    const message = await this.prisma.message.create({
      data: {
        organizationId,
        channelId,
        authorId: actorUserId,
        content: `[CALL] ${description}`,
      },
      include: this.messageInclude(actorUserId),
    });

    await this.audit.record({
      action: `connect.call.${details.action}`,
      organizationId,
      actorUserId,
      resourceType: "Call",
      resourceId: details.callId,
      metadata: { channelId, type: details.type, durationSeconds: details.durationSeconds },
    });

    const recipientUserIds = await this.getRecipientUserIds(organizationId, channel);
    this.publisher.messageCreated(organizationId, channelId, recipientUserIds, message);
    if (channel.type === "DIRECT" || channel.type === "GROUP") {
      await Promise.all(recipientUserIds.map((userId) => this.recordRecentChat(organizationId, userId, channelId)));
      this.publisher.chatActivityChanged(organizationId, recipientUserIds, {
        channelId,
        messageId: message.id,
        senderId: actorUserId,
        createdAt: message.createdAt,
      });
    }
    return message;
  }

  async createCallRecord(
    organizationId: string,
    channelId: string,
    initiatorUserId: string,
    details: {
      callId: string;
      scope: "one-to-one" | "group" | "channel" | "meeting";
      type: "audio" | "video";
      participantIds: string[];
    },
  ): Promise<void> {
    await this.getChannelForMember(organizationId, channelId, initiatorUserId, true);
    const scopeByName: Record<typeof details.scope, ConnectCallScope> = {
      "one-to-one": "ONE_TO_ONE",
      group: "GROUP",
      channel: "CHANNEL",
      meeting: "MEETING",
    };
    const type: ConnectCallType = details.type === "video" ? "VIDEO" : "AUDIO";
    const participantIds = [...new Set(details.participantIds)];

    await this.prisma.connectCall.upsert({
      where: { id: details.callId },
      create: {
        id: details.callId,
        organizationId,
        channelId,
        initiatedById: initiatorUserId,
        scope: scopeByName[details.scope],
        type,
        participants: { create: participantIds.map((userId) => ({ userId })) },
      },
      update: {},
    });
  }

  async updateCallRecord(
    organizationId: string,
    channelId: string,
    userId: string,
    details: {
      callId: string;
      action: "accept" | "reject" | "miss" | "cancel" | "end";
      durationSeconds?: number;
    },
  ): Promise<"audio" | "video" | undefined> {
    await this.getChannelForMember(organizationId, channelId, userId, true);
    const statusByAction: Record<typeof details.action, ConnectCallStatus> = {
      accept: "ACTIVE",
      reject: "DECLINED",
      miss: "MISSED",
      cancel: "CANCELLED",
      end: "ENDED",
    };
    const terminal = details.action === "reject" || details.action === "miss" || details.action === "cancel" || details.action === "end";
    const call = await this.prisma.connectCall.findFirst({
      where: { id: details.callId, organizationId, channelId },
      select: { id: true, type: true },
    });
    if (!call) {return undefined;}

    await this.prisma.connectCall.update({
      where: { id: call.id },
      data: {
        status: statusByAction[details.action],
        ...(terminal ? { endedAt: new Date(), durationSeconds: details.durationSeconds } : {}),
      },
    });

    await this.prisma.connectCallParticipant.upsert({
      where: { callId_userId: { callId: details.callId, userId } },
      create: { callId: details.callId, userId, joinedAt: details.action === "accept" ? new Date() : undefined },
      update: details.action === "accept" ? { joinedAt: new Date(), leftAt: null } : terminal ? { leftAt: new Date() } : {},
    });
    return call.type === "VIDEO" ? "video" : "audio";
  }

  async leaveSharedCall(organizationId: string, channelId: string, userId: string, callId: string): Promise<{ ended: boolean }> {
    await this.getChannelForMember(organizationId, channelId, userId, true);
    const call = await this.prisma.connectCall.findFirst({
      where: { id: callId, organizationId, channelId, scope: { in: ["GROUP", "CHANNEL", "MEETING"] }, status: { in: ["RINGING", "ACTIVE"] } },
      select: { id: true, startedAt: true },
    });
    if (!call) {return { ended: false };}

    await this.prisma.connectCallParticipant.updateMany({
      where: { callId, userId, joinedAt: { not: null }, leftAt: null },
      data: { leftAt: new Date() },
    });
    const activeParticipants = await this.prisma.connectCallParticipant.count({
      where: { callId, joinedAt: { not: null }, leftAt: null },
    });
    const ended = activeParticipants === 0;
    if (ended) {
      const endedAt = new Date();
      await this.prisma.connectCall.update({
        where: { id: call.id },
        data: {
          status: "ENDED",
          endedAt,
          durationSeconds: Math.max(0, Math.round((endedAt.getTime() - call.startedAt.getTime()) / 1000)),
        },
      });
    }
    await this.audit.record({
      action: ended ? "connect.call.ended" : "connect.call.left",
      organizationId,
      actorUserId: userId,
      resourceType: "Call",
      resourceId: callId,
      metadata: { channelId, activeParticipants },
    });
    return { ended };
  }

  async getCallTokenAccess(organizationId: string, userId: string, callId: string) {
    const call = await this.prisma.connectCall.findFirst({
      where: {
        id: callId,
        organizationId,
        status: { in: ["RINGING", "ACTIVE"] },
        participants: { some: { userId } },
      },
      select: { channelId: true },
    });
    if (!call) {
      throw new AppError(ErrorCode.FORBIDDEN, "Call access is not available", HttpStatus.FORBIDDEN);
    }

    await this.getChannelForMember(organizationId, call.channelId, userId, true);
    return { channel: `connect-${call.channelId}`, userId };
  }

  async requestCallRecording(organizationId: string, userId: string, callId: string) {
    const call = await this.prisma.connectCall.findFirst({
      where: { id: callId, organizationId, status: "ACTIVE", initiatedById: userId },
      include: { participants: { select: { userId: true } } },
    });
    if (!call) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the call initiator can request recording for an active call", HttpStatus.FORBIDDEN);
    }
    await this.getChannelForMember(organizationId, call.channelId, userId, true);
    const consents = Object.fromEntries(call.participants.map(({ userId: participantId }) => [participantId, participantId === userId]));
    const recording = await this.prisma.connectCallRecording.upsert({
      where: { callId },
      create: { callId, organizationId, requestedById: userId, participantConsents: consents },
      update: { participantConsents: consents, status: "PENDING_CONSENT" },
    });
    await this.audit.record({
      action: "connect.call.recording.requested",
      organizationId,
      actorUserId: userId,
      resourceType: "CallRecording",
      resourceId: recording.id,
      metadata: { callId },
    });
    return recording;
  }

  async setCallRecordingConsent(organizationId: string, userId: string, callId: string, consent: boolean) {
    const call = await this.prisma.connectCall.findFirst({
      where: { id: callId, organizationId, status: "ACTIVE", participants: { some: { userId } } },
      include: { participants: { select: { userId: true } }, recording: true },
    });
    if (!call?.recording) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Recording consent has not been requested", HttpStatus.BAD_REQUEST);
    }
    await this.getChannelForMember(organizationId, call.channelId, userId, true);
    const existing = call.recording.participantConsents;
    const consents = existing && typeof existing === "object" && !Array.isArray(existing)
      ? Object.fromEntries(Object.entries(existing).map(([participantId, value]) => [participantId, value === true]))
      : {};
    consents[userId] = consent;
    const ready = call.participants.every(({ userId: participantId }) => consents[participantId] === true);
    const recording = await this.prisma.connectCallRecording.update({
      where: { id: call.recording.id },
      data: { participantConsents: consents, status: ready ? "READY" : "PENDING_CONSENT" },
    });
    await this.audit.record({
      action: "connect.call.recording.consent_updated",
      organizationId,
      actorUserId: userId,
      resourceType: "CallRecording",
      resourceId: recording.id,
      metadata: { callId, consent },
    });
    return recording;
  }

  async getCallRecordingConsent(organizationId: string, userId: string, callId: string) {
    const call = await this.prisma.connectCall.findFirst({
      where: { id: callId, organizationId, participants: { some: { userId } } },
      include: { participants: { select: { userId: true } }, recording: true },
    });
    if (!call) {
      throw new AppError(ErrorCode.FORBIDDEN, "Call access is not available", HttpStatus.FORBIDDEN);
    }
    await this.getChannelForMember(organizationId, call.channelId, userId, true);
    if (!call.recording) {return null;}

    const source = call.recording.participantConsents;
    const consents = source && typeof source === "object" && !Array.isArray(source)
      ? Object.fromEntries(Object.entries(source).map(([participantId, value]) => [participantId, value === true]))
      : {};
    return {
      status: call.recording.status,
      participants: call.participants.map(({ userId: participantId }) => participantId),
      consents,
    };
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
      include: this.messageInclude(userId),
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:updated", { channelId: channel.id, message: updated });
    return updated;
  }

  async toggleMessagePin(organizationId: string, messageId: string, userId: string) {
    const message = await this.getMessage(organizationId, messageId);
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);
    const updated = await this.prisma.message.update({
      where: { id: message.id },
      data: { pinnedAt: message.pinnedAt ? null : new Date() },
      include: this.messageInclude(userId),
    });
    const serialized = this.serializeMessage(updated);
    await this.audit.record({
      action: updated.pinnedAt ? "connect.message.pinned" : "connect.message.unpinned",
      organizationId,
      actorUserId: userId,
      resourceType: "Message",
      resourceId: message.id,
      metadata: { channelId: channel.id },
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:updated", {
      channelId: channel.id,
      message: serialized,
    });
    return serialized;
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
      include: this.messageInclude(userId),
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

    await this.prisma.$transaction(async (transaction) => {
      await transaction.messageReaction.deleteMany({ where: { messageId, userId } });
      await transaction.messageReaction.create({ data: { messageId, userId, emoji } });
    });
    await this.audit.record({
      action: "connect.message.reaction.added",
      organizationId,
      actorUserId: userId,
      resourceType: "Message",
      resourceId: messageId,
      metadata: { emoji },
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:reaction-changed", { channelId: channel.id, messageId, userId, emoji, added: true });
  }

  async removeReaction(organizationId: string, messageId: string, userId: string, emoji: string): Promise<void> {
    const message = await this.getMessage(organizationId, messageId);
    const channel = await this.getChannelForMember(organizationId, message.channelId, userId, true);
    await this.prisma.messageReaction.deleteMany({ where: { messageId, userId, emoji } });
    await this.audit.record({
      action: "connect.message.reaction.removed",
      organizationId,
      actorUserId: userId,
      resourceType: "Message",
      resourceId: messageId,
      metadata: { emoji },
    });
    this.publisher.publishToUsers(organizationId, await this.getRecipientUserIds(organizationId, channel), "message:reaction-changed", { channelId: channel.id, messageId, userId, emoji, added: false });
  }

  async markChannelRead(organizationId: string, channelId: string, userId: string, messageId?: string) {
    const channel = await this.getChannelForMember(organizationId, channelId, userId, true);
    const message = await this.prisma.message.findFirst({
      where: { organizationId, channelId, deletedAt: null, ...(messageId ? { id: messageId } : {}) },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { createdAt: true },
    });
    if (!message) {
      if (messageId) {throw new AppError(ErrorCode.MESSAGE_NOT_FOUND, "Message not found", HttpStatus.NOT_FOUND);}
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

  private messageInclude(userId: string) {
    return {
      author: { select: { id: true, name: true, avatarUrl: true } },
      mentions: { select: { userId: true } },
      reactions: { select: { userId: true, emoji: true } },
      _count: { select: { replies: true } },
      poll: {
        include: {
          options: { orderBy: { position: "asc" as const }, include: { _count: { select: { votes: true } } } },
          votes: { where: { userId }, select: { id: true, pollOptionId: true } },
        },
      },
    } as const;
  }

  private postInclude(userId: string) {
    return {
      author: { select: { id: true, name: true, avatarUrl: true } },
      comments: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" as const },
        include: {
          author: { select: { id: true, name: true, avatarUrl: true } },
          reactions: { select: { userId: true, emoji: true } },
        },
      },
      reactions: { select: { userId: true, emoji: true } },
      poll: {
        include: {
          options: { orderBy: { position: "asc" as const }, include: { _count: { select: { votes: true } } } },
          votes: { where: { userId }, select: { id: true, pollOptionId: true } },
        },
      },
    } as const;
  }

  private serializePost(post: PostWithPoll) {
    const { poll, comments, reactions, ...details } = post;
    return {
      ...details,
      comments,
      reactions,
      poll: poll ? {
        id: poll.id, allowsVoteChanges: poll.allowsVoteChanges, closesAt: poll.closesAt,
        createdAt: poll.createdAt, updatedAt: poll.updatedAt,
        options: poll.options.map((option) => ({
          id: option.id, content: option.content, position: option.position, voteCount: option._count.votes,
        })),
        currentVote: poll.votes[0] ?? null,
      } : null,
    };
  }

  private serializeMessage(message: MessageWithMeta) {
    const { poll, ...details } = message;
    return {
      ...details,
      poll: poll ? {
        id: poll.id, allowsVoteChanges: poll.allowsVoteChanges, closesAt: poll.closesAt,
        createdAt: poll.createdAt, updatedAt: poll.updatedAt,
        options: poll.options.map((option) => ({
          id: option.id, content: option.content, position: option.position, voteCount: option._count.votes,
        })),
        currentVote: poll.votes[0] ?? null,
      } : null,
    };
  }

  private assertValidPoll(poll?: CreatePollDto): void {
    if (!poll) {return;}
    if (poll.closesAt && new Date(poll.closesAt) <= new Date()) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll closing time must be in the future", HttpStatus.BAD_REQUEST);
    }
    const optionContent = poll.options.map((option) => option.content.trim().toLocaleLowerCase());
    if (new Set(optionContent).size !== optionContent.length) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Poll options must be unique", HttpStatus.BAD_REQUEST);
    }
  }

  private createPollData(poll: CreatePollDto) {
    return {
      allowsVoteChanges: poll.allowsVoteChanges ?? false,
      closesAt: poll.closesAt ? new Date(poll.closesAt) : null,
      options: { create: poll.options.map((option, position) => ({ content: option.content.trim(), position })) },
    };
  }

  private async recordRecentChat(organizationId: string, userId: string, channelId: string): Promise<void> {
    await this.mutatePreferences(organizationId, userId, (current) => ({
      ...current,
      recentChats: toStringList(toSidebarPreferences(current.favorites).chats).includes(channelId)
        ? toStringList(current.recentChats).filter((id) => id !== channelId)
        : [channelId, ...toStringList(current.recentChats).filter((id) => id !== channelId)].slice(0, 100),
    }));
  }

  private async mutatePreferences(organizationId: string, userId: string, mutate: (current: Record<string, unknown>) => Record<string, unknown>) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`connect-sidebar:${organizationId}:${userId}`}, 0))`;
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

  private async getPost(organizationId: string, postId: string): Promise<Post> {
    const post = await this.prisma.post.findFirst({
      where: { id: postId, organizationId, deletedAt: null },
    });
    if (!post) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Post not found", HttpStatus.NOT_FOUND);
    }
    return post;
  }

  private async getPostComment(organizationId: string, commentId: string) {
    const comment = await this.prisma.postComment.findFirst({
      where: { id: commentId, organizationId, deletedAt: null },
      include: { post: { select: { id: true, authorId: true, channelId: true } } },
    });
    if (!comment) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Post comment not found", HttpStatus.NOT_FOUND);
    }
    return comment;
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

  private serializeTeam(team: Team & { members: Array<{ userId: string; role: "ADMIN" | "MEMBER" }> }) {
    const { members, ...details } = team;
    return {
      ...details,
      admins: members.filter((member) => member.role === "ADMIN").map((member) => member.userId),
      users: members.map((member) => member.userId),
    };
  }

  private serializeChannel(channel: ChannelWithMembers) {
    const { members, ...details } = channel;
    return {
      ...details,
      admins: members.filter((member) => member.role === "ADMIN").map((member) => member.userId),
      users: members.map((member) => member.userId),
    };
  }

  private async requireTeamAdmin(organizationId: string, teamId: string, userId: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: { teamId, userId, role: "ADMIN", team: { organizationId, deletedAt: null } },
      select: { team: true },
    });
    if (!membership) {throw new AppError(ErrorCode.FORBIDDEN, "Only team admins can perform this action", HttpStatus.FORBIDDEN);}
    return membership.team;
  }

  private async requireChannelAdmin(organizationId: string, channelId: string, userId: string) {
    const channel = await this.getChannelForMember(organizationId, channelId, userId);
    const membership = await this.prisma.channelMember.findUnique({
      where: { channelId_userId: { channelId, userId } },
      select: { role: true },
    });
    if (membership?.role !== "ADMIN") {throw new AppError(ErrorCode.FORBIDDEN, "Only channel admins can perform this action", HttpStatus.FORBIDDEN);}
    return channel;
  }
}
