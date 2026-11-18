import { Module } from "@nestjs/common";

import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { ContentModule } from "./content/content.module";
import { SystemHealthModule } from "./system-health/system-health.module";

@Module({
  imports: [ContentModule, SystemHealthModule],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService, ContentModule],
})
export class PlatformAdminModule {}
