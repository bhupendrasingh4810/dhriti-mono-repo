import { Module } from "@nestjs/common";

import { AuthModule } from "../modules/auth/auth.module";
import { ConnectModule } from "../modules/connect/connect.module";
import { PulseModule } from "../modules/pulse/pulse.module";
import { AtlasModule } from "../modules/atlas/atlas.module";
import { NexusModule } from "../modules/nexus/nexus.module";
import { CadenceModule } from "../modules/cadence/cadence.module";
import { FlowModule } from "../modules/flow/flow.module";

import { WsAuthService } from "./ws-auth";
import { ConnectGateway } from "./connect.gateway";
import { ConnectAdapterLifecycleService } from "./connect/connect-adapter-lifecycle.service";
import { ConnectPresenceService } from "./connect/connect-presence.service";
import { ConnectRateLimitService } from "./connect/connect-rate-limit.service";
import { PulseGateway } from "./pulse.gateway";
import { AtlasGateway } from "./atlas.gateway";
import { NexusGateway } from "./nexus.gateway";
import { CadenceGateway } from "./cadence.gateway";
import { WebRtcGateway } from "./webrtc.gateway";
import { FlowGateway } from "./flow.gateway";
import { SessionRevocationSocketService } from "./session-revocation.service";

@Module({
  imports: [AuthModule, ConnectModule, PulseModule, AtlasModule, NexusModule, CadenceModule, FlowModule],
  providers: [
    WsAuthService,
    ConnectGateway,
    ConnectAdapterLifecycleService,
    ConnectPresenceService,
    ConnectRateLimitService,
    SessionRevocationSocketService,
    PulseGateway,
    AtlasGateway,
    NexusGateway,
    CadenceGateway,
    WebRtcGateway,
    FlowGateway,
  ],
})
export class WebsocketModule {}
