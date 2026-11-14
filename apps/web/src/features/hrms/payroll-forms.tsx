"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  payrollService,
  type PayrollWorkspace,
  type SalaryComponent,
  type PayrollCalendarPeriod,
  type PayrollProfile,
} from "@/services/payroll.service";
import { Button, Icon } from "./components/ui-primitives";
import { COUNTRY_OPTIONS, CURRENCY_OPTIONS } from "./master-data-options";
import { PayrollTable } from "./payroll-tables";

type FormKind = "profile" | "structure" | "assignment" | "claim" | "variable";
const titles: Record<FormKind, string> = {
  profile: "Add payroll profile",
  structure: "Add salary structure",
  assignment: "Assign employee salary",
  claim: "Add reimbursement",
  variable: "Add variable pay input",
};
const inputClass =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50";

export function PayrollField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-xs font-medium text-text-secondary">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const frequencyLabel = (frequency: string) =>
  ({ MONTHLY: "Monthly", WEEKLY: "Weekly", BIWEEKLY: "Every two weeks", SEMIMONTHLY: "Twice monthly" })[frequency] ??
  frequency;

/** Server calendars are authoritative; never invent cycle boundaries in the browser. */
export function PayrollPeriodPicker({
  organizationId,
  profile,
  value,
  onChange,
  onClear,
  error,
  disabled = false,
  showTable = false,
}: {
  organizationId: string;
  profile: PayrollProfile;
  value: string;
  onChange: (period: PayrollCalendarPeriod) => void;
  onClear?: () => void;
  error?: string;
  disabled?: boolean;
  showTable?: boolean;
}) {
  const [year, setYear] = useState(value ? value.slice(0, 4) : String(new Date().getUTCFullYear()));
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; periods: PayrollCalendarPeriod[]; error: string } | null>(null);
  const key = `${organizationId}:${profile.id}:${year}:${attempt}`;
  const validYear = /^[1-9]\d{3}$/.test(year) && Number(year) <= 9998;
  useEffect(() => {
    if (disabled || !validYear) return;
    let active = true;
    payrollService.calendar(organizationId, profile.id, Number(year)).then(
      (periods) => {
        if (active) setResult({ key, periods, error: "" });
      },
      (failure: unknown) => {
        if (active)
          setResult({
            key,
            periods: [],
            error: failure instanceof Error ? failure.message : "Unable to load payroll calendar",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [organizationId, profile.id, year, key, disabled, validYear]);
  const current = result?.key === key ? result : null;
  const periods = current?.periods ?? [];
  const selected = periods.find((period) => period.key === value);
  return (
    <div className="space-y-3">
      <PayrollField label="Calendar year">
        <input
          type="number"
          min={1000}
          max={9998}
          value={year}
          disabled={disabled}
          aria-invalid={!validYear}
          className={`${inputClass} ${!validYear ? "border-error" : ""}`}
          onChange={(event) => {
            setYear(event.target.value);
            onClear?.();
          }}
        />
      </PayrollField>
      {!validYear && (
        <p role="alert" className="text-xs text-error">
          Enter a year between 1000 and 9998.
        </p>
      )}
      <PayrollField label="Payroll period">
        <select
          value={value}
          disabled={disabled || !current || Boolean(current.error) || !validYear}
          aria-invalid={Boolean(error)}
          className={`${inputClass} cursor-pointer ${error ? "border-error" : ""}`}
          onChange={(event) => {
            const period = periods.find((item) => item.key === event.target.value);
            if (period) onChange(period);
            else onClear?.();
          }}
        >
          <option value="">Select a configured period</option>
          {value && !selected && <option value={value}>{value} (saved selection)</option>}
          {periods.map((period) => (
            <option key={period.key} value={period.key}>
              {period.start} – {period.end} · Pay {period.payDate}
            </option>
          ))}
        </select>
      </PayrollField>
      {error && (
        <p role="alert" className="text-xs text-error">
          {error}
        </p>
      )}
      {!disabled && validYear && !current && (
        <p role="status" className="text-xs text-text-secondary">
          Loading payroll calendar...
        </p>
      )}
      {current?.error && (
        <div role="alert" className="text-xs text-error">
          {current.error}
          <button
            type="button"
            className="ml-2 cursor-pointer underline"
            onClick={() => setAttempt((value) => value + 1)}
          >
            Retry calendar
          </button>
        </div>
      )}
      {current && !current.error && !periods.length && (
        <p role="status" className="text-xs text-text-secondary">
          No periods starting on or after this profile&apos;s effective date in this year.
        </p>
      )}
      {selected && (
        <p className="text-xs text-text-secondary">
          {frequencyLabel(profile.frequency)}: {selected.start} through {selected.end}; scheduled pay date{" "}
          {selected.payDate}. No weekend/holiday shifting.
        </p>
      )}
      {showTable && (
        <PayrollTable
          label="Payroll calendar"
          rows={periods}
          rowKey={(period) => period.key}
          columns={[
            { key: "start", label: "Period start", value: (period) => period.start },
            { key: "end", label: "Period end", value: (period) => period.end },
            { key: "pay", label: "Scheduled pay date", value: (period) => period.payDate },
          ]}
        />
      )}
    </div>
  );
}

export function PayrollDialog({
  label,
  close,
  busy = false,
  centered = false,
  children,
}: {
  label: string;
  close: () => void;
  busy?: boolean;
  centered?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) close();
      }}
      onClick={(event) => {
        if (!busy && event.target === event.currentTarget) close();
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-dvw max-w-none border-0 bg-transparent p-0 text-text-primary backdrop:bg-text-primary/40"
    >
      <div
        className={centered ? "flex h-full items-center justify-center p-4" : "h-full"}
        onClick={(event) => {
          if (!busy && event.target === event.currentTarget) close();
        }}
      >
        {children}
      </div>
    </dialog>
  );
}

export function PayrollRunDecisionForm({
  organizationId,
  runId,
  action,
  close,
  complete,
}: {
  organizationId: string;
  runId: string;
  action: "cancel" | "reject";
  close: () => void;
  complete: () => void;
}) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const title = action === "cancel" ? "Cancel payroll draft" : "Reject payroll draft";
  async function submit() {
    if (reason.trim().length < 3 || reason.trim().length > 1000) {
      setFieldError("Enter a reason between 3 and 1000 characters.");
      return;
    }
    setFieldError("");
    setError("");
    setBusy(true);
    try {
      await payrollService.closeDraft(organizationId, runId, action, reason.trim());
      complete();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to close payroll draft");
    } finally {
      setBusy(false);
    }
  }
  return (
    <PayrollDialog label={title} close={close} busy={busy} centered>
      <section className="w-full max-w-lg space-y-4 rounded-xl bg-surface p-6">
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-text-secondary">
          The draft and reason remain in history. Create a replacement run after correcting its inputs. Approved or
          processed payroll cannot be closed here.
        </p>
        <div>
          <PayrollField label="Reason">
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              disabled={busy}
              aria-invalid={Boolean(fieldError)}
              aria-describedby={fieldError ? "payroll-decision-reason-error" : undefined}
              className={`${inputClass} ${fieldError ? "border-error" : ""}`}
              maxLength={1000}
            />
          </PayrollField>
          {fieldError && (
            <p id="payroll-decision-reason-error" role="alert" className="mt-1 text-xs text-error">
              {fieldError}
            </p>
          )}
        </div>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" disabled={busy} onClick={close}>
            Keep draft
          </Button>
          <Button disabled={busy} onClick={() => void submit()}>
            {title}
          </Button>
        </div>
      </section>
    </PayrollDialog>
  );
}

export function PayrollForm({
  kind,
  data,
  organizationId,
  close,
  complete,
}: {
  kind: FormKind;
  data: PayrollWorkspace;
  organizationId: string;
  close: () => void;
  complete: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({
    name: "",
    countryCode: "IN",
    currency: "INR",
    minorUnits: "2",
    effectiveFrom: new Date().toISOString().slice(0, 7) + "-01",
    employmentModel: "EMPLOYEE",
    workLocationId: "",
    registration: "",
    profileId: "",
    structureId: "",
    employeeId: "",
    monthlyGross: "",
    title: "",
    amount: "",
    expenseDate: new Date().toISOString().slice(0, 10),
    receiptReference: "",
    variableType: "EARNING",
    calculation: "FIXED",
    quantity: "1",
    rate: "",
    multiplier: "1",
    startPeriod: new Date().toISOString().slice(0, 7),
    endPeriod: new Date().toISOString().slice(0, 7),
    reason: "",
    frequency: "MONTHLY",
    calendarAnchor: "",
    payDateOffset: "0",
    targetPeriod: "",
  });
  const [components, setComponents] = useState<SalaryComponent[]>([
    { code: "BASIC", name: "Basic pay", type: "EARNING", calculation: "PERCENT_GROSS", value: "50" },
    { code: "ALLOWANCE", name: "Allowance", type: "EARNING", calculation: "REMAINDER", value: "0" },
  ]);
  const [verified, setVerified] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: string) => {
    setValues((current) => ({
      ...current,
      [key]: value,
      ...(key === "countryCode" ? { workLocationId: "" } : {}),
      ...(key === "profileId" ? { targetPeriod: "" } : {}),
      ...(key === "calculation" && value === "FIXED" ? { quantity: "1", multiplier: "1" } : {}),
      ...(key === "currency"
        ? { minorUnits: String(CURRENCY_OPTIONS.find((option) => option.code === value)?.minorUnits ?? "") }
        : {}),
    }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };
  const variableProfile = data.profiles.find((profile) => profile.id === values.profileId);
  const nonMonthlyInput = kind === "variable" && variableProfile && variableProfile.frequency !== "MONTHLY";
  const field = (key: string, label: string, type = "text", options?: { id: string; name: string }[]) => (
    <div key={key}>
      <PayrollField label={label}>
        {options ? (
          <select
            aria-label={label}
            value={values[key]}
            onChange={(event) => update(key, event.target.value)}
            aria-invalid={Boolean(errors[key])}
            className={`${inputClass} cursor-pointer ${errors[key] ? "border-error" : ""}`}
          >
            <option value="">Select...</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            aria-label={label}
            type={type}
            value={values[key]}
            onChange={(event) => update(key, event.target.value)}
            aria-invalid={Boolean(errors[key])}
            className={`${inputClass} ${errors[key] ? "border-error" : ""}`}
          />
        )}
      </PayrollField>
      {errors[key] && (
        <p role="alert" className="mt-1 text-xs text-error">
          {errors[key]}
        </p>
      )}
    </div>
  );
  async function submit() {
    const required =
      kind === "profile"
        ? ["name", "countryCode", "currency", "minorUnits", "effectiveFrom", "employmentModel"]
        : kind === "structure"
          ? ["name", "profileId"]
          : kind === "assignment"
            ? ["employeeId", "structureId", "monthlyGross", "effectiveFrom"]
            : kind === "variable"
              ? [
                  "employeeId",
                  "profileId",
                  "name",
                  "variableType",
                  "calculation",
                  "quantity",
                  "rate",
                  "multiplier",
                  "startPeriod",
                  "endPeriod",
                  "reason",
                ]
              : ["employeeId", "title", "amount", "currency", "expenseDate", "receiptReference"];
    const next: Record<string, string> = {};
    for (const key of required) if (!values[key].trim()) next[key] = "This field is required.";
    if (kind === "profile") {
      if (!["MONTHLY", "WEEKLY", "BIWEEKLY", "SEMIMONTHLY"].includes(values.frequency))
        next.frequency = "Choose a supported pay frequency.";
      if (!/^(?:[0-9]|[1-5][0-9]|60)$/.test(values.payDateOffset)) next.payDateOffset = "Use 0–60 calendar days.";
      if (["WEEKLY", "BIWEEKLY"].includes(values.frequency) && !values.calendarAnchor)
        next.calendarAnchor = "Choose a calendar anchor date.";
      if (values.frequency === "SEMIMONTHLY" && !["01", "16"].includes(values.effectiveFrom.slice(8, 10)))
        next.effectiveFrom = "Twice-monthly profiles must start on day 1 or 16.";
      if (["WEEKLY", "BIWEEKLY"].includes(values.frequency) && values.calendarAnchor && values.effectiveFrom) {
        const distance =
          (new Date(values.effectiveFrom).getTime() - new Date(values.calendarAnchor).getTime()) / 86400000;
        if (!Number.isInteger(distance) || distance % (values.frequency === "WEEKLY" ? 7 : 14))
          next.effectiveFrom = "Effective date must align with the configured cycle start.";
      }
      if (!/^[A-Z]{2}$/.test(values.countryCode)) next.countryCode = "Enter a two-letter ISO country code.";
      if (!/^[A-Z]{3}$/.test(values.currency)) next.currency = "Enter a three-letter currency code.";
      if (!/^[0-3]$/.test(values.minorUnits)) next.minorUnits = "Use 0, 1, 2, or 3 decimal places.";
    }
    for (const key of kind === "assignment" ? ["monthlyGross"] : kind === "claim" ? ["amount"] : []) {
      if (!/^\d{1,12}(?:\.\d{1,4})?$/.test(values[key]) || Number(values[key]) <= 0)
        next[key] = "Enter a positive amount with up to four decimal places.";
    }
    if (kind === "variable") {
      if (nonMonthlyInput && !values.targetPeriod) next.targetPeriod = "Choose the target payroll period.";
      for (const key of ["startPeriod", "endPeriod"]) {
        if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(values[key])) next[key] = "Enter a valid payroll month.";
      }
      for (const key of ["quantity", "rate", "multiplier"]) {
        if (!/^\d{1,12}(?:\.\d{1,4})?$/.test(values[key]) || Number(values[key]) <= 0)
          next[key] = "Enter a positive decimal (up to four places).";
      }
      if (Number(values.quantity) >= 100000000) next.quantity = "Quantity must be below 100,000,000.";
      if (Number(values.multiplier) >= 100) next.multiplier = "Multiplier must be below 100.";
      if (values.reason.trim().length < 3) next.reason = "Enter a reason of at least 3 characters.";
      if (values.endPeriod < values.startPeriod) next.endPeriod = "End month cannot precede start month.";
      if (!nonMonthlyInput && values.calculation === "HOURS" && values.startPeriod !== values.endPeriod)
        next.endPeriod = "Hours must apply to a single month.";
    }
    if (kind === "structure") {
      if (!components.length) {
        setError("Add at least one salary component.");
      }
      const seen = new Set<string>();
      components.forEach((component, index) => {
        const prefix = `component.${index}`;
        if (!component.name.trim()) next[`${prefix}.name`] = "Component name is required.";
        if (!/^[A-Z][A-Z0-9_]{0,39}$/.test(component.code) || seen.has(component.code))
          next[`${prefix}.code`] = "Enter a unique uppercase code.";
        if (!/^\d{1,12}(?:\.\d{1,4})?$/.test(component.value))
          next[`${prefix}.value`] = "Enter a nonnegative amount or percentage.";
        if (component.calculation === "PERCENT_COMPONENT" && (!component.basis || !seen.has(component.basis)))
          next[`${prefix}.basis`] = "Select an earlier component.";
        seen.add(component.code);
      });
    }
    setErrors(next);
    if (Object.keys(next).length || (kind === "structure" && !components.length)) return;
    setSaving(true);
    setError("");
    try {
      if (kind === "profile")
        await payrollService.profile(organizationId, {
          name: values.name,
          countryCode: values.countryCode,
          currency: values.currency,
          minorUnits: Number(values.minorUnits),
          effectiveFrom: values.effectiveFrom,
          employmentModel: values.employmentModel,
          frequency:
            values.frequency === "WEEKLY"
              ? "WEEKLY"
              : values.frequency === "BIWEEKLY"
                ? "BIWEEKLY"
                : values.frequency === "SEMIMONTHLY"
                  ? "SEMIMONTHLY"
                  : "MONTHLY",
          payDateOffset: Number(values.payDateOffset),
          ...(["WEEKLY", "BIWEEKLY"].includes(values.frequency) ? { calendarAnchor: values.calendarAnchor } : {}),
          rulesVerified: verified,
          ...(values.workLocationId ? { workLocationId: values.workLocationId } : {}),
          ...(values.registration ? { registration: values.registration } : {}),
        });
      if (kind === "structure")
        await payrollService.structure(organizationId, { name: values.name, profileId: values.profileId, components });
      if (kind === "assignment")
        await payrollService.assign(organizationId, {
          employeeId: values.employeeId,
          structureId: values.structureId,
          monthlyGross: values.monthlyGross,
          effectiveFrom: values.effectiveFrom,
        });
      if (kind === "claim")
        await payrollService.claim(organizationId, {
          employeeId: values.employeeId,
          title: values.title,
          amount: values.amount,
          currency: values.currency,
          expenseDate: values.expenseDate,
          receiptReference: values.receiptReference,
        });
      if (kind === "variable")
        await payrollService.variableInput(organizationId, {
          employeeId: values.employeeId,
          profileId: values.profileId,
          name: values.name,
          type:
            values.variableType === "DEDUCTION"
              ? "DEDUCTION"
              : values.variableType === "EMPLOYER"
                ? "EMPLOYER"
                : "EARNING",
          calculation: values.calculation === "HOURS" ? "HOURS" : "FIXED",
          quantity: values.quantity,
          rate: values.rate,
          multiplier: values.multiplier,
          startPeriod: values.startPeriod,
          endPeriod: values.endPeriod,
          reason: values.reason,
          ...(nonMonthlyInput ? { targetPeriod: values.targetPeriod } : {}),
        });
      complete();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Unable to save payroll configuration");
    } finally {
      setSaving(false);
    }
  }
  return (
    <PayrollDialog label={titles[kind]} close={close} busy={saving}>
      <aside className="ml-auto flex h-full w-full max-w-2xl flex-col bg-surface text-text-primary shadow-xl">
        <header className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">{titles[kind]}</h2>
          <button
            type="button"
            aria-label="Close form"
            onClick={close}
            disabled={saving}
            className="cursor-pointer rounded p-2"
          >
            <Icon name="close" />
          </button>
        </header>
        <form
          noValidate
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <fieldset disabled={saving} className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
            {kind === "variable" && (
              <>
                <p className="rounded-md bg-surface-raised p-3 text-xs text-text-secondary">
                  Explicit amounts are added after recurring salary calculations and are not prorated or automatically
                  taxed. Include any verified additional tax as a separate deduction. Independent input approval is
                  required. Monthly fixed inputs apply in full each month of the selected range; monthly hours apply to
                  one month only. Non-monthly inputs apply once, in full, to their selected period.
                </p>
                {field(
                  "employeeId",
                  "Employee",
                  "text",
                  data.employees.map((employee) => ({
                    id: employee.id,
                    name: `${employee.employeeNumber} · ${employee.user.name}`,
                  })),
                )}
                {field("profileId", "Payroll profile", "text", data.profiles)}
                {field("name", "Input name")}
                {field("variableType", "Input type", "text", [
                  { id: "EARNING", name: "Earning (bonus, commission, hours)" },
                  { id: "DEDUCTION", name: "Deduction" },
                  { id: "EMPLOYER", name: "Employer contribution" },
                ])}
                {field("calculation", "Calculation", "text", [
                  { id: "FIXED", name: "Fixed amount" },
                  { id: "HOURS", name: "Hours × rate × multiplier" },
                ])}
                {values.calculation === "HOURS" && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field("quantity", "Approved hours")}
                    {field("multiplier", "Rate multiplier")}
                  </div>
                )}
                {field(
                  "rate",
                  values.calculation === "HOURS"
                    ? "Hourly rate"
                    : nonMonthlyInput
                      ? "Amount per period"
                      : "Amount per month",
                )}
                {nonMonthlyInput ? (
                  <PayrollPeriodPicker
                    key={variableProfile.id}
                    organizationId={organizationId}
                    profile={variableProfile}
                    value={values.targetPeriod}
                    error={errors.targetPeriod}
                    onClear={() => setValues((current) => ({ ...current, targetPeriod: "" }))}
                    onChange={(period) =>
                      setValues((current) => ({
                        ...current,
                        targetPeriod: period.key,
                        startPeriod: period.start.slice(0, 7),
                        endPeriod: period.end.slice(0, 7),
                      }))
                    }
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {field("startPeriod", "Start month", "month")}
                    {field("endPeriod", "End month (inclusive)", "month")}
                  </div>
                )}
                {field("reason", "Reason / source reference")}
              </>
            )}
            {kind === "profile" && (
              <>
                <p className="rounded-md bg-surface-raised p-3 text-xs text-text-secondary">
                  Create a separate pay group per country, location, currency, or employment model. No automatic
                  statutory filing is included. Local-provider/EOR groups are tracked here but processed externally. Use
                  a new profile for effective-dated rule changes.
                </p>
                {field("name", "Profile name")}
                <div className="grid gap-3 sm:grid-cols-2">
                  {field(
                    "countryCode",
                    "Country",
                    "text",
                    COUNTRY_OPTIONS.map((country) => ({ id: country.code, name: `${country.name} (${country.code})` })),
                  )}
                  {field(
                    "currency",
                    "Currency",
                    "text",
                    CURRENCY_OPTIONS.map((currency) => ({ id: currency.code, name: currency.name })),
                  )}
                </div>
                <PayrollField label="Currency decimal places">
                  <input
                    aria-label="Currency decimal places"
                    className={inputClass}
                    value={values.minorUnits}
                    readOnly
                  />
                </PayrollField>
                <p className="text-xs text-text-secondary">
                  Decimal places follow the selected currency automatically.
                </p>
                {field(
                  "workLocationId",
                  "Work location (optional)",
                  "text",
                  data.locations.filter((location) => location.countryCode === values.countryCode),
                )}
                {field("employmentModel", "Employment model", "text", [
                  { id: "EMPLOYEE", name: "Direct employees" },
                  { id: "CONTRACTOR", name: "Contractors / consultants" },
                  { id: "LOCAL_PROVIDER", name: "Foreign subsidiary / local provider" },
                  { id: "EOR", name: "Employer of record" },
                ])}
                {field("registration", "Tax / employer registration reference (optional)")}
                {field("effectiveFrom", "Effective from", "date")}
                {field("frequency", "Pay frequency", "text", [
                  { id: "MONTHLY", name: "Monthly" },
                  { id: "WEEKLY", name: "Weekly" },
                  { id: "BIWEEKLY", name: "Every two weeks" },
                  { id: "SEMIMONTHLY", name: "Twice monthly (1–15, 16–month-end)" },
                ])}
                {["WEEKLY", "BIWEEKLY"].includes(values.frequency) &&
                  field("calendarAnchor", "Calendar anchor (cycle start)", "date")}
                {field("payDateOffset", "Pay-date offset (calendar days)", "number")}
                <p className="text-xs text-text-secondary">
                  Calendar settings cannot be edited after creation; create a new profile for changes.
                  Weekly/every-two-weeks cycles align with the anchor. Twice-monthly boundaries are 1–15 and
                  16–month-end. The profile effective date must be a cycle start so initial days are not skipped. Pay
                  dates use calendar days with no holiday/weekend shift. Non-monthly salaries allocate the monthly
                  components over each month&apos;s calendar days, not monthly salary per pay period. Country statutory
                  rates are not preloaded.
                </p>
                <label className="flex items-start gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 cursor-pointer accent-brand"
                    checked={verified}
                    onChange={(event) => setVerified(event.target.checked)}
                  />
                  I confirm the intended payroll rules have been independently verified for this jurisdiction.
                </label>
              </>
            )}
            {kind === "structure" && (
              <>
                {field("name", "Structure name")}
                {field("profileId", "Payroll profile", "text", data.profiles)}
                <p className="text-xs text-text-secondary">
                  Components are evaluated in order. Percentages can reference gross or an earlier component. Add a
                  remainder earning so earnings equal gross. Statutory rates must be verified for the relevant
                  jurisdiction.
                </p>
                {components.map((component, index) => {
                  const edit = (patch: Partial<SalaryComponent>) =>
                    setComponents((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
                  return (
                    <div key={index} className="space-y-2 rounded-lg border border-border p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">Component {index + 1}</span>
                        <button
                          type="button"
                          aria-label={`Delete component ${index + 1}`}
                          className="cursor-pointer p-1 text-error"
                          onClick={() => setComponents((current) => current.filter((_, i) => i !== index))}
                        >
                          <Icon name="delete" size={16} />
                        </button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div>
                          <PayrollField label="Code">
                            <input
                              aria-label={`Component ${index + 1} code`}
                              aria-invalid={Boolean(errors[`component.${index}.code`])}
                              className={`${inputClass} ${errors[`component.${index}.code`] ? "border-error" : ""}`}
                              value={component.code}
                              onChange={(event) => edit({ code: event.target.value.toUpperCase() })}
                            />
                          </PayrollField>
                          {errors[`component.${index}.code`] && (
                            <p role="alert" className="mt-1 text-xs text-error">
                              {errors[`component.${index}.code`]}
                            </p>
                          )}
                        </div>
                        <div>
                          <PayrollField label="Name">
                            <input
                              aria-label={`Component ${index + 1} name`}
                              aria-invalid={Boolean(errors[`component.${index}.name`])}
                              className={`${inputClass} ${errors[`component.${index}.name`] ? "border-error" : ""}`}
                              value={component.name}
                              onChange={(event) => edit({ name: event.target.value })}
                            />
                          </PayrollField>
                          {errors[`component.${index}.name`] && (
                            <p role="alert" className="mt-1 text-xs text-error">
                              {errors[`component.${index}.name`]}
                            </p>
                          )}
                        </div>
                        <PayrollField label="Type">
                          <select
                            className={`${inputClass} cursor-pointer`}
                            value={component.type}
                            onChange={(event) => edit({ type: event.target.value as SalaryComponent["type"] })}
                          >
                            <option value="EARNING">Earning</option>
                            <option value="DEDUCTION">Deduction</option>
                            <option value="EMPLOYER">Employer contribution</option>
                          </select>
                        </PayrollField>
                        <PayrollField label="Calculation">
                          <select
                            className={`${inputClass} cursor-pointer`}
                            value={component.calculation}
                            onChange={(event) =>
                              edit({ calculation: event.target.value as SalaryComponent["calculation"] })
                            }
                          >
                            <option value="FIXED">Fixed amount</option>
                            <option value="PERCENT_GROSS">% of gross</option>
                            <option value="PERCENT_COMPONENT">% of earlier component</option>
                            <option value="REMAINDER">Remaining gross</option>
                          </select>
                        </PayrollField>
                        {component.calculation !== "REMAINDER" && (
                          <div>
                            <PayrollField label="Amount / percentage">
                              <input
                                aria-invalid={Boolean(errors[`component.${index}.value`])}
                                className={`${inputClass} ${errors[`component.${index}.value`] ? "border-error" : ""}`}
                                value={component.value}
                                onChange={(event) => edit({ value: event.target.value })}
                              />
                            </PayrollField>
                            {errors[`component.${index}.value`] && (
                              <p role="alert" className="mt-1 text-xs text-error">
                                {errors[`component.${index}.value`]}
                              </p>
                            )}
                          </div>
                        )}
                        {component.calculation === "PERCENT_COMPONENT" && (
                          <div>
                            <PayrollField label="Basis component">
                              <select
                                aria-invalid={Boolean(errors[`component.${index}.basis`])}
                                className={`${inputClass} cursor-pointer ${errors[`component.${index}.basis`] ? "border-error" : ""}`}
                                value={component.basis ?? ""}
                                onChange={(event) => edit({ basis: event.target.value })}
                              >
                                <option value="">Select basis</option>
                                {components.slice(0, index).map((basis) => (
                                  <option key={basis.code} value={basis.code}>
                                    {basis.code}
                                  </option>
                                ))}
                              </select>
                            </PayrollField>
                            {errors[`component.${index}.basis`] && (
                              <p role="alert" className="mt-1 text-xs text-error">
                                {errors[`component.${index}.basis`]}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                <Button
                  variant="secondary"
                  icon="plus"
                  onClick={() =>
                    setComponents((current) => [
                      ...current,
                      {
                        code: `COMPONENT_${current.length + 1}`,
                        name: "",
                        type: "DEDUCTION",
                        calculation: "FIXED",
                        value: "0",
                      },
                    ])
                  }
                >
                  Add component
                </Button>
              </>
            )}
            {(kind === "assignment" || kind === "claim") &&
              field(
                "employeeId",
                "Employee",
                "text",
                data.employees.map((employee) => ({
                  id: employee.id,
                  name: `${employee.employeeNumber} · ${employee.user.name}`,
                })),
              )}
            {kind === "assignment" && (
              <>
                {field(
                  "structureId",
                  "Salary structure",
                  "text",
                  data.structures.map((structure) => ({
                    id: structure.id,
                    name: `${structure.name} · ${structure.profile.currency}`,
                  })),
                )}
                {field("monthlyGross", "Monthly gross", "text")}
                {field("effectiveFrom", "Effective from", "date")}
                <p className="text-xs text-text-secondary">
                  Adds a salary revision, retaining history. Backdated changes affecting locked payroll and
                  partial-month proration are blocked, not silently estimated.
                </p>
              </>
            )}
            {kind === "claim" && (
              <>
                {field("title", "Expense description")}
                {field("amount", "Amount")}
                {field(
                  "currency",
                  "Currency",
                  "text",
                  CURRENCY_OPTIONS.map((currency) => ({ id: currency.code, name: currency.name })),
                )}
                {field("expenseDate", "Expense date", "date")}
                {field("receiptReference", "Receipt / document reference")}
                <p className="text-xs text-text-secondary">
                  An independent approver must approve the claim before it can join a matching-currency payroll.
                  Document upload and OCR are not included yet.
                </p>
              </>
            )}
            {error && (
              <p role="alert" className="rounded-md border border-error/30 bg-error/5 p-3 text-sm text-error">
                {error}
              </p>
            )}
          </fieldset>
          <footer className="flex justify-end gap-2 border-t border-border p-4">
            <Button variant="secondary" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <button
              type="submit"
              disabled={saving}
              className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </footer>
        </form>
      </aside>
    </PayrollDialog>
  );
}
