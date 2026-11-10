"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { MapPin, Pencil, Trash2 } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsDesignation, type HrmsEmploymentType, type HrmsLocation } from "@/services/hrms.service";
import { organizationAccessService } from "@/services/organization-management.service";
import type { ApiEntity } from "@/services/service-types";

import { COUNTRY_OPTIONS, TIMEZONE_OPTIONS } from "./master-data-options";
import { Button, Card, CardTitle, Icon, ListSkeleton } from "./components/ui-primitives";

type MasterDataType = "Locations" | "Designations" | "Employment types";
type DepartmentOption = ApiEntity & {
  name: string;
};
type MasterDataItem = HrmsLocation | HrmsDesignation | HrmsEmploymentType;
type FormValues = {
  name: string;
  code: string;
  countryCode: string;
  city: string;
  timezone: string;
  departmentId: string;
};

const emptyValues: FormValues = {
  name: "",
  code: "",
  countryCode: "",
  city: "",
  timezone: "",
  departmentId: "",
};

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to complete this request. Please try again.";
}

function masterDataTypeForComponent(): MasterDataType {
  return "Locations";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function valuesFor(type: MasterDataType, item?: MasterDataItem): FormValues {
  if (!item) return emptyValues;
  const base = { ...emptyValues, name: item.name, code: item.code ?? "" };
  if (type === "Locations") {
    const location = item as HrmsLocation;
    return { ...base, countryCode: location.countryCode, city: location.city ?? "", timezone: location.timezone };
  }
  if (type === "Designations") return { ...base, departmentId: (item as HrmsDesignation).departmentId ?? "" };
  return base;
}

function displayMeta(type: MasterDataType, item: MasterDataItem) {
  if (type === "Locations") {
    const location = item as HrmsLocation;
    return [location.city ?? "No city", location.countryCode];
  }
  if (type === "Designations") {
    const designation = item as HrmsDesignation;
    return [designation.code ?? "No code", designation.department?.name ?? "No department"];
  }
  const employmentType = item as HrmsEmploymentType;
  return [employmentType.code ?? "No code", employmentType.isActive ? "Active" : "Inactive"];
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

function MasterDataDrawer({
  type,
  item,
  departments,
  onClose,
  onSave,
}: {
  type: MasterDataType;
  item: MasterDataItem | null;
  departments: DepartmentOption[];
  onClose: () => void;
  onSave: (values: FormValues, item: MasterDataItem | null) => Promise<void>;
}) {
  const [values, setValues] = useState(() => valuesFor(type, item ?? undefined));
  const [isCodeManual, setIsCodeManual] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const singular = type === "Employment types" ? "employment type" : type.slice(0, -1).toLowerCase();

  const update = (field: keyof FormValues, value: string) => {
    setValues((current) => {
      const next = { ...current, [field]: value };
      if (field === "name" && !isCodeManual) next.code = slugify(value);
      return next;
    });
    setErrors((current) => ({ ...current, [field]: "", ...(field === "name" ? { code: "" } : {}) }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!values.name.trim()) next.name = "Name is required.";
    if (values.name.trim().length > 120) next.name = "Name must be 120 characters or fewer.";
    if (!values.code.trim()) next.code = "Code is required.";
    if (values.code.length > 64) next.code = "Code must be 64 characters or fewer.";
    if (type === "Locations") {
      if (!values.countryCode) next.countryCode = "Country code is required.";
      if (!values.timezone) next.timezone = "Timezone is required.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setApiError("");
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(values, item);
    } catch (error) {
      setApiError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };
  const fieldClass = (field: keyof FormValues) =>
    `w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:opacity-70 ${
      errors[field] ? "border-error" : "border-border"
    }`;
  const label = (title: string, field: keyof FormValues, required = false) => (
    <span className="mb-1.5 block text-sm font-semibold text-text-primary">
      {title} {required && <span className="text-error">*</span>}
      {errors[field] && <span className="mt-1 block text-xs font-normal text-error">{errors[field]}</span>}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 bg-text-primary/35" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`${item ? "Manage" : "Add"} ${singular}`}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-xl flex-col bg-surface shadow-lg"
      >
        <div className="flex items-start justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold text-text-primary">
              {item ? "Manage" : "Add"} {singular}
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
              {label(
                `${type === "Employment types" ? "Employment type" : singular[0].toUpperCase() + singular.slice(1)} name`,
                "name",
                true,
              )}
              <input
                value={values.name}
                onChange={(event) => update("name", event.target.value)}
                className={fieldClass("name")}
                autoFocus
              />
            </label>
            <div>
              {label("Code", "code", true)}
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
            </div>
            {type === "Locations" && (
              <>
                <label className="block">
                  {label("Country code", "countryCode", true)}
                  <select
                    value={values.countryCode}
                    onChange={(event) => update("countryCode", event.target.value)}
                    className={fieldClass("countryCode")}
                  >
                    <option value="">Select a country</option>
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.name} - ({country.code})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  {label("City", "city")}
                  <input
                    value={values.city}
                    onChange={(event) => update("city", event.target.value)}
                    className={fieldClass("city")}
                  />
                </label>
                <label className="block">
                  {label("IANA timezone", "timezone", true)}
                  <select
                    value={values.timezone}
                    onChange={(event) => update("timezone", event.target.value)}
                    className={fieldClass("timezone")}
                  >
                    <option value="">Select a timezone</option>
                    {TIMEZONE_OPTIONS.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {type === "Designations" && (
              <label className="block">
                {label("Department", "departmentId")}
                <select
                  value={values.departmentId}
                  onChange={(event) => update("departmentId", event.target.value)}
                  className={fieldClass("departmentId")}
                >
                  <option value="">No department</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void submit()} disabled={saving}>
              {saving ? "Saving…" : item ? "Save changes" : `Add ${singular}`}
            </Button>
          </div>
        </form>
      </aside>
    </div>
  );
}

export function HrmsLocations({
  onToast,
  showHeader = true,
}: {
  onToast: (message: string) => void;
  showHeader?: boolean;
}) {
  const { user } = useAuth();
  const masterDataType = masterDataTypeForComponent();
  const organizationId = user?.organization?.id;
  const [items, setItems] = useState<MasterDataItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<MasterDataItem | null | undefined>(undefined);
  const [deletingItem, setDeletingItem] = useState<MasterDataItem | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const load = useCallback(async () => {
    if (!organizationId || !masterDataType) return;
    setLoading(true);
    setLoadError("");
    try {
      const departmentRequest = organizationAccessService.departments.list(organizationId) as Promise<
        DepartmentOption[]
      >;
      const itemRequest =
        masterDataType === "Locations"
          ? hrmsService.locations.list(organizationId)
          : masterDataType === "Designations"
            ? hrmsService.designations.list(organizationId)
            : hrmsService.employmentTypes.list(organizationId);
      const [masterData, departmentData] = await Promise.all([itemRequest, departmentRequest]);
      setItems(masterData as MasterDataItem[]);
      setDepartments(departmentData);
    } catch (error) {
      setItems([]);
      setLoadError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }, [masterDataType, organizationId]);
  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);
  const save = async (values: FormValues, item: MasterDataItem | null) => {
    if (!organizationId || !masterDataType) throw new Error("An organization must be selected before saving.");
    const base = { name: values.name.trim(), code: values.code.trim() };
    if (masterDataType === "Locations") {
      const input = {
        ...base,
        countryCode: values.countryCode,
        city: values.city.trim() || null,
        timezone: values.timezone,
      };
      if (item) await hrmsService.locations.update(organizationId, item.id, input);
      else await hrmsService.locations.create(organizationId, input);
    } else if (masterDataType === "Designations") {
      const input = { ...base, departmentId: values.departmentId || null };
      if (item) await hrmsService.designations.update(organizationId, item.id, input);
      else await hrmsService.designations.create(organizationId, input);
    } else if (item) await hrmsService.employmentTypes.update(organizationId, item.id, base);
    else await hrmsService.employmentTypes.create(organizationId, base);
    setEditingItem(undefined);
    await load();
    onToast(`${masterDataType.slice(0, -1)} ${item ? "updated" : "created"} successfully.`);
  };
  const toggleActive = async (item: HrmsLocation | HrmsEmploymentType) => {
    if (!organizationId) return;
    setUpdatingId(item.id);
    setLoadError("");
    try {
      if (masterDataType === "Locations")
        await hrmsService.locations.update(organizationId, item.id, { isActive: !item.isActive });
      else await hrmsService.employmentTypes.update(organizationId, item.id, { isActive: !item.isActive });
      setItems((current) =>
        current.map((currentItem) =>
          currentItem.id === item.id ? ({ ...currentItem, isActive: !item.isActive } as MasterDataItem) : currentItem,
        ),
      );
      onToast(
        `${masterDataType === "Locations" ? "Location" : "Employment type"} ${item.isActive ? "deactivated" : "activated"} successfully.`,
      );
    } catch (error) {
      setLoadError(errorMessage(error));
    } finally {
      setUpdatingId(null);
    }
  };
  const remove = async () => {
    if (!organizationId || !deletingItem || !masterDataType) return;
    setDeleting(true);
    setDeleteError("");
    try {
      if (masterDataType === "Locations") await hrmsService.locations.remove(organizationId, deletingItem.id);
      else if (masterDataType === "Designations")
        await hrmsService.designations.remove(organizationId, deletingItem.id);
      else await hrmsService.employmentTypes.remove(organizationId, deletingItem.id);
      await load();
      setDeletingItem(null);
      onToast(`${masterDataType.slice(0, -1)} deleted successfully.`);
    } catch (error) {
      setDeleteError(errorMessage(error));
    } finally {
      setDeleting(false);
    }
  };
  const supportsToggle = masterDataType === "Locations" || masterDataType === "Employment types";
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {showHeader && (
        <header className="shrink-0">
          <h1 className="text-2xl font-bold text-text-primary">Locations</h1>
          <p className="mt-1 text-sm text-text-secondary">Manage organization work locations for employees.</p>
        </header>
      )}
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <CardTitle
          title={masterDataType}
          subtitle={`Manage organization ${masterDataType.toLowerCase()}`}
          action={
            <Button icon="plus" onClick={() => setEditingItem(null)} disabled={!organizationId}>
              Add{" "}
              {masterDataType === "Employment types" ? "employment type" : masterDataType.slice(0, -1).toLowerCase()}
            </Button>
          }
        />
        {loadError ? (
          <div role="alert" className="p-5 text-sm text-error">
            {loadError}
          </div>
        ) : loading ? (
          <ListSkeleton />
        ) : items.length === 0 ? (
          <div className="p-5 text-sm text-text-muted">No {masterDataType.toLowerCase()} found.</div>
        ) : (
          <div className="min-h-0 flex-1 divide-y divide-border overflow-y-auto">
            {items.map((item) => {
              const [detail] = displayMeta(masterDataType, item);
              const activeItem = item as HrmsLocation | HrmsEmploymentType;
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-raised">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-muted text-brand">
                    {masterDataType === "Locations" ? (
                      <MapPin aria-hidden="true" size={17} />
                    ) : (
                      <Icon name="users" size={17} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                    <p className="text-xs text-text-muted">{detail}</p>
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {supportsToggle && (
                      <button
                        type="button"
                        role="switch"
                        aria-checked={activeItem.isActive}
                        aria-label={`${activeItem.isActive ? "Active" : "Inactive"} ${masterDataType === "Locations" ? "location" : "employment type"}`}
                        onClick={() => void toggleActive(activeItem)}
                        disabled={updatingId === item.id}
                        className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-text-secondary disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <span
                          aria-hidden="true"
                          className={`relative h-5 w-9 rounded-full transition ${activeItem.isActive ? "bg-brand" : "bg-border"}`}
                        >
                          <span
                            className={`absolute top-0.5 h-4 w-4 rounded-full bg-surface shadow-sm transition ${activeItem.isActive ? "right-0.5" : "left-0.5"}`}
                          />
                        </span>
                        {activeItem.isActive ? "Active" : "Inactive"}
                      </button>
                    )}
                    <IconButton label={`Edit ${item.name}`} onClick={() => setEditingItem(item)}>
                      <Pencil aria-hidden="true" size={18} />
                    </IconButton>
                    <IconButton
                      label={`Delete ${item.name}`}
                      onClick={() => {
                        setDeleteError("");
                        setDeletingItem(item);
                      }}
                      disabled={updatingId === item.id}
                      danger
                    >
                      <Trash2 aria-hidden="true" size={18} />
                    </IconButton>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      {editingItem !== undefined && (
        <MasterDataDrawer
          type={masterDataType}
          item={editingItem}
          departments={departments}
          onClose={() => setEditingItem(undefined)}
          onSave={save}
        />
      )}
      {deletingItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/35 p-4"
          onClick={() => !deleting && setDeletingItem(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-master-data-title"
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-lg"
          >
            <h2 id="delete-master-data-title" className="font-display text-lg font-bold text-text-primary">
              Delete {masterDataType.slice(0, -1).toLowerCase()}?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              Delete <span className="font-semibold">{deletingItem.name}</span>? This cannot be undone.
            </p>
            {deleteError && (
              <p role="alert" className="mt-4 rounded-md border border-error px-3 py-2 text-sm text-error">
                {deleteError}
              </p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeletingItem(null)} disabled={deleting}>
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
