import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";

import { BillingWebhookService } from "../modules/authorization/services/billing-webhook.service";
import { RedisService } from "../redis/redis.service";
import { ApiConfigService } from "../config/config.service";

const RETRY_LEASE_KEY = "jobs:billing-webhook-retry";

@Injectable()
export class BillingWebhookRetryJob implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(BillingWebhookRetryJob.name);
  private timer: NodeJS.Timeout | undefined;

  constructor(
    private readonly billingWebhooks: BillingWebhookService,
    private readonly redis: RedisService,
    private readonly config: ApiConfigService,
  ) {}

  onModuleInit(): void {
    this.timer = setInterval(() => void this.run(), this.config.billing.webhookRetryIntervalSeconds * 1000);
    void this.run();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async run(): Promise<void> {
    try {
      const acquired = await this.redis.raw.set(
        RETRY_LEASE_KEY,
        "1",
        "EX",
        this.config.billing.webhookRetryLeaseTtlSeconds,
        "NX",
      );
      if (acquired !== "OK") {
        return;
      }
      const result = await this.billingWebhooks.retryFailedEvents();
      if (result.attempted > 0) {
        this.logger.log(`Retried ${result.attempted} billing webhook events; ${result.succeeded} succeeded`);
      }
    } catch (error) {
      this.logger.error("Billing webhook retry job failed", error instanceof Error ? error.stack : undefined);
    }
  }
}
