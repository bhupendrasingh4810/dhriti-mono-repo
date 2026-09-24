import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { ApiConfigService } from "../../config/config.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { EntitlementService } from "./entitlement.service";
import { MetricsService } from "../../common/metrics/metrics.service";

interface StripeEvent {
  id: string;
  type: string;
  created: number;
  data: { object: StripeSubscription };
}

interface StripeSubscription {
  id: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired" | "paused";
  current_period_start?: number;
  current_period_end?: number;
  trial_end?: number | null;
  cancel_at_period_end?: boolean;
}

@Injectable()
export class BillingWebhookService {
  private readonly logger = new Logger(BillingWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ApiConfigService,
    private readonly entitlements: EntitlementService,
    private readonly metrics: MetricsService,
  ) {}

  async process(provider: string, signature: string, rawBody: Buffer): Promise<{ duplicate: boolean; ignored?: boolean }> {
    const payload = this.verifyAndParseStripeEvent(provider, signature, rawBody);
    return this.processVerifiedEvent(provider, payload, createHash("sha256").update(rawBody).digest("hex"));
  }

  async retryFailedEvents(limit = this.config.billing.webhookRetryBatchSize): Promise<{ attempted: number; succeeded: number }> {
    const now = new Date();
    const billing = this.config.billing;
    const timedOutTerminalEvents = await this.prisma.billingWebhookEvent.updateMany({
      where: {
        status: "PROCESSING",
        processingStartedAt: { lt: new Date(now.getTime() - billing.webhookProcessingTimeoutSeconds * 1000) },
        attemptCount: { gte: billing.webhookMaxRetryAttempts },
      },
      data: { status: "DEAD_LETTER", failedAt: now, deadLetteredAt: now, processingStartedAt: null, errorCode: "PROCESSING_TIMEOUT", nextRetryAt: null },
    });
    if (timedOutTerminalEvents.count > 0) {
      this.metrics.billingWebhookDeadLettered(timedOutTerminalEvents.count);
      this.logger.error(`Billing webhook events moved to dead letter after processing timeout count=${timedOutTerminalEvents.count}`);
    }
    await this.prisma.billingWebhookEvent.updateMany({
      where: {
        status: "PROCESSING",
        processingStartedAt: { lt: new Date(now.getTime() - billing.webhookProcessingTimeoutSeconds * 1000) },
        attemptCount: { lt: billing.webhookMaxRetryAttempts },
      },
      data: { status: "FAILED", failedAt: now, processingStartedAt: null, errorCode: "PROCESSING_TIMEOUT", nextRetryAt: now },
    });
    const failedEvents = await this.prisma.billingWebhookEvent.findMany({
      where: { provider: "stripe", status: "FAILED", attemptCount: { lt: billing.webhookMaxRetryAttempts }, OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: now } }] },
      orderBy: { nextRetryAt: "asc" },
      take: limit,
    });
    let succeeded = 0;
    for (const event of failedEvents) {
      try {
        await this.processVerifiedEvent(event.provider, this.parseStoredStripeEvent(event.eventData), event.payloadHash);
        succeeded += 1;
      } catch {
        // The ledger retains failure metadata; the job runner can retry this event later.
      }
    }
    return { attempted: failedEvents.length, succeeded };
  }

  private async processVerifiedEvent(provider: string, payload: StripeEvent, payloadHash: string): Promise<{ duplicate: boolean; ignored?: boolean }> {
    const providerEventId = payload.id;
    const billing = this.config.billing;
    const existing = await this.prisma.billingWebhookEvent.findUnique({ where: { provider_providerEventId: { provider, providerEventId } }, select: { id: true, status: true } });
    if (existing?.status === "SUCCEEDED") {return { duplicate: true };}

    let event: { id: string; attemptCount: number };
    if (existing) {
      const claimed = await this.prisma.billingWebhookEvent.updateMany({
        where: { id: existing.id, status: "FAILED", attemptCount: { lt: billing.webhookMaxRetryAttempts } },
        data: { status: "PROCESSING", attemptCount: { increment: 1 }, processingStartedAt: new Date(), nextRetryAt: null, errorCode: null, failedAt: null },
      });
      if (claimed.count !== 1) {throw new AppError(ErrorCode.INTERNAL_ERROR, "Billing event is already being processed", HttpStatus.SERVICE_UNAVAILABLE);}
      const claimedEvent = await this.prisma.billingWebhookEvent.findUnique({ where: { id: existing.id }, select: { id: true, attemptCount: true } });
      if (!claimedEvent) {throw new AppError(ErrorCode.INTERNAL_ERROR, "Billing event claim was lost", HttpStatus.SERVICE_UNAVAILABLE);}
      event = claimedEvent;
    } else {
      try {
        event = await this.prisma.billingWebhookEvent.create({
          data: { provider, providerEventId, providerCreatedAt: new Date(payload.created * 1000), payloadHash, eventData: this.toStoredEvent(payload) as unknown as Prisma.InputJsonValue, attemptCount: 1, processingStartedAt: new Date() },
          select: { id: true, attemptCount: true },
        });
      } catch (error) {
        if (this.isUniqueConstraintError(error)) {throw new AppError(ErrorCode.INTERNAL_ERROR, "Billing event is already being processed", HttpStatus.SERVICE_UNAVAILABLE);}
        throw error;
      }
    }

    let organizationId: string | undefined;
    let ignored = false;
    try {
      await this.prisma.$transaction(async (transaction) => {
        const subscription = await transaction.subscription.findFirst({ where: { provider: "stripe", providerSubscriptionId: payload.data.object.id } });
        if (!subscription) {throw new AppError(ErrorCode.SUBSCRIPTION_NOT_FOUND, "Subscription not found", HttpStatus.NOT_FOUND);}
        organizationId = subscription.organizationId;
        const latestEvent = await transaction.billingWebhookEvent.findFirst({ where: { organizationId: subscription.organizationId, status: "SUCCEEDED", providerCreatedAt: { gt: new Date(payload.created * 1000) } }, select: { id: true } });
        if (latestEvent) {
          await transaction.billingWebhookEvent.update({ where: { id: event.id }, data: { organizationId: subscription.organizationId, status: "SUCCEEDED", processedAt: new Date(), processingStartedAt: null, nextRetryAt: null } });
          ignored = true;
          return;
        }
        const status = this.toSubscriptionStatus(payload.data.object.status);
        const updated = await transaction.subscription.update({
          where: { id: subscription.id },
          data: {
            status,
            currentPeriodStart: this.toDate(payload.data.object.current_period_start),
            currentPeriodEnd: this.toDate(payload.data.object.current_period_end),
            trialEndsAt: this.toDate(payload.data.object.trial_end),
            cancelAtPeriodEnd: payload.data.object.cancel_at_period_end ?? false,
            ...(status === "SUSPENDED" ? { suspendedAt: new Date() } : {}),
          },
        });
        await transaction.subscriptionHistory.create({ data: { organizationId: updated.organizationId, subscriptionId: updated.id, previousPlanId: subscription.planId, planId: updated.planId, previousStatus: subscription.status, status: updated.status, reason: "provider_webhook", providerEventId } });
        await transaction.billingWebhookEvent.update({ where: { id: event.id }, data: { organizationId: updated.organizationId, status: "SUCCEEDED", processedAt: new Date(), processingStartedAt: null, nextRetryAt: null } });
      });
      if (!ignored && organizationId) {await this.entitlements.invalidate(organizationId);}
      return { duplicate: false, ...(ignored ? { ignored: true } : {}) };
    } catch (error) {
      const terminal = event.attemptCount >= billing.webhookMaxRetryAttempts;
      await this.prisma.billingWebhookEvent.update({
        where: { id: event.id },
        data: {
          status: terminal ? "DEAD_LETTER" : "FAILED",
          failedAt: new Date(),
          processingStartedAt: null,
          nextRetryAt: terminal ? null : this.nextRetryAt(event.attemptCount),
          deadLetteredAt: terminal ? new Date() : null,
          errorCode: error instanceof AppError ? error.code : "PROCESSING_FAILED",
        },
      });
      if (terminal) {
        this.metrics.billingWebhookDeadLettered();
        this.logger.error(`Billing webhook event moved to dead letter provider=${provider} eventId=${providerEventId} attempts=${event.attemptCount}`);
      }
      throw error;
    }
  }

  private verifyAndParseStripeEvent(provider: string, signature: string, rawBody: Buffer): StripeEvent {
    if (provider !== "stripe" || !this.config.stripeWebhookSecret) {throw new AppError(ErrorCode.FORBIDDEN, "Billing provider is not configured", HttpStatus.FORBIDDEN);}
    const components = signature.split(",").reduce<Record<string, string[]>>((result, component) => {
      const [key, value] = component.split("=", 2);
      if (key && value) {(result[key] ??= []).push(value);}
      return result;
    }, {});
    const timestamp = Number(components.t?.[0]);
    if (!Number.isSafeInteger(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > this.config.billing.webhookSignatureToleranceSeconds) {throw new AppError(ErrorCode.FORBIDDEN, "Invalid billing webhook signature", HttpStatus.FORBIDDEN);}
    const expected = createHmac("sha256", this.config.stripeWebhookSecret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
    const valid = components.v1?.some((value) => this.safeEqual(expected, value)) ?? false;
    if (!valid) {throw new AppError(ErrorCode.FORBIDDEN, "Invalid billing webhook signature", HttpStatus.FORBIDDEN);}
    try {
      const event = JSON.parse(rawBody.toString("utf8")) as StripeEvent;
      if (!event.id || !Number.isSafeInteger(event.created) || !event.data?.object?.id || !this.isStripeSubscriptionStatus(event.data.object.status) || !event.type.startsWith("customer.subscription.")) {throw new Error("Unsupported event");}
      return event;
    } catch {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Invalid billing webhook event", HttpStatus.BAD_REQUEST);
    }
  }

  private safeEqual(expected: string, received: string): boolean {
    const expectedBuffer = Buffer.from(expected, "hex");
    const receivedBuffer = Buffer.from(received, "hex");
    return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private toSubscriptionStatus(status: StripeSubscription["status"]): "ACTIVE" | "TRIALING" | "PAST_DUE" | "CANCELLED" | "EXPIRED" | "SUSPENDED" {
    if (status === "active") {return "ACTIVE";}
    if (status === "trialing") {return "TRIALING";}
    if (status === "past_due") {return "PAST_DUE";}
    if (status === "canceled" || status === "incomplete_expired") {return "CANCELLED";}
    if (status === "unpaid" || status === "paused") {return "SUSPENDED";}
    return "EXPIRED";
  }

  private toDate(timestamp: number | null | undefined): Date | undefined {
    return timestamp == null ? undefined : new Date(timestamp * 1000);
  }

  private parseStoredStripeEvent(value: Prisma.JsonValue): StripeEvent {
    if (typeof value !== "object" || value === null || Array.isArray(value)) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Invalid stored billing webhook event", HttpStatus.BAD_REQUEST);}
    const event = value as unknown as StripeEvent;
    if (!event.id || !Number.isSafeInteger(event.created) || !event.data?.object?.id || !this.isStripeSubscriptionStatus(event.data.object.status) || !event.type?.startsWith("customer.subscription.")) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Invalid stored billing webhook event", HttpStatus.BAD_REQUEST);
    }
    return event;
  }

  private toStoredEvent(event: StripeEvent): StripeEvent {
    return {
      id: event.id,
      type: event.type,
      created: event.created,
      data: {
        object: {
          id: event.data.object.id,
          status: event.data.object.status,
          current_period_start: event.data.object.current_period_start,
          current_period_end: event.data.object.current_period_end,
          trial_end: event.data.object.trial_end,
          cancel_at_period_end: event.data.object.cancel_at_period_end,
        },
      },
    };
  }

  private isStripeSubscriptionStatus(status: unknown): status is StripeSubscription["status"] {
    return typeof status === "string" && ["active", "trialing", "past_due", "canceled", "unpaid", "incomplete", "incomplete_expired", "paused"].includes(status);
  }

  private nextRetryAt(attemptCount: number): Date | null {
    const billing = this.config.billing;
    if (attemptCount >= billing.webhookMaxRetryAttempts) {return null;}
    return new Date(Date.now() + Math.min(billing.webhookRetryBaseDelaySeconds * 1000 * 2 ** (attemptCount - 1), billing.webhookRetryMaxDelaySeconds * 1000));
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
  }
}