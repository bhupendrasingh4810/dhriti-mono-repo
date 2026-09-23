import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { AssignHrmsAssetDto, CreateHrmsAssetDto, CreateHrmsBenefitDto, CreateHrmsLeaveDto, CreateHrmsPayrollDto, CreateHrmsPerformanceReviewDto, CreateHrmsTrainingDto, EnrollHrmsTrainingDto, UpdateHrmsLeaveStatusDto } from "./dto/hrms-operations.dto";
import { HrmsOperationsService } from "./hrms-operations.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms")
export class HrmsOperationsController {
  constructor(private readonly operations: HrmsOperationsService) {}

  @Get("leave-requests") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.read" })
  listLeave(@CurrentOrganization() organization: OrganizationContext) { return this.operations.listLeave(organization.organizationId); }
  @Post("leave-requests") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.manage" })
  createLeave(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsLeaveDto) { return this.operations.createLeave(organization.organizationId, user.userId, dto); }
  @Patch("leave-requests/:leaveId/status") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.approve" })
  updateLeaveStatus(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("leaveId") leaveId: string, @Body() dto: UpdateHrmsLeaveStatusDto) { return this.operations.updateLeaveStatus(organization.organizationId, leaveId, user.userId, dto.status, dto.rejectionReason); }

  @Get("performance-reviews") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.performance.read" })
  listReviews(@CurrentOrganization() organization: OrganizationContext) { return this.operations.listReviews(organization.organizationId); }
  @Post("performance-reviews") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.performance.manage" })
  createReview(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsPerformanceReviewDto) { return this.operations.createReview(organization.organizationId, user.userId, dto); }

  @Get("payroll") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.read" })
  listPayroll(@CurrentOrganization() organization: OrganizationContext) { return this.operations.listPayroll(organization.organizationId); }
  @Post("payroll") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.manage" })
  createPayroll(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsPayrollDto) { return this.operations.createPayroll(organization.organizationId, user.userId, dto); }
  @Patch("payroll/:payrollId/approve") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.approve" })
  approvePayroll(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("payrollId") payrollId: string) { return this.operations.approvePayroll(organization.organizationId, payrollId, user.userId); }

  @Get("trainings") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.training.read" })
  listTrainings(@CurrentOrganization() organization: OrganizationContext) { return this.operations.listTrainings(organization.organizationId); }
  @Post("trainings") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.training.manage" })
  createTraining(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsTrainingDto) { return this.operations.createTraining(organization.organizationId, user.userId, dto); }
  @Post("trainings/:trainingId/enrollments") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.training.manage" })
  enrollTraining(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("trainingId") trainingId: string, @Body() dto: EnrollHrmsTrainingDto) { return this.operations.enrollTraining(organization.organizationId, trainingId, user.userId, dto.employeeId, dto.status); }

  @Get("assets") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.read" })
  listAssets(@CurrentOrganization() organization: OrganizationContext) { return this.operations.listAssets(organization.organizationId); }
  @Post("assets") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" })
  createAsset(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsAssetDto) { return this.operations.createAsset(organization.organizationId, user.userId, dto); }
  @Patch("assets/:assetId/assignment") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" })
  assignAsset(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("assetId") assetId: string, @Body() dto: AssignHrmsAssetDto) { return this.operations.assignAsset(organization.organizationId, assetId, user.userId, dto.employeeId); }

  @Get("benefits") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.benefit.read" })
  listBenefits(@CurrentOrganization() organization: OrganizationContext) { return this.operations.listBenefits(organization.organizationId); }
  @Post("benefits") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.benefit.manage" })
  createBenefit(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHrmsBenefitDto) { return this.operations.createBenefit(organization.organizationId, user.userId, dto); }
}