"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { organizationAccessService } from "@/services/organization-management.service";
import type { ApiEntity } from "@/services/service-types";

import { Button, Card, CardTitle, Icon, ListSkeleton } from "./components/ui-primitives";

type Department = ApiEntity & {
  name: string;
  code?: string | null;
  parentId?: string | null;
  parent?: { name: string } | null;
  _count?: { members?: number };
};

type DepartmentValues = {
  name: string;
  code: string;
  parentId: string;
};

const emptyValues: DepartmentValues = { name: "", code: "", parentId: "" };

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete this request. Please try again.";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function valuesFor(department?: Department): DepartmentValues {
  return department
    ? { name: department.name, code: department.code ?? "", parentId: department.parentId ?? "" }
    : emptyValues;
}

function IconButton({
  label,
  children,
  onClick,
  disabled = false,
  danger = false,
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`cursor-pointer rounded-md p-2 hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40 ${
        danger ? "text-error" : "text-text-secondary hover:text-text-primary"
      }`}
    >
      {children}
    </button>
  );
}

function DepartmentDrawer({
  department,
  departments,
  onClose,
  onSave,
}: {
  department: Department | null;
  departments: Department[];
  onClose: () => void;
  onSave: (values: DepartmentValues, department: Department | null) => Promise<void>;
}) {
  const [values, setValues] = useState(() => valuesFor(department ?? undefined));
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [errors, setErrors] = useState<Record<keyof DepartmentValues, string>>({
    name: "",
    code: "",
    parentId: "",
  });
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);

  const update = (field: keyof DepartmentValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !isCodeManual) {
        next.code = slugify(value);
      }
      return next;
    });
    setErrors((current) => ({ ...current, [field]: "", ...(field === "name" ? { code: "" } : {}) }));
  };

  const validate = () => {
    const next = { name: "", code: "", parentId: "" };
    if (!values.name.trim()) {
      next.name = "Name is required.";
    } else if (values.name.trim().length > 120) {
      next.name = "Name must be 120 characters or fewer.";
    }
    if (!values.code.trim()) {
      next.code = "Code is required.";
    } else if (values.code.length > 64) {
      next.code = "Code must be 64 characters or fewer.";
    }
    setErrors(next);
    return !next.name && !next.code;
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setApiError("");
    if (!validate()) {
      return;
    }
    setSaving(true);
    try {
      await onSave(values, department);
    } catch (error) {
      setApiError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (field: keyof DepartmentValues) =>
    `w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand ${
      errors[field] ? "border-error" : "border-border"
    }`;

  return (
    <div className="fixed inset-0 z-50 bg-text-primary/35" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${department ? "Manage" : "Add"} department`}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">
              {department ? "Manage" : "Add"} department
            </h2>
            <p className="mt-1 text-xs text-text-muted">Changes apply to the selected organization.</p>
          </div>
          <IconButton label="Close panel" onClick={onClose}>
            <Icon name="close" />
          </IconButton>
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
                Department name <span className="text-error">*</span>
              </span>
              <input
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                className={fieldClass("name")}
                autoFocus
              />
              {errors.name && <span className="mt-1 block text-xs text-error">{errors.name}</span>}
            </label>
            <div>
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">
                Code <span className="text-error">*</span>
              </span>
              <div className="flex gap-2">
                <input
                  value={values.code}
                  onChange={(event) => update("code", event.target.value)}
                  className={fieldClass("code")}
                  disabled={!isCodeManual}
                />
                <IconButton
                  label={isCodeManual ? "Code editing enabled" : "Edit code"}
                  onClick={() => setIsCodeManual(true)}
                  disabled={isCodeManual}
                >
                  <Pencil aria-hidden="true" size={18} />
                </IconButton>
              </div>
              {errors.code && <span className="mt-1 block text-xs text-error">{errors.code}</span>}
            </div>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-text-primary">Parent department</span>
              <select
                value={values.parentId}
                onChange={(event) => update("parentId", event.target.value)}
                className={fieldClass("parentId")}
              >
                <option value="">No parent department</option>
                {departments
                  .filter((candidate) => candidate.id !== department?.id)
                  .map((candidate) => (
                    <option key={candidate.id} value={candidate.id}>
                      {candidate.name}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Saving…" : department ? "Save changes" : "Add department"}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export function HrmsDepartments({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null | undefined>(undefined);
  const [deletingDepartment, setDeletingDepartment] = useState<Department | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!organizationId) {
      return;
    }
    setLoading(true);
    setLoadError("");
    try {
      setDepartments((await organizationAccessService.departments.list(organizationId)) as Department[]);
    } catch (error) {
      setDepartments([]);
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const save = async (values: DepartmentValues, department: Department | null) => {
    if (!organizationId) {
      throw new Error("An organization must be selected before saving.");
    }
    const input = {
      name: values.name.trim(),
      code: values.code.trim(),
      parentId: values.parentId || (department ? null : undefined),
    };
    if (department) {
      await organizationAccessService.departments.update(organizationId, department.id, input);
    } else {
      await organizationAccessService.departments.create(organizationId, input);
    }
    setEditingDepartment(undefined);
    await load();
    onToast(`Department ${department ? "updated" : "created"} successfully.`);
  };

  const remove = async () => {
    if (!organizationId || !deletingDepartment) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await organizationAccessService.departments.remove(organizationId, deletingDepartment.id);
      await load();
      setDeletingDepartment(null);
      onToast("Department deleted successfully.");
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="shrink-0">
        <h1 className="text-2xl font-bold text-text-primary">Departments</h1>
        <p className="mt-1 text-sm text-text-secondary">Manage organization departments and reporting structure.</p>
      </header>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardTitle
          title="Departments"
          subtitle="Manage organization departments"
          action={
            <Button icon="plus" onClick={() => setEditingDepartment(null)} disabled={!organizationId}>
              Add department
            </Button>
          }
        />
        {loadError ? (
          <div role="alert" className="p-5 text-sm text-error">
            {loadError}
          </div>
        ) : loading ? (
          <ListSkeleton />
        ) : departments.length === 0 ? (
          <div className="p-5 text-sm text-text-muted">No departments found.</div>
        ) : (
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {departments.map((department) => (
              <div key={department.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-muted text-brand">
                  <Icon name="users" size={17} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-text-primary">{department.name}</p>
                  <p className="text-xs text-text-muted">
                    {department._count?.members ? `${department._count.members} employees` : "No employees"} ·{" "}
                    {department.parent?.name ?? "Top level"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton label={`Edit ${department.name}`} onClick={() => setEditingDepartment(department)}>
                    <Pencil aria-hidden="true" size={18} />
                  </IconButton>
                  <IconButton
                    label={`Delete ${department.name}`}
                    onClick={() => {
                      setDeleteError("");
                      setDeletingDepartment(department);
                    }}
                    danger
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {editingDepartment !== undefined && (
        <DepartmentDrawer
          department={editingDepartment}
          departments={departments}
          onClose={() => setEditingDepartment(undefined)}
          onSave={save}
        />
      )}
      {deletingDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/35 p-4"
          onClick={() => !deleting && setDeletingDepartment(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-department-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <h2 id="delete-department-title" className="font-display text-lg font-bold text-text-primary">
              Delete department?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Delete <span className="font-semibold">{deletingDepartment.name}</span>? This cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-4 rounded-md border border-error px-3 py-2 text-sm text-error">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingDepartment(null)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => void remove()} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
