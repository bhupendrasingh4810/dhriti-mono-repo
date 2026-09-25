import { CanActivate, ExecutionContext, HttpStatus, Injectable, Logger } from "@nestjs/common";
import type { Request } from "express";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { RedisService } from "../../redis/redis.service";
import { ApiConfigService } from "../../config/config.service";
import { MetricsService } from "../../common/metrics/metrics.service";

// This guard is used to limit the rate of incoming billing webhook requests.
// It ensures that a single client IP cannot exceed a specified number of requests
// within a defined time window. To use it, apply the guard to the billing webhook
// controller or specific routes that handle billing webhooks.

@Injectable()
export class BillingWebhookRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(BillingWebhookRateLimitGuard.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
    private readonly metrics: MetricsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const provider = String(request.params.provider ?? "unknown").toLowerCase();
    const clientIp = request.ip || "unknown";
    const key = `rate-limit:billing-webhook:${provider}:${clientIp}`;
    const billing = this.config.billing;
    try {
      const count = await this.redis.incrementWithExpiry(key, billing.webhookRateLimitWindowSeconds);
      if (count > billing.webhookRateLimitMaxRequests) {
        throw new AppError(ErrorCode.FORBIDDEN, "Billing webhook rate limit exceeded", HttpStatus.TOO_MANY_REQUESTS);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      this.metrics.billingWebhookRateLimitUnavailable();
      this.logger.warn(
        `Billing webhook rate limiting unavailable for provider=${provider}; accepting request after signature verification`,
      );
    }
    return true;
  }
}
