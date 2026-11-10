import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
const base = "/api/organization/hrms";
type Input = Record<string, unknown>;

export interface HrmsEmployee extends ApiEntity {
  employeeNumber: string;
  status: string;
  employmentType: string | null;
  workLocationId: string | null;
  startDate: string | null;
  endDate: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  workLocation: { id: string; name: string; code: string | null } | null;
}

export interface HrmsAttendanceRecord extends ApiEntity {
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: number | null;
  notes: string | null;
}

export interface HrmsLeaveRequest extends ApiEntity {
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: string;
  employee: { id: string; employeeNumber: string };
}

export interface HrmsLocation extends ApiEntity {
  name: string;
  code: string | null;
  countryCode: string;
  city: string | null;
  timezone: string;
  isActive: boolean;
}

export interface HrmsDesignation extends ApiEntity {
  name: string;
  code: string | null;
  departmentId: string | null;
  department: { id: string; name: string; code: string | null } | null;
  isActive: boolean;
}

export interface HrmsEmploymentType extends ApiEntity {
  name: string;
  code: string | null;
  isActive: boolean;
}

export type HrmsWorkflowDefinitionStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type HrmsWorkflowStageType = "APPROVAL" | "TASK" | "AUTOMATION" | "CONDITION" | "PARALLEL_GATE";
export type HrmsWorkflowAssigneeRuleType = "INITIATOR" | "USER_IDS";

export interface HrmsWorkflowStage {
  id: string;
  key: string;
  name: string;
  type?: HrmsWorkflowStageType;
  assigneeRule?: { kind: HrmsWorkflowAssigneeRuleType; userIds?: string[] };
  requiredApprovals?: number;
  slaHours?: number;
  isTerminal?: boolean;
}

export interface HrmsWorkflowTransition {
  from: string;
  to: string;
  action?: "APPROVE" | "REJECT" | "COMPLETE" | "SKIP";
  condition?: { field: string; operator: "equals" | "notEquals" | "greaterThan" | "lessThan"; value: string | number };
}

