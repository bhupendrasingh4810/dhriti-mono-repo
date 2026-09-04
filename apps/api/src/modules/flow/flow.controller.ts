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

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import {
  CurrentOrganization,
  type OrganizationContext,
} from "../../common/decorators/organization.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { FlowService } from "./flow.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import {
  CreateIssueDto,
  ListIssuesQueryDto,
  MoveIssueDto,
  UpdateIssueDto,
} from "./dto/issue.dto";
import { CreateSprintDto, UpdateSprintDto } from "./dto/sprint.dto";
import { CreateColumnDto, UpdateColumnDto } from "./dto/board.dto";

@ApiTags("flow")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/flow")
export class FlowController {
  constructor(private readonly flow: FlowService) {}

  // ---------------- Projects ----------------

  @Get("projects")
  @ApiOperation({ summary: "List projects in the active organization" })
  async listProjects(@CurrentOrganization() organization: OrganizationContext) {
    return this.flow.listProjects(organization.organizationId);
  }

  @Post("projects")
  @ApiOperation({ summary: "Create a project (unique key, e.g. PAY)" })
  async createProject(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateProjectDto,
  ) {
    return this.flow.createProject(organization.organizationId, user.userId, dto);
  }

  @Get("projects/:projectId")
  @ApiOperation({ summary: "Get a project" })
  async getProject(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
  ) {
    return this.flow.getProject(organization.organizationId, projectId);
  }

  @Patch("projects/:projectId")
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
  @ApiOperation({ summary: "List issues with status/priority/assignee/sprint filters" })
  async listIssues(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
    @Query() query: ListIssuesQueryDto,
  ) {
    return this.flow.listIssues(organization.organizationId, projectId, query);
  }

  @Post("projects/:projectId/issues")
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
  @ApiOperation({ summary: "Get an issue" })
  async getIssue(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("issueId") issueId: string,
  ) {
    return this.flow.getIssue(organization.organizationId, issueId);
  }

  @Patch("issues/:issueId")
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
  @ApiOperation({ summary: "Get the kanban board grouped by status" })
  async getBoard(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
  ) {
    return this.flow.getBoard(organization.organizationId, projectId);
  }

  // ---------------- Sprints ----------------

  @Get("projects/:projectId/sprints")
  @ApiOperation({ summary: "List sprints in a project" })
  async listSprints(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("projectId") projectId: string,
  ) {
    return this.flow.listSprints(organization.organizationId, projectId);
  }

  @Post("projects/:projectId/sprints")
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
  @ApiOperation({ summary: "List board columns in order" })
  async listColumns(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("boardId") boardId: string,
  ) {
    return this.flow.listColumns(organization.organizationId, boardId);
  }

  @Post("boards/:boardId/columns")
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
