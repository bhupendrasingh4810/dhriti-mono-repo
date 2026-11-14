"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  payrollService,
  type PayrollWorkspace,
  type PayrollPreview,
  type PayrollRun,
  type RunInput,
  type PayrollItem,
} from "@/services/payroll.service";
import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";
import {
  PayrollForm,
  PayrollField,
  PayrollDialog,
  PayrollRunDecisionForm,
  PayrollPeriodPicker,
  frequencyLabel,
} from "./payroll-forms";
import { PayrollTable, downloadPayrollCsv } from "./payroll-tables";

const tabs = [
  "Dashboard",
  "Configuration",
  "Salary structures",
  "Employee salary",
  "Reimbursements",
  "Run payroll",
  "Payslips",
  "Reports",
];
const steps = ["Period & scope", "Validate inputs", "Salary review", "Exceptions", "Approvals", "Process"];
const inputClass =
  "w-full cursor-pointer rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";
const date = (value: string) => value.slice(0, 10);
const money = (value: string, currency: string) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(Number(value));

function PayrollDrawer({
  organizationId,
  data,
  close,
  complete,
  initialRun,
}: {
  organizationId: string;
  data: PayrollWorkspace;
  close: () => void;
  complete: (message: string) => void;
  initialRun?: PayrollRun;
}) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<RunInput>({
    profileId: initialRun?.profileId ?? data.profiles[0]?.id ?? "",
    period:
      initialRun?.period ?? (data.profiles[0]?.frequency === "MONTHLY" ? new Date().toISOString().slice(0, 7) : ""),
    payDate: initialRun ? date(initialRun.payDate) : "",
    prorationPolicy: initialRun ? (initialRun.snapshot.prorationPolicy ?? "NONE") : "CALENDAR_DAYS",
    ...(initialRun?.snapshot.departmentId ? { departmentId: initialRun.snapshot.departmentId } : {}),
  });
  const [preview, setPreview] = useState<PayrollPreview | null>(initialRun?.snapshot ?? null);
  const [run, setRun] = useState(initialRun);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const { can } = usePermissions();
  async function act(action: "next" | "draft" | "approve" | "process") {
    setError("");
    setErrors({});
    const fields: Record<string, string> = {};
    if (!input.profileId) fields.profileId = "Choose a payroll profile.";
    const validPeriod = profile?.frequency === "MONTHLY" ? /^[1-9]\d{3}-(0[1-9]|1[0-2])$/ : /^[1-9]\d{3}-\d{2}-\d{2}$/;
    if (!validPeriod.test(input.period)) fields.period = "Choose a configured payroll period.";
    if (!input.payDate) fields.payDate = "Pay date is required.";
    setErrors(fields);
    if (Object.keys(fields).length) {
      setStep(1);
      return;
    }
    setBusy(true);
    try {
      if (action === "draft") {
        if (!run) await payrollService.run(organizationId, input);
        complete("Payroll draft saved");
      } else if (action === "approve" && run) {
        await payrollService.approve(organizationId, run.id);
        complete("Payroll approved. Reopen to process the locked snapshot.");
      } else if (action === "process" && run) {
        if (!confirmed) {
          setError("Confirm that you want to lock payroll and generate payslips.");
          return;
        }
        await payrollService.process(organizationId, run.id);
        complete("Payroll processed. No bank payment has been initiated.");
      } else {
        if (step === 1) {
          const result =
            run && run.status !== "DRAFT" ? run.snapshot : await payrollService.preview(organizationId, input);
          setPreview(result);
        }
        if (step === 5 && !run) {
          const created = await payrollService.run(organizationId, input);
          setRun(created);
          setPreview(created.snapshot);
        }
        setStep((current) => Math.min(steps.length, current + 1));
      }
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Payroll action failed");
    } finally {
      setBusy(false);
    }
  }
  const profile = data.profiles.find((item) => item.id === input.profileId);
  const change = (patch: Partial<RunInput>) => {
    setInput((current) => ({ ...current, ...patch }));
    setPreview(null);
  };
  return (
    <PayrollDialog label="Start payroll run" close={close} busy={busy}>
      <aside className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface text-text-primary shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-lg font-bold">Start payroll run</h2>
            <p className="mt-1 text-xs text-text-muted">Payroll workflow · Changes are reviewed before completion</p>
          </div>
          <button
            type="button"
            aria-label="Close payroll run"
            disabled={busy}
            onClick={close}
            className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised"
          >
            <Icon name="close" />
          </button>
        </header>
        <ol className="flex gap-1 border-b border-border px-6 py-4">
          {steps.map((label, index) => (
            <li key={label} aria-current={step === index + 1 ? "step" : undefined} className="min-w-0 flex-1">
              <div className={`h-1.5 rounded-full ${step >= index + 1 ? "bg-brand" : "bg-surface-raised"}`} />
              <p className={`mt-1 text-xs ${step === index + 1 ? "text-brand" : "text-text-muted"}`}>{label}</p>
            </li>
          ))}
        </ol>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6">
          {step === 1 && (
            <fieldset disabled={busy || Boolean(run)} className="space-y-4">
              <PayrollField label="Country / payroll profile">
                <select
                  className={`${inputClass} ${errors.profileId ? "border-error" : ""}`}
                  value={input.profileId}
                  onChange={(event) =>
                    change({
                      profileId: event.target.value,
                      period:
                        data.profiles.find((item) => item.id === event.target.value)?.frequency === "MONTHLY"
                          ? new Date().toISOString().slice(0, 7)
                          : "",
                      payDate: "",
                      prorationPolicy: "CALENDAR_DAYS",
                    })
                  }
                >
                  <option value="">Select a configured payroll profile</option>
                  {data.profiles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} · {item.countryCode} · {item.currency}
                    </option>
                  ))}
                </select>
              </PayrollField>
              {errors.profileId && (
                <p role="alert" className="text-xs text-error">
                  {errors.profileId}
                </p>
              )}
              {profile && profile.frequency !== "MONTHLY" ? (
                <PayrollPeriodPicker
                  key={profile.id}
                  organizationId={organizationId}
                  profile={profile}
                  value={input.period}
                  onClear={() => change({ period: "", payDate: "" })}
                  disabled={Boolean(run)}
                  error={errors.period}
                  onChange={(period) =>
                    change({ period: period.key, payDate: period.payDate, prorationPolicy: "CALENDAR_DAYS" })
                  }
                />
              ) : (
                <>
                  <PayrollField label="Payroll period">
                    <input
                      type="month"
                      className={`${inputClass} ${errors.period ? "border-error" : ""}`}
                      value={input.period}
                      onChange={(event) => change({ period: event.target.value, payDate: "" })}
                    />
                  </PayrollField>
                  {errors.period && (
                    <p role="alert" className="text-xs text-error">
                      {errors.period}
                    </p>
                  )}
                  {profile && (
                    <Button
                      variant="secondary"
                      disabled={busy || Boolean(run) || !input.period}
                      onClick={async () => {
                        setError("");
                        setBusy(true);
                        try {
                          const periods = await payrollService.calendar(
                            organizationId,
                            profile.id,
                            Number(input.period.slice(0, 4)),
                          );
                          const period = periods.find((item) => item.key === input.period);
                          if (!period)
                            throw new Error("Period is before this profile's effective date or outside its calendar");
                          change({ payDate: period.payDate });
                        } catch (failure) {
                          setError(failure instanceof Error ? failure.message : "Unable to load scheduled pay date");
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Use scheduled pay date
                    </Button>
                  )}
                </>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <PayrollField label="Employee scope">
                  <select
                    className={inputClass}
                    value={input.departmentId ?? ""}
                    onChange={(event) => change({ departmentId: event.target.value || undefined })}
                  >
                    <option value="">All eligible employees in pay group</option>
                    <optgroup label="By department">
                      {data.departments.map((department) => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </PayrollField>
                <PayrollField label="Pay date">
                  <input
                    type="date"
                    className={`${inputClass} ${errors.payDate ? "border-error" : ""}`}
                    value={input.payDate}
                    onChange={(event) => change({ payDate: event.target.value })}
                  />
                </PayrollField>
              </div>
              {errors.payDate && (
                <p role="alert" className="text-xs text-error">
                  {errors.payDate}
                </p>
              )}
              <PayrollField label="Proration policy">
                <select
                  className={inputClass}
                  value={input.prorationPolicy}
                  disabled={Boolean(profile && profile.frequency !== "MONTHLY")}
                  onChange={(event) =>
                    change({
                      prorationPolicy: event.target.value === "CALENDAR_DAYS" ? "CALENDAR_DAYS" : "NONE",
                    })
                  }
                >
                  <option value="CALENDAR_DAYS">
                    {profile?.frequency === "MONTHLY"
                      ? "Calendar days in pay period"
                      : "Calendar-day monthly allocation"}
                  </option>
                  {(!profile || profile.frequency === "MONTHLY") && (
                    <option value="NONE">Full-month only (legacy)</option>
                  )}
                </select>
              </PayrollField>
              <p className="text-xs text-text-secondary">
                {profile?.frequency !== "MONTHLY" &&
                  "Monthly salary components are allocated by calendar day within each month, including periods crossing months. "}
                Calendar days includes weekends and holidays. All recurring components, including fixed deductions, are
                prorated for employment dates and date-allocated approved unpaid leave.
              </p>
              {!data.profiles.length && (
                <p className="text-sm text-warning">
                  Create a payroll profile, salary structure, and employee salary first.
                </p>
              )}
            </fieldset>
          )}
          {step === 2 && preview && (
            <>
              {[
                [
                  "Attendance",
                  "Checked for recorded absences; missing attendance and overtime are not automatically reconciled.",
                ],
                [
                  "Leave data",
                  input.prorationPolicy === "CALENDAR_DAYS"
                    ? "Approved date-allocated unpaid leave reduces payable days. Pending leave still blocks approval."
                    : "Approved unpaid and pending leave block approval for external LOP review.",
                ],
                [
                  "Overtime",
                  "Approved period-specific hours × rate × multiplier inputs are included; timesheets and statutory premiums are not inferred.",
                ],
                [
                  "Reimbursements",
                  `${preview.items.reduce((total, item) => total + item.claimIds.length, 0)} approved claims included.`,
                ],
              ].map(([label, detail]) => (
                <div key={label} className="rounded-md border border-border p-4">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="mt-1 text-xs text-text-secondary">{detail}</p>
                </div>
              ))}
              <p className="text-xs text-warning">
                These checks are not a certification of statutory or attendance completeness.
              </p>
            </>
          )}
          {step === 3 && preview && (
            <>
              {preview.periodStart && (
                <p className="text-xs text-text-secondary">
                  Payroll period: {preview.periodStart} through {preview.periodEnd}. Scheduled pay date:{" "}
                  {preview.scheduledPayDate}; selected pay date: {preview.payDate}.
                  {preview.salaryAllocation === "MONTHLY_CALENDAR" &&
                    " Allocation uses each month's calendar-day denominator with cumulative currency rounding, not a full monthly salary each period."}
                </p>
              )}
              <PayrollTable
                label="Salary components"
                rows={preview.componentSummary}
                rowKey={(item) => item.key}
                columns={[
                  { key: "name", label: "Component", value: (item) => item.name },
                  { key: "count", label: "Employees", value: (item) => String(item.employeeCount) },
                  { key: "amount", label: "Amount", value: (item) => money(item.amount, preview.profile.currency) },
                ]}
              />
              <PayrollTable
                label="Salary review"
                rows={preview.items}
                rowKey={(item) => item.employeeId}
                columns={[
                  { key: "employee", label: "Employee", value: (item) => item.name },
                  { key: "gross", label: "Gross", value: (item) => item.gross },
                  {
                    key: "days",
                    label: "Payable calendar days",
                    value: (item) =>
                      item.proration
                        ? `${item.proration.employmentDays - item.proration.unpaidDays} / ${item.proration.periodDays}`
                        : "Full month",
                  },
                  { key: "deductions", label: "Deductions", value: (item) => item.deductions },
                  {
                    key: "variable",
                    label: "Variable inputs",
                    value: (item) => String(item.variableInputs?.length ?? 0),
                  },
                  {
                    key: "variance",
                    label: "Net change vs prior payroll",
                    value: (item) =>
                      item.variance
                        ? `${item.variance.netDelta} (${item.variance.netPercent === null ? "prior net zero" : `${item.variance.netPercent}%`})`
                        : "No same-currency baseline",
                  },
                  {
                    key: "net",
                    label: "Net",
                    value: (item) => item.net,
                    render: (item) => money(item.net, preview.profile.currency),
                  },
                ]}
              />
              <p className="text-xs text-text-secondary">
                Variance compares the latest earlier approved/paid employee payroll in the same currency. It may be a
                different pay group, scope, or month length. Net includes reimbursements. All deltas are shown; no
                automatic anomaly threshold or tax recalculation is implied.
              </p>
              {preview.items
                .filter((item) => item.variableInputs?.length)
                .map((item) => (
                  <div
                    key={item.employeeId}
                    className="rounded-md border border-border p-3 text-xs text-text-secondary"
                  >
                    <p className="font-semibold">{item.name} · Approved variable inputs</p>
                    {item.variableInputs?.map((input) => (
                      <p key={input.id} className="mt-1">
                        {input.name} · {input.type} · {input.quantity} × {input.rate} × {input.multiplier}
                        {" = "}
                        {money(input.amount, preview.profile.currency)} · {input.reason}
                      </p>
                    ))}
                  </div>
                ))}
              {preview.items
                .filter((item) => item.proration)
                .map((item) => (
                  <div
                    key={item.employeeId}
                    className="rounded-md border border-border p-3 text-xs text-text-secondary"
                  >
                    <p className="font-semibold">{item.name} · Calendar-day calculation</p>
                    {item.proration?.segments.map((segment) => (
                      <p key={`${segment.assignmentId}:${segment.month ?? ""}`} className="mt-1">
                        Effective {segment.effectiveFrom}: {money(segment.monthlyGross, preview.profile.currency)}{" "}
                        monthly · {segment.calendarDays} employed days - {segment.unpaidDays} unpaid ={" "}
                        {segment.payableDays} payable / {segment.monthDays ?? item.proration?.periodDays}{" "}
                        {segment.month ? `calendar days in ${segment.month}` : "period days"}.
                      </p>
                    ))}
                  </div>
                ))}
            </>
          )}
          {step === 4 && preview && (
            <>
              {[
                ["Missing bank details", "Not checked · payment provider not configured", "warning"],
                ["Negative net pay", "Validated by salary calculation", "success"],
                [
                  "Attendance mismatch",
                  preview.warnings.some((warning) => warning.includes("Attendance"))
                    ? "Review required"
                    : "No unresolved absence / leave exceptions",
                  preview.warnings.some((warning) => warning.includes("Attendance")) ? "warning" : "success",
                ],
                [
                  "Tax configuration",
                  profile?.rulesVerified ? "Administrator verified · not statutory certification" : "Not verified",
                  profile?.rulesVerified ? "success" : "warning",
                ],
              ].map(([label, detail, tone]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-3 rounded-md border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-text-secondary">{detail}</p>
                  </div>
                  <Badge tone={tone === "success" ? "success" : "warning"}>
                    {tone === "success" ? "Checked" : "Review"}
                  </Badge>
                </div>
              ))}
              {preview.warnings.map((warning) => (
                <p
                  role="alert"
                  key={warning}
                  className="rounded-md border border-warning/30 bg-warning/5 p-3 text-sm text-warning"
                >
                  {warning}
                </p>
              ))}
              {!preview.warnings.length && (
                <p className="rounded-md bg-brand-muted p-3 text-sm text-brand">No configured-rule exceptions found.</p>
              )}
              <p className="text-xs text-text-secondary">
                Gross-to-net formulas and location assignments are validated. Bank account details and statutory filing
                eligibility are not validated by this version.
              </p>
            </>
          )}
          {step === 5 && (
            <div className="space-y-3">
              {[
                "Prepared by HR",
                "Finance review · Independent payroll approver",
                "Final approval · Required before processing",
              ].map((item, index) => (
                <div key={item} className="flex items-center gap-3 rounded-md border border-border p-4">
                  <span className="flex size-8 items-center justify-center rounded-full bg-brand-muted text-brand">
                    {index + 1}
                  </span>
                  <p className="text-sm font-semibold">{item}</p>
                </div>
              ))}
              <p className="text-xs text-text-secondary">
                A different user with payroll approval permission must approve the saved draft. Approval recalculates
                the current inputs and locks their snapshot.
              </p>
            </div>
          )}
          {step === 6 && (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-muted text-brand">
                <Icon name="wallet" size={28} />
              </span>
              <h3 className="mt-4 text-lg font-bold">
                {run?.status === "CANCELLED" || run?.status === "REJECTED"
                  ? `Payroll ${run.status.toLowerCase()}`
                  : run?.status === "PROCESSED"
                    ? "Payroll processed"
                    : run?.status === "APPROVED"
                      ? "Ready to process payroll"
                      : "Payroll approval required"}
              </h3>
              {run?.closureReason && <p className="mt-2 text-sm text-text-secondary">{run.closureReason}</p>}
              <p className="mt-2 text-sm text-text-secondary">
                {preview?.items.length ?? 0} employees · Net payout{" "}
                {preview && profile ? money(preview.totalNet, profile.currency) : "Not calculated"}
              </p>
              <p className="mt-4 rounded-md bg-warning/10 p-3 text-xs text-warning">
                Processing generates payslips and payroll register data. Payment integration is sandbox-only and moves
                no real funds.
              </p>
              {run?.status === "APPROVED" && (
                <label className="mt-4 flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 cursor-pointer accent-brand"
                    checked={confirmed}
                    onChange={(event) => setConfirmed(event.target.checked)}
                  />
                  I confirm processing this approved payroll.
                </label>
              )}
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-md border border-error/30 p-3 text-sm text-error">
              {error}
            </p>
          )}
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-raised px-6 py-4">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close} disabled={busy}>
              Cancel
            </Button>
            {step > 1 && (
              <Button variant="secondary" disabled={busy} onClick={() => setStep((current) => current - 1)}>
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {can("hrms.payroll.manage") && (!run || run.status === "DRAFT") && (
              <Button variant="secondary" disabled={busy} onClick={() => void act("draft")}>
                Save draft
              </Button>
            )}
            {step < 6 ? (
              <Button disabled={busy} onClick={() => void act("next")}>
                Next
              </Button>
            ) : run?.status === "DRAFT" ? (
              <Button disabled={busy || !can("hrms.payroll.approve")} onClick={() => void act("approve")}>
                Approve payroll
              </Button>
            ) : (
              <Button
                disabled={busy || run?.status !== "APPROVED" || !can("hrms.payroll.manage")}
                onClick={() => void act("process")}
              >
                Process payroll
              </Button>
            )}
          </div>
        </footer>
      </aside>
    </PayrollDialog>
  );
}

export function HrmsPayroll({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  if (!organizationId)
    return (
      <p role="status" className="text-sm text-text-secondary">
        Select an organization to access payroll.
      </p>
    );
  // Remount tenant-local drafts and financial data on organization changes.
  return <PayrollWorkspaceView key={organizationId} organizationId={organizationId} onToast={onToast} />;
}

function PayrollWorkspaceView({
  organizationId,
  onToast,
}: {
  organizationId: string;
  onToast: (message: string) => void;
}) {
  const { can } = usePermissions();
  const [tab, setTab] = useState(tabs[0]);
  const [data, setData] = useState<PayrollWorkspace | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawer, setDrawer] = useState<{ run?: PayrollRun } | null>(null);
  const [form, setForm] = useState<"profile" | "structure" | "assignment" | "claim" | "variable" | null>(null);
  const [calendarProfileId, setCalendarProfileId] = useState("");
  const [calendarPeriod, setCalendarPeriod] = useState("");
  const [selectedRunId, setSelectedRunId] = useState("");
  const [checklistFilters, setChecklistFilters] = useState(false);
  const [slip, setSlip] = useState<{ run: PayrollRun; item: PayrollItem } | null>(null);
  const [decision, setDecision] = useState<{ runId: string; action: "cancel" | "reject" } | null>(null);
  const load = useCallback(
    () =>
      payrollService
        .workspace(organizationId)
        .then((result) => {
          setData(result);
          setError("");
        })
        .catch((failure: unknown) => {
          setError(failure instanceof Error ? failure.message : "Unable to load payroll");
        }),
    [organizationId],
  );
  useEffect(() => {
    void load();
  }, [load]);
  async function action(work: () => Promise<unknown>, message: string) {
    setBusy(true);
    setError("");
    try {
      await work();
      onToast(message);
      await load();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Payroll action failed");
    } finally {
      setBusy(false);
    }
  }
  const processed = data?.runs.filter((run) => run.status === "PROCESSED") ?? [];
  const selectedRun = processed.find((run) => run.id === selectedRunId) ?? processed[0];
  const latest = data?.runs.find((run) => run.status !== "CANCELLED" && run.status !== "REJECTED");
  const currency = latest?.profile.currency;
  const stats = [
    [
      "Total payout",
      latest && currency ? money(latest.totalNet, currency) : "Not calculated",
      `${latest?.employeeCount ?? 0} employees`,
    ],
    [
      "Payroll status",
      latest?.status ?? "Not started",
      `${data?.runs.filter((run) => run.status === "DRAFT").length ?? 0} approvals pending`,
    ],
    [
      "Payslips",
      String(processed.reduce((sum, run) => sum + run.employeeCount, 0)),
      `${processed.length} processed runs`,
    ],
    [
      "Reimbursements",
      String(data?.claims.filter((claim) => claim.status === "PENDING").length ?? 0),
      "Pending claims · totals shown per currency in reports",
    ],
  ];
  const checklist = [
    [
      "Validate attendance",
      "People Ops",
      latest ? date(latest.payDate) : "Not scheduled",
      "Recorded exceptions checked",
      "Manual completeness review",
    ],
    [
      "Review variable pay",
      "Finance",
      latest ? date(latest.payDate) : "Not scheduled",
      `${data?.variableInputs.filter((input) => input.status === "PENDING").length ?? 0} pending inputs`,
      "Independent input approval required",
    ],
    [
      "Leadership approval",
      "Payroll approver",
      latest ? date(latest.payDate) : "Not scheduled",
      latest?.approvedById ? "100%" : "0%",
      latest?.approvedById ? "Complete" : "Pending",
    ],
    [
      "Bank processing",
      "Finance",
      latest ? date(latest.payDate) : "Not scheduled",
      latest?.sandboxStatus ?? "Not started",
      "Sandbox only",
    ],
  ];
  function exportRun(run: PayrollRun) {
    downloadPayrollCsv(`payroll-register-${run.period}.csv`, [
      [
        "Period",
        "Employee number",
        "Name",
        "Currency",
        "Gross",
        "Deductions",
        "Reimbursements",
        "Net",
        "Status",
        "Proration policy",
        "Period days",
        "Employment days",
        "Unpaid days",
        "Payable days",
        "Variable input basis",
        "Period employer cost",
        "Previous period",
        "Previous net",
        "Gross change",
        "Deductions change",
        "Net change",
        "Net change percent",
        "Period start",
        "Period end",
        "Frequency",
        "Salary allocation",
        "Scheduled pay date",
        "Selected pay date",
        "Calendar allocation basis",
      ],
      ...run.snapshot.items.map((item) => [
        run.period,
        item.employeeNumber,
        item.name,
        run.profile.currency,
        item.gross,
        item.deductions,
        item.reimbursements,
        item.net,
        run.status,
        run.snapshot.prorationPolicy ?? "NONE",
        item.proration ? String(item.proration.periodDays) : "",
        item.proration ? String(item.proration.employmentDays) : "",
        item.proration ? String(item.proration.unpaidDays) : "",
        item.proration ? String(item.proration.employmentDays - item.proration.unpaidDays) : "",
        (item.variableInputs ?? [])
          .map(
            (input) =>
              `${input.id}: ${input.name}; ${input.calculation}; ${input.quantity} x ${input.rate} x ${input.multiplier} = ${input.amount}; ${input.reason}`,
          )
          .join(" | "),
        item.periodEmployerCost ?? "",
        item.variance?.previousPeriod ?? "",
        item.variance?.previousNet ?? "",
        item.variance?.grossDelta ?? "",
        item.variance?.deductionsDelta ?? "",
        item.variance?.netDelta ?? "",
        item.variance?.netPercent ?? "",
        run.snapshot.periodStart ?? "",
        run.snapshot.periodEnd ?? "",
        run.profile.frequency,
        run.snapshot.salaryAllocation ?? "",
        run.snapshot.scheduledPayDate ?? "",
        date(run.payDate),
        (item.proration?.segments ?? [])
          .map(
            (segment) =>
              `${segment.assignmentId}: ${segment.month ?? run.period}; ${segment.monthlyGross}/month; ${segment.payableDays}/${segment.monthDays ?? item.proration?.periodDays} days`,
          )
          .join(" | "),
      ]),
    ]);
  }
  return (
    <div className="w-full min-w-0 text-text-primary">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div role="tablist" aria-label="Payroll sections" className="flex min-w-0 max-w-full gap-1 overflow-x-auto">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={`payroll-tab-${tabs.indexOf(item)}`}
              aria-selected={tab === item}
              aria-controls="payroll-panel"
              tabIndex={tab === item ? 0 : -1}
              onClick={() => setTab(item)}
              onKeyDown={(event) => {
                const index = tabs.indexOf(item);
                const next =
                  event.key === "ArrowRight"
                    ? (index + 1) % tabs.length
                    : event.key === "ArrowLeft"
                      ? (index - 1 + tabs.length) % tabs.length
                      : event.key === "Home"
                        ? 0
                        : event.key === "End"
                          ? tabs.length - 1
                          : null;
                if (next === null) return;
                event.preventDefault();
                setTab(tabs[next]);
                document.getElementById(`payroll-tab-${next}`)?.focus();
              }}
              className={`shrink-0 cursor-pointer whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-semibold ${tab === item ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-raised"}`}
            >
              {item}
            </button>
          ))}
        </div>
        <Button icon="plus" disabled={!data || !can("hrms.payroll.manage")} onClick={() => setDrawer({})}>
          Start payroll run
        </Button>
      </div>
      <div
        role="tabpanel"
        id="payroll-panel"
        aria-labelledby={`payroll-tab-${tabs.indexOf(tab)}`}
        className="w-full min-w-0"
      >
        {error && (
          <div
            role="alert"
            className="mb-4 flex items-center justify-between rounded-md border border-error/30 p-3 text-sm text-error"
          >
            {error}
            <Button variant="secondary" onClick={() => void load()}>
              Retry
            </Button>
          </div>
        )}
        {!data && !error && (
          <p role="status" className="py-6 text-sm text-text-secondary">
            Loading payroll...
          </p>
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {stats.map(([label, value, meta], index) => (
            <Card key={label} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-text-secondary">{label}</p>
                <span className="flex size-8 items-center justify-center rounded-md bg-brand-muted text-brand">
                  <Icon name="wallet" size={16} />
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold">{value}</p>
              <p className="mt-1 text-xs text-text-muted">{meta}</p>
              {index === 0 && (
                <div className="mt-4 h-1 rounded-full bg-surface-raised">
                  <div className={`h-1 rounded-full bg-brand ${latest?.status === "PROCESSED" ? "w-full" : "w-0"}`} />
                </div>
              )}
            </Card>
          ))}
        </div>
        <p className="mt-2 text-xs text-text-muted">
          Payout and payroll status reflect the most recently created pay-group run; currencies are never combined.
        </p>
        {tab === "Dashboard" && (
          <Card className="mt-5 overflow-hidden">
            <CardTitle
              title="Payroll run checklist"
              subtitle="Payroll · Dashboard"
              action={
                <div className="flex gap-2">
                  <Button variant="secondary" icon="filter" onClick={() => setChecklistFilters((current) => !current)}>
                    Filters
                  </Button>
                  <Button
                    variant="secondary"
                    icon="download"
                    disabled={!latest}
                    onClick={() => latest && exportRun(latest)}
                  >
                    Export
                  </Button>
                </div>
              }
            />
            <PayrollTable<string[]>
              label="Payroll run checklist"
              toolbarActions={false}
              filtersVisible={checklistFilters}
              rows={checklist}
              rowKey={(row) => row[0]}
              columns={["Step", "Owner", "Due date", "Progress", "Status"].map((label, index) => ({
                key: label,
                label,
                value: (row) => row[index],
              }))}
              actions={() => (
                <button
                  type="button"
                  aria-label="Open payroll run"
                  className="cursor-pointer p-2 text-brand"
                  disabled={!data}
                  onClick={() => setDrawer({ run: latest })}
                >
                  <Icon name="dots" />
                </button>
              )}
            />
          </Card>
        )}
        {data && organizationId && (
          <>
            {tab === "Configuration" && (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="max-w-3xl text-sm text-text-secondary">
                    Pay groups isolate country, currency, employment model, and location. Statutory rates and filing
                    integrations are not bundled. Create new effective-dated profiles when rules change.
                  </p>
                  <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("profile")}>
                    Add payroll profile
                  </Button>
                </div>
                <PayrollTable
                  label="Payroll profiles"
                  rows={data.profiles}
                  rowKey={(row) => row.id}
                  columns={[
                    { key: "name", label: "Name", value: (row) => row.name },
                    { key: "country", label: "Country", value: (row) => row.countryCode },
                    { key: "currency", label: "Currency", value: (row) => row.currency },
                    { key: "frequency", label: "Frequency", value: (row) => frequencyLabel(row.frequency) },
                    {
                      key: "anchor",
                      label: "Calendar anchor",
                      value: (row) => (row.calendarAnchor ? date(row.calendarAnchor) : "Not required"),
                    },
                    {
                      key: "offset",
                      label: "Pay-date offset",
                      value: (row) => `${row.payDateOffset ?? 0} calendar days`,
                    },
                    { key: "model", label: "Employment model", value: (row) => row.employmentModel },
                    {
                      key: "verified",
                      label: "Rules",
                      value: (row) => (row.rulesVerified ? "Admin verified" : "Not verified"),
                    },
                    { key: "effective", label: "Effective", value: (row) => date(row.effectiveFrom) },
                  ]}
                  actions={(profile) =>
                    !profile.rulesVerified &&
                    can("hrms.payroll.manage") && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              "Confirm that local payroll rules have been independently verified for this profile.",
                            )
                          )
                            void action(
                              () => payrollService.verifyProfile(organizationId, profile.id),
                              "Payroll rules marked administrator-verified.",
                            );
                        }}
                      >
                        Verify rules
                      </Button>
                    )
                  }
                />
              </>
            )}
            {tab === "Salary structures" && (
              <>
                <div className="mt-4 flex justify-end">
                  <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("structure")}>
                    Add salary structure
                  </Button>
                </div>
                <PayrollTable
                  label="Salary structures"
                  rows={data.structures}
                  rowKey={(row) => row.id}
                  columns={[
                    { key: "name", label: "Structure", value: (row) => row.name },
                    { key: "profile", label: "Payroll profile", value: (row) => row.profile.name },
                    { key: "currency", label: "Currency", value: (row) => row.profile.currency },
                    {
                      key: "components",
                      label: "Components / formulas",
                      value: (row) =>
                        row.components
                          .map(
                            (component) =>
                              `${component.name}: ${component.calculation === "REMAINDER" ? "Remaining gross" : component.value + " " + component.calculation}${component.basis ? ` (${component.basis})` : ""}`,
                          )
                          .join("; "),
                    },
                  ]}
                />
              </>
            )}
            {tab === "Configuration" && data.profiles.length > 0 && (
              <section className="mt-4 space-y-3 rounded-lg border border-border p-4" aria-label="Payroll calendar">
                <h3 className="text-sm font-semibold">Payroll calendar</h3>
                <PayrollField label="Calendar pay group">
                  <select
                    className={inputClass}
                    value={calendarProfileId}
                    onChange={(event) => {
                      setCalendarProfileId(event.target.value);
                      setCalendarPeriod("");
                    }}
                  >
                    <option value="">Select a pay group to view its calendar</option>
                    {data.profiles.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.name} · {frequencyLabel(profile.frequency)}
                      </option>
                    ))}
                  </select>
                </PayrollField>
                {data.profiles
                  .filter((profile) => profile.id === calendarProfileId)
                  .map((profile) => (
                    <PayrollPeriodPicker
                      key={profile.id}
                      organizationId={organizationId}
                      profile={profile}
                      value={calendarPeriod}
                      onClear={() => setCalendarPeriod("")}
                      onChange={(period) => setCalendarPeriod(period.key)}
                      showTable
                    />
                  ))}
              </section>
            )}
            {tab === "Employee salary" && (
              <>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm text-text-secondary">
                    Effective-dated salary history. New assignments preserve prior revisions.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("variable")}>
                      Add variable pay input
                    </Button>
                    <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("assignment")}>
                      Assign / revise salary
                    </Button>
                  </div>
                </div>
                <PayrollTable
                  label="Employee salary"
                  rows={data.assignments}
                  rowKey={(row) => row.id}
                  columns={[
                    {
                      key: "name",
                      label: "Employee",
                      value: (row) => `${row.employee.employeeNumber} · ${row.employee.user.name}`,
                    },
                    { key: "structure", label: "Structure", value: (row) => row.structure.name },
                    { key: "currency", label: "Currency", value: (row) => row.structure.profile.currency },
                    {
                      key: "gross",
                      label: "Monthly gross",
                      value: (row) => row.monthlyGross,
                      render: (row) => money(row.monthlyGross, row.structure.profile.currency),
                    },
                    {
                      key: "ctc",
                      label: "Monthly CTC",
                      value: (row) => row.breakdown.monthlyCtc,
                      render: (row) => money(row.breakdown.monthlyCtc, row.structure.profile.currency),
                    },
                    {
                      key: "annualCtc",
                      label: "Annual CTC",
                      value: (row) => row.breakdown.annualCtc,
                      render: (row) => money(row.breakdown.annualCtc, row.structure.profile.currency),
                    },
                    {
                      key: "net",
                      label: "Monthly net",
                      value: (row) => row.breakdown.net,
                      render: (row) => money(row.breakdown.net, row.structure.profile.currency),
                    },
                    { key: "date", label: "Effective from", value: (row) => date(row.effectiveFrom) },
                  ]}
                />
                <p className="mt-4 text-xs text-text-secondary">
                  Variable inputs require independent approval. Fixed inputs recur over the inclusive month range; hours
                  are period-specific. Approved inputs are immutable and apply only to their pay group. Tax is not
                  recalculated automatically. Employee approval must also be performed by another user.
                </p>
                <PayrollTable
                  label="Variable pay inputs"
                  rows={data.variableInputs}
                  rowKey={(row) => row.id}
                  columns={[
                    {
                      key: "employee",
                      label: "Employee",
                      value: (row) => `${row.employee.employeeNumber} · ${row.employee.user.name}`,
                    },
                    { key: "profile", label: "Pay group", value: (row) => row.profile.name },
                    { key: "name", label: "Input", value: (row) => row.name },
                    { key: "type", label: "Type", value: (row) => row.type },
                    {
                      key: "basis",
                      label: "Calculation basis",
                      value: (row) => `${row.quantity} × ${row.rate} × ${row.multiplier}`,
                    },
                    {
                      key: "amount",
                      label: "Amount per period",
                      value: (row) => row.amount,
                      render: (row) => money(row.amount, row.profile.currency),
                    },
                    {
                      key: "period",
                      label: "Month range / target period",
                      value: (row) => row.targetPeriod ?? `${row.startPeriod} - ${row.endPeriod}`,
                    },
                    { key: "reason", label: "Reason", value: (row) => row.reason },
                    { key: "status", label: "Status", value: (row) => row.status },
                  ]}
                  actions={(input) =>
                    input.status === "PENDING" && (
                      <>
                        {can("hrms.payroll.approve") && (
                          <>
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void action(
                                  () => payrollService.decideVariable(organizationId, input.id, "approve"),
                                  "Variable pay input approved",
                                )
                              }
                            >
                              Approve input
                            </Button>
                            <Button
                              variant="secondary"
                              disabled={busy}
                              onClick={() =>
                                void action(
                                  () => payrollService.decideVariable(organizationId, input.id, "reject"),
                                  "Variable pay input rejected",
                                )
                              }
                            >
                              Reject input
                            </Button>
                          </>
                        )}
                        {can("hrms.payroll.manage") && (
                          <Button
                            variant="secondary"
                            disabled={busy}
                            onClick={() =>
                              void action(
                                () => payrollService.decideVariable(organizationId, input.id, "cancel"),
                                "Variable pay input cancelled",
                              )
                            }
                          >
                            Cancel input
                          </Button>
                        )}
                      </>
                    )
                  }
                />
              </>
            )}
            {tab === "Run payroll" && (
              <PayrollTable
                label="Payroll runs"
                rows={data.runs}
                rowKey={(row) => row.id}
                columns={[
                  { key: "period", label: "Period", value: (row) => row.period },
                  {
                    key: "range",
                    label: "Dates",
                    value: (row) =>
                      row.snapshot.periodStart ? `${row.snapshot.periodStart} – ${row.snapshot.periodEnd}` : row.period,
                  },
                  { key: "frequency", label: "Frequency", value: (row) => frequencyLabel(row.profile.frequency) },
                  { key: "group", label: "Pay group", value: (row) => row.profile.name },
                  { key: "currency", label: "Currency", value: (row) => row.profile.currency },
                  { key: "count", label: "Employees", value: (row) => String(row.employeeCount) },
                  {
                    key: "net",
                    label: "Net payout",
                    value: (row) => row.totalNet,
                    render: (row) => money(row.totalNet, row.profile.currency),
                  },
                  { key: "status", label: "Status", value: (row) => row.status },
                  { key: "reason", label: "Closure reason", value: (row) => row.closureReason ?? "—" },
                  { key: "bank", label: "Sandbox payment", value: (row) => row.sandboxStatus ?? "Not initiated" },
                ]}
                actions={(run) => (
                  <>
                    <Button variant="secondary" onClick={() => setDrawer({ run })}>
                      Review
                    </Button>
                    {run.status === "DRAFT" && can("hrms.payroll.manage") && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setDecision({ runId: run.id, action: "cancel" })}
                      >
                        Cancel draft
                      </Button>
                    )}
                    {run.status === "DRAFT" && can("hrms.payroll.approve") && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setDecision({ runId: run.id, action: "reject" })}
                      >
                        Reject draft
                      </Button>
                    )}
                    {run.status === "PROCESSED" && can("hrms.payroll.approve") && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm("SANDBOX ONLY: simulate a bank payment? No real funds will move."))
                            void action(
                              () => payrollService.sandbox(organizationId, run.id, "SUBMIT"),
                              "Sandbox payment submitted. No real funds moved.",
                            );
                        }}
                      >
                        Initiate bank payment (sandbox)
                      </Button>
                    )}
                    {run.sandboxStatus === "SUBMITTED" && can("hrms.payroll.approve") && (
                      <>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            void action(
                              () => payrollService.sandbox(organizationId, run.id, "SETTLE"),
                              "Simulated settlement recorded; payroll is not marked paid.",
                            )
                          }
                        >
                          Simulate settlement
                        </Button>
                        <Button
                          variant="secondary"
                          disabled={busy}
                          onClick={() =>
                            void action(
                              () => payrollService.sandbox(organizationId, run.id, "FAIL"),
                              "Simulated bank failure recorded.",
                            )
                          }
                        >
                          Simulate failure
                        </Button>
                      </>
                    )}
                  </>
                )}
              />
            )}
            {tab === "Run payroll" && (
              <PayrollTable
                label="Employee payroll records (existing API)"
                rows={data.records}
                rowKey={(row) => row.id}
                columns={[
                  { key: "period", label: "Period", value: (row) => row.period },
                  {
                    key: "start",
                    label: "Period start",
                    value: (row) => (row.periodStart ? date(row.periodStart) : "Not recorded"),
                  },
                  {
                    key: "end",
                    label: "Period end",
                    value: (row) => (row.periodEnd ? date(row.periodEnd) : "Not recorded"),
                  },
                  { key: "currency", label: "Currency", value: (row) => row.currency },
                  {
                    key: "name",
                    label: "Employee",
                    value: (row) => `${row.employee.employeeNumber} · ${row.employee.user.name}`,
                  },
                  {
                    key: "net",
                    label: "Net pay",
                    value: (row) => String(row.netPay),
                    render: (row) => money(String(row.netPay), row.currency),
                  },
                  { key: "status", label: "Status", value: (row) => row.status },
                ]}
              />
            )}
            {tab === "Reimbursements" && (
              <>
                <div className="mt-4 flex justify-end">
                  <Button icon="plus" disabled={!can("hrms.payroll.manage")} onClick={() => setForm("claim")}>
                    Add reimbursement
                  </Button>
                </div>
                <PayrollTable
                  label="Reimbursements"
                  rows={data.claims}
                  rowKey={(row) => row.id}
                  columns={[
                    { key: "name", label: "Employee", value: (row) => row.employee.user.name },
                    { key: "title", label: "Expense", value: (row) => row.title },
                    { key: "currency", label: "Currency", value: (row) => row.currency },
                    {
                      key: "amount",
                      label: "Amount",
                      value: (row) => row.amount,
                      render: (row) => money(row.amount, row.currency),
                    },
                    { key: "date", label: "Date", value: (row) => date(row.expenseDate) },
                    { key: "receipt", label: "Receipt reference", value: (row) => row.receiptReference },
                    { key: "status", label: "Status", value: (row) => row.status },
                  ]}
                  actions={(claim) =>
                    claim.status === "PENDING" &&
                    can("hrms.payroll.approve") && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() =>
                          void action(() => payrollService.approveClaim(organizationId, claim.id), "Claim approved")
                        }
                      >
                        Approve
                      </Button>
                    )
                  }
                />
              </>
            )}
            {(tab === "Payslips" || tab === "Reports") && (
              <>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <PayrollField label="Processed payroll period">
                    <select
                      className={inputClass}
                      value={selectedRun?.id ?? ""}
                      onChange={(event) => setSelectedRunId(event.target.value)}
                    >
                      {!processed.length && <option value="">No processed payroll</option>}
                      {processed.map((run) => (
                        <option key={run.id} value={run.id}>
                          {run.snapshot.periodStart
                            ? `${run.snapshot.periodStart} – ${run.snapshot.periodEnd}`
                            : run.period}{" "}
                          · {run.profile.name}
                        </option>
                      ))}
                    </select>
                  </PayrollField>
                  <Button
                    variant="secondary"
                    icon="download"
                    disabled={!selectedRun}
                    onClick={() => selectedRun && exportRun(selectedRun)}
                  >
                    Export payroll register
                  </Button>
                </div>
                {tab === "Reports" && (
                  <>
                    <p className="mt-3 text-sm text-text-secondary">
                      Variance compares the latest earlier approved/paid employee payroll in the same currency. Net
                      includes reimbursements; scope, pay group and month length can differ. All changes are shown
                      without an anomaly threshold; a zero prior net has no percentage.
                    </p>
                    <p className="mt-3 rounded-md border border-warning/30 p-3 text-sm text-warning">
                      Payroll register export is available. Bank-specific advice formats, statutory ECR/ESIC/PT/24Q/Form
                      16, journal vouchers, and tax filings need country/provider adapters; this is not a filing-ready
                      export.
                    </p>
                  </>
                )}
                <PayrollTable
                  label={tab}
                  rows={selectedRun?.snapshot.items ?? []}
                  rowKey={(row) => row.employeeId}
                  columns={[
                    { key: "code", label: "Employee ID", value: (row) => row.employeeNumber },
                    { key: "name", label: "Employee", value: (row) => row.name },
                    { key: "gross", label: "Gross", value: (row) => row.gross },
                    {
                      key: "days",
                      label: "Payable calendar days",
                      value: (row) =>
                        row.proration
                          ? `${row.proration.employmentDays - row.proration.unpaidDays} / ${row.proration.periodDays}`
                          : "Full month",
                    },
                    { key: "deductions", label: "Deductions", value: (row) => row.deductions },
                    { key: "reimbursements", label: "Reimbursements", value: (row) => row.reimbursements },
                    {
                      key: "net",
                      label: `Net (${selectedRun?.profile.currency ?? "currency"})`,
                      value: (row) => row.net,
                    },
                    ...(tab === "Reports"
                      ? [
                          {
                            key: "previous",
                            label: "Previous period",
                            value: (row: PayrollItem) => row.variance?.previousPeriod ?? "No baseline",
                          },
                          {
                            key: "grossChange",
                            label: "Gross change",
                            value: (row: PayrollItem) => row.variance?.grossDelta ?? "—",
                          },
                          {
                            key: "deductionsChange",
                            label: "Deductions change",
                            value: (row: PayrollItem) => row.variance?.deductionsDelta ?? "—",
                          },
                          {
                            key: "netChange",
                            label: "Net change",
                            value: (row: PayrollItem) =>
                              row.variance
                                ? `${row.variance.netDelta} (${row.variance.netPercent === null ? "prior net zero" : `${row.variance.netPercent}%`})`
                                : "No baseline",
                          },
                        ]
                      : []),
                  ]}
                  actions={
                    tab === "Payslips"
                      ? (item) => (
                          <Button
                            variant="secondary"
                            onClick={() => selectedRun && setSlip({ run: selectedRun, item })}
                          >
                            View payslip
                          </Button>
                        )
                      : undefined
                  }
                />
              </>
            )}
            {decision && (
              <PayrollRunDecisionForm
                organizationId={organizationId}
                runId={decision.runId}
                action={decision.action}
                close={() => setDecision(null)}
                complete={() => {
                  setDecision(null);
                  onToast("Payroll draft closed; its history is preserved.");
                  void load();
                }}
              />
            )}
            {form && (
              <PayrollForm
                kind={form}
                data={data}
                organizationId={organizationId}
                close={() => setForm(null)}
                complete={() => {
                  setForm(null);
                  onToast("Payroll configuration saved");
                  void load();
                }}
              />
            )}
            {drawer && (
              <PayrollDrawer
                organizationId={organizationId}
                data={data}
                initialRun={drawer.run}
                close={() => setDrawer(null)}
                complete={(message) => {
                  setDrawer(null);
                  onToast(message);
                  void load();
                }}
              />
            )}
          </>
        )}
        {slip && (
          <PayrollDialog label="Payslip" centered close={() => setSlip(null)}>
            <section className="max-h-full w-full max-w-2xl overflow-auto rounded-xl bg-surface p-6 text-text-primary">
              <div className="flex justify-between gap-3">
                <h2 className="text-lg font-semibold">Payslip · {slip.run.period}</h2>
                <Button variant="ghost" onClick={() => setSlip(null)}>
                  Close
                </Button>
              </div>
              <p className="mt-2 text-sm">
                {slip.run.profile.name} · {slip.run.profile.countryCode} · {slip.run.profile.currency}
              </p>
              <p className="text-xs text-text-secondary">
                {slip.item.employeeNumber} · {slip.item.name} · Pay date {date(slip.run.payDate)}
              </p>
              {slip.run.snapshot.periodStart && (
                <p className="mt-2 text-xs text-text-secondary">
                  Period {slip.run.snapshot.periodStart} through {slip.run.snapshot.periodEnd} ·{" "}
                  {frequencyLabel(slip.run.profile.frequency)}.
                  {slip.run.snapshot.salaryAllocation === "MONTHLY_CALENDAR" &&
                    " Monthly components allocated within each calendar month; not a full monthly salary per period."}
                </p>
              )}
              {slip.item.proration && (
                <p className="mt-2 text-xs text-text-secondary">
                  Calendar-day policy: {slip.item.proration.employmentDays} employed days -{" "}
                  {slip.item.proration.unpaidDays} unpaid ={" "}
                  {slip.item.proration.employmentDays - slip.item.proration.unpaidDays} payable /{" "}
                  {slip.item.proration.periodDays} period days.
                </p>
              )}
              {slip.item.proration?.allocation === "MONTHLY_CALENDAR" && (
                <div className="mt-2 text-xs text-text-secondary">
                  {slip.item.proration.segments.map((segment) => (
                    <p key={`${segment.assignmentId}:${segment.month}`}>
                      {segment.month}: {segment.payableDays} payable / {segment.monthDays} calendar days; monthly gross{" "}
                      {money(segment.monthlyGross, slip.run.profile.currency)}.
                    </p>
                  ))}
                </div>
              )}
              <PayrollTable
                label="Payslip components"
                rows={slip.item.lines}
                rowKey={(row) => `${row.code}:${row.type}:${row.name}`}
                columns={[
                  { key: "name", label: "Component", value: (row) => row.name },
                  { key: "type", label: "Type", value: (row) => row.type },
                  { key: "amount", label: "Amount", value: (row) => row.amount },
                ]}
              />
              <p className="mt-4 text-sm">
                Reimbursements: {money(slip.item.reimbursements, slip.run.profile.currency)}
              </p>
              <p className="mt-2 font-semibold">Net pay: {money(slip.item.net, slip.run.profile.currency)}</p>
              {slip.item.variableInputs?.length ? (
                <p className="mt-2 text-xs text-text-secondary">
                  Includes {slip.item.variableInputs.length} approved variable input(s). Contractual monthly CTC is not
                  annualized from bonuses or period-specific hours.
                </p>
              ) : null}
              <p className="mt-2 text-xs text-warning">
                Payroll finalized, not proof of bank payment. Sandbox payments move no funds.
              </p>
              <div className="mt-4">
                <Button
                  variant="secondary"
                  icon="download"
                  onClick={() =>
                    downloadPayrollCsv(`payslip-${slip.run.period}-${slip.item.employeeNumber}.csv`, [
                      ["Period", slip.run.period],
                      ["Period start", slip.run.snapshot.periodStart ?? ""],
                      ["Period end", slip.run.snapshot.periodEnd ?? ""],
                      ["Frequency", slip.run.profile.frequency],
                      ["Salary allocation", slip.run.snapshot.salaryAllocation ?? ""],
                      ["Scheduled pay date", slip.run.snapshot.scheduledPayDate ?? ""],
                      ["Selected pay date", date(slip.run.payDate)],
                      ...(slip.item.proration?.segments ?? []).map((segment) => [
                        "Calendar allocation basis",
                        segment.assignmentId,
                        `${segment.month ?? slip.run.period}: ${segment.monthlyGross}/month; ${segment.payableDays}/${segment.monthDays ?? slip.item.proration?.periodDays} days`,
                      ]),
                      ["Employee", slip.item.name],
                      ["Currency", slip.run.profile.currency],
                      ["Proration policy", slip.run.snapshot.prorationPolicy ?? "NONE"],
                      ...(slip.item.proration
                        ? [
                            ["Period days", String(slip.item.proration.periodDays)],
                            ["Employment days", String(slip.item.proration.employmentDays)],
                            ["Unpaid days", String(slip.item.proration.unpaidDays)],
                            [
                              "Payable days",
                              String(slip.item.proration.employmentDays - slip.item.proration.unpaidDays),
                            ],
                          ]
                        : []),
                      ["Component", "Type", "Amount"],
                      ...slip.item.lines.map((line) => [line.name, line.type, line.amount]),
                      ["Reimbursements", "", slip.item.reimbursements],
                      ["Net", "", slip.item.net],
                    ])
                  }
                >
                  Download payslip data
                </Button>
              </div>
            </section>
          </PayrollDialog>
        )}
      </div>
    </div>
  );
}
