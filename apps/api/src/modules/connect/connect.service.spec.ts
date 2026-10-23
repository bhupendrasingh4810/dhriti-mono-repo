import { HttpStatus } from "@nestjs/common";
import type { Channel } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";
import { AuditService } from "../audit/audit.service";
import { EntitlementService } from "../authorization/services/entitlement.service";
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
    channelMember: { findMany: jest.Mock };
    organizationMember: { findMany: jest.Mock };
    team: { findFirst: jest.Mock };
    channel: { findUnique: jest.Mock; create: jest.Mock };
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
      channelMember: { findMany: jest.fn().mockResolvedValue([{ userId: authorId }, { userId: "removed-user" }]) },
      organizationMember: { findMany: jest.fn().mockResolvedValue([{ userId: authorId }]) },
      team: { findFirst: jest.fn().mockResolvedValue({ id: "team-id" }) },
      channel: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: channelId, organizationId, teamId: "team-id", members: [{ userId: authorId, role: "ADMIN" }] }),
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
    );
    jest.spyOn(service, "getChannelForMember").mockResolvedValue({ id: channelId, teamId: null } as Channel);
  });

  it("restores the original message and broadcasts only to eligible members", async () => {
    const restored = await service.restoreMessage(organizationId, messageId, authorId);

    expect(prisma.message.findFirst).toHaveBeenCalledWith({ where: { id: messageId, organizationId } });
    expect(service.getChannelForMember).toHaveBeenCalledWith(organizationId, channelId, authorId, true);
    expect(prisma.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: messageId }, data: { deletedAt: null, isDeleted: false },
    }));
    expect(restored.id).toBe(messageId);
    expect(restored.isDeleted).toBe(false);
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "connect.message.restored" }));
    expect(publisher.publishToUsers).toHaveBeenCalledWith(organizationId, [authorId], "message:updated", {
      channelId, message: restored,
    });
  });

  it("sets the deletion flag and timestamp together and broadcasts the flag", async () => {
    prisma.message.findFirst.mockResolvedValue({ ...deletedMessage, deletedAt: null, isDeleted: false });

    await service.deleteMessage(organizationId, messageId, authorId);

    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: messageId }, data: { deletedAt: expect.any(Date), isDeleted: true },
    });
    expect(publisher.publishToUsers).toHaveBeenCalledWith(organizationId, [authorId], "message:deleted", {
      channelId, messageId, isDeleted: true,
    });
  });

  it("rejects restoration by another user", async () => {
    await expect(service.restoreMessage(organizationId, messageId, "other-user")).rejects.toThrow("Only the author can restore a message");
    expect(prisma.message.update).not.toHaveBeenCalled();
    expect(publisher.publishToUsers).not.toHaveBeenCalled();
  });

  it("rejects messages outside the requested organization", async () => {
    prisma.message.findFirst.mockResolvedValue(null);
    await expect(service.restoreMessage("other-organization", messageId, authorId)).rejects.toThrow("Message not found");
    expect(prisma.message.findFirst).toHaveBeenCalledWith({ where: { id: messageId, organizationId: "other-organization" } });
    expect(prisma.message.update).not.toHaveBeenCalled();
  });

  it("rejects an author who has lost channel access", async () => {
    jest.spyOn(service, "getChannelForMember").mockRejectedValue(
      new AppError(ErrorCode.FORBIDDEN, "Not a channel member", HttpStatus.FORBIDDEN),
    );
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

    expect(prisma.channel.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ teamId: "team-id" }),
    }));
  });
});