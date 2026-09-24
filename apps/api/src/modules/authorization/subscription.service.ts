import { createHash, randomUUID } from "node:crypto";

import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma, SubscriptionPlan, type Subscription } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EntitlementService } from "./entitlement.service";
import { RedisService } from "../../redis/redis.service";
import { ApiConfigService } from "../../config/config.service";

interface IdempotencyRecord<T> {
  fingerprint: string;
  state: "PROCESSING" | "SUCCEEDED";
  response?: T;
}

@Injectable()
export class SubscriptionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly entitlements: EntitlementService,
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
  ) {}

  async executeIdempotent<T>(organizationId: string, userId: string, idempotencyKey: string | undefined, scope: string, input: unknown, operation: () => Promise<T>): Promise<T> {
    if (!idempotencyKey || !/^[A-Za-z0-9_-]{16,128}$/.test(idempotencyKey)) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "A valid Idempotency-Key header is required", HttpStatus.BAD_REQUEST);
    }
    const key = `idempotency:billing:${organizationId}:${userId}:${createHash("sha256").update(idempotencyKey).digest("hex")}`;
    const fingerprint = createHash("sha256").update(JSON.stringify({ scope, input })).digest("hex");
    const completed = this.readIdempotencyRecord<T>(await this.redis.getJson<unknown>(key), fingerprint);
    if (completed !== null) {return completed;}

    const token = randomUUID();
    const lock = JSON.stringify({ fingerprint, state: "PROCESSING", token });
    const acquired = await this.redis.raw.set(key, lock, "EX", this.config.billing.idempotencyLockTtlSeconds, "NX");
    if (acquired !== "OK") {
      const cached = this.readIdempotencyRecord<T>(await this.redis.getJson<unknown>(key), fingerprint);
      if (cached !== null) {return cached;}
      throw new AppError(ErrorCode.VALIDATION_FAILED, "A request with this Idempotency-Key is already in progress", HttpStatus.CONFLICT);
    }
    try {
      const response = await operation();
      await this.redis.setJson(key, { fingerprint, state: "SUCCEEDED", response } satisfies IdempotencyRecord<T>, this.config.billing.idempotencyResultTtlSeconds);
      return response;
    } catch (error) {
      await this.releaseIdempotencyKey(key, lock);
      throw error;
    }
  }

  getOrganizationSubscription(organizationId: string) {
    return this.prisma.subscription.findFirst({ where: { organizationId }, include: { planRecord: true } });
  }

  async createSubscription(organizationId: string, actorUserId: string, input: { planKey: string; seatCount?: number }): Promise<Subscription> {
    const plan = await this.requirePlan(input.planKey);
    const subscription = await this.prisma.subscription.upsert({
      where: { organizationId },
      create: { organizationId, planId: plan.id, plan: this.legacyPlan(plan.key), status: "ACTIVE", seats: input.seatCount ?? 5, currentPeriodStart: new Date() },
      update: { planId: plan.id, plan: this.legacyPlan(plan.key), status: "ACTIVE", seats: input.seatCount ?? 5, cancelAtPeriodEnd: false },
    });
    await this.recordTransition(subscription, undefined, actorUserId, "created");
    await this.recordAndInvalidate("billing.subscription.created", organizationId, actorUserId, subscription.id, { planKey: plan.key });
    return subscription;
  }

  async changePlan(organizationId: string, actorUserId: string, planKey: string): Promise<Subscription> {
    const plan = await this.requirePlan(planKey);
    const subscription = await this.requireSubscription(organizationId);
    const updated = await this.prisma.subscription.update({ where: { id: subscription.id }, data: { planId: plan.id, plan: this.legacyPlan(plan.key) } });
    await this.recordTransition(updated, subscription, actorUserId, "plan_changed");
    await this.recordAndInvalidate("billing.subscription.plan-changed", organizationId, actorUserId, updated.id, { planKey: plan.key });
    return updated;
  }

  async cancelSubscription(organizationId: string, actorUserId: string): Promise<Subscription> {
    const subscription = await this.requireSubscription(organizationId);
    const updated = await this.prisma.subscription.update({ where: { id: subscription.id }, data: { cancelAtPeriodEnd: true, status: "CANCELLED", cancelledAt: new Date() } });
    await this.recordTransition(updated, subscription, actorUserId, "cancelled");
    await this.recordAndInvalidate("billing.subscription.cancelled", organizationId, actorUserId, updated.id);
    return updated;
  }

  async reactivateSubscription(organizationId: string, actorUserId: string): Promise<Subscription> {
    const subscription = await this.requireSubscription(organizationId);
    const updated = await this.prisma.subscription.update({ where: { id: subscription.id }, data: { status: "ACTIVE", cancelAtPeriodEnd: false, cancelledAt: null, suspendedAt: null } });
    await this.recordTransition(updated, subscription, actorUserId, "reactivated");
    await this.recordAndInvalidate("billing.subscription.reactivated", organizationId, actorUserId, updated.id);
    return updated;
  }

  async updateSeatCount(organizationId: string, actorUserId: string, seatCount: number): Promise<Subscription> {
    const subscription = await this.requireSubscription(organizationId);
    const updated = await this.prisma.subscription.update({ where: { id: subscription.id }, data: { seats: seatCount } });
    await this.recordAndInvalidate("billing.subscription.seats-updated", organizationId, actorUserId, updated.id, { seatCount });
    return updated;
  }

  async processProviderUpdate(organizationId: string, input: { status: Subscription["status"]; currentPeriodStart?: Date | null; currentPeriodEnd?: Date | null; trialEndsAt?: Date | null; gracePeriodEndsAt?: Date | null; provider?: string; providerCustomerId?: string; providerSubscriptionId?: string }, providerEventId?: string): Promise<Subscription> {
    const subscription = await this.requireSubscription(organizationId);
    if (providerEventId) {
      const processed = await this.prisma.subscriptionHistory.findUnique({ where: { providerEventId }, select: { id: true } });
      if (processed) {return subscription;}
    }
    const updated = await this.prisma.subscription.update({ where: { id: subscription.id }, data: { ...input, ...(input.status === "SUSPENDED" ? { suspendedAt: new Date() } : {}) } });
    await this.recordTransition(updated, subscription, null, "provider_update", providerEventId);
    await this.entitlements.invalidate(organizationId);
    return updated;
  }

  private async requirePlan(key: string) {
    const plan = await this.prisma.plan.findFirst({ where: { key: key.toLowerCase(), isActive: true } });
    if (!plan) {throw new AppError(ErrorCode.PLAN_NOT_FOUND, "Active plan not found", HttpStatus.NOT_FOUND);}
    return plan;
  }

  private async requireSubscription(organizationId: string) {
    const subscription = await this.prisma.subscription.findFirst({ where: { organizationId } });
    if (!subscription) {throw new AppError(ErrorCode.SUBSCRIPTION_NOT_FOUND, "Organization subscription not found", HttpStatus.NOT_FOUND);}
    return subscription;
  }

  private async recordAndInvalidate(action: string, organizationId: string, actorUserId: string, resourceId: string, metadata?: Prisma.InputJsonValue) {
    await this.audit.record({ action, organizationId, actorUserId, resourceType: "Subscription", resourceId, metadata });
    await this.entitlements.invalidate(organizationId);
  }

  private async recordTransition(current: Subscription, previous: Subscription | undefined, actorUserId: string | null, reason: string, providerEventId?: string): Promise<void> {
    await this.prisma.subscriptionHistory.create({ data: { organizationId: current.organizationId, subscriptionId: current.id, previousPlanId: previous?.planId ?? null, planId: current.planId, previousStatus: previous?.status ?? null, status: current.status, reason, actorUserId, providerEventId: providerEventId ?? null } });
  }

  private legacyPlan(planKey: string): SubscriptionPlan {
    const value = planKey.toUpperCase();
    return value === "STARTER" || value === "PRO" || value === "ENTERPRISE" ? value : "FREE";
  }

  private readIdempotencyRecord<T>(value: unknown, fingerprint: string): T | null {
    if (value === null) {return null;}
    if (typeof value !== "object" || value === null || !("fingerprint" in value) || value.fingerprint !== fingerprint) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Idempotency-Key was already used for a different request", HttpStatus.CONFLICT);
    }
    if ("state" in value && value.state === "SUCCEEDED" && "response" in value) {return value.response as T;}
    throw new AppError(ErrorCode.VALIDATION_FAILED, "A request with this Idempotency-Key is already in progress", HttpStatus.CONFLICT);
  }

  private async releaseIdempotencyKey(key: string, lock: string): Promise<void> {
    await this.redis.raw.eval(
      "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) end return 0",
      1,
      key,
      lock,
    );
  }
}