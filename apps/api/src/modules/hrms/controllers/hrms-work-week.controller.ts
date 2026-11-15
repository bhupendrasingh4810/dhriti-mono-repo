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
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { AccessGuard } from "../../../common/guards/access.guard";
import {
  AssignWorkWeekDto,
  CreateWorkWeekDto,
  DefaultWorkWeekDto,
  UpdateWorkWeekDto,
  WorkWeekEmployeeRangeDto,
  WorkWeekRangeDto,
} from "../dto/hrms-work-week.dto";
import { HrmsWorkWeekService } from "../services/hrms-work-week.service";

const member = { entitlement: "hrms.enabled" };
const manage = { entitlement: "hrms.enabled", permission: "organization.settings.manage" };

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/work-weeks")
export class HrmsWorkWeekController {
  constructor(private readonly weeks: HrmsWorkWeekService) {}

  @Get()
  @RequireAccess(manage)
  @Header("Cache-Control", "no-store")
  list(@CurrentOrganization() org: OrganizationContext) {
    return this.weeks.list(org.organizationId);
  }

  @Get("me/schedule")
  @RequireAccess(member)
  @Header("Cache-Control", "no-store")
  mine(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: WorkWeekRangeDto,
  ) {
    return this.weeks.mySchedule(org.organizationId, user.userId, query.from, query.to);
  }

  @Get("employee-schedule")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.leave.manage" })
  @Header("Cache-Control", "no-store")
  employeeSchedule(@CurrentOrganization() org: OrganizationContext, @Query() query: WorkWeekEmployeeRangeDto) {
    return this.weeks.schedule(org.organizationId, query.employeeId, query.from, query.to);
  }

  @Get("assignments/:employeeId")
  @RequireAccess(manage)
  @Header("Cache-Control", "no-store")
  assignments(@CurrentOrganization() org: OrganizationContext, @Param("employeeId", ParseUUIDPipe) employeeId: string) {
    return this.weeks.assignments(org.organizationId, employeeId);
  }

  @Post("assignments")
  @RequireAccess(manage)
  @HttpCode(HttpStatus.NO_CONTENT)
  assign(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: AssignWorkWeekDto,
  ) {
    return this.weeks.assign(org.organizationId, user.userId, input);
  }

  @Post()
  @RequireAccess(manage)
  create(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: CreateWorkWeekDto,
  ) {
    return this.weeks.create(org.organizationId, user.userId, input);
  }

  @Patch(":id")
  @RequireAccess(manage)
  @HttpCode(HttpStatus.NO_CONTENT)
  update(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: UpdateWorkWeekDto,
  ) {
    return this.weeks.update(org.organizationId, user.userId, id, input);
  }

  @Post(":id/default")
  @RequireAccess(manage)
  @HttpCode(HttpStatus.NO_CONTENT)
  default(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: DefaultWorkWeekDto,
  ) {
    return this.weeks.setDefault(org.organizationId, user.userId, id, input.effectiveFrom);
  }

  @Delete(":id")
  @RequireAccess(manage)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.weeks.remove(org.organizationId, user.userId, id);
  }
}
