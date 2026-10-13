import { Module } from "@nestjs/common";

import { ConnectController } from "./connect.controller";
import { ConnectService } from "./connect.service";
import { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";

@Module({
  controllers: [ConnectController],
  providers: [ConnectService, ConnectPublisherService],
  exports: [ConnectService, ConnectPublisherService],
})
export class ConnectModule {}
