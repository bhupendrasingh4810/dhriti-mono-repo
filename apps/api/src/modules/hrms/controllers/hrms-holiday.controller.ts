import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { HolidayListQueryDto, ImportHrmsHolidaysDto, SendHrmsHolidayListDto, UpsertHrmsHolidayDto } from "../dto/hrms-holiday.dto";
import { HrmsHolidayService } from "../services/hrms-holiday.service";

const read = { entitlement: "hrms.enabled", permission: "hrms.holiday.read" } as const;
const manage = { entitlement: "hrms.enabled", permission: "hrms.holiday.manage" } as const;

/** Static routes are declared before ":holidayId" so they are never captured by it. */
@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/holidays")
export class HrmsHolidayController {
  constructor(private readonly holidays: HrmsHolidayService) {}

  @Get()
  @RequireAccess(read)
  list(@CurrentOrganization() org: OrganizationContext, @Query() query: HolidayListQueryDto) {
    return this.holidays.list(org.organizationId, query.year);
  }

  /** Any organization member may read the upcoming holidays that apply to them (Home widget, Pulse reminder). */
  @Get("upcoming")
  upcoming(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.holidays.upcomingForUser(org.organizationId, user.userId);
  }

  @Get("broadcasts")
  @RequireAccess(read)
  broadcasts(@CurrentOrganization() org: OrganizationContext, @Query() query: HolidayListQueryDto) {
    return this.holidays.listBroadcasts(org.organizationId, query.year);
  }

  @Post("send/preview")
  @HttpCode(HttpStatus.OK)
  @RequireAccess(manage)
  preview(@CurrentOrganization() org: OrganizationContext, @Body() dto: SendHrmsHolidayListDto) {
    return this.holidays.preview(org.organizationId, dto);
  }

  @Post("send")
  @RequireAccess(manage)
  send(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: SendHrmsHolidayListDto) {
    return this.holidays.send(org.organizationId, user.userId, dto);
  }

  @Post("import")
  @RequireAccess(manage)
  importHolidays(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: ImportHrmsHolidaysDto) {
    return this.holidays.importHolidays(org.organizationId, user.userId, dto);
  }

  @Put()
  @RequireAccess(manage)
  upsert(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertHrmsHolidayDto) {
    return this.holidays.upsert(org.organizationId, user.userId, dto);
  }

  @Delete(":holidayId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAccess(manage)
  remove(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("holidayId") holidayId: string) {
    return this.holidays.remove(org.organizationId, holidayId, user.userId);
  }
}
