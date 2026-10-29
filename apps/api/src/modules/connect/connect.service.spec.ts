import { HttpStatus } from "@nestjs/common";
import type { Channel } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { PrismaService } from "../../database/prisma.service";
import type { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";
import type { AuditService } from "../audit/audit.service";
import type { EntitlementService } from "../authorization/services/entitlement.service";
import type { AppSettingsService } from "../settings/app-settings.service";
import { DEFAULT_CONNECT_SETTINGS, type ConnectPolicy } from "../settings/settings.defaults";
import { ConnectService } from "./connect.service";

describe("ConnectService message restore", () => {
  const organizationId = "organization-id";
  const authorId = "author-id";
  const channelId = "channel-id";
  const messageId = "message-id";
  const deletedMessage = { id: messageId, organizationId, channelId, authorId, deletedAt: new Date(), isDeleted: true };
  let service: ConnectService;
  let prisma: {
    message: { findFirst: jest.Mock; update: jest.Mock };
    channelMember: { findMany: jest.Mock; findUnique: jest.Mock };
    organizationMember: { findMany: jest.Mock };
    team: { findFirst: jest.Mock };
    channel: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
    post: { findFirst: jest.Mock; update: jest.Mock };
    postComment: { create: jest.Mock };
  };
  let publisher: { publishToUsers: jest.Mock };
  let audit: { record: jest.Mock };
  let entitlements: { assertWithinLimit: jest.Mock };

  beforeEach(() => {
    prisma = {
      message: {
        findFirst: jest.fn().mockResolvedValue(deletedMessage),
        update: jest.fn().mockResolvedValue({ ...deletedMessage, deletedAt: null, isDeleted: false }),
      },
      channelMember: {
        findMany: jest.fn().mockResolvedValue([{ userId: authorId }, { userId: "removed-user" }]),
        findUnique: jest.fn().mockResolvedValue({ role: "ADMIN" }),
      },
      organizationMember: { findMany: jest.fn().mockResolvedValue([{ userId: authorId }]) },
      team: { findFirst: jest.fn().mockResolvedValue({ id: "team-id" }) },
      channel: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockResolvedValue({
            id: channelId,
            organizationId,
            teamId: "team-id",
            members: [{ userId: authorId, role: "ADMIN" }],
          }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      post: {
        findFirst: jest.fn().mockResolvedValue({ id: "post-id", channelId }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      postComment: {
        create: jest.fn().mockResolvedValue({ id: "comment-id", content: "Great update", author: { id: authorId } }),
      },
    };
    publisher = { publishToUsers: jest.fn() };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    entitlements = { assertWithinLimit: jest.fn().mockResolvedValue(undefined) };
    service = new ConnectService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      publisher as unknown as ConnectPublisherService,
      entitlements as unknown as EntitlementService,
      { isConnected: jest.fn().mockResolvedValue(false) } as never,
      { get: jest.fn().mockResolvedValue(DEFAULT_CONNECT_SETTINGS) } as never,
    );
    jest.spyOn(service, "getChannelForMember").mockResolvedValue({ id: channelId, teamId: null } as Channel);
  });

  describe("ConnectService public channel access", () => {
    it("allows an active organization member to access a public channel without joining it", async () => {
      const organizationId = "organization-id";
      const channelId = "channel-id";
      const userId = "user-id";
      const prisma = {
        organizationMember: { findFirst: jest.fn().mockResolvedValue({ id: "membership-id" }) },
        channel: {
          findFirst: jest.fn().mockResolvedValue({
            id: channelId,
            organizationId,
            type: "CHANNEL",
            visibility: "PUBLIC",
            teamId: null,
            deletedAt: null,
          }),
        },
        channelMember: { findUnique: jest.fn().mockResolvedValue(null) },
      };
      const service = new ConnectService(
        prisma as unknown as PrismaService,
        { record: jest.fn() } as unknown as AuditService,
        { publishToUsers: jest.fn() } as unknown as ConnectPublisherService,
        { assertWithinLimit: jest.fn() } as unknown as EntitlementService,
        { isConnected: jest.fn().mockResolvedValue(false) } as never,
        { get: jest.fn().mockResolvedValue(DEFAULT_CONNECT_SETTINGS) } as never,
      );

      await expect(service.getChannelForMember(organizationId, channelId, userId, true)).resolves.toMatchObject({
        id: channelId,
        visibility: "PUBLIC",
      });
    });
  });

  it("restores the original message and broadcasts only to eligible members", async () => {
    const restored = await service.restoreMessage(organizationId, messageId, authorId);

    expect(prisma.message.findFirst).toHaveBeenCalledWith({ where: { id: messageId, organizationId } });
    expect(service.getChannelForMember).toHaveBeenCalledWith(organizationId, channelId, authorId, true);
    expect(prisma.message.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: messageId },
        data: { deletedAt: null, isDeleted: false, deletedById: null },
      }),
    );
    expect(restored.id).toBe(messageId);
    expect(restored.isDeleted).toBe(false);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "connect.message.restored" }));
    expect(publisher.publishToUsers).toHaveBeenCalledWith(organizationId, [authorId], "message:updated", {
      channelId,
      message: restored,
    });
  });

  it("sets the deletion flag and timestamp together and broadcasts the flag", async () => {
    prisma.message.findFirst.mockResolvedValue({ ...deletedMessage, deletedAt: null, isDeleted: false });

    await service.deleteMessage(organizationId, messageId, authorId);

    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: messageId },
      data: { deletedAt: expect.any(Date), isDeleted: true, deletedById: authorId },
    });
    expect(publisher.publishToUsers).toHaveBeenCalledWith(organizationId, [authorId], "message:deleted", {
      channelId,
      messageId,
      isDeleted: true,
    });
  });

  it("rejects restoration by another user", async () => {
    await expect(service.restoreMessage(organizationId, messageId, "other-user")).rejects.toThrow(
      "Only the author can restore a message",
    );
    expect(prisma.message.update).not.toHaveBeenCalled();
    expect(publisher.publishToUsers).not.toHaveBeenCalled();
  });

  it("rejects messages outside the requested organization", async () => {
    prisma.message.findFirst.mockResolvedValue(null);
    await expect(service.restoreMessage("other-organization", messageId, authorId)).rejects.toThrow(
      "Message not found",
    );
    expect(prisma.message.findFirst).toHaveBeenCalledWith({
      where: { id: messageId, organizationId: "other-organization" },
    });
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it("rejects an author who has lost channel access", async () => {
    jest
      .spyOn(service, "getChannelForMember")
      .mockRejectedValue(new AppError(ErrorCode.FORBIDDEN, "Not a channel member", HttpStatus.FORBIDDEN));
    await expect(service.restoreMessage(organizationId, messageId, authorId)).rejects.toThrow("Not a channel member");
    expect(prisma.message.update).not.toHaveBeenCalled();
    expect(publisher.publishToUsers).not.toHaveBeenCalled();
  });

  it("persists the selected team ID when creating a channel", async () => {
    await service.createChannel(organizationId, authorId, {
      name: "Product updates",
      slug: "product-updates",
      teamId: "team-id",
    });

    expect(prisma.channel.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ teamId: "team-id" }),
      }),
    );
  });

  it("releases the slug when deleting a channel so it can be reused", async () => {
    await service.deleteChannel(organizationId, channelId, authorId);

    expect(prisma.channelMember.findUnique).toHaveBeenCalledWith({
      where: { channelId_userId: { channelId, userId: authorId } },
      select: { role: true },
    });
    expect(prisma.channel.update).toHaveBeenCalledWith({
      where: { id: channelId },
      data: { deletedAt: expect.any(Date), isArchived: true, slug: null },
    });
  });

  it("soft deletes a post only after matching its author and organization", async () => {
    await service.deletePost(organizationId, "post-id", authorId);

    expect(prisma.post.findFirst).toHaveBeenCalledWith({
      where: { id: "post-id", organizationId, authorId, deletedAt: null },
      select: { id: true },
    });
    expect(prisma.post.update).toHaveBeenCalledWith({
      where: { id: "post-id" },
      data: { deletedAt: expect.any(Date) },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "connect.post.deleted",
        resourceType: "Post",
        resourceId: "post-id",
      }),
    );
  });

  it("creates a post comment for an authorized channel member", async () => {
    await service.createPostComment(organizationId, "post-id", authorId, "  Great update  ");

    expect(service.getChannelForMember).toHaveBeenCalledWith(organizationId, channelId, authorId, true);
    expect(prisma.postComment.create).toHaveBeenCalledWith({
      data: { organizationId, postId: "post-id", authorId, content: "Great update" },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        reactions: { select: { userId: true, emoji: true } },
      },
    });
  });
});
describe("ConnectService organization policy", () => {
  const organizationId = "organization-id";
  const authorId = "author-id";
  const channelId = "channel-id";
  const messageId = "message-id";

  function build(policy: Partial<ConnectPolicy>, overrides: Record<string, unknown> = {}) {
    const prisma = {
      message: {
        findFirst: jest.fn().mockResolvedValue({
          id: messageId,
          organizationId,
          channelId,
          authorId,
          createdAt: new Date(Date.now() - 2 * 60 * 60_000),
          deletedAt: null,
          deletedById: null,
          isDeleted: false,
        }),
        update: jest.fn().mockResolvedValue({ id: messageId }),
      },
      channelMember: {
        findUnique: jest.fn().mockResolvedValue({ role: "MEMBER" }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      organizationMember: { findMany: jest.fn().mockResolvedValue([]) },
      ...overrides,
    };
    const settings = { get: jest.fn().mockResolvedValue({ ...DEFAULT_CONNECT_SETTINGS, ...policy }) };
    const permissions = { hasPermission: jest.fn().mockResolvedValue(false) };
    const audit = { record: jest.fn().mockResolvedValue(undefined) };
    const service = new ConnectService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      { publishToUsers: jest.fn() } as unknown as ConnectPublisherService,
      { assertWithinLimit: jest.fn() } as unknown as EntitlementService,
      { isConnected: jest.fn().mockResolvedValue(false) } as never,
      settings as unknown as AppSettingsService,
      undefined,
      permissions as never,
    );
    jest
      .spyOn(service, "getChannelForMember")
      .mockResolvedValue({ id: channelId, teamId: null, type: "CHANNEL", name: "general" } as Channel);
    return { service, prisma, permissions, audit };
  }

  it("blocks direct conversations when direct messages are turned off", async () => {
    const { service } = build({ directMessagesEnabled: false });
    await expect(service.createDirectConversation(organizationId, authorId, "other-user")).rejects.toThrow(
      "Direct messages are turned off",
    );
  });

  it("rejects groups larger than the configured member limit", async () => {
    const { service } = build({ maxGroupChatMembers: 3 });
    await expect(service.createGroupConversation(organizationId, authorId, ["a", "b", "c"])).rejects.toThrow(
      "limited to 3 members",
    );
  });

  it("rejects edits outside the edit window", async () => {
    const { service, prisma } = build({ messageEditWindowMinutes: 15 });
    await expect(service.updateMessage(organizationId, messageId, authorId, { content: "Edited" })).rejects.toThrow(
      "within 15 minutes",
    );
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it("rejects edits when editing is turned off", async () => {
    const { service } = build({ messageEditingEnabled: false });
    await expect(service.updateMessage(organizationId, messageId, authorId, { content: "Edited" })).rejects.toThrow(
      "editing is turned off",
    );
  });

  it("lets a channel admin moderate another member's message and audits it", async () => {
    const { service, prisma, audit } = build({});
    prisma.channelMember.findUnique.mockResolvedValue({ role: "ADMIN" });
    await service.deleteMessage(organizationId, messageId, "admin-id");
    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: messageId },
      data: { deletedAt: expect.any(Date), isDeleted: true, deletedById: "admin-id" },
    });
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "connect.message.moderated" }));
  });

  it("does not let non-admins delete other members' messages", async () => {
    const { service } = build({});
    await expect(service.deleteMessage(organizationId, messageId, "someone-else")).rejects.toThrow(
      "Only the author can delete a message",
    );
  });

  it("does not let authors restore messages removed by an admin", async () => {
    const { service, prisma } = build({});
    prisma.message.findFirst.mockResolvedValue({
      id: messageId,
      organizationId,
      channelId,
      authorId,
      createdAt: new Date(),
      deletedAt: new Date(),
      deletedById: "admin-id",
      isDeleted: true,
    });
    await expect(service.restoreMessage(organizationId, messageId, authorId)).rejects.toThrow("removed by an admin");
  });

  it("restricts pinning to channel admins when the pin policy requires it", async () => {
    const { service } = build({ pinPolicy: "CHANNEL_ADMINS" });
    await expect(service.toggleMessagePin(organizationId, messageId, authorId)).rejects.toThrow(
      "Only channel admins can pin",
    );
  });

  it("rejects reactions outside the allowed list", async () => {
    const { service } = build({ allowedReactions: ["👍"] });
    await expect(service.addReaction(organizationId, messageId, authorId, "🎉")).rejects.toThrow(
      "reaction is not allowed",
    );
  });

  it("enforces channel name prefixes", async () => {
    const { service } = build({ channelNamePrefixes: ["team-"] });
    await expect(service.createChannel(organizationId, authorId, { name: "general", slug: "general" })).rejects.toThrow(
      "must start with one of: team-",
    );
  });

  it("blocks video calls when video is turned off", async () => {
    const { service } = build({ videoCallsEnabled: false });
    await expect(
      service.createCallRecord(organizationId, channelId, authorId, {
        callId: "call-id",
        scope: "one-to-one",
        type: "video",
        participantIds: [authorId, "other-user"],
      }),
    ).rejects.toThrow("Video calls are turned off");
  });
});
