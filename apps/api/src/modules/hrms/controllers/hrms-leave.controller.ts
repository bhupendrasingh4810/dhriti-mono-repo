import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsLeaveDto, UpdateHrmsLeaveStatusDto } from "../dto/hrms-operations.dto";
import { HrmsLeaveService } from "../services/hrms-leave.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/leave-requests")
export class HrmsLeaveController {
  constructor(private readonly leave: HrmsLeaveService) {}
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.read" }) list(
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.leave.list(organization.organizationId);
  }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.manage" }) create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsLeaveDto,
  ) {
    return this.leave.create(organization.organizationId, user.userId, dto);
  }
  @Patch(":leaveId/status")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.approve" })
  updateStatus(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("leaveId") leaveId: string,
    @Body() dto: UpdateHrmsLeaveStatusDto,
  ) {
    return this.leave.updateStatus(organization.organizationId, leaveId, user.userId, dto.status, dto.rejectionReason);
  }
}
