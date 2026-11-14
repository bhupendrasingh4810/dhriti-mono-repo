import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  ApplyHrmsCompOffDto,
  ApplyHrmsLeaveDto,
  DecideHrmsRequestDto,
  ReplyMoreInfoDto,
  RequestMoreInfoDto,
  TeamLeaveQueryDto,
  UpsertHrmsLeaveTypeDto,
} from "../dto/hrms-leave-center.dto";
import { HrmsLeaveCenterService } from "../services/hrms-leave-center.service";

const member = { entitlement: "hrms.enabled" } as const;
const manage = { entitlement: "hrms.enabled", permission: "hrms.leave.manage" } as const;
const approve = { entitlement: "hrms.enabled", permission: "hrms.leave.approve" } as const;
const read = { entitlement: "hrms.enabled", permission: "hrms.leave.read" } as const;

/**
 * Leave centre. Self-service routes ("me/*", "requests", "comp-off") need only HRMS access; review routes need
 * hrms.leave.approve; leave types and apply-on-behalf need hrms.leave.manage.
 */
@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/leave")
export class HrmsLeaveCenterController {
  constructor(private readonly leave: HrmsLeaveCenterService) {}

  @Get("types") @RequireAccess(member)
  types(@CurrentOrganization() org: OrganizationContext) {
    return this.leave.listTypes(org.organizationId);
  }

  @Put("types") @RequireAccess(manage)
  saveType(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: UpsertHrmsLeaveTypeDto) {
    return this.leave.upsertType(org.organizationId, user.userId, dto);
  }

  @Delete("types/:typeId") @RequireAccess(manage)
  removeType(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("typeId") typeId: string) {
    return this.leave.removeType(org.organizationId, user.userId, typeId);
  }

  @Get("me/balances") @RequireAccess(member)
  balances(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.leave.balances(org.organizationId, user.userId);
  }

  @Get("me/requests") @RequireAccess(member)
  myRequests(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.leave.listMine(org.organizationId, user.userId);
  }

  @Get("me/comp-off") @RequireAccess(member)
  myCompOff(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.leave.listMyCompOff(org.organizationId, user.userId);
  }

  @Get("team") @RequireAccess(member)
  team(@CurrentOrganization() org: OrganizationContext, @Query() query: TeamLeaveQueryDto) {
    return this.leave.teamLeave(org.organizationId, query.from, query.to);
  }

  @Get("requests") @RequireAccess(read)
  requests(@CurrentOrganization() org: OrganizationContext) {
    return this.leave.listAll(org.organizationId);
  }

  @Post("requests") @RequireAccess(member)
  apply(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyHrmsLeaveDto) {
    return this.leave.apply(org.organizationId, user.userId, dto, false);
  }

  @Post("requests/on-behalf") @RequireAccess(manage)
  applyOnBehalf(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyHrmsLeaveDto) {
    return this.leave.apply(org.organizationId, user.userId, dto, true);
  }

  @Post("requests/:id/cancel") @RequireAccess(member)
  cancel(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.leave.cancel(org.organizationId, user.userId, id);
  }

  @Post("requests/:id/reply") @RequireAccess(member)
  reply(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReplyMoreInfoDto) {
    return this.leave.replyLeaveInfo(org.organizationId, user.userId, id, dto.reply);
  }

  @Post("requests/:id/decision") @RequireAccess(approve)
  decide(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: DecideHrmsRequestDto) {
    return this.leave.decideLeave(org.organizationId, user.userId, id, dto.status, dto.reason);
  }

  @Post("requests/:id/request-info") @RequireAccess(approve)
  requestInfo(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: RequestMoreInfoDto) {
    return this.leave.requestLeaveInfo(org.organizationId, user.userId, id, dto.note);
  }

  @Get("comp-off") @RequireAccess(read)
  compOff(@CurrentOrganization() org: OrganizationContext) {
    return this.leave.listAllCompOff(org.organizationId);
  }

  @Post("comp-off") @RequireAccess(member)
  applyCompOff(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyHrmsCompOffDto) {
    return this.leave.applyCompOff(org.organizationId, user.userId, dto, false);
  }

  @Post("comp-off/on-behalf") @RequireAccess(manage)
  applyCompOffOnBehalf(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyHrmsCompOffDto) {
    return this.leave.applyCompOff(org.organizationId, user.userId, dto, true);
  }

  @Post("comp-off/:id/cancel") @RequireAccess(member)
  cancelCompOff(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.leave.cancelCompOff(org.organizationId, user.userId, id);
  }

  @Post("comp-off/:id/reply") @RequireAccess(member)
  replyCompOff(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReplyMoreInfoDto) {
    return this.leave.replyCompOffInfo(org.organizationId, user.userId, id, dto.reply);
  }

  @Post("comp-off/:id/decision") @RequireAccess(approve)
  decideCompOff(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: DecideHrmsRequestDto) {
    return this.leave.decideCompOff(org.organizationId, user.userId, id, dto.status, dto.reason);
  }

  @Post("comp-off/:id/request-info") @RequireAccess(approve)
  requestCompOffInfo(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: RequestMoreInfoDto) {
    return this.leave.requestCompOffInfo(org.organizationId, user.userId, id, dto.note);
  }
}
