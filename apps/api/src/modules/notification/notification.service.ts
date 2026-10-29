import { Injectable } from "@nestjs/common";
import type { Notification, NotificationPreference } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { EmailService } from "./email.service";
import type { CreateNotificationDto, ListNotificationsQueryDto, UpsertPreferenceDto } from "./dto/notification.dto";

export interface NotificationPage {
  notifications: Notification[];
  nextCursor: string | null;
  unreadCount: number;
}

export interface NotificationDeliveryOptions {
  /** Email delivery when the user has no saved preference for the type. Defaults to true. */
  emailByDefault?: boolean;
  /** Skip email regardless of preference, e.g. during the recipient's quiet hours. */
  suppressEmail?: boolean;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  // ---------------- In-app notifications ----------------

  async create(
    organizationId: string,
    dto: CreateNotificationDto,
    options: NotificationDeliveryOptions = {},
  ): Promise<Notification> {
    const preference = await this.prisma.notificationPreference.findUnique({
      where: {
        userId_organizationId_type: {
          userId: dto.userId,
          organizationId,
          type: dto.type,
        },
      },
    });

    // Respect per-type channel preferences (in-app default on).
    if (preference && !preference.inApp) {
      // Skip in-app delivery; still send email if enabled.
      if (preference.email && !options.suppressEmail) {
        await this.sendEmail(organizationId, dto);
      }
      // Return a non-persisted placeholder shape for the caller.
      return {
        id: "",
        organizationId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        linkUrl: dto.linkUrl ?? null,
        metadata: null,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
      };
    }

    const notification = await this.prisma.notification.create({
      data: {
        organizationId,
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body ?? null,
        linkUrl: dto.linkUrl ?? null,
      },
    });

    const emailEnabled = preference ? preference.email : (options.emailByDefault ?? true);
    if (emailEnabled && !options.suppressEmail) {
      await this.sendEmail(organizationId, dto);
    }
    return notification;
  }

  async list(organizationId: string, userId: string, query: ListNotificationsQueryDto): Promise<NotificationPage> {
    const limit = Math.min(query.limit ?? 50, 200);
    const notifications = await this.prisma.notification.findMany({
      where: {
        organizationId,
        userId,
        ...(query.unreadOnly ? { isRead: false } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
    });

    const hasMore = notifications.length > limit;
    const page = hasMore ? notifications.slice(0, limit) : notifications;

    const unreadCount = await this.prisma.notification.count({
      where: { organizationId, userId, isRead: false },
    });

    return {
      notifications: page,
      nextCursor: hasMore ? (page[page.length - 1]?.id ?? null) : null,
      unreadCount,
    };
  }

  async markRead(organizationId: string, userId: string, notificationId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id: notificationId, organizationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
  }

  async markAllRead(organizationId: string, userId: string): Promise<number> {
    const result = await this.prisma.notification.updateMany({
      where: { organizationId, userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return result.count;
  }

  async unreadCount(organizationId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { organizationId, userId, isRead: false },
    });
  }

  // ---------------- Preferences ----------------

  async listPreferences(organizationId: string, userId: string): Promise<NotificationPreference[]> {
    return this.prisma.notificationPreference.findMany({
      where: { organizationId, userId },
      orderBy: { type: "asc" },
    });
  }

  async upsertPreference(
    organizationId: string,
    userId: string,
    dto: UpsertPreferenceDto,
  ): Promise<NotificationPreference> {
    return this.prisma.notificationPreference.upsert({
      where: {
        userId_organizationId_type: { userId, organizationId, type: dto.type },
      },
      create: {
        organizationId,
        userId,
        type: dto.type,
        inApp: dto.inApp ?? true,
        email: dto.email ?? true,
        push: dto.push ?? false,
      },
      update: {
        ...(dto.inApp !== undefined ? { inApp: dto.inApp } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.push !== undefined ? { push: dto.push } : {}),
      },
    });
  }

  // ---------------- Internals ----------------

  private async sendEmail(organizationId: string, dto: CreateNotificationDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { email: true, name: true },
    });
    if (!user) {
      return;
    }
    await this.email.send({
      to: [{ email: user.email }],
      subject: dto.title,
      text: dto.body ?? dto.title,
    });
  }
}
