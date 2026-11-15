import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { IsIn, IsOptional } from "class-validator";
import { z, hrmsAssetRevisionSchema } from "@dhriti/validation";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { EmployeeTimelineQueryDto } from "../dto/hrms-employee.dto";
import { HrmsAssetOperationsService, assetInput } from "../services/hrms-asset-operations.service";
import { HrmsAssetEvidenceService, ASSET_FILE_MAX_BYTES } from "../services/hrms-asset-evidence.service";
interface MultipartAsset {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}
const upload = FileInterceptor("file", {
  limits: { fileSize: ASSET_FILE_MAX_BYTES, files: 1, fields: 2, fieldSize: 1024 },
});
const asFile = (file?: MultipartAsset) =>
  file ? { originalName: file.originalname, contentType: file.mimetype, data: file.buffer } : undefined;

export class AssetRequestQueryDto extends EmployeeTimelineQueryDto {
  @IsOptional()
  @IsIn(["dashboard"])
  scope?: "dashboard";
}

/** Management routes cannot be used as alternate self-service entry points. */
@Controller("organization/hrms/asset-operations")
@UseGuards(TenantGuard, AccessGuard)
@RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" })
export class HrmsAssetOperationsController {
  constructor(
    private readonly operations: HrmsAssetOperationsService,
    private readonly evidence: HrmsAssetEvidenceService,
  ) {}
  @Post("replacement")
  @RequireAccess({ entitlement: "hrms.enabled" })
  replacement(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.operations.requestReplacement(org.organizationId, user.userId, input);
  }
  @Get("requests")
  @Header("Cache-Control", "no-store")
  @RequireAccess({ entitlement: "hrms.enabled" })
  requests(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AssetRequestQueryDto,
  ) {
    return this.operations.requests(
      org.organizationId,
      user.userId,
      query.page,
      query.pageSize,
      query.scope === "dashboard",
    );
  }
  @Post("requests/:id/decision")
  @RequireAccess({ entitlement: "hrms.enabled" })
  decide(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.decideRequest(org.organizationId, user.userId, id, input);
  }
  @Get("maintenance")
  @Header("Cache-Control", "no-store")
  maintenance(@CurrentOrganization() org: OrganizationContext, @Query() query: EmployeeTimelineQueryDto) {
    return this.operations.maintenance(org.organizationId, query.page, query.pageSize);
  }
  @Post("maintenance")
  openMaintenance(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.operations.openMaintenance(org.organizationId, user.userId, input);
  }
  @Post("maintenance/:id/close")
  closeMaintenance(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.closeMaintenance(org.organizationId, user.userId, id, input);
  }
  @Get("assets/:id/accessories")
  @Header("Cache-Control", "no-store")
  accessories(@CurrentOrganization() org: OrganizationContext, @Param("id", ParseUUIDPipe) id: string) {
    return this.operations.accessories(org.organizationId, id);
  }
  @Post("assets/:id/accessories")
  addAccessory(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.addAccessory(org.organizationId, user.userId, id, input);
  }
  @Post("accessories/:id/return")
  returnAccessory(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.returnAccessory(org.organizationId, user.userId, id, input);
  }
  @Post("clearance/:id/skip")
  @RequireAccess({ entitlement: "hrms.enabled" })
  skipClearance(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.overrideClearance(org.organizationId, user.userId, id, input);
  }
  @Get("stock")
  @Header("Cache-Control", "no-store")
  stock(@CurrentOrganization() org: OrganizationContext) {
    return this.operations.stockChecks(org.organizationId);
  }
  @Post("stock")
  startStock(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.operations.createStockCheck(org.organizationId, user.userId, input);
  }
  @Get("stock/:id")
  @Header("Cache-Control", "no-store")
  stockItems(
    @CurrentOrganization() org: OrganizationContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() query: EmployeeTimelineQueryDto,
  ) {
    return this.operations.stockItems(org.organizationId, id, query.page, query.pageSize);
  }
  @Post("stock/items/:id/observe")
  observeStock(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.observeStock(org.organizationId, user.userId, id, input);
  }
  @Post("stock/items/:id/resolve")
  resolveStock(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.observeStock(org.organizationId, user.userId, id, input, true);
  }
  @Post("stock/:id/complete")
  completeStock(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.completeStock(
      org.organizationId,
      user.userId,
      id,
      assetInput(hrmsAssetRevisionSchema, input).revision,
    );
  }
  @Get("procurement")
  @Header("Cache-Control", "no-store")
  procurement(@CurrentOrganization() org: OrganizationContext, @Query() query: EmployeeTimelineQueryDto) {
    return this.operations.procurement(org.organizationId, query.page, query.pageSize);
  }
  @Post("procurement")
  createProcurement(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.operations.createProcurement(org.organizationId, user.userId, input);
  }
  @Post("procurement/:id/decision")
  decideProcurement(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.operations.decideProcurement(org.organizationId, user.userId, id, input);
  }
  @Get("depreciation")
  @Header("Cache-Control", "no-store")
  depreciation(@CurrentOrganization() org: OrganizationContext) {
    return this.operations.depreciation(org.organizationId);
  }
  @Post("depreciation")
  configureDepreciation(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.operations.configureDepreciation(org.organizationId, user.userId, input);
  }
  @Get("accounting")
  @Header("Cache-Control", "no-store")
  accounting(@CurrentOrganization() org: OrganizationContext, @Query("asOf") asOf: string) {
    const date = assetInput(
      z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/)
        .refine((value) => {
          const date = new Date(`${value}T00:00:00Z`);
          return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
        }, "Use a valid YYYY-MM-DD date."),
      asOf,
    );
    return this.operations.accounting(org.organizationId, date);
  }
  @Get("assets/:id/attachments")
  @Header("Cache-Control", "no-store")
  attachments(@CurrentOrganization() org: OrganizationContext, @Param("id", ParseUUIDPipe) id: string) {
    return this.evidence.attachments(org.organizationId, id);
  }
  @Post("assets/:id/attachments")
  @UseInterceptors(upload)
  uploadAttachment(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
    @UploadedFile() file?: MultipartAsset,
  ) {
    return this.evidence.upload(org.organizationId, user.userId, id, input, asFile(file));
  }
  @Get("attachments/:id/download")
  @Header("Cache-Control", "no-store")
  downloadAttachment(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.evidence.download(org.organizationId, user.userId, id);
  }
  @Post("attachments/:id/archive")
  archiveAttachment(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.evidence.archive(org.organizationId, user.userId, id);
  }
  @Get("import/template")
  template() {
    return this.evidence.template();
  }
  @Post("import/preview")
  @UseInterceptors(upload)
  preview(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file?: MultipartAsset,
  ) {
    return this.evidence.preview(org.organizationId, user.userId, asFile(file));
  }
  @Post("import/:id/apply")
  apply(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.evidence.apply(org.organizationId, user.userId, id);
  }
}
