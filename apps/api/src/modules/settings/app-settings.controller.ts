import { Body, Controller, Get, HttpStatus, Param, Patch, UseGuards } from "@nestjs/common";
import { ModuleRef } from "@nestjs/core";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../common/decorators/access.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { ConnectService } from "../connect/connect.service";
import { PermissionService } from "../authorization/services/permission.service";
import { AppSettingsService } from "./app-settings.service";
import {
  UpdateAtlasSettingsDto,
  UpdateCadenceSettingsDto,
  UpdateConnectSettingsDto,
  UpdateConnectUserSettingsDto,
  UpdateFlowSettingsDto,
  UpdateHrmsSettingsDto,
  UpdateNexusSettingsDto,
  UpdateNotesSettingsDto,
  UpdatePulseSettingsDto,
} from "./dto/app-settings.dto";

const MANAGE_SETTINGS = { permission: "organization.settings.manage" };

@ApiTags("settings")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/settings/apps")
export class AppSettingsController {
  constructor(
    private readonly settings: AppSettingsService,
    private readonly moduleRef: ModuleRef,
    private readonly permissions: PermissionService,
  ) {}

  @Get("access")
  @ApiOperation({ summary: "Get the current member's settings capabilities" })
  async access(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return {
      canManage: await this.permissions.hasPermission({
        userId: user.userId,
        organizationId: organization.organizationId,
        permissionKey: MANAGE_SETTINGS.permission,
      }),
    };
  }

  // Personal routes are declared before `:app` so "connect/me" is not captured by it.
  @Get("connect/me")
  @ApiOperation({ summary: "Get the current user's Connect preferences" })
  getConnectUser(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.settings.getConnectUser(organization.organizationId, user.userId);
  }

  @Patch("connect/me")
  @ApiOperation({ summary: "Update the current user's Connect preferences" })
  async updateConnectUser(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpdateConnectUserSettingsDto,
  ) {
    const updated = await this.settings.updateConnectUser(organization.organizationId, user.userId, dto);
    if (dto.manualStatus !== undefined || dto.manualStatusExpiresAt !== undefined) {
      // Resolved lazily: ConnectModule depends on this global module, so a static import would be circular.
      const connect = this.moduleRef.get(ConnectService, { strict: false });
      await connect.applyPresencePreference(organization.organizationId, user.userId);
    }
    return updated;
  }

  @Get(":app")
  @ApiOperation({ summary: "Get an app's organization settings (readable by every member)" })
  get(@CurrentOrganization() organization: OrganizationContext, @Param("app") app: string) {
    if (!this.settings.isAppKey(app)) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, `Unknown app "${app}"`, HttpStatus.NOT_FOUND);
    }
    return this.settings.get(app, organization.organizationId);
  }

  @Patch("connect")
  @RequireAccess(MANAGE_SETTINGS)
  updateConnect(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateConnectSettingsDto,
  ) {
    return this.settings.update("connect", org.organizationId, user.userId, dto);
  }

  @Patch("flow")
  @RequireAccess(MANAGE_SETTINGS)
  updateFlow(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateFlowSettingsDto,
  ) {
    return this.settings.update("flow", org.organizationId, user.userId, dto);
  }

  @Patch("atlas")
  @RequireAccess(MANAGE_SETTINGS)
  updateAtlas(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateAtlasSettingsDto,
  ) {
    return this.settings.update("atlas", org.organizationId, user.userId, dto);
  }

  @Patch("nexus")
  @RequireAccess(MANAGE_SETTINGS)
  updateNexus(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateNexusSettingsDto,
  ) {
    return this.settings.update("nexus", org.organizationId, user.userId, dto);
  }

  @Patch("cadence")
  @RequireAccess(MANAGE_SETTINGS)
  updateCadence(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateCadenceSettingsDto,
  ) {
    return this.settings.update("cadence", org.organizationId, user.userId, dto);
  }

  @Patch("pulse")
  @RequireAccess(MANAGE_SETTINGS)
  updatePulse(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdatePulseSettingsDto,
  ) {
    return this.settings.update("pulse", org.organizationId, user.userId, dto);
  }

  @Patch("notes")
  @RequireAccess(MANAGE_SETTINGS)
  updateNotes(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateNotesSettingsDto,
  ) {
    return this.settings.update("notes", org.organizationId, user.userId, dto);
  }

  @Patch("hrms")
  @RequireAccess(MANAGE_SETTINGS)
  updateHrms(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() org: OrganizationContext,
    @Body() dto: UpdateHrmsSettingsDto,
  ) {
    return this.settings.update("hrms", org.organizationId, user.userId, dto);
  }
}
