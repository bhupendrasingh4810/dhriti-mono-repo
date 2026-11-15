"use client";

import { useMemo, useState, type FormEvent } from "react";
import { DhritiDateField, DhritiSelectMenu, DhritiTextField, type FieldOption } from "@dhriti/ui";

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
  endDate: string;
  biometricId: string;
  retirementDate: string;
  resignationDate: string;
};

type Errors = Partial<Record<keyof FormValues, string>>;

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
    endDate: employee?.endDate?.slice(0, 10) ?? "",
    biometricId: employee?.biometricId ?? "",
    retirementDate: employee?.retirementDate ?? "",
    resignationDate: employee?.resignationDate ?? "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [openField, setOpenField] = useState<keyof FormValues | null>(null);
  const [joiningMonth, setJoiningMonth] = useState(
    () => employee?.startDate?.slice(0, 7) ?? new Date().toISOString().slice(0, 7),
  );
  const [dateMonths, setDateMonths] = useState<Record<string, string>>({});
  const dateField = (key: "endDate" | "retirementDate" | "resignationDate", label: string) => (
    <DhritiDateField
      label={label}
      value={values[key]}
      onChange={(value) => set(key, value)}
      month={dateMonths[key] ?? (values[key]?.slice(0, 7) || new Date().toISOString().slice(0, 7))}
      onMonthChange={(month) => setDateMonths((current) => ({ ...current, [key]: month }))}
      open={openField === key}
      onOpenChange={(open) => setOpenField(open ? key : null)}
      min={values.startDate || undefined}
      clearable
      error={errors[key]}
    />
  );
  const set = (key: keyof FormValues, value: string) => setValues((current) => ({ ...current, [key]: value }));
  // The form owns menu state and nullable options; shared fields only emit selection changes.
  const selectField = (key: keyof FormValues, label: string, items: FieldOption[], emptyLabel?: string) => (
    <DhritiSelectMenu
      label={label}
      required={key === "userId" || key === "status"}
      error={key === "userId" || key === "status" ? errors[key] : undefined}
      value={values[key] || null}
      onChange={(value) => {
        if (key === "departmentId")
          setValues((current) => ({ ...current, departmentId: value ?? "", designationId: "" }));
        else set(key, value ?? "");
      }}
      open={openField === key}
      onOpenChange={(open) => setOpenField(open ? key : null)}
      placeholder={emptyLabel ?? "Select a member"}
      options={emptyLabel ? [{ value: "", label: emptyLabel }, ...items] : items}
    />
  );

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
    // Lifecycle dates are date-only values; a changed joining date must not leave earlier exit dates.
    for (const key of ["endDate", "retirementDate", "resignationDate"] as const) {
      if (values[key] && values.startDate && values[key] < values.startDate)
        next[key] = "Date must not be before the joining date.";
    }
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
        ...(values.startDate || employee?.startDate
          ? { startDate: values.startDate ? new Date(`${values.startDate}T00:00:00.000Z`).toISOString() : null }
          : {}),
        ...(values.endDate || employee?.endDate
          ? { endDate: values.endDate ? new Date(`${values.endDate}T00:00:00.000Z`).toISOString() : null }
          : {}),
        ...(values.biometricId || employee?.biometricId ? { biometricId: values.biometricId.trim() || null } : {}),
        ...(values.retirementDate || employee?.retirementDate ? { retirementDate: values.retirementDate || null } : {}),
        ...(values.resignationDate || employee?.resignationDate
          ? { resignationDate: values.resignationDate || null }
          : {}),
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
            <h2 className="font-display text-lg font-bold text-text-primary">
              {employee ? "Edit employee" : "Add employee"}
            </h2>
            <p className="mt-1 text-xs text-text-muted">
              {employee ? employee.user.email : "Employees are created from existing active organization members."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-surface-raised"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="grid gap-4 overflow-y-auto p-6 sm:grid-cols-2">
          {employee ? (
            <DhritiTextField
              label="Member"
              disabled
              value={`${employee.user.name} (${employee.user.email})`}
              onChange={() => {}}
            />
          ) : (
            selectField(
              "userId",
              "Member",
              options.members.map((member) => ({ value: member.id, label: `${member.name} (${member.email})` })),
            )
          )}
          <DhritiTextField
            label="Employee number"
            required
            error={errors.employeeNumber}
            value={values.employeeNumber}
            onChange={(value) => set("employeeNumber", value)}
          />
          {selectField(
            "status",
            "Status",
            Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          )}
          {selectField(
            "employmentType",
            "Employment type",
            options.employmentTypes.map((item) => ({ value: item.name, label: item.name })),
            "Not specified",
          )}
          {selectField(
            "workLocationId",
            "Work location",
            options.locations.map((item) => ({ value: item.id, label: item.name })),
            "Not specified",
          )}
          {selectField(
            "shiftId",
            "Shift",
            (options.shifts ?? []).map((item) => ({
              value: item.id,
              label: `${item.name} (${formatShiftRange(item)})`,
            })),
            "No shift",
          )}
          {selectField(
            "departmentId",
            "Department",
            options.departments.map((item) => ({ value: item.id, label: item.name })),
            "Not specified",
          )}
          {selectField(
            "designationId",
            "Designation",
            designations.map((item) => ({ value: item.id, label: item.name })),
            "Not specified",
          )}
          {selectField(
            "reportingManagerId",
            "Reporting manager",
            managers.map((manager) => ({
              value: manager.id,
              label: `${manager.user.name} (${manager.employeeNumber})`,
            })),
            "No manager",
          )}
          <DhritiDateField
            label="Date of joining"
            value={values.startDate}
            onChange={(value) => set("startDate", value)}
            month={joiningMonth}
            onMonthChange={setJoiningMonth}
            open={openField === "startDate"}
            onOpenChange={(open) => setOpenField(open ? "startDate" : null)}
            placeholder="Select joining date"
            clearable
          />
          <DhritiTextField
            label="Biometric ID"
            value={values.biometricId}
            onChange={(value) => set("biometricId", value)}
            maxLength={64}
          />
          {dateField("endDate", "Employment end date")}
          {dateField("retirementDate", "Retirement date")}
          {dateField("resignationDate", "Resignation date")}
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
