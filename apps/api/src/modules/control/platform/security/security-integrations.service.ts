import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import {
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  type OnModuleInit,
  type OnModuleDestroy,
} from "@nestjs/common";
import { Prisma, type SecurityAlertDelivery, type SecurityEvent } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma.service";
import { RedisService } from "../../../../redis/redis.service";
import { ApiConfigService } from "../../../../config/config.service";
import { EmailService } from "../../../notification/email.service";
import { canonicalIp } from "./ip-address";
import type { IngestSecurityEventDto, SecurityPageDto } from "./security.dto";

type EventInput = Pick<SecurityEvent, "severity" | "type" | "description" | "ipAddress"> &
  Partial<Pick<SecurityEvent, "source" | "externalId">>;
const MAX_ATTEMPTS = 8;

@Injectable()
export class SecurityIntegrationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SecurityIntegrationsService.name);
  private timer?: NodeJS.Timeout;
  private running = false;
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
    private readonly email: EmailService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.run(), 5000);
    this.timer.unref();
  }
  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  /** Event and delivery intents commit together. External IDs make provider retries idempotent. */
  async recordEvent(input: EventInput) {
    const config = this.config.securityIntegrations;
    const destinations = [
      ...(["critical", "high"].includes(input.severity)
        ? config.emails.map((destination) => ({ channel: "EMAIL", destination }))
        : []),
      ...(config.webhookUrl ? [{ channel: "WEBHOOK", destination: config.webhookUrl }] : []),
    ];
    const data = { ...input, deliveries: { create: destinations } };
    if (input.externalId) {
      const where = { source_externalId: { source: input.source ?? "dhriti", externalId: input.externalId } };
      try {
        return await this.prisma.securityEvent.upsert({ where, create: data, update: {} });
      } catch (error) {
        // Nested delivery writes can prevent a native upsert; concurrent imports can lose the unique-key race.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          Array.isArray(error.meta?.target) &&
          error.meta.target.length === 2 &&
          error.meta.target.includes("source") &&
          error.meta.target.includes("externalId")
        ) {
          return this.prisma.securityEvent.findUniqueOrThrow({ where });
        }
        throw error;
      }
    }
    return this.prisma.securityEvent.create({ data });
  }

  async ingest(input: IngestSecurityEventDto, authorization: string | undefined, ip: string) {
    const token = this.config.securityIntegrations.ingestToken;
    if (!token) {
      throw new ServiceUnavailableException("Security event ingestion is not configured");
    }
    const expected = createHash("sha256").update(`Bearer ${token}`).digest();
    const actual = createHash("sha256")
      .update(authorization ?? "")
      .digest();
    if (!timingSafeEqual(expected, actual)) {
      throw new UnauthorizedException("Invalid integration credentials");
    }
    if (input.source.toLowerCase() === "dhriti") {
      throw new BadRequestException("The dhriti event source is reserved");
    }
    const count = await this.redis.incrementWithExpiry(`security:ingest:${canonicalIp(ip)}`, 60);
    if (count > 120) {
      throw new HttpException("Security ingestion rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
    }
    const event = await this.recordEvent({
      ...input,
      ipAddress: input.ipAddress ? canonicalIp(input.ipAddress) : null,
    });
    return { id: event.id };
  }

  status() {
    const config = this.config.securityIntegrations;
    return {
      email: config.emails.length > 0,
      webhook: Boolean(config.webhookUrl),
      ingestion: Boolean(config.ingestToken),
    };
  }

  async deliveries(query: SecurityPageDto) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.securityAlertDelivery.findMany({
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          eventId: true,
          channel: true,
          attempts: true,
          deliveredAt: true,
          lastError: true,
          createdAt: true,
          availableAt: true,
        },
      }),
      this.prisma.securityAlertDelivery.count(),
    ]);
    return {
      items,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async retry(id: string, actorUserId: string) {
    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const updated = await tx.securityAlertDelivery.updateMany({
        where: {
          id,
          deliveredAt: null,
          lastError: { not: null },
          OR: [{ leaseUntil: null }, { leaseUntil: { lte: now } }],
        },
        data: { attempts: 0, availableAt: now, lastError: null, leaseToken: null, leaseUntil: null },
      });
      if (!updated.count) {
        throw new ConflictException("Only a failed delivery without an active worker lease can be retried");
      }
      await tx.auditLog.create({
        data: {
          action: "security.delivery.retry_requested",
          actorUserId,
          resourceType: "SecurityAlertDelivery",
          resourceId: id,
        },
      });
    });
  }

  async run() {
    if (this.running) {
      return;
    }
    this.running = true;
    try {
      for (let index = 0; index < 10; index++) {
        if (!(await this.deliverNext())) {
          break;
        }
      }
    } catch (error) {
      this.logger.error("Security alert worker failed", error instanceof Error ? error.stack : String(error));
    } finally {
      this.running = false;
    }
  }

  /** At-least-once delivery: consumers deduplicate by X-Dhriti-Delivery-Id. No network I/O holds a DB transaction. */
  async deliverNext(): Promise<boolean> {
    const token = randomUUID();
    const job = await this.prisma.$transaction(async (tx) => {
      const [row] = await tx.$queryRaw<SecurityAlertDelivery[]>`
        SELECT * FROM security_alert_deliveries
        WHERE "deliveredAt" IS NULL AND attempts < ${MAX_ATTEMPTS}
          AND "availableAt" <= timezone('UTC', CURRENT_TIMESTAMP)
          AND ("leaseUntil" IS NULL OR "leaseUntil" < timezone('UTC', CURRENT_TIMESTAMP))
        ORDER BY "availableAt", id FOR UPDATE SKIP LOCKED LIMIT 1`;
      if (!row) {
        return null;
      }
      return tx.securityAlertDelivery.update({
        where: { id: row.id },
        data: { attempts: { increment: 1 }, leaseToken: token, leaseUntil: new Date(Date.now() + 300000) },
        include: { event: true },
      });
    });
    if (!job) {
      return false;
    }
    let lastError: string | null = null;
    try {
      const config = this.config.securityIntegrations;
      if (job.channel === "EMAIL") {
        if (!config.emails.includes(job.destination)) {
          throw new Error("Email destination is no longer configured");
        }
        await this.email.send(
          {
            to: [{ email: job.destination }],
            subject: `Dhriti security alert: ${job.event.severity} ${job.event.type}`,
            text: `${job.event.description}\nSource: ${job.event.source}\nIP: ${job.event.ipAddress ?? "Unavailable"}\nEvent ID: ${job.event.id}\nOpen Security Center to investigate.`,
          },
          { requireConfigured: true, sensitive: true },
        );
      } else if (job.channel === "WEBHOOK") {
        if (!config.webhookUrl || config.webhookUrl !== job.destination || !config.webhookSecret) {
          throw new Error("Webhook destination is no longer configured");
        }
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const body = JSON.stringify({
          version: 1,
          deliveryId: job.id,
          event: {
            id: job.event.id,
            source: job.event.source,
            externalId: job.event.externalId,
            severity: job.event.severity,
            type: job.event.type,
            description: job.event.description,
            ipAddress: job.event.ipAddress,
            createdAt: job.event.createdAt,
          },
        });
        const signature = createHmac("sha256", config.webhookSecret).update(`${timestamp}.${body}`).digest("hex");
        const response = await fetch(config.webhookUrl, {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(10000),
          headers: {
            "Content-Type": "application/json",
            "X-Dhriti-Timestamp": timestamp,
            "X-Dhriti-Signature": signature,
            "X-Dhriti-Delivery-Id": job.id,
          },
          body,
        });
        await response.body?.cancel();
        if (!response.ok) {
          throw new Error(`Webhook returned HTTP ${response.status}`);
        }
      } else {
        throw new Error("Unsupported security delivery channel");
      }
    } catch (error) {
      // Do not persist provider response bodies, destination URLs, credentials or user-supplied payloads in errors.
      lastError =
        error instanceof Error &&
        /^(Webhook returned HTTP \d{3}|Email destination is no longer configured|Webhook destination is no longer configured|Unsupported security delivery channel)$/.test(
          error.message,
        )
          ? error.message
          : "Delivery failed; check provider connectivity and configuration";
      this.logger.error(`Security delivery ${job.id} attempt ${job.attempts} failed: ${lastError}`);
    }
    await this.prisma.securityAlertDelivery.updateMany({
      where: { id: job.id, leaseToken: token },
      data: {
        deliveredAt: lastError ? null : new Date(),
        lastError,
        leaseToken: null,
        leaseUntil: null,
        availableAt: new Date(Date.now() + Math.min(3600, 30 * 2 ** job.attempts) * 1000),
      },
    });
    return true;
  }
}
