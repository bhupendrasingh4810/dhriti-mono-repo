import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsPayrollDto } from "../dto/hrms-operations.dto";
import { HrmsPayrollService } from "../services/hrms-payroll.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/payroll")
export class HrmsPayrollController {
  constructor(private readonly payroll: HrmsPayrollService) {}
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.read" }) list(
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.payroll.list(organization.organizationId);
  }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.manage" }) create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsPayrollDto,
  ) {
    return this.payroll.create(organization.organizationId, user.userId, dto);
  }
  @Patch(":payrollId/approve")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.approve" })
  approve(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("payrollId") payrollId: string,
  ) {
    return this.payroll.approve(organization.organizationId, payrollId, user.userId);
  }
}
