import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
const base = "/api/organization/hrms";
type Input = Record<string, unknown>;

export interface HrmsEmployee extends ApiEntity {
  employeeNumber: string;
  status: string;
  employmentType: string | null;
  workLocationId: string | null;
  shiftId: string | null;
  departmentId: string | null;
  designationId: string | null;
  reportingManagerId: string | null;
  startDate: string | null;
  endDate: string | null;
  biometricId: string | null;
  user: { id: string; name: string; email: string; avatarUrl: string | null };
  workLocation: { id: string; name: string; code: string | null } | null;
  shift: { id: string; name: string; startTime: string; endTime: string; timeZone: string } | null;
  department: { id: string; name: string; code: string | null } | null;
  designation: { id: string; name: string; code: string | null } | null;
  reportingManager: { id: string; employeeNumber: string; user: { name: string } } | null;
}
export type HrmsEmployeeSortField =
  | "employeeNumber"
  | "name"
  | "status"
  | "employmentType"
  | "startDate"
  | "department"
  | "location";
export interface HrmsEmployeeListQuery {
  page?: number;
  pageSize?: number;
  query?: string;
  status?: string;
  departmentId?: string;
  sortBy?: HrmsEmployeeSortField;
  sortOrder?: "asc" | "desc";
}
export interface HrmsEmployeeOptions {
  members: { id: string; name: string; email: string }[];
  departments: { id: string; name: string }[];
  designations: { id: string; name: string; departmentId: string | null }[];
  locations: { id: string; name: string }[];
  employmentTypes: { id: string; name: string }[];
  shifts: { id: string; name: string; startTime: string; endTime: string; timeZone: string }[];
  managers: { id: string; employeeNumber: string; user: { name: string } }[];
}
export interface HrmsOrgChartNode {
  id: string;
  employeeNumber: string;
  status: string;
  reportingManagerId: string | null;
  user: { name: string; avatarUrl: string | null };
  department: { name: string } | null;
  designation: { name: string } | null;
}
export type HrmsEmployeeFileFormat = "csv" | "xlsx";
export type HrmsEmployeeExportScope = "all" | "selected" | "filtered";
export interface HrmsEmployeeImportField {
  key: string;
  label: string;
  required: boolean;
}
export interface HrmsEmployeeImportParse {
  format: HrmsEmployeeFileFormat;
  headers: string[];
  rows: { rowNumber: number; values: string[] }[];
  fields: HrmsEmployeeImportField[];
  suggestedMapping: Record<string, number | null>;
}
export type HrmsEmployeeImportRow = { rowNumber: number } & Record<string, string | number | undefined>;
export interface HrmsEmployeeImportRowResult {
  rowNumber: number;
  valid: boolean;
  errors: string[];
}
export interface HrmsEmployeeImportValidation {
  results: HrmsEmployeeImportRowResult[];
  summary: { total: number; valid: number; invalid: number };
}
export interface HrmsEmployeeImportOutcome {
  created: number;
  skipped: number;
  errors: HrmsEmployeeImportRowResult[];
}
export interface HrmsHoliday {
  id: string;
  /** ISO timestamp at UTC midnight of the holiday date. */
  date: string;
  name: string;
  isHalfDay: boolean;
  imageUrl: string | null;
  /** Null = applies to every work location. */
  workLocationId: string | null;
  workLocation: { id: string; name: string } | null;
  updatedAt: string;
}
export interface HrmsHolidayImportItem {
  date: string;
  name: string;
  isHalfDay?: boolean;
  locationName?: string;
}
export interface HrmsHolidayImportResult {
  created: number;
  updated: number;
  errors: { row: number; message: string }[];
}
export interface HrmsHolidayEmailPreview {
  subject: string;
  html: string;
  holidayCount: number;
}
export interface HrmsHolidayBroadcast {
  id: string;
  year: number;
  audience: "ALL" | "SELECTED";
  recipientCount: number;
  failedCount: number;
  changesOnly: boolean;
  holidayCount: number;
  sentBy: string | null;
  sentAt: string;
}
export interface HrmsEmployeePage {
  items: HrmsEmployee[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: { total: number; active: number; onLeave: number; newJoiners: number };
}

export interface HrmsAttendanceRecord extends ApiEntity {
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
  workHours: number | null;
  breakMinutes: number;
  breakStartedAt: string | null;
  notes: string | null;
}
export type HrmsRegularizationType =
  | "MISSED_CLOCK_IN"
  | "MISSED_CLOCK_OUT"
  | "LATE_ARRIVAL"
  | "WORK_FROM_CLIENT_SITE"
  | "OTHER";
export type HrmsRegularizationStatus = "PENDING" | "APPROVED" | "REJECTED";
export interface HrmsAttendanceRegularization extends ApiEntity {
  employeeId: string;
  date: string;
  type: HrmsRegularizationType;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  reason: string;
  status: HrmsRegularizationStatus;
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  /** The day's current attendance record (null if none); present on list responses. */
  attendanceRecord?: HrmsAttendanceRecord | null;
  employee: { id: string; employeeNumber: string; user: { id: string; name: string; avatarUrl: string | null } };
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

export interface HrmsLeaveType extends ApiEntity {
  name: string;
  code: string;
  category: string;
  annualDays: number;
  carryForwardDays: number;
  isPaid: boolean;
  allowHalfDay: boolean;
  isCompOff: boolean;
  isActive: boolean;
}

export interface HrmsLeaveBalance {
  typeId: string;
  name: string;
  code: string;
  isPaid: boolean;
  isCompOff: boolean;
  allowHalfDay: boolean;
  unlimited: boolean;
  /** Accrued so far: annualDays / 12 per credited month, plus carry-forward. */
  entitled: number;
  annualDays: number;
  accruedMonths: number;
  used: number;
  pending: number;
  /** Null when the type is unlimited. */
  available: number | null;
}

export type HrmsRequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED" | "WITHDRAWN" | "NEEDS_INFO";

export interface HrmsLeaveCenterRequest extends ApiEntity {
  employeeId: string;
  leaveTypeId: string | null;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: HrmsRequestStatus;
  rejectionReason: string | null;
  moreInfoNote: string | null;
  moreInfoReply: string | null;
  attachmentFileId: string | null;
  attachmentName: string | null;
  type?: { id: string; name: string; code: string } | null;
  employee?: { id: string; employeeNumber: string; user: { id: string; name: string; avatarUrl: string | null } };
}

export interface HrmsCompOffRequest extends ApiEntity {
  employeeId: string;
  workedDate: string;
  workedEndDate: string | null;
  days: number;
  reason: string | null;
  status: HrmsRequestStatus;
  decisionReason: string | null;
  moreInfoNote: string | null;
  moreInfoReply: string | null;
  employee?: { id: string; employeeNumber: string; user: { id: string; name: string; avatarUrl: string | null } };
}

export interface HrmsTeamLeave {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  type: { name: string; code: string } | null;
  employee: { id: string; user: { id: string; name: string; avatarUrl: string | null } };
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

/** Admin-defined shift; times are "HH:mm" (24h) and endTime <= startTime means the shift crosses midnight. */
export interface HrmsShift extends ApiEntity {
  name: string;
  startTime: string;
  endTime: string;
  /** IANA zone the times are expressed in. */
  timeZone: string;
  isActive: boolean;
  sortOrder: number;
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
/** Binary responses cannot go through apiRequest (it always parses JSON), so downloads use fetch directly. */
async function downloadFile(organizationId: string, url: string, fallbackName: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("x-organization-id", organizationId);
  const response = await fetch(url, { credentials: "include", ...init, headers });
  if (!response.ok) {
    const body = (await response.json().catch(() => undefined)) as { message?: string | string[] } | undefined;
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message || "Download failed.");
  }
  const disposition = response.headers.get("content-disposition") ?? "";
  const name = /filename="?([^";]+)"?/i.exec(disposition)?.[1] ?? fallbackName;
  const href = URL.createObjectURL(await response.blob());
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(href);
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
  shifts: {
    list: (organizationId: string) => tenantRequest<HrmsShift[]>(organizationId, `${base}/shifts`),
    create: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsShift, Input>(organizationId, `${base}/shifts`, "POST", input),
    update: (organizationId: string, shiftId: string, input: Input) =>
      tenantJsonRequest<HrmsShift, Input>(organizationId, `${base}/shifts/${pathSegment(shiftId)}`, "PATCH", input),
    remove: (organizationId: string, shiftId: string) =>
      tenantRequest<void>(organizationId, `${base}/shifts/${pathSegment(shiftId)}`, { method: "DELETE" }),
  },
  holidays: {
    list: (organizationId: string, year: number) =>
      tenantRequest<HrmsHoliday[]>(organizationId, `${base}/holidays`, { query: { year } }),
    save: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsHoliday, Input>(organizationId, `${base}/holidays`, "PUT", input),
    remove: (organizationId: string, holidayId: string) =>
      tenantRequest<void>(organizationId, `${base}/holidays/${pathSegment(holidayId)}`, { method: "DELETE" }),
    upcoming: (organizationId: string) => tenantRequest<HrmsHoliday[]>(organizationId, `${base}/holidays/upcoming`),
    importItems: (organizationId: string, items: HrmsHolidayImportItem[]) =>
      tenantJsonRequest<HrmsHolidayImportResult, Input>(organizationId, `${base}/holidays/import`, "POST", { items }),
    preview: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsHolidayEmailPreview, Input>(organizationId, `${base}/holidays/send/preview`, "POST", input),
    broadcasts: (organizationId: string, year: number) =>
      tenantRequest<HrmsHolidayBroadcast[]>(organizationId, `${base}/holidays/broadcasts`, { query: { year } }),
    send: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsHolidayBroadcast, Input>(organizationId, `${base}/holidays/send`, "POST", input),
  },
  employees: {
    ...resource("employees"),
    list: (
      organizationId: string,
      query: HrmsEmployeeListQuery = {},
    ) => tenantRequest<HrmsEmployeePage>(organizationId, `${base}/employees`, { query }),
    options: (organizationId: string) =>
      tenantRequest<HrmsEmployeeOptions>(organizationId, `${base}/employees/options`),
    myStartDate: (organizationId: string) =>
      tenantRequest<{ startDate: string | null }>(organizationId, `${base}/employees/me/start-date`),
    myShift: (organizationId: string) =>
      tenantRequest<{ id: string; name: string; startTime: string; endTime: string; timeZone: string } | null>(
        organizationId,
        `${base}/employees/me/shift`,
      ),
    orgChart: (organizationId: string) =>
      tenantRequest<{ items: HrmsOrgChartNode[]; total: number }>(organizationId, `${base}/employees/org-chart`),
    parseImport: (organizationId: string, file: File) => {
      const body = new FormData();
      body.append("file", file);
      return tenantRequest<HrmsEmployeeImportParse>(organizationId, `${base}/employees/import/parse`, {
        method: "POST",
        body,
      });
    },
    validateImport: (organizationId: string, rows: HrmsEmployeeImportRow[]) =>
      tenantJsonRequest<HrmsEmployeeImportValidation, Input>(
        organizationId,
        `${base}/employees/import/validate`,
        "POST",
        { rows },
      ),
    import: (organizationId: string, rows: HrmsEmployeeImportRow[]) =>
      tenantJsonRequest<HrmsEmployeeImportOutcome, Input>(organizationId, `${base}/employees/import`, "POST", {
        rows,
      }),
    downloadTemplate: (organizationId: string, format: HrmsEmployeeFileFormat) =>
      downloadFile(organizationId, `${base}/employees/import/template?format=${format}`, `employee-import-template.${format}`),
    export: (
      organizationId: string,
      input: {
        format: HrmsEmployeeFileFormat;
        scope: HrmsEmployeeExportScope;
        ids?: string[];
      } & Pick<HrmsEmployeeListQuery, "query" | "status" | "departmentId" | "sortBy" | "sortOrder">,
    ) =>
      downloadFile(organizationId, `${base}/employees/export`, `workforce-export.${input.format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      }),
    get: (organizationId: string, employeeId: string) =>
      tenantRequest<HrmsEmployee>(organizationId, `${base}/employees/${pathSegment(employeeId)}`),
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
  attendanceSelf: {
    today: (organizationId: string, date: string) =>
      tenantRequest<{ employeeId: string; record: HrmsAttendanceRecord | null }>(
        organizationId,
        `${base}/attendance/me/today`,
        { query: { date } },
      ),
    records: (organizationId: string, query: { from?: string; to?: string } = {}) =>
      tenantRequest<HrmsAttendanceRecord[]>(organizationId, `${base}/attendance/me/records`, { query }),
    clockIn: (organizationId: string, date: string) =>
      tenantJsonRequest<HrmsAttendanceRecord, Input>(organizationId, `${base}/attendance/me/clock-in`, "POST", { date }),
    clockOut: (organizationId: string) =>
      tenantJsonRequest<HrmsAttendanceRecord, Input>(organizationId, `${base}/attendance/me/clock-out`, "POST", {}),
    startBreak: (organizationId: string) =>
      tenantJsonRequest<HrmsAttendanceRecord, Input>(organizationId, `${base}/attendance/me/break/start`, "POST", {}),
    endBreak: (organizationId: string) =>
      tenantJsonRequest<HrmsAttendanceRecord, Input>(organizationId, `${base}/attendance/me/break/end`, "POST", {}),
    myRegularizations: (organizationId: string) =>
      tenantRequest<HrmsAttendanceRegularization[]>(organizationId, `${base}/attendance/me/regularizations`),
    createRegularization: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsAttendanceRegularization, Input>(
        organizationId,
        `${base}/attendance/me/regularizations`,
        "POST",
        input,
      ),
    regularizations: (organizationId: string, status?: HrmsRegularizationStatus) =>
      tenantRequest<HrmsAttendanceRegularization[]>(organizationId, `${base}/attendance/regularizations`, {
        query: { status },
      }),
    decideRegularization: (
      organizationId: string,
      regularizationId: string,
      input: { status: "APPROVED" | "REJECTED"; decisionNote: string },
    ) =>
      tenantJsonRequest<HrmsAttendanceRegularization, Input>(
        organizationId,
        `${base}/attendance/regularizations/${pathSegment(regularizationId)}`,
        "PATCH",
        input,
      ),
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
  leave: {
    types: (organizationId: string) => tenantRequest<HrmsLeaveType[]>(organizationId, `${base}/leave/types`),
    saveType: (organizationId: string, input: Input) =>
      tenantJsonRequest<HrmsLeaveType, Input>(organizationId, `${base}/leave/types`, "PUT", input),
    removeType: (organizationId: string, typeId: string) =>
      tenantRequest<{ deactivated: boolean }>(organizationId, `${base}/leave/types/${pathSegment(typeId)}`, { method: "DELETE" }),
    balances: (organizationId: string) => tenantRequest<HrmsLeaveBalance[]>(organizationId, `${base}/leave/me/balances`),
    myRequests: (organizationId: string) => tenantRequest<HrmsLeaveCenterRequest[]>(organizationId, `${base}/leave/me/requests`),
    myCompOff: (organizationId: string) => tenantRequest<HrmsCompOffRequest[]>(organizationId, `${base}/leave/me/comp-off`),
    team: (organizationId: string, from: string, to: string) =>
      tenantRequest<HrmsTeamLeave[]>(organizationId, `${base}/leave/team`, { query: { from, to } }),
    requests: (organizationId: string) => tenantRequest<HrmsLeaveCenterRequest[]>(organizationId, `${base}/leave/requests`),
    apply: (organizationId: string, input: Input, onBehalf = false) =>
      tenantJsonRequest<HrmsLeaveCenterRequest, Input>(
        organizationId,
        `${base}/leave/requests${onBehalf ? "/on-behalf" : ""}`,
        "POST",
        input,
      ),
    cancel: (organizationId: string, id: string) =>
      tenantRequest<ApiEntity>(organizationId, `${base}/leave/requests/${pathSegment(id)}/cancel`, { method: "POST" }),
    reply: (organizationId: string, id: string, reply: string) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/leave/requests/${pathSegment(id)}/reply`, "POST", { reply }),
    decide: (organizationId: string, id: string, status: "APPROVED" | "REJECTED", reason?: string) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/leave/requests/${pathSegment(id)}/decision`, "POST", {
        status,
        reason,
      }),
    requestInfo: (organizationId: string, id: string, note: string) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/leave/requests/${pathSegment(id)}/request-info`, "POST", {
        note,
      }),
    compOff: (organizationId: string) => tenantRequest<HrmsCompOffRequest[]>(organizationId, `${base}/leave/comp-off`),
    applyCompOff: (organizationId: string, input: Input, onBehalf = false) =>
      tenantJsonRequest<HrmsCompOffRequest, Input>(
        organizationId,
        `${base}/leave/comp-off${onBehalf ? "/on-behalf" : ""}`,
        "POST",
        input,
      ),
    cancelCompOff: (organizationId: string, id: string) =>
      tenantRequest<ApiEntity>(organizationId, `${base}/leave/comp-off/${pathSegment(id)}/cancel`, { method: "POST" }),
    replyCompOff: (organizationId: string, id: string, reply: string) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/leave/comp-off/${pathSegment(id)}/reply`, "POST", { reply }),
    decideCompOff: (organizationId: string, id: string, status: "APPROVED" | "REJECTED", reason?: string) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/leave/comp-off/${pathSegment(id)}/decision`, "POST", {
        status,
        reason,
      }),
    requestCompOffInfo: (organizationId: string, id: string, note: string) =>
      tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/leave/comp-off/${pathSegment(id)}/request-info`, "POST", {
        note,
      }),
  },
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