export interface HrmsWorkflowDefinition extends ApiEntity {
  name: string;
  description: string | null;
  status: HrmsWorkflowDefinitionStatus;
  version: number;
  stages: HrmsWorkflowStage[];
  transitions: HrmsWorkflowTransition[];
  templateKey: string | null;
  isTemplate: boolean;
  isDefault: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface HrmsWorkflowDefinitionInput {
  name: string;
  description?: string;
  stages: HrmsWorkflowStage[];
  transitions: HrmsWorkflowTransition[];
}
export type HrmsAssetStatus = "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "UNFIT";
export type HrmsAssetCondition = "NEW" | "GOOD" | "FAIR";
export type HrmsAssetType =
  "LAPTOP" | "PHONE" | "MONITOR" | "KEYBOARD" | "MOUSE" | "HEADPHONES" | "FURNITURE" | "OTHER";
export interface HrmsAsset extends ApiEntity {
  name: string;
  type: HrmsAssetType;
  customCategory: string | null;
  serialNumber: string;
  condition: HrmsAssetCondition;
  status: HrmsAssetStatus;
  assignedEmployeeId: string | null;
  assignedEmployee: { id: string; employeeNumber: string; user: { name: string } } | null;
}
export interface HrmsAssetPage {
  items: HrmsAsset[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: { total: number; assigned: number; available: number; maintenance: number };
}
const resource = (path: string) => ({
  list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/${path}`),
  create: (organizationId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/${path}`, "POST", input),
});
export const hrmsService = {
  locations: {
    list: (organizationId: string) => tenantRequest<HrmsLocation[]>(organizationId, `${base}/locations`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsLocation, Input>(organizationId, `${base}/locations`, "POST", input),
    update: (organizationId: string, locationId: string, input: Input) =>
      tenantJsonRequest<HrmsLocation, Input>(
        organizationId,
        `${base}/locations/${pathSegment(locationId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, locationId: string) =>
      tenantRequest<void>(organizationId, `${base}/locations/${pathSegment(locationId)}`, { method: "DELETE" }),
  },
  designations: {
    list: (organizationId: string) => tenantRequest<HrmsDesignation[]>(organizationId, `${base}/designations`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsDesignation, Input>(organizationId, `${base}/designations`, "POST", input),
    update: (organizationId: string, designationId: string, input: Input) =>
      tenantJsonRequest<HrmsDesignation, Input>(
        organizationId,
        `${base}/designations/${pathSegment(designationId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, designationId: string) =>
      tenantRequest<void>(organizationId, `${base}/designations/${pathSegment(designationId)}`, { method: "DELETE" }),
  },
  employmentTypes: {
    list: (organizationId: string) => tenantRequest<HrmsEmploymentType[]>(organizationId, `${base}/employment-types`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsEmploymentType, Input>(organizationId, `${base}/employment-types`, "POST", input),
    update: (organizationId: string, employmentTypeId: string, input: Input) =>
      tenantJsonRequest<HrmsEmploymentType, Input>(
        organizationId,
        `${base}/employment-types/${pathSegment(employmentTypeId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, employmentTypeId: string) =>
      tenantRequest<void>(organizationId, `${base}/employment-types/${pathSegment(employmentTypeId)}`, {
        method: "DELETE",
      }),
  },
  employees: {
    ...resource("employees"),
    list: (organizationId: string) => tenantRequest<HrmsEmployee[]>(organizationId, `${base}/employees`),
    get: (organizationId: string, employeeId: string) =>
      tenantRequest<ApiEntity>(organizationId, `${base}/employees/${pathSegment(employeeId)}`),
    update: (organizationId: string, employeeId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(
        organizationId,
        `${base}/employees/${pathSegment(employeeId)}`,
        "PATCH",
        input,
      ),
    delete: (organizationId: string, employeeId: string) =>
      tenantRequest<void>(organizationId, `${base}/employees/${pathSegment(employeeId)}`, { method: "DELETE" }),
  },
  attendance: {
    list: (organizationId: string, employeeId: string, query: { from?: string; to?: string } = {}) =>
      tenantRequest<HrmsAttendanceRecord[]>(organizationId, `${base}/employees/${pathSegment(employeeId)}/attendance`, {
        query,
      }),
    upsert: (organizationId: string, employeeId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(
        organizationId,
        `${base}/employees/${pathSegment(employeeId)}/attendance`,
        "POST",
        input,
      ),
  },
  holidayCalendars: {
    ...resource("holiday-calendars"),
    update: (organizationId: string, calendarId: string, input: Input) =>
      tenantJsonRequest<ApiEntity, Input>(
        organizationId,
        `${base}/holiday-calendars/${pathSegment(calendarId)}`,
        "PATCH",
        input,
      ),
    remove: (organizationId: string, calendarId: string) =>
      tenantRequest<void>(organizationId, `${base}/holiday-calendars/${pathSegment(calendarId)}`, { method: "DELETE" }),
  },
  assets: {
    list: (organizationId: string, query: Record<string, string | number | undefined> = {}) =>
      tenantRequest<HrmsAssetPage>(organizationId, `${base}/assets`, {
        query: Object.fromEntries(Object.entries(query).filter(([, value]) => value !== undefined && value !== "")),
      }),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsAsset, Input>(organizationId, `${base}/assets`, "POST", input),
    update: (organizationId: string, assetId: string, input: Input) =>
      tenantJsonRequest<HrmsAsset, Input>(organizationId, `${base}/assets/${pathSegment(assetId)}`, "PATCH", input),
    remove: (organizationId: string, assetId: string) =>
      tenantRequest<void>(organizationId, `${base}/assets/${pathSegment(assetId)}`, { method: "DELETE" }),
    assign: (organizationId: string, assetId: string, employeeId: string) =>
      tenantJsonRequest<ApiEntity, { employeeId: string }>(
        organizationId,
        `${base}/assets/${pathSegment(assetId)}/assignment`,
        "PATCH",
        { employeeId },
      ),
  },
  benefits: resource("benefits"),
  leaveRequests: {
    ...resource("leave-requests"),
    list: (organizationId: string) => tenantRequest<HrmsLeaveRequest[]>(organizationId, `${base}/leave-requests`),
    updateStatus: (organizationId: string, leaveId: string, input: { status: string; rejectionReason?: string }) =>
      tenantJsonRequest<ApiEntity, typeof input>(
        organizationId,
        `${base}/leave-requests/${pathSegment(leaveId)}/status`,
        "PATCH",
        input,
      ),
  },
  payroll: {
    ...resource("payroll"),
    approve: (organizationId: string, payrollId: string) =>
      tenantRequest<ApiEntity>(organizationId, `${base}/payroll/${pathSegment(payrollId)}/approve`, {
        method: "PATCH",
      }),
  },
  performanceReviews: resource("performance-reviews"),
  trainings: {
    ...resource("trainings"),
    enroll: (organizationId: string, trainingId: string, input: { employeeId: string; status?: string }) =>
      tenantJsonRequest<ApiEntity, typeof input>(
        organizationId,
        `${base}/trainings/${pathSegment(trainingId)}/enrollments`,
        "POST",
        input,
      ),
  },
  workflowDefinitions: {
    list: (organizationId: string, query: { status?: HrmsWorkflowDefinitionStatus; isTemplate?: boolean } = {}) =>
      tenantRequest<HrmsWorkflowDefinition[]>(organizationId, `${base}/workflow-definitions`, {
        query,
      }),
    listTemplates: (organizationId: string) =>
      tenantRequest<HrmsWorkflowDefinition[]>(organizationId, `${base}/workflow-definitions/templates`),
    get: (organizationId: string, workflowId: string) =>
      tenantRequest<HrmsWorkflowDefinition>(organizationId, `${base}/workflow-definitions/${pathSegment(workflowId)}`),
    create: (organizationId: string, input: HrmsWorkflowDefinitionInput) =>
      tenantJsonRequest<HrmsWorkflowDefinition, HrmsWorkflowDefinitionInput>(
        organizationId,
        `${base}/workflow-definitions`,
        "POST",
        input,
      ),
    update: (
      organizationId: string,
      workflowId: string,
      input: Partial<HrmsWorkflowDefinitionInput> & {
        status?: Extract<HrmsWorkflowDefinitionStatus, "DRAFT" | "ARCHIVED">;
      },
    ) =>
      tenantJsonRequest<HrmsWorkflowDefinition, typeof input>(
        organizationId,
        `${base}/workflow-definitions/${pathSegment(workflowId)}`,
        "PATCH",
        input,
      ),
    clone: (organizationId: string, workflowId: string, input: { name?: string } = {}) =>
      tenantJsonRequest<HrmsWorkflowDefinition, typeof input>(
        organizationId,
        `${base}/workflow-definitions/${pathSegment(workflowId)}/clone`,
        "POST",
        input,
      ),
    publish: (organizationId: string, workflowId: string) =>
      tenantJsonRequest<HrmsWorkflowDefinition, Record<string, never>>(
        organizationId,
        `${base}/workflow-definitions/${pathSegment(workflowId)}/publish`,
        "POST",
        {},
      ),
  },
};
