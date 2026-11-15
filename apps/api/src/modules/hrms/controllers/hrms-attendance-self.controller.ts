import { Body, Controller, Get, Header, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AttendanceRegularizationStatus } from "@prisma/client";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  ClockInDto,
  AttendancePunchDto,
  CreateAttendanceRegularizationDto,
  DecideAttendanceRegularizationDto,
} from "../dto/hrms-attendance.dto";
import { HrmsAttendanceClockService } from "../services/hrms-attendance-clock.service";
import { HrmsAttendanceRegularizationService } from "../services/hrms-attendance-regularization.service";

const selfService = { entitlement: "hrms.enabled" } as const;
const manage = { entitlement: "hrms.enabled", permission: "hrms.attendance.manage" } as const;

/**
 * Employee self-service attendance (clock, breaks, own records, regularization requests) is open to every member
 * with an active employee record; listing and deciding regularizations requires hrms.attendance.manage.
 */
@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/attendance")
export class HrmsAttendanceSelfController {
  constructor(
    private readonly clock: HrmsAttendanceClockService,
    private readonly regularizations: HrmsAttendanceRegularizationService,
  ) {}

  @Get("me/today")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  today(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Query("date") date: string) {
    return this.clock.today(org.organizationId, user.userId, date);
  }

  @Get("me/records")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  records(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.clock.records(org.organizationId, user.userId, from, to);
  }

  @Post("me/clock-in")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  clockIn(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: ClockInDto) {
    return this.clock.clockIn(org.organizationId, user.userId, dto.date, dto.capture);
  }

  @Post("me/clock-out")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  clockOut(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: AttendancePunchDto) {
    return this.clock.clockOut(org.organizationId, user.userId, dto.capture);
  }

  @Post("me/break/start")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  startBreak(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.clock.startBreak(org.organizationId, user.userId);
  }

  @Post("me/break/end")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  endBreak(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.clock.endBreak(org.organizationId, user.userId);
  }

  @Get("me/regularizations")
  @Header("Cache-Control", "no-store")
  @RequireAccess(selfService)
  myRegularizations(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.regularizations.listMine(org.organizationId, user.userId);
  }

  @Post("me/regularizations")
  @RequireAccess(selfService)
  createRegularization(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendanceRegularizationDto,
  ) {
    return this.regularizations.create(org.organizationId, user.userId, dto);
  }

  @Get("regularizations")
  @Header("Cache-Control", "no-store")
  @RequireAccess(manage)
  listRegularizations(
    @CurrentOrganization() org: OrganizationContext,
    @Query("status") status?: AttendanceRegularizationStatus,
  ) {
    return this.regularizations.listAll(org.organizationId, status);
  }

  @Patch("regularizations/:regularizationId")
  @RequireAccess(manage)
  decide(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("regularizationId") regularizationId: string,
    @Body() dto: DecideAttendanceRegularizationDto,
  ) {
    return this.regularizations.decide(org.organizationId, regularizationId, user.userId, dto.status, dto.decisionNote);
  }
}
