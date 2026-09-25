import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsPerformanceReviewDto } from "../dto/hrms-operations.dto";
import { HrmsPerformanceReviewService } from "../services/hrms-performance-review.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/performance-reviews")
export class HrmsPerformanceReviewController {
  constructor(private readonly reviews: HrmsPerformanceReviewService) {}
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.performance.read" }) list(
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.reviews.list(organization.organizationId);
  }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.performance.manage" }) create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsPerformanceReviewDto,
  ) {
    return this.reviews.create(organization.organizationId, user.userId, dto);
  }
}
