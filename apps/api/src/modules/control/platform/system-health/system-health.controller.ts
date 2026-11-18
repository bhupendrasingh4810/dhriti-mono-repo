import { Controller, Get, Header, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PlatformRoles } from "../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../common/guards/platform-roles.guard";
import { SystemHealthServiceProvider } from "./system-health.service";

@ApiTags("control/platform/system-health")
@ApiBearerAuth()
@UseGuards(PlatformRolesGuard)
@PlatformRoles("PLATFORM_ADMIN", "ENGINEERING", "SECURITY")
@Controller("control/platform/system-health")
export class SystemHealthController {
  constructor(private readonly health: SystemHealthServiceProvider) {}

  @Get()
  @Header("Cache-Control", "no-store")
  overview() {
    return this.health.getSnapshot();
  }

  @Get("report")
  @Header("Cache-Control", "no-store")
  @Header("Content-Disposition", 'attachment; filename="dhriti-system-health.json"')
  report() {
    return this.health.getSnapshot();
  }
}
