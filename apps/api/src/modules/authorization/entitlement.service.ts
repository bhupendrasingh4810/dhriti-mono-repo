import { HttpStatus, Injectable } from "@nestjs/common";
import type { EntitlementKind, SubscriptionStatus } from "@prisma/client";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { RedisService } from "../../redis/redis.service";
import { ApiConfigService } from "../../config/config.service";

export interface EffectiveEntitlement {
  enabled: boolean;
  value: number | null;
}

@Injectable()
export class EntitlementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
  ) {}

  async hasFeature(organizationId: string, entitlementKey: string): Promise<boolean> {
    const entitlement = await this.getEntitlement(organizationId, entitlementKey);
    return entitlement.enabled;
  }

  async getEntitlement(organizationId: string, entitlementKey: string): Promise<EffectiveEntitlement> {
    const cacheKey = this.cacheKey(organizationId, entitlementKey);
    const cached = await this.readCache(cacheKey);
    if (cached) {
      return cached;
    }

    const entitlement = await this.prisma.entitlement.findUnique({
      where: { key: entitlementKey },
      select: { id: true, kind: true },
    });
    if (!entitlement) {
      return { enabled: false, value: null };
    }

    const subscription = await this.prisma.subscription.findFirst({
      where: { organizationId },
      select: {
        planId: true,
        status: true,
        currentPeriodEnd: true,
        trialEndsAt: true,
        gracePeriodEndsAt: true,
        planRecord: {
          select: {
            entitlements: {
              where: { entitlementId: entitlement.id },
              select: { enabled: true, value: true },
            },
          },
        },
      },
    });

    const override = await this.prisma.organizationEntitlement.findFirst({
      where: {
        organizationId,
        entitlementId: entitlement.id,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: { enabled: true, value: true },
    });
    const planEntitlement =
      subscription && this.hasPaidAccess(subscription) ? subscription.planRecord?.entitlements[0] : undefined;
    const result = this.resolve(entitlement.kind, planEntitlement, override);
    await this.writeCache(cacheKey, result);
    return result;
  }

  async getLimit(organizationId: string, entitlementKey: string): Promise<number | null> {
    const result = await this.getEntitlement(organizationId, entitlementKey);
    return result.enabled ? result.value : null;
  }

  async listEntitlements(organizationId: string): Promise<Array<EffectiveEntitlement & { key: string }>> {
    const entitlements = await this.prisma.entitlement.findMany({ select: { key: true }, orderBy: { key: "asc" } });
    return Promise.all(
      entitlements.map(async ({ key }) => ({ key, ...(await this.getEntitlement(organizationId, key)) })),
    );
  }

  async assertFeatureEnabled(organizationId: string, entitlementKey: string): Promise<void> {
    if (!(await this.hasFeature(organizationId, entitlementKey))) {
      throw new AppError(
        ErrorCode.FEATURE_NOT_ENTITLED,
        `Organization is not entitled to ${entitlementKey}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async assertWithinLimit(organizationId: string, entitlementKey: string, requestedValue: number): Promise<void> {
    if (!Number.isSafeInteger(requestedValue) || requestedValue < 0) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        `Invalid requested value for ${entitlementKey}`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const limit = await this.getLimit(organizationId, entitlementKey);
    if (limit === null || requestedValue > limit) {
      throw new AppError(
        ErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
        `Organization exceeded ${entitlementKey}`,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async invalidate(organizationId: string): Promise<void> {
    try {
      await this.redis.deleteByPattern(`entitlement:${organizationId}:*`);
    } catch {
      // Entitlements remain correct because the cache has a short TTL.
    }
  }

  private resolve(
    kind: EntitlementKind,
    plan: { enabled: boolean; value: number | null } | undefined,
    override: { enabled: boolean | null; value: number | null } | null,
  ): EffectiveEntitlement {
    const enabled = override?.enabled ?? plan?.enabled ?? false;
    const value = override?.value ?? plan?.value ?? null;
    if (kind === "FEATURE") {
      return { enabled, value: null };
    }

    // A null, negative, or non-integer LIMIT is never interpreted as unlimited access.
    if (!enabled || value === null || !Number.isSafeInteger(value) || value < 0) {
      return { enabled: false, value: null };
    }
    return { enabled: true, value };
  }

  private hasPaidAccess(subscription: {
    status: SubscriptionStatus;
    currentPeriodEnd: Date | null;
    trialEndsAt: Date | null;
    gracePeriodEndsAt: Date | null;
  }): boolean {
    const now = new Date();
    if (subscription.status === "ACTIVE") {
      return subscription.currentPeriodEnd === null || subscription.currentPeriodEnd > now;
    }
    if (subscription.status === "TRIALING") {
      return subscription.trialEndsAt !== null && subscription.trialEndsAt > now;
    }
    if (subscription.status === "PAST_DUE") {
      return subscription.gracePeriodEndsAt !== null && subscription.gracePeriodEndsAt > now;
    }
    return (
      subscription.status === "CANCELLED" &&
      subscription.currentPeriodEnd !== null &&
      subscription.currentPeriodEnd > now
    );
  }

  private cacheKey(organizationId: string, entitlementKey: string): string {
    return `entitlement:${organizationId}:${entitlementKey}`;
  }

  private async readCache(key: string): Promise<EffectiveEntitlement | null> {
    try {
      return await this.redis.getJson<EffectiveEntitlement>(key);
    } catch {
      return null;
    }
  }

  private async writeCache(key: string, value: EffectiveEntitlement): Promise<void> {
    try {
      await this.redis.setJson(key, value, this.config.entitlementCacheTtlSeconds);
    } catch {
      // Authorization falls back to the database on the next request.
    }
  }
}
