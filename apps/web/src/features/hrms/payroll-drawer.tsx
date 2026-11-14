"use client";

import { useState } from "react";
import { usePermissions } from "@/hooks/use-permissions";
import {
  payrollService,
  type PayrollWorkspace,
  type PayrollPreview,
  type PayrollRun,
  type RunInput,
} from "@/services/payroll.service";
import { Badge, Button, Icon } from "./components/ui-primitives";
import { PayrollField, PayrollDialog, PayrollPeriodPicker } from "./payroll-forms";
import { PayrollTable } from "./payroll-tables";
import { date, inputClass, money } from "./payroll-shared";

const steps = ["Period & scope", "Validate inputs", "Salary review", "Exceptions", "Approvals", "Process"];

export function PayrollDrawer({
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
