import { Module } from "@nestjs/common";

import { ConnectController } from "./connect.controller";
import { ConnectService } from "./connect.service";
import { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";
import { ConnectPresenceService } from "../../websocket/connect/connect-presence.service";

@Module({
  controllers: [ConnectController],
  providers: [ConnectService, ConnectPublisherService, ConnectPresenceService],
  exports: [ConnectService, ConnectPublisherService],
})
export class ConnectModule {}
