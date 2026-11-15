"use client";

import { useEffect, useState } from "react";
import { DhritiDateField, DhritiSelectMenu, DhritiTextField } from "@dhriti/ui";
import { updateHrmsLifecycleSchema } from "@dhriti/validation";
import type { HrmsEmployeeLifecycleResponse, HrmsLifecycleAction, HrmsEmployeeReadiness } from "@dhriti/types";
import { hrmsService } from "@/services/hrms.service";
import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { Button, Card, CardTitle } from "../components/ui-primitives";

type Action = HrmsLifecycleAction["action"];
const actions: { value: Action; label: string }[] = [
  { value: "CONFIGURE", label: "Configure tracking" },
  { value: "CONFIRM_PROBATION", label: "Confirm probation" },
  { value: "EXTEND_PROBATION", label: "Extend probation" },
  { value: "RENEW_CONTRACT", label: "Renew contract" },
  { value: "APPROVE_LAST_WORKING_DATE", label: "Approve last working date" },
];
const errorText = (error: unknown) => (error instanceof Error ? error.message : "Unable to load employee foundations.");

/** HR decisions record tracking/audit only; they never terminate employment or release payroll. */
export function EmployeeLifecycle({
  organizationId,
  employeeId,
  onDirtyChange,
  onBusyChange,
}: {
  organizationId: string;
  employeeId: string;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const [saved, setSaved] = useState<HrmsEmployeeLifecycleResponse | null>(null);
  const [readiness, setReadiness] = useState<HrmsEmployeeReadiness | null>(null);
  const [action, setAction] = useState<Action>("CONFIGURE");
  const [fields, setFields] = useState({
    probationEndDate: "",
    contractStartDate: "",
    contractEndDate: "",
    noticePeriodDays: "",
    date: "",
    reason: "",
  });
  const [open, setOpen] = useState<string | null>(null);
  const [months, setMonths] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [retry, setRetry] = useState(0);
  const [status, setStatus] = useState("");
  const [confirmReload, setConfirmReload] = useState(false);
  const reload = () => {
    setSaved(null);
    setReadiness(null);
    setDirty(false);
    setErrors({});
    setError("");
    setStatus("");
    setConfirmReload(false);
    setRetry((value) => value + 1);
  };
  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(busy);
  }, [busy, onBusyChange]);
  useEffect(() => {
    let active = true;
    Promise.all([
      hrmsService.employees.lifecycle(organizationId, employeeId),
      hrmsService.employees.readiness(organizationId, employeeId),
    ])
      .then(([lifecycle, readiness]) => {
        if (!active) return;
        setSaved(lifecycle);
        setReadiness(readiness);
        setFields({
          probationEndDate: lifecycle.data.probationEndDate ?? "",
          contractStartDate: lifecycle.data.contractStartDate ?? "",
          contractEndDate: lifecycle.data.contractEndDate ?? "",
          noticePeriodDays: lifecycle.data.noticePeriodDays?.toString() ?? "",
          date: "",
          reason: "",
        });
        setDirty(false);
        setError("");
      })
      .catch((reason: unknown) => {
        if (active) setError(errorText(reason));
      });
    return () => {
      active = false;
    };
  }, [organizationId, employeeId, retry]);
  const update = (key: keyof typeof fields, value: string) => {
    setFields((current) => ({ ...current, [key]: value }));
    setDirty(true);
    setErrors({});
    setStatus("");
  };
  const dateField = (
    key: "probationEndDate" | "contractStartDate" | "contractEndDate" | "date",
    label: string,
    required = false,
    disabled = false,
  ) => (
    <DhritiDateField
      label={label}
      required={required}
      value={fields[key]}
      onChange={(value) => update(key, value ?? "")}
      month={months[key] ?? (fields[key].slice(0, 7) || new Date().toISOString().slice(0, 7))}
      onMonthChange={(value) => setMonths((current) => ({ ...current, [key]: value }))}
      open={open === key}
      onOpenChange={(shown) => setOpen(shown ? key : null)}
      error={errors[key]}
      disabled={busy || disabled}
      clearable={!required}
    />
  );
  const save = async () => {
    if (!saved || busy) return;
    const body = {
      action,
      version: saved.version,
      reason: fields.reason,
      ...(action === "CONFIGURE"
        ? {
            data: {
              probationEndDate: fields.probationEndDate || null,
              contractStartDate: fields.contractStartDate || null,
              contractEndDate: fields.contractEndDate || null,
              noticePeriodDays: fields.noticePeriodDays.trim() === "" ? null : Number(fields.noticePeriodDays),
            },
          }
        : { date: fields.date }),
    };
    const parsed = updateHrmsLifecycleSchema.safeParse(body);
    if (!parsed.success) {
      setErrors(Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path.at(-1)), issue.message])));
      return;
    }
    setBusy(true);
    setStatus("");
    setError("");
    setOpen(null);
    try {
      const result = await hrmsService.employees.updateLifecycle(organizationId, employeeId, parsed.data);
      setSaved(result);
      setFields({
        probationEndDate: result.data.probationEndDate ?? "",
        contractStartDate: result.data.contractStartDate ?? "",
        contractEndDate: result.data.contractEndDate ?? "",
        noticePeriodDays: result.data.noticePeriodDays?.toString() ?? "",
        date: "",
        reason: "",
      });
      setDirty(false);
      setStatus("Lifecycle decision saved.");
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  if (!saved || !readiness)
    return (
      <div className="space-y-3">
        {error ? (
          <>
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
            <Button variant="secondary" onClick={() => setRetry((value) => value + 1)}>
              Retry foundations
            </Button>
          </>
        ) : (
          <p role="status" className="text-sm text-text-muted">
            Loading employee foundations…
          </p>
        )}
      </div>
    );
  const details = [
    ["Probation", saved.probationStatus.replaceAll("_", " ").toLowerCase()],
    ["Probation end", saved.data.probationEndDate ?? "Not configured"],
    ["Confirmed on", saved.data.probationConfirmedOn ?? "Not recorded"],
    ["Contract", saved.contractStatus.toLowerCase()],
    ["Contract start", saved.data.contractStartDate ?? "Not configured"],
    ["Contract end", saved.data.contractEndDate ?? "Not configured"],
    ["Notice days (calendar)", saved.data.noticePeriodDays?.toString() ?? "Not configured"],
    ["Proposed last working date", saved.proposedLastWorkingDate ?? "Requires resignation date and notice days"],
    ["Approved last working date", saved.data.approvedLastWorkingDate ?? "Not approved"],
  ];
  return (
    <div className="space-y-4">
      <Card>
        <CardTitle title={`Setup checklist · ${readiness.complete}/${readiness.total}`} />
        <p className="px-5 pt-3 text-xs text-text-muted">
          Advisory only, not payroll or compliance approval. Top-level employees may intentionally have no manager.
        </p>
        <ul className="divide-y divide-border p-5">
          {readiness.checks.map((check) => (
            <li key={check.key} className="py-2">
              <p className={`text-sm font-semibold ${check.status === "COMPLETE" ? "text-success" : "text-warning"}`}>
                {check.label} · {check.status === "COMPLETE" ? "Configured" : "Needs review"}
              </p>
              <p className="text-xs text-text-secondary">{check.message}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card>
        <CardTitle title="Employee lifecycle" />
        <dl className="space-y-2 p-5 text-sm">
          {details.map(([label, value]) => (
            <div key={label} className="flex flex-wrap justify-between gap-2">
              <dt className="text-text-muted">{label}</dt>
              <dd className="font-medium text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <fieldset disabled={busy} className="space-y-4 rounded-lg border border-border bg-surface p-5">
        <h3 className="text-sm font-semibold text-text-primary">Record HR decision</h3>
        <p className="text-xs text-text-muted">
          Dates use UTC calendar days. No automatic confirmation, termination, access revocation or payroll change.
          Notice days count after the resignation date.
        </p>
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        {status && (
          <p role="status" className="text-sm text-success">
            {status}
          </p>
        )}
        <DhritiSelectMenu
          label="Action"
          value={action}
          options={actions}
          open={open === "action"}
          onOpenChange={(shown) => setOpen(shown ? "action" : null)}
          onChange={(value) => {
            const chosen = actions.find((option) => option.value === value);
            if (chosen) {
              setAction(chosen.value);
              setErrors({});
              setDirty(true);
            }
          }}
        />
        {action === "CONFIGURE" ? (
          <>
            {dateField("probationEndDate", "Probation end date", false, !!saved.data.probationEndDate)}
            {dateField("contractStartDate", "Contract start date", false, !!saved.data.contractEndDate)}
            {dateField("contractEndDate", "Contract end date", false, !!saved.data.contractEndDate)}
            <DhritiTextField
              label="Notice period days"
              value={fields.noticePeriodDays}
              onChange={(value) => update("noticePeriodDays", value)}
              error={errors.noticePeriodDays}
              placeholder="Not configured"
            />
            <p className="text-xs text-text-muted">
              Use the extension or renewal action to change existing end dates. Notice days are an employee-specific
              value; no organization default is assumed.
            </p>
          </>
        ) : (
          dateField(
            "date",
            action === "CONFIRM_PROBATION"
              ? "Confirmation date"
              : action === "EXTEND_PROBATION"
                ? "New probation end date"
                : action === "RENEW_CONTRACT"
                  ? "New contract end date"
                  : "Last working date",
            true,
          )
        )}
        <DhritiTextField
          label="Reason"
          required
          value={fields.reason}
          onChange={(value) => update("reason", value)}
          error={errors.reason}
          maxLength={1000}
        />
        <div className="flex justify-end">
          <Button variant="secondary" disabled={busy} onClick={() => (dirty ? setConfirmReload(true) : reload())}>
            Reload tracking
          </Button>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : "Save decision"}
          </Button>
        </div>
      </fieldset>
      <Card>
        <CardTitle title="Recent lifecycle decisions" />
        <ul className="space-y-3 p-5">
          {saved.history.length ? (
            saved.history.map((event) => (
              <li key={event.id} className="text-sm text-text-primary">
                <p className="font-semibold">{event.action.replaceAll("_", " ")}</p>
                <p>{event.reason}</p>
                <p className="text-xs text-text-muted">
                  {event.actor?.name ?? "Former user"} · {event.recordedAt}
                </p>
              </li>
            ))
          ) : (
            <li className="text-sm text-text-muted">No lifecycle decisions recorded.</li>
          )}
        </ul>
        <p className="px-5 pb-4 text-xs text-text-muted">Latest 50 decisions; full history remains in the audit log.</p>
      </Card>
      <ConfirmationDialog
        open={confirmReload}
        title="Reload lifecycle tracking?"
        description="Your unsaved lifecycle changes will be discarded."
        confirmLabel="Reload"
        onCancel={() => setConfirmReload(false)}
        onConfirm={reload}
      />
    </div>
  );
}
