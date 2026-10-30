import { randomUUID } from "node:crypto";
import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from "@nestjs/common";
import type { Notification, NotificationOutbox, Prisma } from "@prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../redis/redis.service";
import { EmailService } from "./email.service";
import { AppSettingsService } from "../settings/app-settings.service";
import { ApiConfigService } from "../../config/config.service";
import type { NotificationEnvelope } from "./notification-events";

export const NOTIFICATION_UPDATES_CHANNEL = "notifications:updates";
const MAX_ATTEMPTS = 8;
const retryAt = (attempts: number) => new Date(Date.now() + Math.min(3600, 30 * 2 ** attempts) * 1000);
type NotificationResource = Pick<Notification, "organizationId" | "userId" | "sourceId" | "sourceType" | "type">;

export function notificationPayload(value: Prisma.JsonValue): { title: string; body: string; path: string } {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value) ||
    value.version !== 1 ||
    typeof value.title !== "string"
  ) {
    throw new Error("Invalid notification event payload");
  }
  const path = typeof value.path === "string" ? value.path : "";
  if (path.startsWith("/") || path.includes("..") || path.includes(":") || path.includes("\\")) {
    throw new Error("Invalid notification destination");
  }
  return { title: value.title, body: typeof value.body === "string" ? value.body : "", path };
}

