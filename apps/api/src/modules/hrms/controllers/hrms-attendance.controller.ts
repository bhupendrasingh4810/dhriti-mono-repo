import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { UpsertHrmsAttendanceDto } from "../dto/hrms-attendance.dto";
import { HrmsAttendanceService } from "../services/hrms-attendance.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/employees/:employeeId/attendance")
export class HrmsAttendanceController {
  constructor(private readonly attendance: HrmsAttendanceService) {}

  @Get()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.attendance.read" })
  list(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("employeeId") employeeId: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.attendance.list(organization.organizationId, employeeId, from, to);
  }

  @Post()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.attendance.manage" })
  upsert(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employeeId") employeeId: string,
    @Body() dto: UpsertHrmsAttendanceDto,
  ) {
    return this.attendance.upsert(organization.organizationId, employeeId, user.userId, dto);
  }
}
