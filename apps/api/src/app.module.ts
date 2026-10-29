import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { ClsModule } from "nestjs-cls";

import { ConfigModule } from "./config/config.module";
import { DatabaseModule } from "./database/database.module";
import { RedisModule } from "./redis/redis.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { AuthModule } from "./modules/auth/auth.module";
import { OrganizationModule } from "./modules/organization/organization.module";
import { AuditModule } from "./modules/audit/audit.module";
import { FileModule } from "./modules/file/file.module";
import { ConnectModule } from "./modules/connect/connect.module";
import { FlowModule } from "./modules/flow/flow.module";
import { AtlasModule } from "./modules/atlas/atlas.module";
import { PulseModule } from "./modules/pulse/pulse.module";
import { NexusModule } from "./modules/nexus/nexus.module";
import { CadenceModule } from "./modules/cadence/cadence.module";
import { WebhookModule } from "./modules/webhook/webhook.module";
import { HealthModule } from "./health/health.module";
import { ControlModule } from "./modules/control/control.module";
import { SearchModule } from "./modules/search/search.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { UserModule } from "./modules/user/user.module";
import { WebsocketModule } from "./websocket/websocket.module";
import { AuthGuard } from "./common/guards/auth.guard";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { MetricsModule } from "./common/metrics/metrics.module";
import { MetricsInterceptor } from "./common/metrics/metrics.interceptor";
import { AuthorizationModule } from "./modules/authorization/authorization.module";
import { HrmsModule } from "./modules/hrms/hrms.module";
import { JobsModule } from "./jobs/jobs.module";
import { NotesModule } from "./modules/notes/notes.module";
import { SettingsModule } from "./modules/settings/settings.module";

@Module({
  imports: [
    ClsModule.forRoot({ global: true, middleware: { mount: true } }),
    ConfigModule,
    DatabaseModule,
    RedisModule,
    AuthorizationModule,
    HrmsModule,
    JobsModule,
    NotesModule,
    SettingsModule,
    MetricsModule,
    NotificationModule,
    AuditModule,
    AuthModule,
    OrganizationModule,
    FileModule,
    ConnectModule,
    FlowModule,
    AtlasModule,
    PulseModule,
    NexusModule,
    CadenceModule,
    WebhookModule,
    HealthModule,
    ControlModule,
    SearchModule,
    AnalyticsModule,
    UserModule,
    WebsocketModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule {}
