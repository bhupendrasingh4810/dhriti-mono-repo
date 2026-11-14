import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { HrmsPayroll } from "../../payroll";
import { PayrollForm, PayrollPeriodPicker } from "../../payroll-forms";
import { PayrollTable, downloadPayrollCsv } from "../../payroll-tables";
import {
  payrollService,
  type PayrollProfile,
  type PayrollRun,
  type PayrollWorkspace,
} from "@/services/payroll.service";

const auth = vi.hoisted(() => ({ organizationId: "org-a", manage: true }));
vi.mock("@/hooks/use-auth", () => ({ useAuth: () => ({ user: { organization: { id: auth.organizationId } } }) }));
vi.mock("@/hooks/use-permissions", () => ({ usePermissions: () => ({ can: () => auth.manage }) }));
vi.mock("@/services/payroll.service", () => ({
  payrollService: {
    workspace: vi.fn(),
    calendar: vi.fn(),
    profile: vi.fn(),
    verifyProfile: vi.fn(),
    structure: vi.fn(),
    assign: vi.fn(),
    claim: vi.fn(),
    approveClaim: vi.fn(),
    preview: vi.fn(),
    run: vi.fn(),
    approve: vi.fn(),
    process: vi.fn(),
    sandbox: vi.fn(),
    variableInput: vi.fn(),
    decideVariable: vi.fn(),
    closeDraft: vi.fn(),
  },
}));

