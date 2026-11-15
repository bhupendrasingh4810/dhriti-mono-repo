import { tenantRequest } from "./request.service";

export type LeaveMetrics = { months: { month: string; days: number }[]; excludedLegacyRequests: number };
export type PayrollMetrics = { months: string[]; series: { currency: string; values: string[] }[] };

export const dashboardMetricsService = {
  leave: (org: string) => tenantRequest<LeaveMetrics>(org, "/api/organization/hrms/leave/dashboard/monthly"),
  payroll: (org: string) => tenantRequest<PayrollMetrics>(org, "/api/organization/hrms/payroll/dashboard/monthly"),
};
