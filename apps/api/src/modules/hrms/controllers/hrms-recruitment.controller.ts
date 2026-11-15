import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from "class-validator";
import { Type } from "class-transformer";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { HrmsRecruitmentService } from "../services/hrms-recruitment.service";
import { HrmsRecruitmentCandidateService } from "../services/hrms-recruitment-candidate.service";

class RecruitmentQuery {
  @IsOptional() @IsString() @MaxLength(120) query?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(10000) page?: number;
  @IsOptional() @IsUUID() openingId?: string;
  @IsOptional() @IsIn(["active", "closed"]) scope?: "active" | "closed";
  @IsOptional() @IsIn(["true", "false"]) includeClosed?: "true" | "false";
}

@Controller("organization/hrms/recruitment")
@UseGuards(TenantGuard, AccessGuard)
@RequireAccess({ entitlement: "hrms.enabled" })
export class HrmsRecruitmentController {
  constructor(
    private readonly recruitment: HrmsRecruitmentService,
    private readonly candidates: HrmsRecruitmentCandidateService,
  ) {}

  @Get("stages")
  @Header("Cache-Control", "no-store")
  stages(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.candidates.stages(org.organizationId, user.userId);
  }
  @Post("stages")
  addStage(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.candidates.addStage(org.organizationId, user.userId, input);
  }
  @Patch("stages/order")
  reorderStages(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.candidates.reorderStages(org.organizationId, user.userId, input);
  }
  @Patch("stages/:id")
  renameStage(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.renameStage(org.organizationId, user.userId, id, input);
  }
  @Delete("stages/:id")
  deleteStage(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.candidates.deleteStage(org.organizationId, user.userId, id);
  }
  @Get("board")
  @Header("Cache-Control", "no-store")
  board(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecruitmentQuery,
  ) {
    return this.candidates.board(org.organizationId, user.userId, query.openingId, query.includeClosed === "true");
  }
  @Get("candidates")
  @Header("Cache-Control", "no-store")
  listCandidates(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecruitmentQuery,
  ) {
    return this.candidates.list(org.organizationId, user.userId, query.page ?? 1, query.openingId, query.scope);
  }
  @Post("candidates")
  createCandidate(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.candidates.create(org.organizationId, user.userId, input);
  }
  @Get("candidates/:id")
  @Header("Cache-Control", "no-store")
  candidate(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.candidates.details(org.organizationId, user.userId, id);
  }
  @Patch("candidates/:id/stage")
  move(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.move(org.organizationId, user.userId, id, input);
  }
  @Patch("candidates/:id/assignment")
  assign(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.assign(org.organizationId, user.userId, id, input);
  }
  @Patch("candidates/:id/interviewer")
  assignInterviewer(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.assignInterviewer(org.organizationId, user.userId, id, input);
  }
  @Get("interviews/:id")
  @Header("Cache-Control", "no-store")
  interview(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.candidates.interviewDetails(org.organizationId, user.userId, id);
  }
  @Post("interviews/:id/feedback")
  interviewFeedback(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.submitInterviewFeedback(org.organizationId, user.userId, id, input);
  }
  @Patch("candidates/:id/outcome")
  outcome(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.close(org.organizationId, user.userId, id, input);
  }
  @Patch("candidates/:id/rejection")
  reject(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.reject(org.organizationId, user.userId, id, input);
  }
  @Post("candidates/:id/comments")
  comment(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.candidates.comment(org.organizationId, user.userId, id, input);
  }

  @Get("access")
  @Header("Cache-Control", "no-store")
  access(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitment.access(org.organizationId, user.userId);
  }
  @Get("members")
  @Header("Cache-Control", "no-store")
  members(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecruitmentQuery,
  ) {
    return this.recruitment.members(org.organizationId, user.userId, query.query ?? "", query.page ?? 1);
  }
  @Get("grants")
  @Header("Cache-Control", "no-store")
  grants(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitment.grants(org.organizationId, user.userId);
  }
  @Get("assignees")
  @Header("Cache-Control", "no-store")
  assignees(@CurrentOrganization() org: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.recruitment.assignees(org.organizationId, user.userId);
  }
  @Get("interviewers")
  @Header("Cache-Control", "no-store")
  interviewers(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecruitmentQuery,
  ) {
    return this.recruitment.interviewers(org.organizationId, user.userId, query.query ?? "", query.page ?? 1);
  }
  @Post("grants")
  grant(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.recruitment.setGrant(org.organizationId, user.userId, input);
  }
  @Delete("grants/:userId")
  revoke(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("userId", ParseUUIDPipe) userId: string,
  ) {
    return this.recruitment.revokeGrant(org.organizationId, user.userId, userId);
  }
  @Get("openings")
  @Header("Cache-Control", "no-store")
  openings(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RecruitmentQuery,
  ) {
    return this.recruitment.openings(org.organizationId, user.userId, query.page ?? 1);
  }
  @Post("openings")
  create(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() input: unknown,
  ) {
    return this.recruitment.createOpening(org.organizationId, user.userId, input);
  }
  @Patch("openings/:id/status")
  status(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: unknown,
  ) {
    return this.recruitment.changeStatus(org.organizationId, user.userId, id, input);
  }
}
