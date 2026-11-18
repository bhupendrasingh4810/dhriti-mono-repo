import { Module } from "@nestjs/common";
import { SecurityService } from "./security.service";
import { SecurityAccessGuard } from "./security-access.guard";
import { SecurityController } from "./security.controller";
import { SessionModule } from "../../../auth/session.module";
import { SecurityOperationsService } from "./security-operations.service";
import { SecurityIntegrationsService } from "./security-integrations.service";
import { SecurityIngestController } from "./security-ingest.controller";

@Module({
  imports: [SessionModule],
  providers: [SecurityService, SecurityAccessGuard, SecurityOperationsService, SecurityIntegrationsService],
  controllers: [SecurityController, SecurityIngestController],
  exports: [SecurityService, SecurityAccessGuard],
})
export class SecurityModule {}
