import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsTrainingDto, EnrollHrmsTrainingDto } from "../dto/hrms-operations.dto";
import { HrmsTrainingService } from "../services/hrms-training.service";

@ApiTags("hrms") @ApiBearerAuth() @UseGuards(TenantGuard, AccessGuard) @Controller("organization/hrms/trainings")
export class HrmsTrainingController {
  constructor(private readonly trainings: HrmsTrainingService) {}
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.training.read" }) list(@CurrentOrganization() organization: OrganizationContext) { return this.trainings.list(organization.organizationId); }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.training.manage" }) create(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsTrainingDto) { return this.trainings.create(organization.organizationId, user.userId, dto); }
  @Post(":trainingId/enrollments") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.training.manage" }) enroll(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("trainingId") trainingId: string, @Body() dto: EnrollHrmsTrainingDto) { return this.trainings.enroll(organization.organizationId, trainingId, user.userId, dto.employeeId, dto.status); }
}