import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity, IssuePriority, IssueStatus } from "@/services/service-types";

export interface ProjectInput {
  key?: string;
  name?: string;
  description?: string;
  teamId?: string;
  leadId?: string;
}
export interface IssueInput {
  title?: string;
  description?: string;
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string | null;
  sprintId?: string | null;
  estimate?: number | null;
  dueDate?: string | null;
}
export interface IssueQuery {
  status?: IssueStatus;
  priority?: IssuePriority;
  assigneeId?: string;
  sprintId?: string;
  limit?: number;
}
export interface SprintInput {
  name?: string;
  goal?: string;
  startsAt?: string;
  endsAt?: string;
  status?: string;
}
export interface ColumnInput {
  name?: string;
  position?: number;
  wipLimit?: number | null;
}
const base = "/api/organization/flow";

export const flowService = {
  listProjects: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/projects`),
  createProject: (organizationId: string, input: Required<Pick<ProjectInput, "key" | "name">> & ProjectInput) =>
    tenantJsonRequest<ApiEntity, ProjectInput>(organizationId, `${base}/projects`, "POST", input),
  getProject: (organizationId: string, projectId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${base}/projects/${pathSegment(projectId)}`),
  updateProject: (organizationId: string, projectId: string, input: ProjectInput) =>
    tenantJsonRequest<ApiEntity, ProjectInput>(
      organizationId,
      `${base}/projects/${pathSegment(projectId)}`,
      "PATCH",
      input,
    ),
  listIssues: (organizationId: string, projectId: string, query: IssueQuery = {}) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/projects/${pathSegment(projectId)}/issues`, { query }),
  createIssue: (organizationId: string, projectId: string, input: Required<Pick<IssueInput, "title">> & IssueInput) =>
    tenantJsonRequest<ApiEntity, IssueInput>(
      organizationId,
      `${base}/projects/${pathSegment(projectId)}/issues`,
      "POST",
      input,
    ),
  getIssue: (organizationId: string, issueId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${base}/issues/${pathSegment(issueId)}`),
  updateIssue: (organizationId: string, issueId: string, input: IssueInput) =>
    tenantJsonRequest<ApiEntity, IssueInput>(organizationId, `${base}/issues/${pathSegment(issueId)}`, "PATCH", input),
  moveIssue: (organizationId: string, issueId: string, input: { status: IssueStatus; position?: number }) =>
    tenantJsonRequest<ApiEntity, { status: IssueStatus; position?: number }>(
      organizationId,
      `${base}/issues/${pathSegment(issueId)}/move`,
      "POST",
      input,
    ),
  deleteIssue: (organizationId: string, issueId: string) =>
    tenantRequest<void>(organizationId, `${base}/issues/${pathSegment(issueId)}`, { method: "DELETE" }),
  getBoard: (organizationId: string, projectId: string) =>
    tenantRequest<ApiEntity>(organizationId, `${base}/projects/${pathSegment(projectId)}/board`),
  listSprints: (organizationId: string, projectId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/projects/${pathSegment(projectId)}/sprints`),
  createSprint: (organizationId: string, projectId: string, input: SprintInput) =>
    tenantJsonRequest<ApiEntity, SprintInput>(
      organizationId,
      `${base}/projects/${pathSegment(projectId)}/sprints`,
      "POST",
      input,
    ),
  updateSprint: (organizationId: string, projectId: string, sprintId: string, input: SprintInput) =>
    tenantJsonRequest<ApiEntity, SprintInput>(
      organizationId,
      `${base}/projects/${pathSegment(projectId)}/sprints/${pathSegment(sprintId)}`,
      "PATCH",
      input,
    ),
  listColumns: (organizationId: string, boardId: string) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/boards/${pathSegment(boardId)}/columns`),
  createColumn: (organizationId: string, boardId: string, input: ColumnInput) =>
    tenantJsonRequest<ApiEntity, ColumnInput>(
      organizationId,
      `${base}/boards/${pathSegment(boardId)}/columns`,
      "POST",
      input,
    ),
  updateColumn: (organizationId: string, boardId: string, columnId: string, input: ColumnInput) =>
    tenantJsonRequest<ApiEntity, ColumnInput>(
      organizationId,
      `${base}/boards/${pathSegment(boardId)}/columns/${pathSegment(columnId)}`,
      "PATCH",
      input,
    ),
  deleteColumn: (organizationId: string, boardId: string, columnId: string) =>
    tenantRequest<void>(organizationId, `${base}/boards/${pathSegment(boardId)}/columns/${pathSegment(columnId)}`, {
      method: "DELETE",
    }),
};
