import { Module } from "@nestjs/common";

import { CadenceController } from "./cadence.controller";
import { CadenceService } from "./cadence.service";

@Module({
  controllers: [CadenceController],
  providers: [CadenceService],
  exports: [CadenceService],
})
export class CadenceModule {}
