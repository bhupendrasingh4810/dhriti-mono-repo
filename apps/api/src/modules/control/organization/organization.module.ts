import { Module } from "@nestjs/common";

import { OrganizationAdminController } from "./organization.controller";
import { OrganizationAdminService } from "./organization.service";
import { OrganizationBankController } from "./organization-bank.controller";
import { OrganizationBankService } from "./organization-bank.service";

@Module({
  controllers: [OrganizationAdminController, OrganizationBankController],
  providers: [OrganizationAdminService, OrganizationBankService],
  exports: [OrganizationAdminService],
})
export class OrganizationAdminModule {}