@Injectable()
export class NotificationWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationWorker.name);
  private timer?: NodeJS.Timeout;
  private eventsRunning = false;
  private readonly deliveryRunning = { REALTIME: false, EMAIL: false };

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly redis: RedisService,
    private readonly settings: AppSettingsService,
    private readonly config: ApiConfigService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.run(), 2000);
    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  async run(): Promise<void> {
    await Promise.all([this.processEvents(), this.processDeliveries("REALTIME"), this.processDeliveries("EMAIL")]);
  }

  private async processEvents(): Promise<void> {
    if (this.eventsRunning) {
      return;
    }
    this.eventsRunning = true;
    try {
      for (let index = 0; index < 25; index++) {
        if (!(await this.processNextEvent())) {
          break;
        }
      }
    } catch (error) {
      this.logger.error("Notification outbox worker failed", error instanceof Error ? error.stack : String(error));
    } finally {
      this.eventsRunning = false;
    }
  }

  private async processDeliveries(channel: "REALTIME" | "EMAIL"): Promise<void> {
    if (this.deliveryRunning[channel]) {
      return;
    }
    this.deliveryRunning[channel] = true;
    try {
      for (let index = 0; index < 25; index++) {
        if (!(await this.deliverNext(undefined, channel))) {
          break;
        }
      }
    } catch (error) {
      this.logger.error(`Notification ${channel} worker failed`, error instanceof Error ? error.stack : String(error));
    } finally {
      this.deliveryRunning[channel] = false;
    }
  }

  async processNextEvent(organizationId?: string): Promise<boolean> {
    return this.prisma.$transaction(async (tx) => {
      const [event] = await tx.$queryRaw<NotificationOutbox[]>`
        SELECT * FROM notification_outbox
        WHERE status = 'PENDING' AND "availableAt" <= timezone('UTC', CURRENT_TIMESTAMP)
          AND (${organizationId ?? null}::uuid IS NULL OR "organizationId" = ${organizationId ?? null}::uuid)
        ORDER BY "availableAt", id FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!event) {
        return false;
      }
      await tx.$executeRawUnsafe("SAVEPOINT notification_event");
      try {
        const status = await this.materializeEvent(tx, event);
        await tx.notificationOutbox.update({
          where: { id: event.id },
          data: { status, processedAt: new Date(), lastError: null },
        });
      } catch (error) {
        // Recover even from SQL failures before persisting a bounded retry.
        await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT notification_event");
        const attempts = event.attempts + 1;
        this.logger.error(
          `Notification event ${event.id} failed`,
          error instanceof Error ? error.stack : String(error),
        );
        await tx.notificationOutbox.update({
          where: { id: event.id },
          data: {
            attempts,
            status: attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
            availableAt: retryAt(attempts),
            lastError: error instanceof Error ? error.message : String(error),
          },
        });
      }

      return true;
    });
  }

  /** Transport-independent, idempotent consumer; broker adapters must preserve the envelope ID. */
  async materializeEvent(tx: Prisma.TransactionClient, event: NotificationEnvelope): Promise<"PROCESSED" | "SKIPPED"> {
    const content = notificationPayload(event.payload);
    const member = await tx.organizationMember.findFirst({
      where: { organizationId: event.organizationId, userId: event.recipientId, status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
    if (!member) {
      return "SKIPPED";
    }
    if (
      !(await this.canAccessResource(tx, {
        organizationId: event.organizationId,
        userId: event.recipientId,
        sourceId: event.sourceId,
        sourceType: event.sourceType,
        type: event.type,
      }))
    ) {
      return "SKIPPED";
    }
    const preference = await tx.notificationPreference.findUnique({
      where: {
        userId_organizationId_type: {
          userId: event.recipientId,
          organizationId: event.organizationId,
          type: event.type,
        },
      },
    });
    const raw = event.payload;
    const options = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
    const emailEnabled =
      preference?.email ??
      (typeof options.emailByDefault === "boolean" ? options.emailByDefault : event.type !== "CALL");
    const organization = await tx.organization.findUniqueOrThrow({
      where: { id: event.organizationId },
      select: { slug: true },
    });
    const linkUrl = `/${organization.slug}/${content.path}`;
    const notification = await tx.notification.upsert({
      where: { eventId: event.id },
      update: {},
      create: {
        organizationId: event.organizationId,
        userId: event.recipientId,
        actorId: event.actorId,
        sourceType: event.sourceType,
        sourceId: event.sourceId,
        eventId: event.id,
        type: event.type,
        title: content.title,
        body: content.body,
        linkUrl,
        payload: { ...content, url: linkUrl, version: 1 },
      },
    });
    await tx.notificationDelivery.createMany({
      data: [
        {
          notificationId: notification.id,
          channel: "REALTIME",
          status: preference?.inApp === false ? "SUPPRESSED" : "PENDING",
        },
        {
          notificationId: notification.id,
          channel: "EMAIL",
          status: emailEnabled && options.suppressEmail !== true ? "PENDING" : "SUPPRESSED",
        },
      ],
      skipDuplicates: true,
    });
    return "PROCESSED";
  }
  async deliverNext(organizationId?: string, channel?: "REALTIME" | "EMAIL"): Promise<boolean> {
    const token = randomUUID();
    const delivery = await this.prisma.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM notification_deliveries
        WHERE ((status = 'PENDING' AND "availableAt" <= timezone('UTC', CURRENT_TIMESTAMP))
          OR (status = 'PROCESSING' AND "leaseUntil" < timezone('UTC', CURRENT_TIMESTAMP)))
          AND (${channel ?? null}::text IS NULL OR channel = ${channel ?? null}::text)
          AND (${organizationId ?? null}::uuid IS NULL OR "notificationId" IN
            (SELECT id FROM notifications WHERE "organizationId" = ${organizationId ?? null}::uuid))
        ORDER BY "availableAt", id FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!row) {
        return null;
      }
      return tx.notificationDelivery.update({
        where: { id: row.id },
        data: {
          status: "PROCESSING",
          leaseToken: token,
          leaseUntil: new Date(Date.now() + 120000),
          attempts: { increment: 1 },
        },
        include: { notification: true },
      });
    });
    if (!delivery) {
      return false;
    }
    try {
      if (delivery.attempts > MAX_ATTEMPTS) {
        throw new Error("Notification delivery retry limit exceeded");
      }
      const notification = delivery.notification;
      const member = await this.prisma.organizationMember.findFirst({
        where: {
          organizationId: notification.organizationId,
          userId: notification.userId,
          status: "ACTIVE",
          deletedAt: null,
        },
        select: { id: true },
      });
      const preference = await this.prisma.notificationPreference.findUnique({
        where: {
          userId_organizationId_type: {
            userId: notification.userId,
            organizationId: notification.organizationId,
            type: notification.type,
          },
        },
      });
      let suppressed =
        !member || (delivery.channel === "EMAIL" ? preference?.email === false : preference?.inApp === false);
      if (!suppressed) {
        suppressed = !(await this.canAccessResource(this.prisma, notification));
      }
      if (!suppressed && notification.sourceType === "connect" && notification.sourceId) {
        const sidebar = await this.prisma.connectSidebarPreference.findUnique({
          where: {
            organizationId_userId: { organizationId: notification.organizationId, userId: notification.userId },
          },
          select: { preferences: true },
        });
        const json = (value: Prisma.JsonValue | undefined): Prisma.JsonObject =>
          value && typeof value === "object" && !Array.isArray(value) ? value : {};
        suppressed =
          json(json(json(json(sidebar?.preferences).settings).conversationNotifications)[notification.sourceId])
            .muted === true;
      }
      if (!suppressed && delivery.channel === "EMAIL" && notification.sourceType === "connect") {
        const [settings, profile] = await Promise.all([
          this.prisma.connectUserSettings.findUnique({
            where: {
              organizationId_userId: { organizationId: notification.organizationId, userId: notification.userId },
            },
          }),
          this.prisma.userProfile.findUnique({ where: { userId: notification.userId }, select: { timezone: true } }),
        ]);
        suppressed = Boolean(
          settings &&
          (this.settings.effectiveManualStatus(settings) === "dnd" ||
            this.settings.isWithinQuietHours(settings, profile?.timezone)),
        );
      }
      if (!suppressed) {
        if (delivery.channel === "REALTIME") {
          await this.redis.raw.publish(
            NOTIFICATION_UPDATES_CHANNEL,
            JSON.stringify({
              organizationId: notification.organizationId,
              userId: notification.userId,
              notificationId: notification.id,
            }),
          );
        } else if (delivery.channel === "EMAIL") {
          const user = await this.prisma.user.findUniqueOrThrow({
            where: { id: notification.userId },
            select: { email: true },
          });
          await this.email.send(
            {
              to: [{ email: user.email }],
              subject: notification.title,
              text: `${notification.body || notification.title}\n\n${new URL(notification.linkUrl ?? "/", this.config.webAppUrl).toString()}`,
            },
            { requireConfigured: true },
          );
        } else {
          throw new Error(`Unsupported notification channel: ${delivery.channel}`);
        }
      }
      await this.prisma.notificationDelivery.updateMany({
        where: { id: delivery.id, leaseToken: token },
        data: {
          status: suppressed ? "SUPPRESSED" : "SENT",
          sentAt: suppressed ? null : new Date(),
          leaseToken: null,
          leaseUntil: null,
          lastError: null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Notification delivery ${delivery.id} failed`,
        error instanceof Error ? error.stack : String(error),
      );
      await this.prisma.notificationDelivery.updateMany({
        where: { id: delivery.id, leaseToken: token },
        data: {
          status: delivery.attempts >= MAX_ATTEMPTS ? "FAILED" : "PENDING",
          availableAt: retryAt(delivery.attempts),
          leaseToken: null,
          leaseUntil: null,
          lastError: error instanceof Error ? error.message : String(error),
        },
      });
    }
    return true;
  }

  private async canAccessResource(db: Prisma.TransactionClient, notification: NotificationResource): Promise<boolean> {
    const { organizationId, userId, sourceId, sourceType } = notification;
    if (!sourceId) {
      return true;
    }
    if (sourceType === "notes") {
      // Decision text contains no note content and remains useful after access was denied.
      if (notification.type === "NOTES_ACCESS_DECISION") {
        return true;
      }
      return Boolean(
        await db.note.findFirst({
          where: {
            id: sourceId,
            organizationId,
            ...(notification.type === "NOTES_ACCESS_REQUEST"
              ? {
                  isPublic: true,
                  accessRequests: { some: { status: "PENDING" } },
                  OR: [{ ownerId: userId }, { permissions: { some: { userId, isOwner: true } } }],
                }
              : {
                  OR: [{ ownerId: userId }, { isPublic: true }, { permissions: { some: { userId } } }],
                }),
          },
          select: { id: true },
        }),
      );
    }
    if (sourceType === "connect") {
      const channel = await db.channel.findFirst({
        where: { id: sourceId, organizationId, deletedAt: null },
        select: {
          visibility: true,
          type: true,
          teamId: true,
          members: { where: { userId, leftAt: null }, select: { userId: true } },
        },
      });
      if (!channel || (!channel.members.length && !(channel.type === "CHANNEL" && channel.visibility === "PUBLIC"))) {
        return false;
      }
      if (
        channel.teamId &&
        !(await db.teamMember.findUnique({
          where: { teamId_userId: { teamId: channel.teamId, userId } },
          select: { id: true },
        }))
      ) {
        return false;
      }
      return true;
    }
    if (sourceType === "flow") {
      return Boolean(
        await db.issue.findFirst({
          where: { id: sourceId, organizationId, assigneeId: userId, deletedAt: null },
          select: { id: true },
        }),
      );
    }
    if (sourceType === "pulse") {
      return Boolean(
        await db.calendarEvent.findFirst({
          where: {
            id: sourceId,
            organizationId,
            deletedAt: null,
            ...(notification.type === "PULSE_INVITATION" ? { cancelledAt: null } : {}),
            attendees: { some: { userId } },
          },
          select: { id: true },
        }),
      );
    }
    return true;
  }
}
