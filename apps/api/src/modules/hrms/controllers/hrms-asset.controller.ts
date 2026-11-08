import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { AssignHrmsAssetDto, CreateHrmsAssetDto, ListHrmsAssetsDto, UpdateHrmsAssetDto } from "../dto/hrms-operations.dto";
import { HrmsAssetService } from "../services/hrms-asset.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/assets")
export class HrmsAssetController {
  constructor(private readonly assets: HrmsAssetService) {}
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.read" }) list(
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: ListHrmsAssetsDto,
  ) {
    return this.assets.list(organization.organizationId, query);
  }
  @Patch(":assetId") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" }) update(
    @CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser,
    @Param("assetId") assetId: string, @Body() dto: UpdateHrmsAssetDto,
  ) {
    return this.assets.update(organization.organizationId, assetId, user.userId, dto);
  }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" }) create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsAssetDto,
  ) {
    return this.assets.create(organization.organizationId, user.userId, dto);
  }
  @Patch(":assetId/assignment") @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" }) assign(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId") assetId: string,
    @Body() dto: AssignHrmsAssetDto,
  ) {
    return this.assets.assign(organization.organizationId, assetId, user.userId, dto.employeeId);
  }
  @Delete(":assetId") @HttpCode(HttpStatus.NO_CONTENT) @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" }) remove(
    @CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("assetId") assetId: string,
  ) {
    return this.assets.remove(organization.organizationId, assetId, user.userId);
  }
}
