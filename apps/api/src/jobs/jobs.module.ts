import { Module } from "@nestjs/common";

import { FileModule } from "../modules/file/file.module";
import { BillingWebhookRetryJob } from "./billing-webhook-retry.job";
import { ConnectRetentionJob } from "./connect-retention.job";

@Module({
  imports: [FileModule],
  providers: [BillingWebhookRetryJob, ConnectRetentionJob],
})
export class JobsModule {}
