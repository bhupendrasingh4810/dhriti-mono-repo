"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ConfirmationDialog } from "@/components/dialogs/ConfirmationDialog";
import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsLeaveType } from "@/services/hrms.service";
import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

const categories = [
  ["VACATION", "Vacation / privilege"],
  ["SICK_LEAVE", "Sick"],
  ["PERSONAL_LEAVE", "Personal / casual"],
  ["MATERNITY_LEAVE", "Maternity"],
  ["PATERNITY_LEAVE", "Paternity"],
  ["BEREAVEMENT_LEAVE", "Bereavement"],
  ["JURY_DUTY", "Jury duty"],
  ["UNPAID_LEAVE", "Unpaid"],
  ["WORK_FROM_HOME", "Work from home"],
  ["HALF_DAY", "Half day"],
] as const;

type Form = {
  id?: string;
  name: string;
  code: string;
  category: string;
  annualDays: string;
  carryForwardDays: string;
  isPaid: boolean;
  allowHalfDay: boolean;
  isCompOff: boolean;
  isActive: boolean;
};

const emptyForm: Form = {
  name: "",
  code: "",
  category: "VACATION",
  annualDays: "0",
  carryForwardDays: "0",
  isPaid: true,
  allowHalfDay: true,
  isCompOff: false,
  isActive: true,
};

