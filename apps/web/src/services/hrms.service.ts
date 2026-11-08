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
    ...resource("assets"),
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
};
