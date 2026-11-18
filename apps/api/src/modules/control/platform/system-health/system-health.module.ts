import { Module } from "@nestjs/common";
import { SessionModule } from "../../../auth/session.module";
import { FileModule } from "../../../file/file.module";
import { SystemHealthController } from "./system-health.controller";
import { SystemHealthServiceProvider } from "./system-health.service";
import { PlatformRolesGuard } from "../../../../common/guards/platform-roles.guard";

@Module({
  imports: [SessionModule, FileModule],
  controllers: [SystemHealthController],
  providers: [SystemHealthServiceProvider, PlatformRolesGuard],
})
export class SystemHealthModule {}
