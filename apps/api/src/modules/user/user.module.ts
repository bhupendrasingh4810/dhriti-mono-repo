import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { OnboardingController } from "./controllers/onboarding.controller";
import { OnboardingService } from "./services/onboarding.service";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";

@Module({
  imports: [AuthModule],
  controllers: [UserController, OnboardingController],
  providers: [UserService, OnboardingService],
  exports: [UserService],
})
export class UserModule {}
