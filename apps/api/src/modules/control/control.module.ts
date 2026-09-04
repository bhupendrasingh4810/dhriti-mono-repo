import { Module } from "@nestjs/common";

import { PlatformAdminModule } from "./platform/platform.module";
import { OrganizationAdminModule } from "./organization/organization.module";

@Module({
  imports: [PlatformAdminModule, OrganizationAdminModule],
  exports: [PlatformAdminModule, OrganizationAdminModule],
})
export class ControlModule {}
