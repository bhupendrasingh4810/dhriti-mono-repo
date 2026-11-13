"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import type { HrmsEmployee, HrmsEmployeeOptions } from "@/services/hrms.service";
import { Button, Icon } from "../components/ui-primitives";
import { formatShiftRange } from "@/features/hrms/shift-format";
import { statusLabels } from "./shared";

type FormValues = {
  userId: string;
  employeeNumber: string;
  status: string;
  employmentType: string;
  workLocationId: string;
  shiftId: string;
  departmentId: string;
  designationId: string;
  reportingManagerId: string;
  startDate: string;
};

type Errors = Partial<Record<"userId" | "employeeNumber" | "status", string>>;

const fieldClass = (invalid: boolean) =>
  `w-full rounded-md border bg-white px-3 py-2 text-sm outline-none transition focus:ring-2 ${
    invalid ? "border-error focus:ring-error/10" : "border-border focus:border-brand focus:ring-brand/10"
  }`;

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-text-primary">
      {label}
      {required && <span className="text-error"> *</span>}
      <div className="mt-1.5">{children}</div>
      {error && (
        <p role="alert" className="mt-1 text-xs font-normal text-error">
          {error}
        </p>
      )}
    </label>
  );
}

/**
 * Create/edit form for an employee. Members are only selectable on create (an employee is always an
 * existing organization member); on edit the identity is read-only. `onSubmit` rejections surface inline.
 */
export function EmployeeForm({
  employee,
  options,
  onClose,
  onSubmit,
}: {
  employee: HrmsEmployee | null;
  options: HrmsEmployeeOptions;
  onClose: () => void;
  onSubmit: (input: Record<string, unknown>) => Promise<void>;
}) {
  const [values, setValues] = useState<FormValues>({
    userId: employee?.user.id ?? "",
    employeeNumber: employee?.employeeNumber ?? "",
    status: employee?.status ?? "ACTIVE",
    employmentType: employee?.employmentType ?? "",
    workLocationId: employee?.workLocationId ?? "",
    shiftId: employee?.shiftId ?? "",
    departmentId: employee?.departmentId ?? "",
    designationId: employee?.designationId ?? "",
    reportingManagerId: employee?.reportingManagerId ?? "",
    startDate: employee?.startDate?.slice(0, 10) ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof FormValues, value: string) => setValues((current) => ({ ...current, [key]: value }));

  const designations = useMemo(
    () =>
      options.designations.filter(
        (item) => !values.departmentId || !item.departmentId || item.departmentId === values.departmentId,
      ),
    [options.designations, values.departmentId],
  );
  const managers = options.managers.filter((manager) => manager.id !== employee?.id);

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!employee && !values.userId) next.userId = "Select the organization member for this employee.";
    if (!values.employeeNumber.trim()) next.employeeNumber = "Employee number is required.";
    if (!values.status) next.status = "Status is required.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setSaving(true);
    setFormError("");
    try {
      await onSubmit({
        ...(employee ? {} : { userId: values.userId }),
        employeeNumber: values.employeeNumber.trim(),
        status: values.status,
        ...(values.employmentType ? { employmentType: values.employmentType } : {}),
        workLocationId: values.workLocationId || null,
        shiftId: values.shiftId || null,
        departmentId: values.departmentId || null,
        designationId: values.designationId || null,
        reportingManagerId: values.reportingManagerId || null,
        ...(values.startDate ? { startDate: new Date(`${values.startDate}T00:00:00.000Z`).toISOString() } : {}),
      });
    } catch (reason) {
      setFormError(reason instanceof Error ? reason.message : "Unable to save the employee.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <form
        noValidate
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label={employee ? "Edit employee" : "Add employee"}
        className="flex max-h-full w-full max-w-2xl flex-col overflow-hidden rounded-lg bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">{employee ? "Edit employee" : "Add employee"}</h2>
            <p className="mt-1 text-xs text-text-muted">
              {employee ? employee.user.email : "Employees are created from existing active organization members."}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised">
            <Icon name="close" />
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          {employee ? (
            <Field label="Member">
              <input disabled value={`${employee.user.name} (${employee.user.email})`} className={fieldClass(false)} />
            </Field>
          ) : (
            <Field label="Member" required error={errors.userId}>
              <select value={values.userId} onChange={(e) => set("userId", e.target.value)} className={`${fieldClass(!!errors.userId)} cursor-pointer`}>
                <option value="">Select a member</option>
                {options.members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Employee number" required error={errors.employeeNumber}>
            <input value={values.employeeNumber} onChange={(e) => set("employeeNumber", e.target.value)} className={fieldClass(!!errors.employeeNumber)} />
          </Field>
          <Field label="Status" required error={errors.status}>
            <select value={values.status} onChange={(e) => set("status", e.target.value)} className={`${fieldClass(!!errors.status)} cursor-pointer`}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Employment type">
            <select value={values.employmentType} onChange={(e) => set("employmentType", e.target.value)} className={`${fieldClass(false)} cursor-pointer`}>
              <option value="">Not specified</option>
              {options.employmentTypes.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Work location">
            <select value={values.workLocationId} onChange={(e) => set("workLocationId", e.target.value)} className={`${fieldClass(false)} cursor-pointer`}>
              <option value="">Not specified</option>
              {options.locations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Shift">
            <select value={values.shiftId} onChange={(e) => set("shiftId", e.target.value)} className={`${fieldClass(false)} cursor-pointer`}>
              <option value="">No shift</option>
              {(options.shifts ?? []).map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({formatShiftRange(item)})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Department">
            <select
              value={values.departmentId}
              onChange={(e) => setValues((current) => ({ ...current, departmentId: e.target.value, designationId: "" }))}
              className={`${fieldClass(false)} cursor-pointer`}
            >
              <option value="">Not specified</option>
              {options.departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Designation">
            <select value={values.designationId} onChange={(e) => set("designationId", e.target.value)} className={`${fieldClass(false)} cursor-pointer`}>
              <option value="">Not specified</option>
              {designations.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Reporting manager">
            <select value={values.reportingManagerId} onChange={(e) => set("reportingManagerId", e.target.value)} className={`${fieldClass(false)} cursor-pointer`}>
              <option value="">No manager</option>
              {managers.map((manager) => (
                <option key={manager.id} value={manager.id}>
                  {manager.user.name} ({manager.employeeNumber})
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date of joining">
            <input type="date" value={values.startDate} onChange={(e) => set("startDate", e.target.value)} className={fieldClass(false)} />
          </Field>
        </div>
        {formError && (
          <p role="alert" className="border-t border-border bg-red-50 px-6 py-2 text-sm text-error">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center justify-center rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : employee ? "Save changes" : "Add employee"}
          </button>
        </div>
      </form>
    </div>
  );
}
