import { Module } from "@nestjs/common";

import { ConnectController } from "./connect.controller";
import { ConnectService } from "./connect.service";
import { ConnectPresenceExpiryService } from "./connect-presence-expiry.service";
import { ConnectPublisherService } from "../../websocket/connect/connect-publisher.service";
import { ConnectPresenceService } from "../../websocket/connect/connect-presence.service";

@Module({
  controllers: [ConnectController],
  providers: [ConnectService, ConnectPublisherService, ConnectPresenceService, ConnectPresenceExpiryService],
  exports: [ConnectService, ConnectPublisherService],
})
export class ConnectModule {}
