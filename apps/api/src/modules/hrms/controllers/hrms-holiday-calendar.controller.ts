import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsHolidayCalendarDto, UpdateHrmsHolidayCalendarDto } from "../dto/hrms-holiday-calendar.dto";
import { HrmsHolidayCalendarService } from "../services/hrms-holiday-calendar.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/holiday-calendars")
export class HrmsHolidayCalendarController {
  constructor(private readonly calendars: HrmsHolidayCalendarService) {}

  @Get()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.holiday.read" })
  list(@CurrentOrganization() organization: OrganizationContext) {
    return this.calendars.list(organization.organizationId);
  }

  @Post()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.holiday.manage" })
  create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsHolidayCalendarDto,
  ) {
    return this.calendars.create(organization.organizationId, user.userId, dto);
  }

  @Patch(":calendarId")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.holiday.manage" })
  update(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("calendarId") calendarId: string,
    @Body() dto: UpdateHrmsHolidayCalendarDto,
  ) {
    return this.calendars.update(organization.organizationId, calendarId, user.userId, dto);
  }

  @Delete(":calendarId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.holiday.manage" })
  remove(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("calendarId") calendarId: string,
  ): Promise<void> {
    return this.calendars.remove(organization.organizationId, calendarId, user.userId);
  }
}
