import { Module } from "@nestjs/common";

import { OrganizationAdminController } from "./organization.controller";
import { OrganizationAdminService } from "./organization.service";

@Module({
  controllers: [OrganizationAdminController],
  providers: [OrganizationAdminService],
  exports: [OrganizationAdminService],
})
export class OrganizationAdminModule {}
