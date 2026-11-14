import { pathSegment, tenantJsonRequest, tenantRequest } from "./request.service";

export type SalaryComponent = {
  code: string;
  name: string;
  type: "EARNING" | "DEDUCTION" | "EMPLOYER";
  calculation: "FIXED" | "PERCENT_GROSS" | "PERCENT_COMPONENT" | "REMAINDER";
  value: string;
  basis?: string;
};
export type PayrollProfile = {
  id: string;
  name: string;
  countryCode: string;
  currency: string;
  minorUnits: number;
  frequency: "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY";
  calendarAnchor?: string | null;
  payDateOffset?: number;
  employmentModel: string;
  workLocationId: string | null;
  registration: string | null;
  rulesVerified: boolean;
  effectiveFrom: string;
};
export type ProfileInput = Omit<PayrollProfile, "id" | "workLocationId" | "registration"> & {
  workLocationId?: string;
  registration?: string;
};
export type SalaryStructure = {
  id: string;
  name: string;
  profileId: string;
  profile: PayrollProfile;
  components: SalaryComponent[];
};
type EmployeeSummary = { employeeNumber: string; user: { name: string } };
export type VariablePayInput = {
  id: string;
  employeeId: string;
  profileId: string;
  name: string;
  type: "EARNING" | "DEDUCTION" | "EMPLOYER";
  calculation: "FIXED" | "HOURS";
  quantity: string;
  rate: string;
  multiplier: string;
  amount: string;
  startPeriod: string;
  endPeriod: string;
  targetPeriod?: string | null;
  reason: string;
  status: string;
  createdById: string;
  employee: EmployeeSummary;
  profile: PayrollProfile;
};
export type VariablePayRequest = Pick<
  VariablePayInput,
  | "employeeId"
  | "profileId"
  | "name"
  | "type"
  | "calculation"
  | "quantity"
  | "rate"
  | "multiplier"
  | "startPeriod"
  | "endPeriod"
  | "reason"
