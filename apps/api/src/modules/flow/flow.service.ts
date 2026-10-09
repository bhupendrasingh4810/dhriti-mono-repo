import { HttpStatus, Injectable } from "@nestjs/common";
import type { Issue, IssuePriority, IssueStatus, Project } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import { EntitlementService } from "../authorization/services/entitlement.service";
import type { CreateProjectDto, UpdateProjectDto } from "./dto/project.dto";
import type { CreateIssueDto, ListIssuesQueryDto, MoveIssueDto, UpdateIssueDto } from "./dto/issue.dto";
import type { CreateSprintDto, UpdateSprintDto } from "./dto/sprint.dto";
import type { CreateColumnDto, UpdateColumnDto } from "./dto/board.dto";

@Injectable()
export class FlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly entitlements: EntitlementService,
  ) {}

  // ---------------- Projects ----------------

  async listProjects(organizationId: string): Promise<Project[]> {
    return this.prisma.project.findMany({
      where: { organizationId, deletedAt: null, isArchived: false },
      orderBy: { createdAt: "asc" },
    });
  }

  async createProject(organizationId: string, userId: string, dto: CreateProjectDto): Promise<Project> {
    if (dto.teamId) {
      await this.assertTeamInOrganization(organizationId, dto.teamId);
    }
    if (dto.leadId) {
      await this.assertOrgMember(organizationId, dto.leadId);
    }
    const keyTaken = await this.prisma.project.findUnique({
      where: { organizationId_key: { organizationId, key: dto.key } },
      select: { id: true },
    });
    if (keyTaken) {
      throw new AppError(ErrorCode.PROJECT_KEY_TAKEN, "A project with this key already exists", HttpStatus.CONFLICT);
    }

    const limit = await this.entitlements.getLimit(organizationId, "max_projects");
    if (limit === null) {
      throw new AppError(
        ErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
        "Organization exceeded max_projects",
        HttpStatus.FORBIDDEN,
      );
    }
    const project = await this.createProjectWithinLimit(organizationId, dto, limit);

    await this.audit.record({
      action: "flow.project.created",
      organizationId,
      actorUserId: userId,
      resourceType: "Project",
      resourceId: project.id,
    });
    return project;
  }

  private async createProjectWithinLimit(
    organizationId: string,
    dto: CreateProjectDto,
    limit: number,
  ): Promise<Project> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await this.prisma.$transaction(
          async (transaction) => {
            const projectCount = await transaction.project.count({ where: { organizationId, deletedAt: null } });
            if (projectCount >= limit) {
              throw new AppError(
                ErrorCode.ENTITLEMENT_LIMIT_EXCEEDED,
                "Organization exceeded max_projects",
                HttpStatus.FORBIDDEN,
              );
            }
            return transaction.project.create({
              data: {
                organizationId,
                teamId: dto.teamId ?? null,
                key: dto.key,
                name: dto.name.trim(),
                description: dto.description ?? null,
                leadId: dto.leadId ?? null,
              },
            });
          },
          { isolationLevel: "Serializable" },
        );
      } catch (error) {
        if (!this.isSerializationFailure(error) || attempt === 2) {
          throw error;
        }
      }
    }
    throw new AppError(ErrorCode.INTERNAL_ERROR, "Project quota transaction failed", HttpStatus.SERVICE_UNAVAILABLE);
  }

  private isSerializationFailure(error: unknown): boolean {
    return typeof error === "object" && error !== null && "code" in error && error.code === "P2034";
  }

  async getProject(organizationId: string, projectId: string): Promise<Project> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId, deletedAt: null },
    });
    if (!project) {
      throw new AppError(ErrorCode.PROJECT_NOT_FOUND, "Project not found", HttpStatus.NOT_FOUND);
    }
    return project;
  }

  async updateProject(
    organizationId: string,
    projectId: string,
    userId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    await this.getProject(organizationId, projectId);
    if (dto.leadId) {
      await this.assertOrgMember(organizationId, dto.leadId);
    }
    const updated = await this.prisma.project.update({
      where: { id: projectId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.leadId !== undefined ? { leadId: dto.leadId } : {}),
      },
    });

    await this.audit.record({
      action: "flow.project.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "Project",
      resourceId: projectId,
    });
    return updated;
  }

  // ---------------- Issues ----------------

  async listIssues(organizationId: string, projectId: string, query: ListIssuesQueryDto): Promise<Issue[]> {
    await this.getProject(organizationId, projectId);
    return this.prisma.issue.findMany({
      where: {
        organizationId,
        projectId,
        deletedAt: null,
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        ...(query.sprintId ? { sprintId: query.sprintId } : {}),
      },
      orderBy: [{ position: "asc" }, { createdAt: "desc" }],
      take: Math.min(query.limit ?? 100, 200),
    });
  }

  async createIssue(
    organizationId: string,
    projectId: string,
    reporterId: string,
    dto: CreateIssueDto,
  ): Promise<Issue> {
    const project = await this.getProject(organizationId, projectId);

    if (dto.assigneeId) {
      await this.assertOrgMember(organizationId, dto.assigneeId);
    }
    if (dto.sprintId) {
      await this.assertSprintInProject(projectId, dto.sprintId);
    }

    const issue = await this.prisma.$transaction(async (tx) => {
      const next = await tx.project.update({
        where: { id: projectId },
        data: { issueCounter: { increment: 1 } },
        select: { issueCounter: true },
      });

      return tx.issue.create({
        data: {
          organizationId,
          projectId,
          number: next.issueCounter,
          title: dto.title.trim(),
          description: dto.description ?? null,
          status: dto.status ?? "BACKLOG",
          priority: dto.priority ?? "NONE",
          assigneeId: dto.assigneeId ?? null,
          reporterId,
          sprintId: dto.sprintId ?? null,
          estimate: dto.estimate ?? null,
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        },
      });
    });

    await this.audit.record({
      action: "flow.issue.created",
      organizationId,
      actorUserId: reporterId,
      resourceType: "Issue",
      resourceId: issue.id,
      metadata: { key: `${project.key}-${issue.number}` },
    });
    return issue;
  }

  async getIssue(organizationId: string, issueId: string): Promise<Issue> {
    const issue = await this.prisma.issue.findFirst({
      where: { id: issueId, organizationId, deletedAt: null },
    });
    if (!issue) {
      throw new AppError(ErrorCode.ISSUE_NOT_FOUND, "Issue not found", HttpStatus.NOT_FOUND);
    }
    return issue;
  }

  async updateIssue(organizationId: string, issueId: string, userId: string, dto: UpdateIssueDto): Promise<Issue> {
    const existing = await this.getIssue(organizationId, issueId);

    if (dto.assigneeId) {
      await this.assertOrgMember(organizationId, dto.assigneeId);
    }
    if (dto.sprintId) {
      await this.assertSprintInProject(existing.projectId, dto.sprintId);
    }

    const updated = await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
        ...(dto.sprintId !== undefined ? { sprintId: dto.sprintId } : {}),
        ...(dto.estimate !== undefined ? { estimate: dto.estimate } : {}),
        ...(dto.dueDate !== undefined ? { dueDate: dto.dueDate === null ? null : new Date(dto.dueDate) } : {}),
      },
    });

    await this.audit.record({
      action: "flow.issue.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "Issue",
      resourceId: issueId,
      metadata: { status: updated.status, priority: updated.priority },
    });
    return updated;
  }

  async moveIssue(organizationId: string, issueId: string, userId: string, dto: MoveIssueDto): Promise<Issue> {
    await this.getIssue(organizationId, issueId);
    const updated = await this.prisma.issue.update({
      where: { id: issueId },
      data: {
        status: dto.status,
        ...(dto.position !== undefined ? { position: dto.position } : {}),
      },
    });

    await this.audit.record({
      action: "flow.issue.moved",
      organizationId,
      actorUserId: userId,
      resourceType: "Issue",
      resourceId: issueId,
      metadata: { status: dto.status },
    });
    return updated;
  }

  async deleteIssue(organizationId: string, issueId: string, userId: string): Promise<void> {
    await this.getIssue(organizationId, issueId);
    await this.prisma.issue.update({
      where: { id: issueId },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      action: "flow.issue.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "Issue",
      resourceId: issueId,
    });
  }

  // ---------------- Board ----------------

  async getBoard(organizationId: string, projectId: string) {
    await this.getProject(organizationId, projectId);
    const issues = await this.prisma.issue.findMany({
      where: { organizationId, projectId, deletedAt: null },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    });

    const columns: Array<{ status: IssueStatus; name: string; issues: Issue[] }> = [
      "BACKLOG",
      "TODO",
      "IN_PROGRESS",
      "IN_REVIEW",
      "DONE",
      "CANCELLED",
    ].map((status) => ({
      status: status as IssueStatus,
      name: status.replace(/_/g, " "),
      issues: issues.filter((issue) => issue.status === status),
    }));

    return { projectId, columns };
  }

  // ---------------- Sprints ----------------

  async listSprints(organizationId: string, projectId: string) {
    await this.getProject(organizationId, projectId);
    return this.prisma.sprint.findMany({
      where: { projectId },
      include: { _count: { select: { issues: { where: { deletedAt: null } } } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async createSprint(organizationId: string, projectId: string, userId: string, dto: CreateSprintDto) {
    await this.getProject(organizationId, projectId);
    const sprint = await this.prisma.sprint.create({
      data: {
        projectId,
        name: dto.name.trim(),
        goal: dto.goal ?? null,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      },
    });

    await this.audit.record({
      action: "flow.sprint.created",
      organizationId,
      actorUserId: userId,
      resourceType: "Sprint",
      resourceId: sprint.id,
    });
    return sprint;
  }

  async updateSprint(
    organizationId: string,
    projectId: string,
    sprintId: string,
    userId: string,
    dto: UpdateSprintDto,
  ) {
    await this.getProject(organizationId, projectId);
    const sprint = await this.prisma.sprint.findFirst({ where: { id: sprintId, projectId } });
    if (!sprint) {
      throw new AppError(ErrorCode.SPRINT_NOT_FOUND, "Sprint not found", HttpStatus.NOT_FOUND);
    }

    // Only one active sprint per project.
    if (dto.isActive === true) {
      await this.prisma.sprint.updateMany({
        where: { projectId, id: { not: sprintId } },
        data: { isActive: false },
      });
    }

    const updated = await this.prisma.sprint.update({
      where: { id: sprintId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.goal !== undefined ? { goal: dto.goal } : {}),
        ...(dto.startDate !== undefined ? { startDate: dto.startDate === null ? null : new Date(dto.startDate) } : {}),
        ...(dto.endDate !== undefined ? { endDate: dto.endDate === null ? null : new Date(dto.endDate) } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.isCompleted !== undefined ? { isCompleted: dto.isCompleted } : {}),
      },
    });

    await this.audit.record({
      action: "flow.sprint.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "Sprint",
      resourceId: sprintId,
    });
    return updated;
  }

  // ---------------- Board columns ----------------

  async listColumns(organizationId: string, boardId: string) {
    const board = await this.getBoardForOrg(organizationId, boardId);
    return this.prisma.boardColumn.findMany({
      where: { boardId: board.id },
      orderBy: { position: "asc" },
    });
  }

  async createColumn(organizationId: string, boardId: string, userId: string, dto: CreateColumnDto) {
    const board = await this.getBoardForOrg(organizationId, boardId);
    const maxPosition = await this.prisma.boardColumn.aggregate({
      where: { boardId: board.id },
      _max: { position: true },
    });

    const column = await this.prisma.boardColumn.create({
      data: {
        boardId: board.id,
        name: dto.name.trim(),
        status: dto.status,
        position: dto.position ?? (maxPosition._max.position ?? -1) + 1,
        wipLimit: dto.wipLimit ?? null,
      },
    });

    await this.audit.record({
      action: "flow.board_column.created",
      organizationId,
      actorUserId: userId,
      resourceType: "BoardColumn",
      resourceId: column.id,
    });
    return column;
  }

  async updateColumn(organizationId: string, boardId: string, columnId: string, userId: string, dto: UpdateColumnDto) {
    const board = await this.getBoardForOrg(organizationId, boardId);
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });
    if (!column) {
      throw new AppError(ErrorCode.COLUMN_NOT_FOUND, "Column not found", HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.boardColumn.update({
      where: { id: columnId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.wipLimit !== undefined ? { wipLimit: dto.wipLimit } : {}),
      },
    });

    await this.audit.record({
      action: "flow.board_column.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "BoardColumn",
      resourceId: columnId,
    });
    return updated;
  }

  async deleteColumn(organizationId: string, boardId: string, columnId: string, userId: string): Promise<void> {
    const board = await this.getBoardForOrg(organizationId, boardId);
    const column = await this.prisma.boardColumn.findFirst({
      where: { id: columnId, boardId: board.id },
    });
    if (!column) {
      throw new AppError(ErrorCode.COLUMN_NOT_FOUND, "Column not found", HttpStatus.NOT_FOUND);
    }
    await this.prisma.boardColumn.delete({ where: { id: columnId } });

    await this.audit.record({
      action: "flow.board_column.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "BoardColumn",
      resourceId: columnId,
    });
  }

  // ---------------- Internals ----------------

  private async getBoardForOrg(organizationId: string, boardId: string) {
    const board = await this.prisma.board.findFirst({
      where: { id: boardId, deletedAt: null, project: { organizationId, deletedAt: null } },
    });
    if (!board) {
      throw new AppError(ErrorCode.BOARD_NOT_FOUND, "Board not found", HttpStatus.NOT_FOUND);
    }
    return board;
  }

  private async assertOrgMember(organizationId: string, userId: string): Promise<void> {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!member) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "Assignee must be a member of the organization",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async assertTeamInOrganization(organizationId: string, teamId: string): Promise<void> {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!team) {
      throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.BAD_REQUEST);
    }
  }

  private async assertSprintInProject(projectId: string, sprintId: string): Promise<void> {
    const sprint = await this.prisma.sprint.findFirst({
      where: { id: sprintId, projectId },
      select: { id: true },
    });
    if (!sprint) {
      throw new AppError(ErrorCode.SPRINT_NOT_FOUND, "Sprint not found in this project", HttpStatus.BAD_REQUEST);
    }
  }
}

export type { IssuePriority, IssueStatus };