const message = (error: unknown) => (error instanceof Error ? error.message : "Unable to complete this request.");
const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand ${
    invalid ? "border-error" : "border-border"
  }`;

function LeaveTypeDialog({
  initial,
  onClose,
  onSave,
}: {
  initial: Form;
  onClose: () => void;
  onSave: (form: Form) => Promise<void>;
}) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!form.name.trim()) next.name = "Name is required.";
    if (!/^[A-Z0-9_]{2,20}$/.test(form.code)) next.code = "Use 2–20 capital letters, digits or underscores.";
    if (!(Number(form.annualDays) >= 0)) next.annualDays = "Enter 0 or more.";
    if (!(Number(form.carryForwardDays) >= 0)) next.carryForwardDays = "Enter 0 or more.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setApiError("");
    try {
      await onSave(form);
    } catch (error) {
      setApiError(message(error));
    } finally {
      setSaving(false);
    }
  };

  const error = (key: string) => errors[key] && <p className="mt-1 text-xs text-error">{errors[key]}</p>;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Leave type"
        className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-bold text-text-primary">{form.id ? "Edit leave type" : "New leave type"}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-md p-1 text-text-muted hover:bg-surface-raised">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-text-secondary">
            Name
            <input value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass(!!errors.name)} />
            {error("name")}
          </label>
          <label className="block text-sm font-medium text-text-secondary">
            Code
            <input
              value={form.code}
              onChange={(e) => update("code", e.target.value.toUpperCase())}
              className={inputClass(!!errors.code)}
            />
            {error("code")}
          </label>
          <label className="block text-sm font-medium text-text-secondary">
            Category
            <select value={form.category} onChange={(e) => update("category", e.target.value)} className={`${inputClass(false)} cursor-pointer`}>
              {categories.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-text-secondary">
            Days per year
            <input
              type="number"
              min={0}
              step={0.5}
              disabled={form.isCompOff}
              value={form.annualDays}
              onChange={(e) => update("annualDays", e.target.value)}
              className={inputClass(!!errors.annualDays)}
            />
            {error("annualDays")}
            <span className="mt-1 block text-xs text-text-muted">0 means unlimited.</span>
          </label>
          <label className="block text-sm font-medium text-text-secondary">
            Carry-forward days
            <input
              type="number"
              min={0}
              step={0.5}
              value={form.carryForwardDays}
              onChange={(e) => update("carryForwardDays", e.target.value)}
              className={inputClass(!!errors.carryForwardDays)}
            />
            {error("carryForwardDays")}
          </label>
        </div>
        <div className="grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
          {(
            [
              ["isPaid", "Paid leave"],
              ["allowHalfDay", "Allow half days"],
              ["isCompOff", "Balance comes from approved comp-off"],
              ["isActive", "Active"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={form[key]} onChange={(e) => update(key, e.target.checked)} className="cursor-pointer" />
              {label}
            </label>
          ))}
        </div>
        {apiError && <p role="alert" className="text-sm text-error">{apiError}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}

/** HRMS settings: manage the leave types employees can apply for (entitlement, paid, half-day, comp-off). */
export function HrmsLeaveTypes({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [types, setTypes] = useState<HrmsLeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editing, setEditing] = useState<Form | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setLoadError("");
    try {
      setTypes(await hrmsService.leave.types(organizationId));
    } catch (error) {
      setLoadError(message(error));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const save = async (form: Form) => {
    if (!organizationId) return;
    await hrmsService.leave.saveType(organizationId, {
      id: form.id,
      name: form.name.trim(),
      code: form.code,
      category: form.category,
      annualDays: form.isCompOff ? 0 : Number(form.annualDays),
      carryForwardDays: Number(form.carryForwardDays),
      isPaid: form.isPaid,
      allowHalfDay: form.allowHalfDay,
      isCompOff: form.isCompOff,
      isActive: form.isActive,
    });
    setEditing(null);
    await load();
    onToast("Leave type saved.");
  };

  const [pendingDelete, setPendingDelete] = useState<HrmsLeaveType | null>(null);

  const remove = async (type: HrmsLeaveType) => {
    setPendingDelete(null);
    if (!organizationId) return;
    try {
      const result = await hrmsService.leave.removeType(organizationId, type.id);
      await load();
      onToast(result.deactivated ? "Leave type is in use, so it was deactivated." : "Leave type deleted.");
    } catch (error) {
      onToast(message(error));
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <Card>
        <CardTitle
          title="Leave types"
          subtitle="Types employees can apply for, with their yearly entitlement."
          action={
            <Button icon="plus" onClick={() => setEditing(emptyForm)}>
              Add leave type
            </Button>
          }
        />
        {loadError && <p role="alert" className="px-5 py-4 text-sm text-error">{loadError}</p>}
        {loading ? (
          <p className="px-5 py-6 text-sm text-text-muted">Loading…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-raised text-xs uppercase text-text-muted">
                <tr>
                  {["Name", "Code", "Days / year", "Carry-forward", "Flags", "Status", ""].map((heading) => (
                    <th key={heading} className="px-5 py-3 font-semibold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {types.map((type) => (
                  <tr key={type.id}>
                    <td className="px-5 py-3 text-sm font-semibold text-text-primary">{type.name}</td>
                    <td className="px-5 py-3 text-sm text-text-secondary">{type.code}</td>
                    <td className="px-5 py-3 text-sm">{type.isCompOff ? "From comp-off" : type.annualDays === 0 ? "Unlimited" : type.annualDays}</td>
                    <td className="px-5 py-3 text-sm">{type.carryForwardDays}</td>
                    <td className="space-x-1 px-5 py-3">
                      <Badge tone={type.isPaid ? "success" : "neutral"}>{type.isPaid ? "Paid" : "Unpaid"}</Badge>
                      {type.allowHalfDay && <Badge tone="info">Half day</Badge>}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={type.isActive ? "success" : "neutral"}>{type.isActive ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="space-x-2 px-5 py-3 text-right">
                      <button
                        type="button"
                        aria-label={`Edit ${type.name}`}
                        className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised hover:text-text-primary"
                        onClick={() =>
                          setEditing({
                            id: type.id,
                            name: type.name,
                            code: type.code,
                            category: type.category,
                            annualDays: String(type.annualDays),
                            carryForwardDays: String(type.carryForwardDays),
                            isPaid: type.isPaid,
                            allowHalfDay: type.allowHalfDay,
                            isCompOff: type.isCompOff,
                            isActive: type.isActive,
                          })
                        }
                      >
                        <Icon name="edit" size={16} />
                      </button>
                      <button
                        type="button"
                        aria-label={`Delete ${type.name}`}
                        className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised hover:text-error"
                        onClick={() => setPendingDelete(type)}
                      >
                        <Icon name="delete" size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      <ConfirmationDialog
        open={Boolean(pendingDelete)}
        title="Delete leave type"
        description={`Delete "${pendingDelete?.name ?? ""}"? Types already used by requests are deactivated instead.${
          pendingDelete?.code === "BIRTHDAY" || pendingDelete?.code === "OPTIONAL"
            ? " This also turns the matching setting off."
            : ""
        }`}
        confirmLabel="Delete"
        confirmColor="error"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && void remove(pendingDelete)}
      />
      {editing && <LeaveTypeDialog initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  );
}
