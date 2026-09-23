import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsBenefitDto } from "../dto/hrms-operations.dto";
import { HrmsBenefitService } from "../services/hrms-benefit.service";

@ApiTags("hrms") @ApiBearerAuth() @UseGuards(TenantGuard, AccessGuard) @Controller("organization/hrms/benefits")
export class HrmsBenefitController {
  constructor(private readonly benefits: HrmsBenefitService) {}
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.benefit.read" }) list(@CurrentOrganization() organization: OrganizationContext) { return this.benefits.list(organization.organizationId); }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.benefit.manage" }) create(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsBenefitDto) { return this.benefits.create(organization.organizationId, user.userId, dto); }
}