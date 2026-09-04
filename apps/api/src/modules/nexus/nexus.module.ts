import { Module } from "@nestjs/common";

import { NexusController } from "./nexus.controller";
import { NexusService } from "./nexus.service";
import { AiProviderService } from "./ai-provider.service";

@Module({
  controllers: [NexusController],
  providers: [NexusService, AiProviderService],
  exports: [NexusService, AiProviderService],
})
export class NexusModule {}
