import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../../common/decorators/current-user.decorator";
import {
  CurrentOrganization,
  type OrganizationContext,
} from "../../../common/decorators/organization.decorator";
import { OrgRoles } from "../../../common/decorators/org-roles.decorator";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { OrgRolesGuard } from "../../../common/guards/org-roles.guard";

import { OrganizationAdminService, type OrgDashboard } from "./organization.service";
import {
  UpdateOrgEntitlementDto,
  UpdateOrgSettingsDto,
  UpsertOrgFeatureFlagDto,
} from "./dto/organization.dto";

@ApiTags("control/organization")
@ApiBearerAuth()
@UseGuards(TenantGuard, OrgRolesGuard)
@OrgRoles("OWNER", "ADMIN")
@Controller("control/organization")
export class OrganizationAdminController {
  constructor(private readonly admin: OrganizationAdminService) {}

  @Get("dashboard")
  @ApiOperation({ summary: "Org dashboard: members, teams, products, storage, activity counts" })
  async dashboard(@CurrentOrganization() organization: OrganizationContext): Promise<OrgDashboard> {
    return this.admin.dashboard(organization.organizationId);
  }

  // ---------------- Settings ----------------

  @Get("settings")
  @ApiOperation({ summary: "Get organization settings" })
  async getSettings(@CurrentOrganization() organization: OrganizationContext) {
    return this.admin.getSettings(organization.organizationId);
  }

  @Patch("settings")
  @ApiOperation({ summary: "Update org profile/branding/security/retention settings" })
  async updateSettings(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpdateOrgSettingsDto,
  ) {
    return this.admin.updateSettings(organization.organizationId, user.userId, dto);
  }

  // ---------------- Application access (entitlements) ----------------

  @Get("entitlements")
  @ApiOperation({ summary: "List which products are enabled for the org" })
  async listEntitlements(@CurrentOrganization() organization: OrganizationContext) {
    return this.admin.listEntitlements(organization.organizationId);
  }

  @Post("entitlements")
  @ApiOperation({ summary: "Enable or disable a product for the org" })
  async setEntitlement(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpdateOrgEntitlementDto,
  ) {
    return this.admin.setEntitlement(organization.organizationId, user.userId, dto);
  }

  // ---------------- Feature flags ----------------

  @Get("feature-flags")
  @ApiOperation({ summary: "List org feature flags" })
  async listFeatureFlags(@CurrentOrganization() organization: OrganizationContext) {
    return this.admin.listFeatureFlags(organization.organizationId);
  }

  @Post("feature-flags")
  @ApiOperation({ summary: "Upsert a feature flag for the org" })
  async upsertFeatureFlag(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpsertOrgFeatureFlagDto,
  ) {
    return this.admin.upsertFeatureFlag(organization.organizationId, user.userId, dto);
  }

  // ---------------- Subscription ----------------

  @Get("subscription")
  @ApiOperation({ summary: "View the org's subscription (plan, seats, status)" })
  async getSubscription(@CurrentOrganization() organization: OrganizationContext) {
    return this.admin.getSubscription(organization.organizationId);
  }

  // ---------------- Audit export ----------------

  @Get("audit-logs/export")
  @ApiOperation({ summary: "Export org audit logs as CSV" })
  async exportAuditLogs(
    @CurrentOrganization() organization: OrganizationContext,
    @Res() response: Response,
  ): Promise<void> {
    const csv = await this.admin.exportAuditLogs(organization.organizationId);
    response.setHeader("Content-Type", "text/csv");
    response.setHeader("Content-Disposition", 'attachment; filename="audit-logs.csv"');
    response.send(csv);
  }
}
