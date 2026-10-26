import { Module } from "@nestjs/common";
import { ConnectModule } from "../connect/connect.module";

import { PulseController } from "./pulse.controller";
import { PulseService } from "./pulse.service";

@Module({
  imports: [ConnectModule],
  controllers: [PulseController],
  providers: [PulseService],
  exports: [PulseService],
})
export class PulseModule {}
