import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { RequireAccess } from "../../common/decorators/access.decorator";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { FlowService } from "./flow.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import { CreateIssueDto, ListIssuesQueryDto, MoveIssueDto, UpdateIssueDto } from "./dto/issue.dto";
import { CreateSprintDto, UpdateSprintDto } from "./dto/sprint.dto";
import { CreateColumnDto, UpdateColumnDto } from "./dto/board.dto";

@ApiTags("flow")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/flow")
export class FlowController {
  constructor(private readonly flow: FlowService) {}

  // ---------------- Projects ----------------

  @Get("projects")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.read" })
  @ApiOperation({ summary: "List projects in the active organization" })
  async listProjects(@CurrentOrganization() organization: OrganizationContext) {
    return this.flow.listProjects(organization.organizationId);
  }

  @Post("projects")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.create" })
  @ApiOperation({ summary: "Create a project (unique key, e.g. PAY)" })
  async createProject(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateProjectDto,
  ) {
    return this.flow.createProject(organization.organizationId, user.userId, dto);
  }

  @Get("projects/:projectId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.read" })
  @ApiOperation({ summary: "Get a project" })
  async getProject(@CurrentOrganization() organization: OrganizationContext, @Param("projectId") projectId: string) {
    return this.flow.getProject(organization.organizationId, projectId);
  }

  @Patch("projects/:projectId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.update" })
  @ApiOperation({ summary: "Update a project (name, description, lead)" })
  async updateProject(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.flow.updateProject(organization.organizationId, projectId, user.userId, dto);
  }

  // ---------------- Issues ----------------

  @Get("projects/:projectId/issues")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.issue.read" })
  @ApiOperation({ summary: "List issues with status/priority/assignee/sprint filters" })
  async listIssues(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
    @Query() query: ListIssuesQueryDto,
  ) {
    return this.flow.listIssues(organization.organizationId, projectId, query);
  }

  @Post("projects/:projectId/issues")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.issue.create" })
  @ApiOperation({ summary: "Create an issue; number is auto-incremented per project" })
  async createIssue(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
    @Body() dto: CreateIssueDto,
  ) {
    return this.flow.createIssue(organization.organizationId, projectId, user.userId, dto);
  }

  @Get("issues/:issueId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.issue.read" })
  @ApiOperation({ summary: "Get an issue" })
  async getIssue(@CurrentOrganization() organization: OrganizationContext, @Param("issueId") issueId: string) {
    return this.flow.getIssue(organization.organizationId, issueId);
  }

  @Patch("issues/:issueId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.issue.update" })
  @ApiOperation({ summary: "Update an issue (status, priority, assignee, sprint, estimate, due date)" })
  async updateIssue(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("issueId") issueId: string,
    @Body() dto: UpdateIssueDto,
  ) {
    return this.flow.updateIssue(organization.organizationId, issueId, user.userId, dto);
  }

  @Post("issues/:issueId/move")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.issue.transition" })
  @ApiOperation({ summary: "Move an issue to a status column (board drag-and-drop)" })
  async moveIssue(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("issueId") issueId: string,
    @Body() dto: MoveIssueDto,
  ) {
    return this.flow.moveIssue(organization.organizationId, issueId, user.userId, dto);
  }

  @Delete("issues/:issueId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.issue.delete" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete an issue" })
  async deleteIssue(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("issueId") issueId: string,
  ): Promise<void> {
    return this.flow.deleteIssue(organization.organizationId, issueId, user.userId);
  }

  // ---------------- Board ----------------

  @Get("projects/:projectId/board")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.read" })
  @ApiOperation({ summary: "Get the kanban board grouped by status" })
  async getBoard(@CurrentOrganization() organization: OrganizationContext, @Param("projectId") projectId: string) {
    return this.flow.getBoard(organization.organizationId, projectId);
  }

  // ---------------- Sprints ----------------

  @Get("projects/:projectId/sprints")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.read" })
  @ApiOperation({ summary: "List sprints in a project" })
  async listSprints(@CurrentOrganization() organization: OrganizationContext, @Param("projectId") projectId: string) {
    return this.flow.listSprints(organization.organizationId, projectId);
  }

  @Post("projects/:projectId/sprints")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.update" })
  @ApiOperation({ summary: "Create a sprint" })
  async createSprint(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
    @Body() dto: CreateSprintDto,
  ) {
    return this.flow.createSprint(organization.organizationId, projectId, user.userId, dto);
  }

  @Patch("projects/:projectId/sprints/:sprintId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.update" })
  @ApiOperation({ summary: "Update a sprint; activating it deactivates other sprints in the project" })
  async updateSprint(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
    @Param("sprintId") sprintId: string,
    @Body() dto: UpdateSprintDto,
  ) {
    return this.flow.updateSprint(organization.organizationId, projectId, sprintId, user.userId, dto);
  }

  // ---------------- Board columns ----------------

  @Get("boards/:boardId/columns")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.read" })
  @ApiOperation({ summary: "List board columns in order" })
  async listColumns(@CurrentOrganization() organization: OrganizationContext, @Param("boardId") boardId: string) {
    return this.flow.listColumns(organization.organizationId, boardId);
  }

  @Post("boards/:boardId/columns")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.update" })
  @ApiOperation({ summary: "Add a column to a board" })
  async createColumn(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("boardId") boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.flow.createColumn(organization.organizationId, boardId, user.userId, dto);
  }

  @Patch("boards/:boardId/columns/:columnId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.update" })
  @ApiOperation({ summary: "Update a board column (name, order, WIP limit)" })
  async updateColumn(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("boardId") boardId: string,
    @Param("columnId") columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.flow.updateColumn(organization.organizationId, boardId, columnId, user.userId, dto);
  }

  @Delete("boards/:boardId/columns/:columnId")
  @RequireAccess({ entitlement: "flow.enabled", permission: "flow.project.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a board column" })
  async deleteColumn(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("boardId") boardId: string,
    @Param("columnId") columnId: string,
  ): Promise<void> {
    return this.flow.deleteColumn(organization.organizationId, boardId, columnId, user.userId);
  }
}
