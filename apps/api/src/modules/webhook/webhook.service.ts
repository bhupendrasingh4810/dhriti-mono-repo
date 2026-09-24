import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { Webhook, WebhookDelivery } from "@prisma/client";

import { ApiConfigService } from "../../config/config.service";
import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { SecretEncryptionService } from "../../common/crypto/secret-encryption.service";
import { AuditService } from "../audit/audit.service";
import type { CreateWebhookDto, UpdateWebhookDto } from "./dto/webhook.dto";

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly secrets: SecretEncryptionService,
    private readonly config: ApiConfigService,
  ) {}

  // ---------------- CRUD ----------------

  async list(organizationId: string): Promise<Array<Omit<Webhook, "secret" | "secretEncrypted">>> {
    const webhooks = await this.prisma.webhook.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
    });
    return webhooks.map(({ secret: _secret, secretEncrypted: _secretEncrypted, ...rest }) => rest);
  }

  async create(organizationId: string, userId: string, dto: CreateWebhookDto): Promise<Webhook> {
    const webhook = await this.prisma.webhook.create({
      data: {
        organizationId,
        url: dto.url,
        secretEncrypted: this.secrets.encrypt(randomBytes(32).toString("hex")),
        events: dto.events,
        description: dto.description ?? null,
        createdById: userId,
      },
    });

    await this.audit.record({
      action: "webhook.created",
      organizationId,
      actorUserId: userId,
      resourceType: "Webhook",
      resourceId: webhook.id,
      metadata: { events: dto.events },
    });
    return webhook;
  }

  async update(organizationId: string, webhookId: string, userId: string, dto: UpdateWebhookDto): Promise<Webhook> {
    await this.getWebhook(organizationId, webhookId);
    const updated = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: {
        ...(dto.url !== undefined ? { url: dto.url } : {}),
        ...(dto.events !== undefined ? { events: dto.events } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });

    await this.audit.record({
      action: "webhook.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "Webhook",
      resourceId: webhookId,
    });
    return updated;
  }

  async rotateSecret(organizationId: string, webhookId: string, userId: string): Promise<Webhook> {
    await this.getWebhook(organizationId, webhookId);
    const updated = await this.prisma.webhook.update({
      where: { id: webhookId },
      data: { secret: null, secretEncrypted: this.secrets.encrypt(randomBytes(32).toString("hex")) },
    });

    await this.audit.record({
      action: "webhook.secret-rotated",
      organizationId,
      actorUserId: userId,
      resourceType: "Webhook",
      resourceId: webhookId,
    });
    return updated;
  }

  async delete(organizationId: string, webhookId: string, userId: string): Promise<void> {
    await this.getWebhook(organizationId, webhookId);
    await this.prisma.webhook.update({
      where: { id: webhookId },
      data: { deletedAt: new Date(), isActive: false },
    });

    await this.audit.record({
      action: "webhook.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "Webhook",
      resourceId: webhookId,
    });
  }

  async listDeliveries(organizationId: string, webhookId: string): Promise<WebhookDelivery[]> {
    await this.getWebhook(organizationId, webhookId);
    return this.prisma.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  // ---------------- Dispatch ----------------

  /**
   * Dispatches an event to all active webhooks in the org subscribed to it.
   * Runs deliveries in the background; never blocks the request path.
   */
  async dispatch(organizationId: string, event: string, data: unknown): Promise<void> {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        deletedAt: null,
        isActive: true,
        events: { has: event },
      },
    });

    if (webhooks.length === 0) {
      return;
    }

    const payload = {
      id: randomBytes(12).toString("hex"),
      event,
      organizationId,
      occurredAt: new Date().toISOString(),
      data,
    };

    // Fire-and-forget with per-delivery error isolation.
    void Promise.allSettled(webhooks.map((webhook) => this.deliver(webhook, event, payload)));
  }

  private async deliver(webhook: Webhook, event: string, payload: object): Promise<void> {
    const body = JSON.stringify(payload);
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = this.sign(await this.resolveSecret(webhook), `${timestamp}.${body}`);
    const startedAt = Date.now();

    const delivery = this.config.webhookDelivery;
    for (let attempt = 1; attempt <= delivery.maxAttempts; attempt += 1) {
      try {
        const response = await fetch(webhook.url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Dhriti-Event": event,
            "X-Dhriti-Signature": `sha256=${signature}`,
            "X-Dhriti-Timestamp": timestamp,
            "X-Dhriti-Delivery": payload["id" as keyof typeof payload],
          },
          body,
          signal: AbortSignal.timeout(delivery.timeoutSeconds * 1000),
        });

        await this.recordDelivery(webhook.id, event, payload, response.status, response.ok, attempt, startedAt, null);
        if (response.ok) {
          return;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        await this.recordDelivery(webhook.id, event, payload, null, false, attempt, startedAt, message);
      }

      if (attempt < delivery.maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, attempt * delivery.retryBaseDelaySeconds * 1000));
      }
    }

    this.logger.warn(`Webhook ${webhook.id} delivery failed after ${delivery.maxAttempts} attempts for event=${event}`);
  }

  private async recordDelivery(
    webhookId: string,
    event: string,
    payload: object,
    statusCode: number | null,
    success: boolean,
    attempt: number,
    startedAt: number,
    error: string | null,
  ): Promise<void> {
    try {
      await this.prisma.webhookDelivery.create({
        data: {
          webhookId,
          event,
          payload: payload as never,
          statusCode,
          success,
          attempt,
          durationMs: Date.now() - startedAt,
          error,
        },
      });
    } catch (recordError) {
      this.logger.error("Failed to record webhook delivery", recordError instanceof Error ? recordError.stack : String(recordError));
    }
  }

  private sign(secret: string, body: string): string {
    return createHmac("sha256", secret).update(body).digest("hex");
  }

  /** Verifies a webhook signature (used by consumers / docs). */
  verifySignature(secret: string, body: string, timestamp: string, signature: string): boolean {
    const expected = `sha256=${this.sign(secret, `${timestamp}.${body}`)}`;
    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    return a.length === b.length && timingSafeEqual(a, b);
  }

  private async resolveSecret(webhook: Webhook): Promise<string> {
    if (webhook.secretEncrypted) {return this.secrets.decrypt(webhook.secretEncrypted);}
    if (!webhook.secret) {throw new AppError(ErrorCode.WEBHOOK_NOT_FOUND, "Webhook secret is unavailable", HttpStatus.INTERNAL_SERVER_ERROR);}
    await this.prisma.webhook.update({
      where: { id: webhook.id },
      data: { secret: null, secretEncrypted: this.secrets.encrypt(webhook.secret) },
    });
    return webhook.secret;
  }

  private async getWebhook(organizationId: string, webhookId: string): Promise<Webhook> {
    const webhook = await this.prisma.webhook.findFirst({
      where: { id: webhookId, organizationId, deletedAt: null },
    });
    if (!webhook) {
      throw new AppError(ErrorCode.WEBHOOK_NOT_FOUND, "Webhook not found", HttpStatus.NOT_FOUND);
    }
    return webhook;
  }
}
