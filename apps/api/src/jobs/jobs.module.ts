import { Module } from "@nestjs/common";

import { BillingWebhookRetryJob } from "./billing-webhook-retry.job";

@Module({
  providers: [BillingWebhookRetryJob],
})
export class JobsModule {}
