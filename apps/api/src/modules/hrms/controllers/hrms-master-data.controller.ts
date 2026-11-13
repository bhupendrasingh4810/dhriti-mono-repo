import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequirePermission } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  CreateHrmsDesignationDto,
  CreateHrmsEmploymentTypeDto,
  CreateHrmsLocationDto,
  CreateHrmsShiftDto,
  UpdateHrmsDesignationDto,
  UpdateHrmsEmploymentTypeDto,
  UpdateHrmsLocationDto,
  UpdateHrmsShiftDto,
} from "../dto/hrms-master-data.dto";
import { HrmsMasterDataService } from "../services/hrms-master-data.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms")
export class HrmsMasterDataController {
  constructor(private readonly masterData: HrmsMasterDataService) {}

  @Get("locations")
  @RequirePermission("organization.members.read")
  listLocations(@CurrentOrganization() organization: OrganizationContext) {
    return this.masterData.listLocations(organization.organizationId);
  }

  @Post("locations")
  @RequirePermission("organization.permissions.manage")
  createLocation(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsLocationDto,
  ) {
    return this.masterData.createLocation(organization.organizationId, user.userId, dto);
  }

  @Patch("locations/:locationId")
  @RequirePermission("organization.permissions.manage")
  updateLocation(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("locationId") locationId: string,
    @Body() dto: UpdateHrmsLocationDto,
  ) {
    return this.masterData.updateLocation(organization.organizationId, locationId, user.userId, dto);
  }

  @Delete("locations/:locationId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  removeLocation(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("locationId") locationId: string,
  ): Promise<void> {
    return this.masterData.removeLocation(organization.organizationId, locationId, user.userId);
  }

  @Get("designations")
  @RequirePermission("organization.members.read")
  listDesignations(@CurrentOrganization() organization: OrganizationContext) {
    return this.masterData.listDesignations(organization.organizationId);
  }

  @Post("designations")
  @RequirePermission("organization.permissions.manage")
  createDesignation(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsDesignationDto,
  ) {
    return this.masterData.createDesignation(organization.organizationId, user.userId, dto);
  }

  @Patch("designations/:designationId")
  @RequirePermission("organization.permissions.manage")
  updateDesignation(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("designationId") designationId: string,
    @Body() dto: UpdateHrmsDesignationDto,
  ) {
    return this.masterData.updateDesignation(organization.organizationId, designationId, user.userId, dto);
  }

  @Delete("designations/:designationId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  removeDesignation(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("designationId") designationId: string,
  ): Promise<void> {
    return this.masterData.removeDesignation(organization.organizationId, designationId, user.userId);
  }

  @Get("employment-types")
  @RequirePermission("organization.members.read")
  listEmploymentTypes(@CurrentOrganization() organization: OrganizationContext) {
    return this.masterData.listEmploymentTypes(organization.organizationId);
  }

  @Post("employment-types")
  @RequirePermission("organization.permissions.manage")
  createEmploymentType(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsEmploymentTypeDto,
  ) {
    return this.masterData.createEmploymentType(organization.organizationId, user.userId, dto);
  }

  @Patch("employment-types/:employmentTypeId")
  @RequirePermission("organization.permissions.manage")
  updateEmploymentType(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employmentTypeId") employmentTypeId: string,
    @Body() dto: UpdateHrmsEmploymentTypeDto,
  ) {
    return this.masterData.updateEmploymentType(organization.organizationId, employmentTypeId, user.userId, dto);
  }

  @Delete("employment-types/:employmentTypeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  removeEmploymentType(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employmentTypeId") employmentTypeId: string,
  ): Promise<void> {
    return this.masterData.removeEmploymentType(organization.organizationId, employmentTypeId, user.userId);
  }

  @Get("shifts")
  @RequirePermission("organization.members.read")
  listShifts(@CurrentOrganization() organization: OrganizationContext) {
    return this.masterData.listShifts(organization.organizationId);
  }

  @Post("shifts")
  @RequirePermission("organization.permissions.manage")
  createShift(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsShiftDto,
  ) {
    return this.masterData.createShift(organization.organizationId, user.userId, dto);
  }

  @Patch("shifts/:shiftId")
  @RequirePermission("organization.permissions.manage")
  updateShift(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("shiftId") shiftId: string,
    @Body() dto: UpdateHrmsShiftDto,
  ) {
    return this.masterData.updateShift(organization.organizationId, shiftId, user.userId, dto);
  }

  @Delete("shifts/:shiftId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  removeShift(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("shiftId") shiftId: string,
  ): Promise<void> {
    return this.masterData.removeShift(organization.organizationId, shiftId, user.userId);
  }
}
