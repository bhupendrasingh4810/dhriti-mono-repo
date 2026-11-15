import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { ListHrmsAssetsDto } from "../dto/hrms-operations.dto";
import { EmployeeTimelineQueryDto } from "../dto/hrms-employee.dto";
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";
import { HrmsAssetService } from "../services/hrms-asset.service";

const read = { entitlement: "hrms.enabled", permission: "hrms.asset.read" };
const manage = { entitlement: "hrms.enabled", permission: "hrms.asset.manage" };
export class AssetEmployeeQueryDto extends EmployeeTimelineQueryDto {
  @IsOptional() @IsString() @MaxLength(120) query?: string;
  @IsOptional() @IsIn(["true", "false"]) includeInactive?: string;
}
@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/assets")
export class HrmsAssetController {
  constructor(private readonly assets: HrmsAssetService) {}
  @Get()
  @RequireAccess(read)
  @Header("Cache-Control", "no-store")
  list(@CurrentOrganization() org: OrganizationContext, @Query() query: ListHrmsAssetsDto) {
    return this.assets.list(org.organizationId, query);
  }
  @Get("categories")
  @RequireAccess(read)
  @Header("Cache-Control", "no-store")
  categories(@CurrentOrganization() org: OrganizationContext) {
    return this.assets.categories(org.organizationId);
  }
  @Get("employees")
  @RequireAccess(read)
  @Header("Cache-Control", "no-store")
  employees(@CurrentOrganization() org: OrganizationContext, @Query() query: AssetEmployeeQueryDto) {
    return this.assets.employees(org.organizationId, query);
  }
  @Post("categories")
  @RequireAccess(manage)
  createCategory(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.assets.saveCategory(org.organizationId, user.userId, input);
  }
  @Patch("categories/:categoryId")
  @RequireAccess(manage)
  updateCategory(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("categoryId", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.assets.saveCategory(org.organizationId, user.userId, input, id);
  }
  @Get("export")
  @RequireAccess(read)
  @Header("Cache-Control", "no-store")
  export(@CurrentOrganization() org: OrganizationContext, @Query() query: ListHrmsAssetsDto) {
    return this.assets.export(org.organizationId, query);
  }
  @Get("mine")
  @RequireAccess({ entitlement: "hrms.enabled" })
  @Header("Cache-Control", "no-store")
  mine(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: EmployeeTimelineQueryDto,
  ) {
    return this.assets.myAssets(org.organizationId, user.userId, query.page, query.pageSize);
  }
  @Get("clearance/:employeeId")
  @RequireAccess(read)
  @Header("Cache-Control", "no-store")
  clearance(@CurrentOrganization() org: OrganizationContext, @Param("employeeId", ParseUUIDPipe) id: string) {
    return this.assets.clearance(org.organizationId, id);
  }
  @Get(":assetId/history")
  @RequireAccess(read)
  @Header("Cache-Control", "no-store")
  history(
    @CurrentOrganization() org: OrganizationContext,
    @Param("assetId", ParseUUIDPipe) id: string,
    @Query() query: EmployeeTimelineQueryDto,
  ) {
    return this.assets.history(org.organizationId, id, query.page);
  }
  @Patch(":assetId")
  @RequireAccess(manage)
  update(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.assets.update(org.organizationId, id, user.userId, input);
  }
  @Post()
  @RequireAccess(manage)
  create(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.assets.create(org.organizationId, user.userId, input);
  }
  @Post(":assetId/issue")
  @RequireAccess(manage)
  issue(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.assets.custody(org.organizationId, id, user.userId, "ISSUE", input);
  }
  @Post(":assetId/return")
  @RequireAccess(manage)
  returnAsset(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.assets.custody(org.organizationId, id, user.userId, "RETURN", input);
  }
  @Post(":assetId/acknowledge")
  @RequireAccess({ entitlement: "hrms.enabled" })
  @HttpCode(HttpStatus.NO_CONTENT)
  acknowledge(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.assets.acknowledge(org.organizationId, id, user.userId, input);
  }
  @Delete(":assetId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAccess(manage)
  archive(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("assetId", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.assets.archive(org.organizationId, id, user.userId, input);
  }
}
