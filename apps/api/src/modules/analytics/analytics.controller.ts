import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import {
  CurrentOrganization,
  type OrganizationContext,
} from "../../common/decorators/organization.decorator";
import { RequirePermission } from "../../common/decorators/access.decorator";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { AnalyticsService, type AnalyticsOverview } from "./analytics.service";
import { AnalyticsQueryDto, TrackEventDto } from "./dto/analytics.dto";

@ApiTags("analytics")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/analytics")
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Post("track")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Track a usage event (called by app clients/server hooks)" })
  async track(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: TrackEventDto,
  ): Promise<void> {
    return this.analytics.track(organization.organizationId, user.userId, dto);
  }

  @Get("overview")
  @RequirePermission("analytics.read")
  @ApiOperation({ summary: "Analytics overview: usage by app, daily activity, DAU/WAU/MAU, team velocity (OWNER/ADMIN)" })
  async overview(
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsOverview> {
    return this.analytics.overview(organization.organizationId, query);
  }
}
