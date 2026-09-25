import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity } from "@/services/service-types";
const base = "/api/organization/hrms";
type Input = Record<string, unknown>;
const resource = (path: string) => ({
  list: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/${path}`),
  create: (organizationId: string, input: Input) =>
    tenantJsonRequest<ApiEntity, Input>(organizationId, `${base}/${path}`, "POST", input),
});
export const hrmsService = {
  employees: {
    ...resource("employees"),
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
      tenantRequest<ApiEntity[]>(organizationId, `${base}/employees/${pathSegment(employeeId)}/attendance`, { query }),
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
