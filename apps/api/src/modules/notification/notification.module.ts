import { Global, Module } from "@nestjs/common";

import { EmailService } from "./email.service";
import { NotificationService } from "./notification.service";
import { NotificationController } from "./notification.controller";

@Global()
@Module({
  controllers: [NotificationController],
  providers: [EmailService, NotificationService],
  exports: [EmailService, NotificationService],
})
export class NotificationModule {}
