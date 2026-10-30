import { Global, Module } from "@nestjs/common";

import { EmailService } from "./email.service";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";
import { NotificationWorker } from "./notification-worker.service";

@Global()
@Module({
  controllers: [NotificationController],
  providers: [EmailService, NotificationService, NotificationWorker],
  exports: [EmailService, NotificationService],
})
export class NotificationModule {}