> & { targetPeriod?: string };
export type PayrollCalendarPeriod = {
  key: string;
  start: string;
  end: string;
  payDate: string;
  frequency: string;
};
export type SalaryAssignment = {
  id: string;
  employeeId: string;
  structureId: string;
  monthlyGross: string;
  effectiveFrom: string;
  employee: EmployeeSummary;
  structure: SalaryStructure;
  breakdown: { net: string; monthlyCtc: string; annualCtc: string };
};
export type ExpenseClaim = {
  id: string;
  employeeId: string;
  title: string;
  amount: string;
  currency: string;
  expenseDate: string;
  receiptReference: string;
  status: string;
  runId: string | null;
  employee: EmployeeSummary;
};
export type PayrollItem = {
  employeeId: string;
  employeeNumber: string;
  name: string;
  assignmentId: string;
  gross: string;
  deductions: string;
  employer: string;
  monthlyCtc: string;
  annualCtc: string;
  reimbursements: string;
  net: string;
  claimIds: string[];
  variableInputs?: {
    id: string;
    name: string;
    type: string;
    calculation: string;
    quantity: string;
    rate: string;
    multiplier: string;
    amount: string;
    reason: string;
    targetPeriod?: string;
  }[];
  periodEmployerCost?: string;
  variance?: {
    previousRecordId: string;
    previousPeriod: string;
    currency: string;
    previousGross: string;
    previousDeductions: string;
    previousNet: string;
    grossDelta: string;
    deductionsDelta: string;
    netDelta: string;
    netPercent: string | null;
  } | null;
  lines: { code: string; name: string; type: string; amount: string }[];
  proration?: {
    policy: "CALENDAR_DAYS";
    allocation?: "MONTHLY_CALENDAR";
    periodDays: number;
    employmentDays: number;
    unpaidDays: number;
    segments: {
      assignmentId: string;
      effectiveFrom: string;
      monthlyGross: string;
      calendarDays: number;
      unpaidDays: number;
      payableDays: number;
      month?: string;
      monthDays?: number;
    }[];
  };
};
export type PayrollPreview = {
  profile: PayrollProfile;
  items: PayrollItem[];
  componentSummary: { key: string; name: string; type: string; employeeCount: number; amount: string }[];
  warnings: string[];
  totalNet: string;
  period: string;
  periodStart?: string;
  periodEnd?: string;
  scheduledPayDate?: string;
  salaryAllocation?: "MONTHLY_CALENDAR" | "LEGACY_MONTHLY";
  payDate: string;
  departmentId?: string;
  prorationPolicy?: "NONE" | "CALENDAR_DAYS";
};
export type PayrollRun = {
  id: string;
  profileId: string;
  profile: PayrollProfile;
  period: string;
  payDate: string;
  status: string;
  totalNet: string;
  employeeCount: number;
  preparedById: string;
  approvedById: string | null;
  snapshot: PayrollPreview;
  sandboxReference: string | null;
  sandboxStatus: string | null;
  closureReason?: string | null;
  closedById?: string | null;
  closedAt?: string | null;
};
export type PayrollWorkspace = {
  profiles: PayrollProfile[];
  structures: SalaryStructure[];
  assignments: SalaryAssignment[];
  claims: ExpenseClaim[];
  variableInputs: VariablePayInput[];
  runs: PayrollRun[];
  employees: (EmployeeSummary & { id: string; workLocationId: string | null })[];
  locations: { id: string; name: string; countryCode: string }[];
  departments: { id: string; name: string }[];
  records: {
    id: string;
    period: string;
    periodStart?: string;
    periodEnd?: string;
    currency: string;
    grossSalary: number;
    totalDeductions: number;
    netPay: number;
    status: string;
    employee: EmployeeSummary;
  }[];
};
export type RunInput = {
  profileId: string;
  period: string;
  payDate: string;
  departmentId?: string;
  prorationPolicy?: "NONE" | "CALENDAR_DAYS";
};
const base = "/api/organization/hrms/payroll";
export const payrollService = {
  workspace: (org: string) => tenantRequest<PayrollWorkspace>(org, `${base}/workspace`),
  calendar: (org: string, profileId: string, year: number) =>
    tenantRequest<PayrollCalendarPeriod[]>(org, `${base}/profiles/${pathSegment(profileId)}/periods?year=${year}`),
  profile: (org: string, input: ProfileInput) => tenantJsonRequest(org, `${base}/profiles`, "POST", input),
  verifyProfile: (org: string, id: string) =>
    tenantJsonRequest(org, `${base}/profiles/${pathSegment(id)}/verify`, "PATCH", {}),
  structure: (org: string, input: { profileId: string; name: string; components: SalaryComponent[] }) =>
    tenantJsonRequest(org, `${base}/structures`, "POST", input),
  assign: (
    org: string,
    input: { employeeId: string; structureId: string; monthlyGross: string; effectiveFrom: string },
  ) => tenantJsonRequest(org, `${base}/assignments`, "POST", input),
  claim: (
    org: string,
    input: {
      employeeId: string;
      title: string;
      amount: string;
      currency: string;
      expenseDate: string;
      receiptReference: string;
    },
  ) => tenantJsonRequest(org, `${base}/claims`, "POST", input),
  approveClaim: (org: string, id: string) =>
    tenantJsonRequest(org, `${base}/claims/${pathSegment(id)}/approve`, "PATCH", {}),
  variableInput: (org: string, input: VariablePayRequest) =>
    tenantJsonRequest(org, `${base}/variable-inputs`, "POST", input),
  decideVariable: (org: string, id: string, decision: "approve" | "reject" | "cancel") =>
    tenantJsonRequest(org, `${base}/variable-inputs/${pathSegment(id)}/${decision}`, "POST", {}),
  preview: (org: string, input: RunInput) =>
    tenantJsonRequest<PayrollPreview, RunInput>(org, `${base}/runs/preview`, "POST", input),
  run: (org: string, input: RunInput) => tenantJsonRequest<PayrollRun, RunInput>(org, `${base}/runs`, "POST", input),
  approve: (org: string, id: string) => tenantJsonRequest(org, `${base}/runs/${pathSegment(id)}/approve`, "PATCH", {}),
  process: (org: string, id: string) => tenantJsonRequest(org, `${base}/runs/${pathSegment(id)}/process`, "POST", {}),
  closeDraft: (org: string, id: string, action: "cancel" | "reject", reason: string) =>
    tenantJsonRequest(org, `${base}/runs/${pathSegment(id)}/${action}`, "POST", { reason }),
  sandbox: (org: string, id: string, action: "SUBMIT" | "SETTLE" | "FAIL") =>
    tenantJsonRequest(org, `${base}/runs/${pathSegment(id)}/sandbox-payment`, "POST", { action, confirmSandbox: true }),
};
