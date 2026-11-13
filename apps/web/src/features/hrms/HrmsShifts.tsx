"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Clock3, Pencil, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsShift } from "@/services/hrms.service";

import { Button, Card, CardTitle } from "./components/ui-primitives";

type FormValues = { name: string; startTime: string; endTime: string; timeZone: string; isActive: boolean };

const browserZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const timeZones = () => (typeof Intl.supportedValuesOf === "function" ? Intl.supportedValuesOf("timeZone") : []);

const emptyValues: FormValues = { name: "", startTime: "09:00", endTime: "18:00", timeZone: "", isActive: true };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete this request. Please try again.";
}

/** An end time at or before the start time means the shift runs past midnight. */
function crossesMidnight(shift: Pick<HrmsShift, "startTime" | "endTime">) {
  return shift.endTime <= shift.startTime;
}

function ShiftDrawer({
  shift,
  onClose,
  onSave,
}: {
  shift: HrmsShift | null;
  onClose: () => void;
  onSave: (values: FormValues, shift: HrmsShift | null) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>(
    shift
      ? { name: shift.name, startTime: shift.startTime, endTime: shift.endTime, timeZone: shift.timeZone, isActive: shift.isActive }
      : { ...emptyValues, timeZone: browserZone() },
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.name.trim()) next.name = "Name is required.";
    else if (values.name.trim().length > 120) next.name = "Name must be 120 characters or fewer.";
    if (!values.startTime) next.startTime = "Start time is required.";
    if (!values.timeZone) next.timeZone = "Time zone is required.";
    if (!values.endTime) next.endTime = "End time is required.";
    if (values.startTime && values.startTime === values.endTime) next.endTime = "End time must differ from start time.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(values, shift);
    } catch (error) {
      setApiError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (field: keyof FormValues) =>
    `w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand ${
      errors[field] ? "border-error" : "border-border"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-text-primary/35" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${shift ? "Edit" : "Add"} shift`}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface shadow-lg"
      >
        <div className="border-b border-border px-6 py-4">
          <h2 className="font-display text-lg font-bold text-text-primary">{shift ? "Edit" : "Add"} shift</h2>
          <p className="mt-1 text-xs text-text-muted">An end time earlier than the start time spans midnight.</p>
        </div>
        <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
          <button type="submit" tabIndex={-1} aria-hidden="true" className="sr-only" />
          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {apiError && (
              <p role="alert" className="rounded-md border border-error px-3 py-2 text-sm text-error">
                {apiError}
              </p>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">
                Shift name <span className="text-error">*</span>
              </span>
              <input
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                className={fieldClass("name")}
                autoFocus
              />
              {errors.name && <span className="mt-1 block text-xs text-error">{errors.name}</span>}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-primary">
                  Starts <span className="text-error">*</span>
                </span>
                <input
                  type="time"
                  value={values.startTime}
                  onChange={(event) => update("startTime", event.target.value)}
                  className={fieldClass("startTime")}
                />
                {errors.startTime && <span className="mt-1 block text-xs text-error">{errors.startTime}</span>}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-text-primary">
                  Ends <span className="text-error">*</span>
                </span>
                <input
                  type="time"
                  value={values.endTime}
                  onChange={(event) => update("endTime", event.target.value)}
                  className={fieldClass("endTime")}
                />
                {errors.endTime && <span className="mt-1 block text-xs text-error">{errors.endTime}</span>}
              </label>
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">
                Time zone <span className="text-error">*</span>
              </span>
              <input
                list="shift-time-zones"
                value={values.timeZone}
                onChange={(event) => update("timeZone", event.target.value)}
                className={fieldClass("timeZone")}
              />
              <datalist id="shift-time-zones">
                {timeZones().map((zone) => (
                  <option key={zone} value={zone} />
                ))}
              </datalist>
              {errors.timeZone && <span className="mt-1 block text-xs text-error">{errors.timeZone}</span>}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-primary">
              <input
                type="checkbox"
                checked={values.isActive}
                onChange={(event) => update("isActive", event.target.checked)}
                className="cursor-pointer"
              />
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export function HrmsShifts({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [shifts, setShifts] = useState<HrmsShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<HrmsShift | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<HrmsShift | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoading(true);
    setLoadError("");
    try {
      setShifts(await hrmsService.shifts.list(organizationId));
    } catch (error) {
      setShifts([]);
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const save = async (values: FormValues, shift: HrmsShift | null) => {
    if (!organizationId) throw new Error("An organization must be selected before saving.");
    const input = { ...values, name: values.name.trim() };
    if (shift) await hrmsService.shifts.update(organizationId, shift.id, input);
    else await hrmsService.shifts.create(organizationId, input);
    setEditing(undefined);
    await load();
    onToast(`Shift ${shift ? "updated" : "created"} successfully.`);
  };

  const remove = async () => {
    if (!organizationId || !deleting) return;
    setBusy(true);
    setDeleteError("");
    try {
      await hrmsService.shifts.remove(organizationId, deleting.id);
      setDeleting(null);
      await load();
      onToast("Shift deleted successfully.");
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="shrink-0">
        <h1 className="text-2xl font-bold text-text-primary">Shifts</h1>
        <p className="mt-1 text-sm text-text-secondary">Define the shifts and timings available to your organization.</p>
      </header>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardTitle
          title="Shifts"
          subtitle="Morning, Day, Evening and Night are provided by default; edit their times as needed."
          action={
            <Button icon="plus" onClick={() => setEditing(null)} disabled={!organizationId}>
              Add shift
            </Button>
          }
        />
        {loadError ? (
          <div role="alert" className="p-5 text-sm text-error">
            {loadError}
          </div>
        ) : loading ? (
          <div className="p-5 text-sm text-text-muted">Loading shifts…</div>
        ) : shifts.length === 0 ? (
          <div className="p-5 text-sm text-text-muted">No shifts found.</div>
        ) : (
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {shifts.map((shift) => (
              <div key={shift.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-muted text-brand">
                  <Clock3 aria-hidden="true" size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{shift.name}</p>
                  <p className="text-xs text-text-muted">
                    {shift.startTime} – {shift.endTime} ({shift.timeZone})
                    {crossesMidnight(shift) ? " (next day)" : ""} · {shift.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Edit ${shift.name}`}
                  title={`Edit ${shift.name}`}
                  onClick={() => setEditing(shift)}
                  className="cursor-pointer rounded-md p-2 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                >
                  <Pencil aria-hidden="true" size={18} />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${shift.name}`}
                  title={`Delete ${shift.name}`}
                  onClick={() => {
                    setDeleteError("");
                    setDeleting(shift);
                  }}
                  className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"
                >
                  <Trash2 aria-hidden="true" size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
      {editing !== undefined && <ShiftDrawer shift={editing} onClose={() => setEditing(undefined)} onSave={save} />}
      {deleting && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/35 p-4"
          onClick={() => !busy && setDeleting(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-shift-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <h2 id="delete-shift-title" className="font-display text-lg font-bold text-text-primary">
              Delete shift?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Delete <span className="font-semibold">{deleting.name}</span>? This cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-4 rounded-md border border-error px-3 py-2 text-sm text-error">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleting(null)} disabled={busy}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void remove()} disabled={busy}>
                {busy ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
