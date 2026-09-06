import { Module } from "@nestjs/common";

import { PlatformController } from "./platform.controller";
import { PlatformService } from "./platform.service";
import { ContentModule } from "./content/content.module";

@Module({
  imports: [ContentModule],
  controllers: [PlatformController],
  providers: [PlatformService],
  exports: [PlatformService, ContentModule],
})
export class PlatformAdminModule {}