const profile: PayrollProfile = {
  id: "profile-a",
  name: "India payroll",
  countryCode: "IN",
  currency: "INR",
  minorUnits: 2,
  frequency: "MONTHLY",
  employmentModel: "EMPLOYEE",
  workLocationId: null,
  registration: null,
  rulesVerified: true,
  effectiveFrom: "2026-01-01",
};
const item = {
  employeeId: "employee-a",
  employeeNumber: "E001",
  name: "Payroll Employee",
  assignmentId: "assignment-a",
  gross: "10000.00",
  deductions: "1000.00",
  employer: "500.00",
  monthlyCtc: "10500.00",
  annualCtc: "126000.00",
  reimbursements: "100.00",
  net: "9100.00",
  claimIds: [],
  lines: [
    { code: "BASIC", name: "Basic", type: "EARNING", amount: "10000.00" },
    { code: "TAX", name: "Configured deduction", type: "DEDUCTION", amount: "1000.00" },
  ],
};
const run: PayrollRun = {
  id: "run-a",
  profileId: "profile-a",
  profile,
  period: "2026-11",
  payDate: "2026-11-30",
  status: "PROCESSED",
  totalNet: "9100.00",
  employeeCount: 1,
  preparedById: "preparer",
  approvedById: "approver",
  snapshot: {
    profile,
    items: [item],
    componentSummary: [{ key: "basic", name: "Basic", type: "EARNING", employeeCount: 1, amount: "10000.00" }],
    warnings: [],
    totalNet: "9100.00",
    period: "2026-11",
    payDate: "2026-11-30",
  },
  sandboxReference: null,
  sandboxStatus: null,
};
const workspace: PayrollWorkspace = {
  variableInputs: [],
  profiles: [profile],
  structures: [
    {
      id: "structure-a",
      name: "Standard salary",
      profileId: profile.id,
      profile,
      components: [{ code: "BASIC", name: "Basic", type: "EARNING", calculation: "REMAINDER", value: "0" }],
    },
  ],
  assignments: [
    {
      id: "assignment-a",
      employeeId: "employee-a",
      structureId: "structure-a",
      monthlyGross: "10000",
      effectiveFrom: "2026-01-01",
      employee: { employeeNumber: "E001", user: { name: "Payroll Employee" } },
      structure: { id: "structure-a", name: "Standard salary", profileId: profile.id, profile, components: [] },
      breakdown: { net: "9000.00", monthlyCtc: "10500.00", annualCtc: "126000.00" },
    },
  ],
  claims: [
    {
      id: "claim-a",
      employeeId: "employee-a",
      title: "Customer visit",
      amount: "100",
      currency: "INR",
      expenseDate: "2026-11-01",
      receiptReference: "DOC-123",
      status: "PENDING",
      runId: null,
      employee: { employeeNumber: "E001", user: { name: "Payroll Employee" } },
    },
  ],
  runs: [run],
  employees: [{ id: "employee-a", employeeNumber: "E001", user: { name: "Payroll Employee" }, workLocationId: null }],
  locations: [],
  departments: [{ id: "dept-a", name: "Engineering" }],
  records: [],
};
beforeAll(() => {
  // jsdom does not implement native modal dialog focus management.
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: {
      configurable: true,
      value() {
        this.setAttribute("open", "");
      },
    },
    close: {
      configurable: true,
      value() {
        this.removeAttribute("open");
      },
    },
  });
});
beforeEach(() => {
  vi.resetAllMocks();
  auth.organizationId = "org-a";
  auth.manage = true;
  vi.mocked(payrollService.workspace).mockResolvedValue(workspace);
  vi.mocked(payrollService.preview).mockResolvedValue(run.snapshot);
  vi.mocked(payrollService.run).mockResolvedValue({ ...run, status: "DRAFT" });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("payroll calendars", () => {
  const weekly: PayrollProfile = {
    ...profile,
    frequency: "WEEKLY",
    calendarAnchor: "2026-01-05",
    payDateOffset: 2,
    effectiveFrom: "2026-01-05",
  };
  const period = {
    key: "2026-11-02",
    start: "2026-11-02",
    end: "2026-11-08",
    payDate: "2026-11-10",
    frequency: "WEEKLY",
  };
  it.each(["WEEKLY", "BIWEEKLY", "SEMIMONTHLY"] as const)(
    "uses API period choices and defaults pay dates for %s without altering other tabs",
    async (frequency) => {
      const configured = {
        ...weekly,
        frequency,
        effectiveFrom: frequency === "SEMIMONTHLY" ? "2026-01-01" : weekly.effectiveFrom,
      };
      const selectedPeriod =
        frequency === "BIWEEKLY"
          ? { ...period, key: "2026-11-09", start: "2026-11-09", end: "2026-11-22", payDate: "2026-11-24", frequency }
          : frequency === "SEMIMONTHLY"
            ? { ...period, key: "2026-11-01", start: "2026-11-01", end: "2026-11-15", payDate: "2026-11-17", frequency }
            : period;
      vi.mocked(payrollService.workspace).mockResolvedValue({ ...workspace, profiles: [configured] });
      vi.mocked(payrollService.calendar).mockResolvedValue([selectedPeriod]);
      render(<HrmsPayroll onToast={vi.fn()} />);
      await screen.findByText("1 employees");
      fireEvent.click(screen.getByRole("button", { name: "Start payroll run" }));
      const dialog = screen.getByRole("dialog", { name: "Start payroll run" });
      await waitFor(() => expect(within(dialog).getByLabelText("Payroll period")).toBeEnabled());
      fireEvent.change(within(dialog).getByLabelText("Payroll period"), { target: { value: selectedPeriod.key } });
      expect(within(dialog).getByLabelText("Pay date")).toHaveValue(selectedPeriod.payDate);
      expect(within(dialog).getByLabelText("Proration policy")).toBeDisabled();
      expect(within(dialog).queryByRole("option", { name: "Full-month only (legacy)" })).not.toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
      await waitFor(() =>
        expect(payrollService.preview).toHaveBeenCalledWith("org-a", {
          profileId: configured.id,
          period: selectedPeriod.key,
          payDate: selectedPeriod.payDate,
          prorationPolicy: "CALENDAR_DAYS",
        }),
      );
    },
  );
  it("reviews a saved non-monthly run without fetching a mutable calendar or changing its dates/policy", async () => {
    vi.mocked(payrollService.workspace).mockResolvedValue({
      ...workspace,
      profiles: [weekly],
      runs: [
        {
          ...run,
          profile: weekly,
          period: period.key,
          payDate: period.payDate,
          status: "APPROVED",
          snapshot: {
            ...run.snapshot,
            profile: weekly,
            period: period.key,
            payDate: period.payDate,
            periodStart: period.start,
            periodEnd: period.end,
            prorationPolicy: "CALENDAR_DAYS",
            salaryAllocation: "MONTHLY_CALENDAR",
          },
        },
      ],
    });
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("tab", { name: "Run payroll" }));
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByLabelText("Payroll period")).toHaveValue(period.key);
    expect(screen.getByLabelText("Payroll period")).toBeDisabled();
    expect(screen.getByLabelText("Pay date")).toHaveValue(period.payDate);
    expect(screen.getByLabelText("Proration policy")).toHaveValue("CALENDAR_DAYS");
    expect(payrollService.calendar).not.toHaveBeenCalled();
  });
  it("shows the saved calendar basis in payslips and appends real dates and allocation to register exports", async () => {
    vi.mocked(payrollService.workspace).mockResolvedValue({
      ...workspace,
      profiles: [weekly],
      runs: [
        {
          ...run,
          profile: weekly,
          period: period.key,
          payDate: period.payDate,
          snapshot: {
            ...run.snapshot,
            profile: weekly,
            period: period.key,
            payDate: period.payDate,
            periodStart: period.start,
            periodEnd: period.end,
            scheduledPayDate: period.payDate,
            salaryAllocation: "MONTHLY_CALENDAR",
            items: [
              {
                ...item,
                proration: {
                  policy: "CALENDAR_DAYS",
                  allocation: "MONTHLY_CALENDAR",
                  periodDays: 7,
                  employmentDays: 7,
                  unpaidDays: 0,
                  segments: [
                    {
                      assignmentId: "assignment-a",
                      effectiveFrom: "2026-01-05",
                      monthlyGross: "10000.00",
                      calendarDays: 7,
                      unpaidDays: 0,
                      payableDays: 7,
                      month: "2026-11",
                      monthDays: 30,
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    });
    const create = vi.fn().mockReturnValue("blob:calendar-dates");
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      render(<HrmsPayroll onToast={vi.fn()} />);
      await screen.findByText("1 employees");
      fireEvent.click(screen.getByRole("tab", { name: "Payslips" }));
      fireEvent.click(screen.getByRole("button", { name: "Export payroll register" }));
      const reader = new FileReader();
      const csv = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(create.mock.calls[0][0]);
      });
      expect(csv).toContain(
        '"Period start","Period end","Frequency","Salary allocation","Scheduled pay date","Selected pay date","Calendar allocation basis"',
      );
      expect(csv).toContain('"2026-11-02","2026-11-08","WEEKLY","MONTHLY_CALENDAR","2026-11-10","2026-11-10"');
      expect(csv).toContain("assignment-a: 2026-11; 10000.00/month; 7/30 days");
      fireEvent.click(screen.getByRole("button", { name: "View payslip" }));
      expect(screen.getByRole("dialog", { name: "Payslip" })).toHaveTextContent(
        "Period 2026-11-02 through 2026-11-08 · Weekly.",
      );
      expect(screen.getByRole("dialog", { name: "Payslip" })).toHaveTextContent(
        "2026-11: 7 payable / 30 calendar days",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });
  it("shows a searchable, sortable calendar table with its year and configured pay dates", async () => {
    vi.mocked(payrollService.calendar).mockResolvedValue([period]);
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("tab", { name: "Configuration" }));
    fireEvent.change(screen.getByLabelText("Calendar pay group"), { target: { value: profile.id } });
    const table = await screen.findByRole("table", { name: "Payroll calendar" });
    await waitFor(() => expect(within(table).getByText("2026-11-10")).toBeInTheDocument());
    expect(screen.getByRole("region", { name: "Payroll calendar table" })).toHaveClass("overflow-auto");
    fireEvent.change(screen.getByLabelText("Calendar year"), { target: { value: "2027" } });
    await waitFor(() => expect(payrollService.calendar).toHaveBeenLastCalledWith("org-a", profile.id, 2027));
  });
  it("surfaces API calendar failures, retries explicitly and validates the year inline", async () => {
    vi.mocked(payrollService.calendar).mockRejectedValueOnce(new Error("Calendar unavailable"));
    render(<PayrollPeriodPicker organizationId="org-a" profile={weekly} value="" onChange={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Calendar unavailable");
    expect(screen.getByLabelText("Payroll period")).toBeDisabled();
    vi.mocked(payrollService.calendar).mockResolvedValueOnce([period]);
    fireEvent.click(screen.getByRole("button", { name: "Retry calendar" }));
    await waitFor(() => expect(screen.getByLabelText("Payroll period")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Calendar year"), { target: { value: "999" } });
    expect(screen.getByLabelText("Calendar year")).toHaveClass("border-error");
    expect(screen.getByText("Enter a year between 1000 and 9998.")).toBeInTheDocument();
    expect(screen.getByLabelText("Payroll period")).toBeDisabled();
  });
  it("does not display a late calendar response after the tenant changes", async () => {
    let resolveOld!: (value: (typeof period)[]) => void;
    vi.mocked(payrollService.calendar)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveOld = resolve;
        }),
      )
      .mockResolvedValueOnce([]);
    const { rerender } = render(
      <PayrollPeriodPicker organizationId="org-a" profile={weekly} value="" onChange={vi.fn()} />,
    );
    rerender(<PayrollPeriodPicker organizationId="org-b" profile={weekly} value="" onChange={vi.fn()} />);
    await screen.findByText(/No periods starting/);
    resolveOld([period]);
    await waitFor(() => expect(screen.queryByRole("option", { name: /2026-11-02/ })).not.toBeInTheDocument());
  });
  it("validates calendar fields before saving a weekly profile and sends typed settings", async () => {
    const complete = vi.fn();
    render(<PayrollForm kind="profile" organizationId="org-a" data={workspace} close={vi.fn()} complete={complete} />);
    fireEvent.change(screen.getByLabelText("Profile name"), { target: { value: "Weekly India" } });
    fireEvent.change(screen.getByLabelText("Pay frequency"), { target: { value: "WEEKLY" } });
    fireEvent.change(screen.getByLabelText("Effective from"), { target: { value: "2026-01-05" } });
    fireEvent.change(screen.getByLabelText("Pay-date offset (calendar days)"), { target: { value: "61" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Calendar anchor (cycle start)")).toHaveClass("border-error");
    expect(screen.getByLabelText("Pay-date offset (calendar days)")).toHaveClass("border-error");
    expect(payrollService.profile).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText("Calendar anchor (cycle start)"), { target: { value: "2026-01-05" } });
    fireEvent.change(screen.getByLabelText("Pay-date offset (calendar days)"), { target: { value: "2" } });
    vi.mocked(payrollService.profile).mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(payrollService.profile).toHaveBeenCalledWith(
      "org-a",
      expect.objectContaining({ frequency: "WEEKLY", calendarAnchor: "2026-01-05", payDateOffset: 2 }),
    );
  });
  it("targets a non-monthly variable input at one API-defined period rather than repeating a month amount", async () => {
    vi.mocked(payrollService.calendar).mockResolvedValue([period]);
    render(
      <PayrollForm
        kind="variable"
        organizationId="org-a"
        data={{ ...workspace, profiles: [weekly] }}
        close={vi.fn()}
        complete={vi.fn()}
      />,
    );
    for (const [label, value] of [
      ["Employee", "employee-a"],
      ["Payroll profile", weekly.id],
      ["Input name", "Weekly award"],
      ["Reason / source reference", "Finance award"],
      ["Amount per period", "100"],
    ]) {
      // The amount label changes only after selecting the profile.
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    }
    await waitFor(() => expect(screen.getByLabelText("Payroll period")).toBeEnabled());
    fireEvent.change(screen.getByLabelText("Payroll period"), { target: { value: period.key } });
    vi.mocked(payrollService.variableInput).mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(payrollService.variableInput).toHaveBeenCalledWith(
        "org-a",
        expect.objectContaining({
          targetPeriod: period.key,
          startPeriod: "2026-11",
          endPeriod: "2026-11",
          rate: "100",
          quantity: "1",
          multiplier: "1",
        }),
      ),
    );
    expect(screen.queryByLabelText("Start month")).not.toBeInTheDocument();
  });
  it("uses configured monthly pay-date offsets only when requested and leaves legacy drafts unchanged", async () => {
    vi.mocked(payrollService.calendar).mockResolvedValue([
      {
        ...period,
        key: "2026-11",
        start: "2026-11-01",
        end: "2026-11-30",
        payDate: "2026-12-03",
        frequency: "MONTHLY",
      },
    ]);
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("button", { name: "Start payroll run" }));
    fireEvent.change(screen.getByLabelText("Payroll period"), { target: { value: "2026-11" } });
    fireEvent.click(screen.getByRole("button", { name: "Use scheduled pay date" }));
    await waitFor(() => expect(screen.getByLabelText("Pay date")).toHaveValue("2026-12-03"));
  });
});

describe("payroll workspace", () => {
  it("preserves salary assignments while showing input history and surfaces decision errors before reloading on success", async () => {
    vi.mocked(payrollService.workspace).mockResolvedValue({
      ...workspace,
      variableInputs: [
        {
          id: "input-a",
          employeeId: "employee-a",
          profileId: profile.id,
          name: "Performance bonus",
          type: "EARNING",
          calculation: "FIXED",
          quantity: "1",
          rate: "1000",
          multiplier: "1",
          amount: "1000.00",
          startPeriod: "2026-11",
          endPeriod: "2026-11",
          reason: "Finance award",
          status: "PENDING",
          createdById: "preparer",
          profile,
          employee: workspace.assignments[0].employee,
        },
      ],
    });
    const toast = vi.fn();
    render(<HrmsPayroll onToast={toast} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("tab", { name: "Employee salary" }));
    expect(screen.getByRole("table", { name: "Employee salary" })).toBeInTheDocument();
    expect(
      within(screen.getByRole("table", { name: "Variable pay inputs" })).getByText("Performance bonus"),
    ).toBeInTheDocument();
    vi.mocked(payrollService.decideVariable).mockRejectedValueOnce(
      new Error("A different payroll approver must decide this input"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Approve input" }));
    expect(await screen.findByText("A different payroll approver must decide this input")).toBeInTheDocument();
    expect(toast).not.toHaveBeenCalled();
    vi.mocked(payrollService.decideVariable).mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Approve input" }));
    await waitFor(() => expect(payrollService.workspace).toHaveBeenCalledTimes(2));
    expect(payrollService.decideVariable).toHaveBeenLastCalledWith("org-a", "input-a", "approve");
    expect(toast).toHaveBeenCalledWith("Variable pay input approved");
  });

  it("requires a source reason, validates hours as one month and sends explicit decimal inputs", async () => {
    const complete = vi.fn();
    render(<PayrollForm kind="variable" organizationId="org-a" data={workspace} close={vi.fn()} complete={complete} />);
    const set = (label: string, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
    set("Employee", "employee-a");
    set("Payroll profile", profile.id);
    set("Input name", "Overtime");
    set("Calculation", "HOURS");
    set("Approved hours", "10.5");
    set("Hourly rate", "125.25");
    set("Rate multiplier", "1.5");
    set("Start month", "2026-11");
    set("End month (inclusive)", "2026-12");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Reason / source reference")).toHaveClass("border-error");
    expect(screen.getByText("Hours must apply to a single month.")).toBeInTheDocument();
    expect(payrollService.variableInput).not.toHaveBeenCalled();
    set("End month (inclusive)", "2026-11");
    set("Reason / source reference", "Approved timesheet TS-100");
    vi.mocked(payrollService.variableInput).mockResolvedValueOnce({});
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(payrollService.variableInput).toHaveBeenCalledWith("org-a", {
      employeeId: "employee-a",
      profileId: profile.id,
      name: "Overtime",
      type: "EARNING",
      calculation: "HOURS",
      quantity: "10.5",
      rate: "125.25",
      multiplier: "1.5",
      startPeriod: "2026-11",
      endPeriod: "2026-11",
      reason: "Approved timesheet TS-100",
    });
  });

  it("reports all salary deltas and exports immutable variable input calculation basis", async () => {
    const variance = {
      previousRecordId: "prior",
      previousPeriod: "2026-10",
      currency: "INR",
      previousGross: "9000.00",
      previousDeductions: "1000.00",
      previousNet: "8100.00",
      grossDelta: "1000.00",
      deductionsDelta: "0.00",
      netDelta: "1000.00",
      netPercent: "12.35",
    };
    vi.mocked(payrollService.workspace).mockResolvedValue({
      ...workspace,
      runs: [
        {
          ...run,
          snapshot: {
            ...run.snapshot,
            items: [
              {
                ...item,
                variance,
                periodEmployerCost: "10500.00",
                variableInputs: [
                  {
                    id: "input-a",
                    name: "Bonus",
                    type: "EARNING",
                    calculation: "FIXED",
                    quantity: "1",
                    rate: "1000",
                    multiplier: "1",
                    amount: "1000.00",
                    reason: "Finance award",
                  },
                ],
              },
            ],
          },
        },
      ],
    });
    const create = vi.fn().mockReturnValue("blob:variable-register");
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      render(<HrmsPayroll onToast={vi.fn()} />);
      await screen.findByText("1 employees");
      fireEvent.click(screen.getByRole("tab", { name: "Reports" }));
      const report = screen.getByRole("table", { name: "Reports" });
      expect(within(report).getByRole("columnheader", { name: /Gross change/ })).toBeInTheDocument();
      expect(within(report).getByText("1000.00 (12.35%)")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Export payroll register" }));
      const reader = new FileReader();
      const csv = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(create.mock.calls[0][0]);
      });
      expect(csv).toContain('"Previous period","Previous net","Gross change"');
      expect(csv).toContain("input-a: Bonus; FIXED; 1 x 1000 x 1 = 1000.00; Finance award");
      expect(csv).toContain('"2026-10","8100.00","1000.00","0.00","1000.00","12.35"');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("shows and exports the approved calendar-day basis in payslips and the payroll register", async () => {
    const proration = {
      policy: "CALENDAR_DAYS" as const,
      periodDays: 30,
      employmentDays: 20,
      unpaidDays: 1,
      segments: [
        {
          assignmentId: "assignment-a",
          effectiveFrom: "2026-01-01",
          monthlyGross: "10000.00",
          calendarDays: 20,
          unpaidDays: 1,
          payableDays: 19,
        },
      ],
    };
    vi.mocked(payrollService.workspace).mockResolvedValue({
      ...workspace,
      runs: [
        { ...run, snapshot: { ...run.snapshot, prorationPolicy: "CALENDAR_DAYS", items: [{ ...item, proration }] } },
      ],
    });
    const create = vi.fn().mockReturnValue("blob:calendar-register");
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    try {
      render(<HrmsPayroll onToast={vi.fn()} />);
      await screen.findByText("1 employees");
      fireEvent.click(screen.getByRole("tab", { name: "Payslips" }));
      expect(screen.getByText("19 / 30")).toBeInTheDocument();
      fireEvent.click(screen.getByRole("button", { name: "Export payroll register" }));
      const reader = new FileReader();
      const csv = await new Promise<string>((resolve) => {
        reader.onload = () => resolve(String(reader.result));
        reader.readAsText(create.mock.calls[0][0]);
      });
      expect(csv).toContain('"Proration policy","Period days","Employment days","Unpaid days","Payable days"');
      expect(csv).toContain('"CALENDAR_DAYS","30","20","1","19"');
      fireEvent.click(screen.getByRole("button", { name: "View payslip" }));
      expect(screen.getByRole("dialog", { name: "Payslip" })).toHaveTextContent(
        "Calendar-day policy: 20 employed days - 1 unpaid = 19 payable / 30 period days.",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("defaults new payroll to calendar days while preserving the original policy of saved drafts", async () => {
    vi.mocked(payrollService.workspace).mockResolvedValue({ ...workspace, runs: [{ ...run, status: "DRAFT" }] });
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("button", { name: "Start payroll run" }));
    expect(screen.getByLabelText("Proration policy")).toHaveValue("CALENDAR_DAYS");
    fireEvent.click(screen.getByRole("button", { name: "Close payroll run" }));
    fireEvent.click(screen.getByRole("tab", { name: "Run payroll" }));
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(screen.getByLabelText("Proration policy")).toHaveValue("NONE");
    expect(screen.getByLabelText("Proration policy")).toBeDisabled();
  });

  it.each(["Cancel", "Reject"] as const)(
    "requires a reason to %s a draft and reloads history after the API succeeds",
    async (label) => {
      vi.mocked(payrollService.workspace).mockResolvedValue({ ...workspace, runs: [{ ...run, status: "DRAFT" }] });
      const toast = vi.fn();
      render(<HrmsPayroll onToast={toast} />);
      await screen.findByText("1 employees");
      fireEvent.click(screen.getByRole("tab", { name: "Run payroll" }));
      fireEvent.click(screen.getByRole("button", { name: `${label} draft` }));
      const dialog = screen.getByRole("dialog", { name: `${label} payroll draft` });
      fireEvent.click(within(dialog).getByRole("button", { name: `${label} payroll draft` }));
      expect(within(dialog).getByRole("alert")).toHaveTextContent("Enter a reason");
      expect(within(dialog).getByLabelText("Reason")).toHaveClass("border-error");
      expect(payrollService.closeDraft).not.toHaveBeenCalled();
      fireEvent.change(within(dialog).getByLabelText("Reason"), {
        target: { value: "  Salary input needs correcting  " },
      });
      vi.mocked(payrollService.closeDraft).mockRejectedValueOnce(new Error("Run is no longer a draft"));
      fireEvent.click(within(dialog).getByRole("button", { name: `${label} payroll draft` }));
      expect(await within(dialog).findByText("Run is no longer a draft")).toBeInTheDocument();
      expect(toast).not.toHaveBeenCalled();
      vi.mocked(payrollService.closeDraft).mockResolvedValueOnce({});
      fireEvent.click(within(dialog).getByRole("button", { name: `${label} payroll draft` }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(payrollService.closeDraft).toHaveBeenLastCalledWith(
        "org-a",
        run.id,
        label.toLowerCase(),
        "Salary input needs correcting",
      );
      expect(payrollService.workspace).toHaveBeenCalledTimes(2);
    },
  );

  it("keeps closed drafts visible but does not offer cancellation, approval, or payment actions", async () => {
    vi.mocked(payrollService.workspace).mockResolvedValue({
      ...workspace,
      runs: [{ ...run, status: "CANCELLED", closureReason: "Incorrect salary" }],
    });
    render(<HrmsPayroll onToast={vi.fn()} />);
    await waitFor(() => expect(screen.getByRole("button", { name: "Start payroll run" })).toBeEnabled());
    fireEvent.click(screen.getByRole("tab", { name: "Run payroll" }));
    expect(screen.getByText("CANCELLED")).toBeInTheDocument();
    expect(screen.getByText("Incorrect salary")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Cancel draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reject draft" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Initiate bank payment (sandbox)" })).not.toBeInTheDocument();
  });

  it("keeps every tab's full-width content below, not inside, the wrapping navigation header", async () => {
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    const navigation = screen.getByRole("tablist", { name: "Payroll sections" });
    const header = navigation.parentElement!;
    const start = screen.getByRole("button", { name: "Start payroll run" });
    expect(header).toContainElement(start);
    expect(header).toHaveClass("flex", "flex-wrap");
    const tablesByTab = [
      ["Dashboard", ["Payroll run checklist"]],
      ["Configuration", ["Payroll profiles"]],
      ["Salary structures", ["Salary structures"]],
      ["Employee salary", ["Employee salary"]],
      ["Reimbursements", ["Reimbursements"]],
      ["Run payroll", ["Payroll runs", "Employee payroll records (existing API)"]],
      ["Payslips", ["Payslips"]],
      ["Reports", ["Reports"]],
    ] as const;
    for (const [tab, tables] of tablesByTab) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      const panel = screen.getByRole("tabpanel", { name: tab });
      expect(panel.parentElement).toBe(header.parentElement);
      expect(header.nextElementSibling).toBe(panel);
      expect(header).not.toContainElement(panel);
      expect(panel).not.toContainElement(start);
      expect(panel).toHaveClass("w-full", "min-w-0");
      expect(panel).not.toHaveClass("flex", "flex-wrap");
      expect(panel).toContainElement(screen.getByText("Total payout"));
      for (const label of tables) {
        const table = within(panel).getByRole("table", { name: label });
        const scroll = within(panel).getByRole("region", { name: `${label} table` });
        expect(scroll).toContainElement(table);
        expect(scroll.parentElement).toHaveClass("w-full", "min-w-0");
        expect(header).not.toContainElement(table);
      }
    }
  });

  it("supports keyboard navigation through workflow-ordered tabs", async () => {
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    const dashboard = screen.getByRole("tab", { name: "Dashboard" });
    fireEvent.keyDown(dashboard, { key: "ArrowRight" });
    const configuration = screen.getByRole("tab", { name: "Configuration" });
    expect(configuration).toHaveAttribute("aria-selected", "true");
    expect(configuration).toHaveFocus();
    expect(screen.getByRole("tabpanel", { name: "Configuration" })).toBeInTheDocument();
    fireEvent.keyDown(configuration, { key: "End" });
    const reports = screen.getByRole("tab", { name: "Reports" });
    expect(reports).toHaveFocus();
    fireEvent.keyDown(reports, { key: "ArrowRight" });
    expect(dashboard).toHaveFocus();
    fireEvent.keyDown(dashboard, { key: "ArrowLeft" });
    expect(reports).toHaveFocus();
    fireEvent.keyDown(reports, { key: "Home" });
    expect(dashboard).toHaveFocus();
  });

  it("preserves original tabs, dashboard cards and checklist without demo payroll values", async () => {
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    const tabOrder = [
      "Dashboard",
      "Configuration",
      "Salary structures",
      "Employee salary",
      "Reimbursements",
      "Run payroll",
      "Payslips",
      "Reports",
    ];
    expect(
      within(screen.getByRole("tablist", { name: "Payroll sections" }))
        .getAllByRole("tab")
        .map((tab) => tab.textContent),
    ).toEqual(tabOrder);
    for (const name of tabOrder) {
      expect(screen.getByRole("tab", { name })).toBeInTheDocument();
    }
    expect(screen.getByRole("tab", { name: "Dashboard" })).toHaveClass("rounded-md", "bg-brand/10", "text-brand");
    expect(screen.getByRole("tabpanel", { name: "Dashboard" })).toBeInTheDocument();
    for (const name of [
      "Total payout",
      "Payroll status",
      "Payslips",
      "Reimbursements",
      "Validate attendance",
      "Review variable pay",
      "Leadership approval",
      "Bank processing",
    ]) {
      expect(screen.getAllByText(name).length).toBeGreaterThan(0);
    }
    expect(screen.queryByText("₹4.82 Cr")).not.toBeInTheDocument();
    expect(payrollService.workspace).toHaveBeenCalledWith("org-a");
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("group", { name: "Payroll run checklist filters" })).toBeInTheDocument();
  });

  it("loads every previously missing tab from API-backed data", async () => {
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    for (const [tab, content] of [
      ["Salary structures", "Standard salary"],
      ["Employee salary", "E001 · Payroll Employee"],
      ["Reimbursements", "Customer visit"],
      ["Run payroll", "India payroll"],
      ["Configuration", "India payroll"],
    ]) {
      fireEvent.click(screen.getByRole("tab", { name: tab }));
      expect(screen.getAllByText(content).length).toBeGreaterThan(0);
    }
    fireEvent.click(screen.getByRole("tab", { name: "Payslips" }));
    fireEvent.click(screen.getByRole("button", { name: "View payslip" }));
    expect(screen.getByRole("dialog", { name: "Payslip" })).toHaveTextContent("Configured deduction");
    expect(
      screen.getByText("Payroll finalized, not proof of bank payment. Sandbox payments move no funds."),
    ).toBeInTheDocument();
  });

  it("shows loading failures explicitly and retries the workspace API", async () => {
    vi.mocked(payrollService.workspace).mockRejectedValueOnce(new Error("Payroll unavailable"));
    render(<HrmsPayroll onToast={vi.fn()} />);
    expect(await screen.findByRole("alert")).toHaveTextContent("Payroll unavailable");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByText("1 employees");
    expect(payrollService.workspace).toHaveBeenCalledTimes(2);
  });

  it("keeps all six drawer steps, validates required dates, and uses the selected department in preview", async () => {
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("button", { name: "Start payroll run" }));
    const dialog = screen.getByRole("dialog", { name: "Start payroll run" });
    for (const name of ["Period & scope", "Validate inputs", "Salary review", "Exceptions", "Approvals", "Process"]) {
      expect(within(dialog).getByText(name)).toBeInTheDocument();
    }
    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
    expect(within(dialog).getByText("Pay date is required.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Pay date")).toHaveClass("border-error");
    fireEvent.change(within(dialog).getByLabelText("Payroll period"), { target: { value: "2026-11" } });
    fireEvent.change(within(dialog).getByLabelText("Pay date"), { target: { value: "2026-11-30" } });
    fireEvent.change(within(dialog).getByLabelText("Employee scope"), { target: { value: "dept-a" } });
    fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
    await waitFor(() =>
      expect(payrollService.preview).toHaveBeenCalledWith(
        "org-a",
        expect.objectContaining({
          profileId: "profile-a",
          departmentId: "dept-a",
          period: "2026-11",
          payDate: "2026-11-30",
        }),
      ),
    );
    expect(await within(dialog).findByText(/missing attendance and overtime/)).toBeInTheDocument();
  });

  it("persists draft payroll rather than displaying a fake success", async () => {
    const toast = vi.fn();
    render(<HrmsPayroll onToast={toast} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("button", { name: "Start payroll run" }));
    fireEvent.change(screen.getByLabelText("Pay date"), { target: { value: "2026-11-30" } });
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() =>
      expect(payrollService.run).toHaveBeenCalledWith("org-a", expect.objectContaining({ payDate: "2026-11-30" })),
    );
    expect(toast).toHaveBeenCalledWith("Payroll draft saved");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reviews locked inputs and requires final confirmation before processing an approved payroll", async () => {
    vi.mocked(payrollService.workspace).mockResolvedValue({ ...workspace, runs: [{ ...run, status: "APPROVED" }] });
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("tab", { name: "Run payroll" }));
    fireEvent.click(screen.getByRole("button", { name: "Review" }));
    const dialog = screen.getByRole("dialog", { name: "Start payroll run" });
    for (const step of ["Validate inputs", "Salary review", "Exceptions", "Approvals", "Process"]) {
      fireEvent.click(within(dialog).getByRole("button", { name: "Next" }));
      await waitFor(() => expect(dialog.querySelector('li[aria-current="step"]')).toHaveTextContent(step));
    }
    fireEvent.click(within(dialog).getByRole("button", { name: "Process payroll" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Confirm that you want");
    expect(payrollService.process).not.toHaveBeenCalled();
    fireEvent.click(within(dialog).getByRole("checkbox", { name: "I confirm processing this approved payroll." }));
    fireEvent.click(within(dialog).getByRole("button", { name: "Process payroll" }));
    await waitFor(() => expect(payrollService.process).toHaveBeenCalledWith("org-a", "run-a"));
    expect(payrollService.preview).not.toHaveBeenCalled();
  });

  it("requires explicit sandbox confirmation and never initiates real transfers", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    fireEvent.click(screen.getByRole("tab", { name: "Run payroll" }));
    fireEvent.click(screen.getByRole("button", { name: "Initiate bank payment (sandbox)" }));
    expect(payrollService.sandbox).not.toHaveBeenCalled();
    confirm.mockReturnValue(true);
    fireEvent.click(screen.getByRole("button", { name: "Initiate bank payment (sandbox)" }));
    await waitFor(() => expect(payrollService.sandbox).toHaveBeenCalledWith("org-a", "run-a", "SUBMIT"));
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining("No real funds"));
  });

  it("disables manage actions without payroll permission and clears tenant-local views on organization switch", async () => {
    auth.manage = false;
    const { rerender } = render(<HrmsPayroll onToast={vi.fn()} />);
    await screen.findByText("1 employees");
    expect(screen.getByRole("button", { name: "Start payroll run" })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: "Salary structures" }));
    expect(screen.getByRole("button", { name: "Add salary structure" })).toBeDisabled();
    auth.organizationId = "org-b";
    vi.mocked(payrollService.workspace).mockResolvedValue({ ...workspace, runs: [], structures: [] });
    rerender(<HrmsPayroll onToast={vi.fn()} />);
    expect(screen.queryByText("Standard salary")).not.toBeInTheDocument();
    await waitFor(() => expect(payrollService.workspace).toHaveBeenCalledWith("org-b"));
  });
});

describe("payroll forms and tables", () => {
  it("uses country/currency dropdowns, clears stale locations, and derives ISO currency precision", async () => {
    const complete = vi.fn();
    render(
      <PayrollForm
        kind="profile"
        data={{
          ...workspace,
          locations: [
            { id: "bengaluru", name: "Bengaluru", countryCode: "IN" },
            { id: "dubai", name: "Dubai", countryCode: "AE" },
          ],
        }}
        organizationId="org-a"
        close={vi.fn()}
        complete={complete}
      />,
    );
    const country = screen.getByRole("combobox", { name: "Country" });
    const currency = screen.getByRole("combobox", { name: "Currency" });
    expect(country).toHaveValue("IN");
    expect(within(country).getByRole("option", { name: "United Arab Emirates (AE)" })).toBeInTheDocument();
    expect(within(country).getByRole("option", { name: "Germany (DE)" })).toBeInTheDocument();
    expect(currency).toHaveValue("INR");
    const location = screen.getByRole("combobox", { name: "Work location (optional)" });
    fireEvent.change(location, { target: { value: "bengaluru" } });
    fireEvent.change(country, { target: { value: "AE" } });
    expect(location).toHaveValue("");
    expect(within(location).queryByRole("option", { name: "Bengaluru" })).not.toBeInTheDocument();
    expect(within(location).getByRole("option", { name: "Dubai" })).toBeInTheDocument();
    expect(currency).toHaveValue("INR");
    for (const [code, precision] of [
      ["JPY", "0"],
      ["KWD", "3"],
      ["AED", "2"],
    ]) {
      fireEvent.change(currency, { target: { value: code } });
      expect(screen.getByLabelText("Currency decimal places")).toHaveValue(precision);
    }
    expect(screen.getByLabelText("Currency decimal places")).toHaveAttribute("readonly");
    fireEvent.change(screen.getByLabelText("Profile name"), { target: { value: "UAE payroll" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(payrollService.profile).toHaveBeenCalledWith(
        "org-a",
        expect.objectContaining({
          countryCode: "AE",
          currency: "AED",
          minorUnits: 2,
          name: "UAE payroll",
        }),
      ),
    );
    expect(complete).toHaveBeenCalledOnce();
  });

  it("uses the same currency dropdown for claims and shows missing selections inline", () => {
    render(<PayrollForm kind="claim" data={workspace} organizationId="org-a" close={vi.fn()} complete={vi.fn()} />);
    const currency = screen.getByRole("combobox", { name: "Currency" });
    fireEvent.change(currency, { target: { value: "USD" } });
    expect(currency).toHaveValue("USD");
    fireEvent.change(currency, { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(currency).toHaveAttribute("aria-invalid", "true");
    expect(currency).toHaveClass("border-error");
    expect(currency.closest("div")?.querySelector('[role="alert"]')).toHaveTextContent("This field is required.");
  });

  it("marks every missing required claim field inline and never calls the API with invalid data", () => {
    render(<PayrollForm kind="claim" data={workspace} organizationId="org-a" close={vi.fn()} complete={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    for (const name of ["Employee", "Expense description", "Amount", "Receipt / document reference"]) {
      expect(screen.getByLabelText(name)).toHaveClass("border-error");
      expect(screen.getByLabelText(name)).toHaveAttribute("aria-invalid", "true");
    }
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(3);
    expect(payrollService.claim).not.toHaveBeenCalled();
  });

  it("validates component fields inline before creating structures", () => {
    render(<PayrollForm kind="structure" data={workspace} organizationId="org-a" close={vi.fn()} complete={vi.fn()} />);
    fireEvent.change(screen.getByLabelText("Structure name"), { target: { value: "India salary" } });
    fireEvent.change(screen.getByLabelText("Payroll profile"), { target: { value: "profile-a" } });
    fireEvent.change(screen.getByLabelText("Component 1 name"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByLabelText("Component 1 name")).toHaveClass("border-error");
    expect(screen.getByText("Component name is required.")).toBeInTheDocument();
    expect(payrollService.structure).not.toHaveBeenCalled();
  });

  it("submits a salary assignment and surfaces API failures without closing the form", async () => {
    const complete = vi.fn();
    vi.mocked(payrollService.assign).mockRejectedValueOnce(new Error("Backdated arrears unsupported"));
    render(
      <PayrollForm kind="assignment" data={workspace} organizationId="org-a" close={vi.fn()} complete={complete} />,
    );
    fireEvent.change(screen.getByLabelText("Employee"), { target: { value: "employee-a" } });
    fireEvent.change(screen.getByLabelText("Salary structure"), { target: { value: "structure-a" } });
    fireEvent.change(screen.getByLabelText("Monthly gross"), { target: { value: "12345.50" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Backdated arrears unsupported");
    expect(payrollService.assign).toHaveBeenCalledWith(
      "org-a",
      expect.objectContaining({ monthlyGross: "12345.50", employeeId: "employee-a" }),
    );
    expect(complete).not.toHaveBeenCalled();
  });

  it("sorts and filters before compact pagination with scrolling confined to table content", () => {
    const rows = Array.from({ length: 25 }, (_, index) => ({
      id: String(index),
      name: `Employee ${String(index + 1).padStart(2, "0")}`,
    }));
    render(
      <PayrollTable
        label="Employees"
        rows={rows}
        rowKey={(row) => row.id}
        columns={[{ key: "name", label: "Name", value: (row) => row.name }]}
      />,
    );
    expect(screen.getByText("1-10 of 25")).toBeInTheDocument();
    const region = screen.getByRole("region", { name: "Employees table" });
    expect(region).toHaveClass("overflow-auto");
    expect(region).not.toContainElement(screen.getByRole("navigation"));
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("11-20 of 25")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("Employee 25");
    expect(screen.getByText("1-10 of 25")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Employee 01" } });
    expect(screen.getByText("1-1 of 1")).toBeInTheDocument();
  });

  it("sorts decimal amounts numerically and combines column filters with search", () => {
    const rows = [
      { id: "a", amount: "1000.20" },
      { id: "b", amount: "900.50" },
      { id: "c", amount: "1000.11" },
    ];
    render(
      <PayrollTable
        label="Amounts"
        rows={rows}
        rowKey={(row) => row.id}
        columns={[{ key: "amount", label: "Amount", value: (row) => row.amount }]}
      />,
    );
    expect(within(screen.getByRole("table")).getAllByRole("row")[1]).toHaveTextContent("900.50");
    expect(within(screen.getByRole("table")).getAllByRole("row")[2]).toHaveTextContent("1000.11");
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    fireEvent.change(screen.getByLabelText("Filter value"), { target: { value: "1000." } });
    expect(screen.getByText("1-2 of 2")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: ".20" } });
    expect(screen.getByText("1-1 of 1")).toBeInTheDocument();
  });

  it("uses a native modal dialog and supports keyboard cancellation", () => {
    const close = vi.fn();
    render(<PayrollForm kind="claim" data={workspace} organizationId="org-a" close={close} complete={vi.fn()} />);
    const dialog = screen.getByRole("dialog", { name: "Add reimbursement" });
    expect(dialog).toHaveAttribute("open");
    fireEvent(dialog, new Event("cancel", { cancelable: true }));
    expect(close).toHaveBeenCalledOnce();
  });

  it("escapes CSV formulas and quotes and revokes temporary download URLs", async () => {
    const create = vi.fn().mockReturnValue("blob:payroll-test");
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    downloadPayrollCsv("payroll.csv", [["=SUM(1,2)", 'A "name"', "+12"]]);
    const blob = create.mock.calls[0][0] as Blob;
    const reader = new FileReader();
    const text = await new Promise<string>((resolve) => {
      reader.onload = () => resolve(String(reader.result));
      reader.readAsText(blob);
    });

    expect(text).toContain(`"'=SUM(1,2)"`);
    expect(text).toContain('"A ""name"""');
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:payroll-test");
    vi.unstubAllGlobals();
  });
});
