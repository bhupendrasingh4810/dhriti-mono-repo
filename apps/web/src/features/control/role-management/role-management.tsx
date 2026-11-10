"use client";

import { ArrowLeft, Pencil, Plus, Trash2, UserMinus, X } from "lucide-react";
import { type FormEvent, useCallback, useEffect, useState } from "react";

import { controlPlatformService, type ControlPlatformRole, type PlatformUser } from "@/services/control.service";
import { organizationAccessService, organizationManagementService } from "@/services/organization-management.service";

type Permission = {
  id: string;
  key: string;
  name?: string;
  resource?: string;
  action?: string;
  productKey?: string | null;
  description?: string | null;
  isAssignable?: boolean;
  isSystemOnly?: boolean;
};
type PermissionInput = {
  key: string;
  resource: string;
  action: string;
  productKey?: string;
  description?: string;
  isAssignable: boolean;
  isSystemOnly: boolean;
};
type Role = {
  id: string;
  key?: string;
  name: string;
  description: string | null;
  isSystem?: boolean;
  permissions: Array<{ permission: Permission }>;
  assignments?: Array<{ user: AssignableUser & { profile?: { jobTitle: string | null } | null } }>;
  _count: { assignments: number };
};
type AssignableUser = { id: string; name: string; email: string; avatarUrl?: string | null; designation?: string | null };

const applicationLabels: Record<string, string> = {
  atlas: "Atlas",
  cadence: "Cadence",
  connect: "Connect",
  flow: "Flow",
  hrms: "HRMS",
  nexus: "Nexus",
  pulse: "Pulse",
};

function applicationFor(permission: Permission) {
  const productKey = permission.productKey?.trim().toLowerCase();
  if (!productKey) return "Organization & Platform";

  return applicationLabels[productKey] ?? `${productKey.charAt(0).toUpperCase()}${productKey.slice(1)}`;
}

function messageFrom(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function RoleList({
  roles,
  selectedId,
  onSelect,
  onEdit,
  noun,
}: {
  roles: Role[];
  selectedId: string;
  onSelect: (id: string) => void;
  onEdit?: (role: Role) => void;
  noun: string;
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredRoles = normalizedQuery
    ? roles.filter((role) => `${role.name} ${role.description ?? ""}`.toLowerCase().includes(normalizedQuery))
    : roles;

  return (
    <aside className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface p-3">
      <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{noun}s</p>
      <label className="mb-3 block px-1">
        <span className="sr-only">Search {noun.toLowerCase()}s</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${noun.toLowerCase()}s`}
          className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
        />
      </label>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {filteredRoles.length ? (
          filteredRoles.map((role) => {
            const isSelected = role.id === selectedId;
            return (
              <div
                key={role.id}
                className={`flex items-center rounded-md transition-colors ${
                  isSelected ? "bg-brand-muted text-brand" : "text-text-primary hover:bg-surface-raised"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelect(role.id)}
                  className="min-w-0 flex-1 cursor-pointer px-3 py-2 text-left"
                >
                  <span className="block truncate text-sm font-semibold">{role.name}</span>
                  <span className="block text-xs text-text-muted">
                    {role._count.assignments} assignments · {role.permissions.length} permissions
                  </span>
                </button>
                {onEdit ? (
                  <button
                    type="button"
                    onClick={() => onEdit(role)}
                    className="mr-2 cursor-pointer rounded-md p-2 text-text-secondary hover:bg-surface hover:text-text-primary"
                    aria-label={`Edit ${role.name}`}
                    title={`Edit ${role.name}`}
                  >
                    <Pencil aria-hidden="true" size={16} />
                  </button>
                ) : null}
              </div>
            );
          })
        ) : (
          <p className="px-3 py-4 text-sm text-text-muted">
            {normalizedQuery ? `No ${noun.toLowerCase()}s match your search.` : `No ${noun.toLowerCase()}s yet.`}
          </p>
        )}
      </div>
    </aside>
  );
}

export function RoleCreationForm({
  noun,
  includeKey,
  isOpen,
  onClose,
  onCreate,
}: {
  noun: string;
  includeKey: boolean;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: { name: string; key?: string; description?: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; key?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = {
      ...(name.trim() ? {} : { name: "Name is required." }),
      ...(includeKey && !key.trim() ? { key: "Key is required." } : {}),
    };
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    setIsSaving(true);
    try {
      await onCreate({ name: name.trim(), key: key.trim() || undefined, description: description.trim() || undefined });
      setName("");
      setKey("");
      setDescription("");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/35" onMouseDown={onClose}>
      <section
        aria-modal="true"
        aria-labelledby="create-role-title"
        role="dialog"
        className="flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 id="create-role-title" className="text-lg font-semibold text-text-primary">
              Create {noun.toLowerCase()}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">Define the role details before configuring its access.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md p-2 text-text-secondary hover:bg-surface-raised"
            aria-label={`Close create ${noun.toLowerCase()} drawer`}
            title="Close"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void submit(event)}>
          <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-text-primary">
                Name <span className="text-error">*</span>
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand ${
                  errors.name ? "border-error" : "border-border"
                }`}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name ? <span className="mt-1 block text-xs text-error">{errors.name}</span> : null}
            </label>
            {includeKey ? (
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">
                  Key <span className="text-error">*</span>
                </span>
                <input
                  value={key}
                  onChange={(event) => setKey(event.target.value)}
                  className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand ${
                    errors.key ? "border-error" : "border-border"
                  }`}
                  aria-invalid={Boolean(errors.key)}
                />
                {errors.key ? <span className="mt-1 block text-xs text-error">{errors.key}</span> : null}
              </label>
            ) : null}
            <label className={`block ${includeKey ? "md:col-span-2" : ""}`}>
              <span className="mb-1 block text-sm font-medium text-text-primary">Description</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
              />
            </label>
          </div>
          <div className="flex justify-end gap-2 border-t border-border p-6">
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised"
            >
              Cancel
            </button>
            <button
              disabled={isSaving}
              className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Creating…" : `Create ${noun}`}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function PermissionCatalogDrawer({
  isOpen,
  permissions,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}: {
  isOpen: boolean;
  permissions: Permission[];
  onClose: () => void;
  onCreate: (input: PermissionInput) => Promise<void>;
  onUpdate: (permission: Permission, input: Omit<PermissionInput, "key">) => Promise<void>;
  onDelete: (permission: Permission) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Permission | null>(null);
  const [draft, setDraft] = useState<PermissionInput>({
    key: "",
    resource: "",
    action: "",
    productKey: "",
    description: "",
    isAssignable: true,
    isSystemOnly: false,
  });
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const filteredPermissions = permissions.filter((permission) =>
    `${permission.key} ${permission.resource ?? ""} ${permission.action ?? ""} ${permission.productKey ?? ""}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const closeForm = () => {
    setEditing(null);
    setError("");
  };
  const openCreate = () => {
    setEditing({ id: "", key: "", resource: "", action: "" });
    setDraft({ key: "", resource: "", action: "", productKey: "", description: "", isAssignable: true, isSystemOnly: false });
    setError("");
  };
  const openEdit = (permission: Permission) => {
    setEditing(permission);
    setDraft({
      key: permission.key,
      resource: permission.resource ?? "",
      action: permission.action ?? "",
      productKey: permission.productKey ?? "",
      description: permission.description ?? "",
      isAssignable: permission.isAssignable ?? true,
      isSystemOnly: permission.isSystemOnly ?? false,
    });
    setError("");
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.key.trim() || !draft.resource.trim() || !draft.action.trim()) {
      setError("Key, resource, and action are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editing?.id) {
        const { key: _key, ...input } = draft;
        await onUpdate(editing, input);
      } else {
        await onCreate(draft);
      }
      closeForm();
    } catch (reason) {
      setError(messageFrom(reason, "Unable to save permission."));
    } finally {
      setIsSaving(false);
    }
  };
  const remove = async (permission: Permission) => {
    setError("");
    try {
      await onDelete(permission);
    } catch (reason) {
      setError(messageFrom(reason, "Unable to delete permission."));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/35" onMouseDown={onClose}>
      <section
        aria-modal="true"
        aria-labelledby="permission-catalog-title"
        role="dialog"
        className="flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-border p-6">
          <div>
            <h2 id="permission-catalog-title" className="text-lg font-semibold text-text-primary">
              {editing ? (editing.id ? "Edit permission" : "Create permission") : "Permission catalog"}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {editing ? "Define the permission action and its product association." : "Manage reusable permissions for platform roles and permission groups."}
            </p>
          </div>
          <button
            type="button"
            onClick={editing ? closeForm : onClose}
            className="cursor-pointer rounded-md p-2 text-text-secondary hover:bg-surface-raised"
            aria-label="Close permission catalog drawer"
            title="Close"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>
        {editing ? (
          <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void save(event)}>
            <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-text-primary">
                  Permission key <span className="text-error">*</span>
                </span>
                <input
                  value={draft.key}
                  disabled={Boolean(editing.id)}
                  onChange={(event) => setDraft((current) => ({ ...current, key: event.target.value }))}
                  className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed disabled:bg-surface-raised ${
                    error ? "border-error" : "border-border"
                  }`}
                  aria-invalid={Boolean(error)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">
                  Resource <span className="text-error">*</span>
                </span>
                <input
                  value={draft.resource}
                  onChange={(event) => setDraft((current) => ({ ...current, resource: event.target.value }))}
                  className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand ${
                    error ? "border-error" : "border-border"
                  }`}
                  aria-invalid={Boolean(error)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">
                  Action <span className="text-error">*</span>
                </span>
                <input
                  value={draft.action}
                  onChange={(event) => setDraft((current) => ({ ...current, action: event.target.value }))}
                  className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand ${
                    error ? "border-error" : "border-border"
                  }`}
                  aria-invalid={Boolean(error)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">Product key</span>
                <input
                  value={draft.productKey}
                  onChange={(event) => setDraft((current) => ({ ...current, productKey: event.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-text-primary">Description</span>
                <input
                  value={draft.description}
                  onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={draft.isAssignable}
                  onChange={(event) => setDraft((current) => ({ ...current, isAssignable: event.target.checked }))}
                  className="cursor-pointer accent-brand"
                />
                Assignable to roles
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-text-primary">
                <input
                  type="checkbox"
                  checked={draft.isSystemOnly}
                  onChange={(event) => setDraft((current) => ({ ...current, isSystemOnly: event.target.checked }))}
                  className="cursor-pointer accent-brand"
                />
                System-only permission
              </label>
              {error ? <p role="alert" className="text-sm text-error md:col-span-2">{error}</p> : null}
            </div>
            <div className="flex items-center justify-between border-t border-border p-6">
              <button
                type="button"
                onClick={closeForm}
                className="flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised"
              >
                <ArrowLeft aria-hidden="true" size={16} />
                Catalog
              </button>
              <button
                disabled={isSaving}
                className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving…" : "Save permission"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex gap-2 border-b border-border p-4">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Search permissions</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search permissions"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
                />
              </label>
              <button
                type="button"
                onClick={openCreate}
                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse"
              >
                <Plus aria-hidden="true" size={16} />
                Permission
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 rounded-md border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{permission.key}</p>
                      <p className="truncate text-xs text-text-muted">
                        {permission.resource} · {permission.action}{permission.productKey ? ` · ${permission.productKey}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(permission)}
                      className="cursor-pointer rounded-md p-2 text-text-secondary hover:bg-surface-raised hover:text-text-primary"
                      aria-label={`Edit ${permission.key}`}
                      title={`Edit ${permission.key}`}
                    >
                      <Pencil aria-hidden="true" size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(permission)}
                      className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"
                      aria-label={`Delete ${permission.key}`}
                      title={`Delete ${permission.key}`}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

export function PermissionEditor({
  role,
  permissions,
  allowPermissionId,
  onToggle,
  onToggleMany,
}: {
  role: Role | undefined;
  permissions: Permission[];
  allowPermissionId: boolean;
  onToggle: (permission: Permission, attached: boolean) => Promise<void>;
  onToggleMany: (permissions: Permission[], attached: boolean) => Promise<void>;
}) {
  const [permissionId, setPermissionId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState("");
  const selectedIds = new Set(role?.permissions.map(({ permission }) => permission.id));
  const visiblePermissions = permissions.length
    ? permissions
    : (role?.permissions.map(({ permission }) => permission) ?? []);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPermissions = normalizedQuery
    ? visiblePermissions.filter((permission) =>
        `${permission.name ?? ""} ${permission.key} ${applicationFor(permission)}`.toLowerCase().includes(normalizedQuery),
      )
    : visiblePermissions;
  const permissionsByApplication = filteredPermissions.reduce<Map<string, Permission[]>>((applications, permission) => {
    const application = applicationFor(permission);
    const applicationPermissions = applications.get(application) ?? [];
    applicationPermissions.push(permission);
    applications.set(application, applicationPermissions);
    return applications;
  }, new Map());
  const groupedPermissions = Array.from(permissionsByApplication).sort(([firstApplication], [secondApplication]) =>
    firstApplication.localeCompare(secondApplication),
  );
  const allPermissionsSelected = visiblePermissions.length > 0 && visiblePermissions.every((permission) => selectedIds.has(permission.id));

  const addById = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!permissionId.trim()) return;
    setIsAdding(true);
    try {
      await onToggle({ id: permissionId.trim(), key: permissionId.trim() }, false);
      setPermissionId("");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface">
      <div className="sticky top-0 z-10 flex items-start justify-between gap-4 rounded-t-lg border-b border-border bg-surface p-5">
        <div>
          <h2 className="font-semibold text-text-primary">{role?.name ?? "Select a role"}</h2>
          <p className="mt-1 text-sm text-text-secondary">
            {role?.description ?? "Choose a role to configure its permissions."}
          </p>
        </div>
        {role ? (
          <div className="flex shrink-0 items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-medium text-text-primary">
              <input
                type="checkbox"
                checked={allPermissionsSelected}
                onChange={() => void onToggleMany(visiblePermissions, allPermissionsSelected)}
                className="cursor-pointer accent-brand"
              />
              Select all
            </label>
            <label className="w-72">
              <span className="sr-only">Search permissions</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search permissions"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
              />
            </label>
          </div>
        ) : null}
      </div>
      {role ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            {groupedPermissions.length ? groupedPermissions.map(([application, applicationPermissions]) => (
              <section key={application} aria-labelledby={`permission-application-${application}`}>
                <div className="mb-2 flex items-center justify-between gap-3 px-1">
                  <h3
                    id={`permission-application-${application}`}
                    className="text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {application}
                  </h3>
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-text-secondary">
                    <input
                      type="checkbox"
                      checked={applicationPermissions.every((permission) => selectedIds.has(permission.id))}
                      onChange={() =>
                        void onToggleMany(
                          applicationPermissions,
                          applicationPermissions.every((permission) => selectedIds.has(permission.id)),
                        )
                      }
                      className="cursor-pointer accent-brand"
                    />
                    Select all
                  </label>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {applicationPermissions.map((permission) => {
                    const attached = selectedIds.has(permission.id);
                    return (
                      <label
                        key={permission.id}
                        className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                          attached
                            ? "border-brand bg-brand-muted"
                            : "border-border bg-surface hover:bg-surface-raised"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={attached}
                          onChange={() => void onToggle(permission, attached)}
                          className="cursor-pointer accent-brand"
                          aria-label={`${attached ? "Remove" : "Add"} ${permission.key}`}
                        />
                        <span className="min-w-0">
                          <span
                            className="block truncate text-sm font-medium text-text-primary"
                            title={permission.name ?? permission.key}
                          >
                            {permission.name ?? permission.key}
                          </span>
                          <span className="block truncate text-xs text-text-muted" title={permission.key}>
                            {permission.key}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </section>
            )) : (
              <p className="px-1 py-4 text-sm text-text-muted">No permissions match your search.</p>
            )}
          </div>
          {allowPermissionId ? (
            <form onSubmit={(event) => void addById(event)} className="flex gap-2 border-t border-border p-4">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Permission ID</span>
                <input
                  value={permissionId}
                  onChange={(event) => setPermissionId(event.target.value)}
                  placeholder="Permission ID"
                  className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                />
              </label>
              <button
                disabled={isAdding}
                className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-raised disabled:cursor-not-allowed"
              >
                Attach
              </button>
            </form>
          ) : null}
        </>
      ) : null}
    </section>
  );
}

export function RoleAssignment({
  role,
  users,
  onAssign,
  onRevoke,
}: {
  role: Role | undefined;
  users: AssignableUser[];
  onAssign: (userId: string) => Promise<void>;
  onRevoke: (userId: string) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [memberQuery, setMemberQuery] = useState("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [isMemberMenuOpen, setIsMemberMenuOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [revokeTarget, setRevokeTarget] = useState<AssignableUser | null>(null);
  if (!role) return null;
  const assignedUsers =
    (role.assignments?.map(({ user }) => ({ ...user, designation: user.profile?.jobTitle ?? user.designation })) ?? []).sort(
      (first, second) => first.name.localeCompare(second.name),
    );
  const visibleUsers = assignedUsers.filter((user) =>
    `${user.name} ${user.email} ${user.designation ?? ""}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const assignedUserIds = new Set(assignedUsers.map((user) => user.id));
  const selectableUsers = users.filter(
    (user) =>
      !assignedUserIds.has(user.id) &&
      `${user.name} ${user.email}`.toLowerCase().includes(memberQuery.trim().toLowerCase()),
  );
  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };
  const addMembers = async () => {
    if (!selectedMemberIds.size) return;
    setIsSaving(true);
    try {
      await Promise.all(Array.from(selectedMemberIds, (memberId) => onAssign(memberId)));
      setSelectedMemberIds(new Set());
      setMemberQuery("");
      setIsMemberMenuOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="flex h-full min-h-0 flex-col rounded-lg border border-border bg-surface">
      <div className="relative border-b border-border p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold text-text-primary">
            Assignees ({assignedUsers.length})
          </h2>
          <button
            type="button"
            onClick={() => setIsMemberMenuOpen((current) => !current)}
            className="flex cursor-pointer items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold text-text-primary hover:bg-surface-raised"
            aria-expanded={isMemberMenuOpen}
          >
            <Plus aria-hidden="true" size={14} />
            Add member
          </button>
        </div>
        <p className="mt-1 text-sm text-text-secondary">Users assigned to {role.name}.</p>
        <label className="mt-4 block">
          <span className="sr-only">Search assignees</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search users"
            className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
          />
        </label>
        {isMemberMenuOpen ? (
          <div className="absolute inset-x-3 top-full z-20 mt-2 rounded-md border border-border bg-surface p-3 shadow-lg">
            <label>
              <span className="sr-only">Find members to add</span>
              <input
                type="search"
                value={memberQuery}
                onChange={(event) => setMemberQuery(event.target.value)}
                placeholder="Search members"
                className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted focus:border-brand"
              />
            </label>
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
              {selectableUsers.map((user) => (
                <label key={user.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-surface-raised">
                  <input
                    type="checkbox"
                    checked={selectedMemberIds.has(user.id)}
                    onChange={() => toggleMember(user.id)}
                    className="cursor-pointer accent-brand"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-text-primary">{user.name}</span>
                    <span className="block truncate text-xs text-text-muted">{user.email}</span>
                  </span>
                </label>
              ))}
              {!selectableUsers.length ? <p className="px-2 py-3 text-sm text-text-muted">No members found.</p> : null}
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
              <button
                type="button"
                onClick={() => setIsMemberMenuOpen(false)}
                className="cursor-pointer rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-raised"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedMemberIds.size || isSaving}
                onClick={() => void addMembers()}
                className="cursor-pointer rounded-md bg-brand px-2 py-1 text-xs font-semibold text-text-inverse disabled:cursor-not-allowed disabled:opacity-60"
              >
                Add {selectedMemberIds.size || ""} member{selectedMemberIds.size === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
        {visibleUsers.map((user) => (
          <div key={user.id} className="flex items-center gap-3 rounded-md border border-border p-3">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="size-9 rounded-full object-cover" />
            ) : (
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-raised text-sm font-semibold text-text-primary">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-text-primary">{user.name}</p>
              <p className="truncate text-xs text-text-muted">{user.designation ?? user.email}</p>
            </div>
            <button
              type="button"
              onClick={() => setRevokeTarget(user)}
              className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"
              aria-label={`Revoke ${role.name} from ${user.name}`}
              title={`Revoke ${role.name} from ${user.name}`}
            >
              <UserMinus aria-hidden="true" size={16} />
            </button>
          </div>
        ))}
        {!visibleUsers.length ? <p className="px-2 py-4 text-sm text-text-muted">No assignees found.</p> : null}
      </div>
      {revokeTarget ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-text-primary/35 p-4" onMouseDown={() => setRevokeTarget(null)}>
          <section
            aria-modal="true"
            aria-labelledby="revoke-role-title"
            role="dialog"
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="revoke-role-title" className="text-lg font-semibold text-text-primary">Revoke access?</h2>
            <p className="mt-2 text-sm text-text-secondary">
              {revokeTarget.name} will no longer be assigned to {role.name}.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setRevokeTarget(null)} className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void onRevoke(revokeTarget.id).then(() => setRevokeTarget(null))}
                className="cursor-pointer rounded-md bg-error px-3 py-2 text-sm font-semibold text-text-inverse"
              >
                Revoke access
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function RoleManagement({
  title,
  description,
  noun,
  roles,
  permissions,
  catalogPermissions,
  users,
  includeKey,
  allowPermissionId,
  loadError,
  onCreate,
  onUpdate,
  onDelete,
  onCreatePermission,
  onUpdatePermission,
  onDeletePermission,
  onTogglePermission,
  onTogglePermissions,
  onAssign,
  onRevoke,
}: {
  title: string;
  description: string;
  noun: string;
  roles: Role[];
  permissions: Permission[];
  catalogPermissions?: Permission[];
  users: AssignableUser[];
  includeKey: boolean;
  allowPermissionId: boolean;
  loadError: string;
  onCreate: (input: { name: string; key?: string; description?: string }) => Promise<void>;
  onUpdate?: (role: Role, input: { name: string; description?: string }) => Promise<void>;
  onDelete?: (role: Role) => Promise<void>;
  onCreatePermission?: (input: PermissionInput) => Promise<void>;
  onUpdatePermission?: (permission: Permission, input: Omit<PermissionInput, "key">) => Promise<void>;
  onDeletePermission?: (permission: Permission) => Promise<void>;
  onTogglePermission: (role: Role, permission: Permission, attached: boolean) => Promise<void>;
  onTogglePermissions: (role: Role, permissions: Permission[], attached: boolean) => Promise<void>;
  onAssign: (role: Role, userId: string) => Promise<void>;
  onRevoke: (role: Role, userId: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState("");
  const [error, setError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingPermissions, setIsManagingPermissions] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingError, setEditingError] = useState("");
  const selected = roles.find((role) => role.id === selectedId) ?? roles[0];

  const run = async (action: () => Promise<void>, fallback: string) => {
    setError("");
    try {
      await action();
    } catch (reason) {
      setError(messageFrom(reason, fallback));
    }
  };

  const openEditDrawer = (role: Role) => {
    setEditingRole(role);
    setEditingName(role.name);
    setEditingDescription(role.description ?? "");
    setEditingError("");
  };

  const saveGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingRole || !onUpdate) return;
    if (!editingName.trim()) {
      setEditingError("Name is required.");
      return;
    }

    try {
      await onUpdate(editingRole, {
        name: editingName.trim(),
        description: editingDescription.trim() || undefined,
      });
      setEditingRole(null);
    } catch (reason) {
      setEditingError(messageFrom(reason, "Unable to update permission group."));
    }
  };

  const deleteGroup = async () => {
    if (!editingRole || !onDelete) return;

    try {
      await onDelete(editingRole);
      setEditingRole(null);
    } catch (reason) {
      setEditingError(messageFrom(reason, "Unable to delete permission group."));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onCreatePermission ? (
            <button
              type="button"
              onClick={() => setIsManagingPermissions(true)}
              className="cursor-pointer rounded-md border border-border px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-raised"
            >
              Manage permissions
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setIsCreating((current) => !current)}
            className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-hover"
            aria-expanded={isCreating}
          >
            New {noun}
          </button>
        </div>
      </header>
      {error || loadError ? (
        <p role="alert" className="rounded-md border border-error p-3 text-sm text-error">
          {error || loadError}
        </p>
      ) : null}
      <RoleCreationForm
        noun={noun}
        includeKey={includeKey}
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={(input) =>
          run(() => onCreate(input), `Unable to create ${noun.toLowerCase()}.`).then(() => setIsCreating(false))
        }
      />
      {onCreatePermission && onUpdatePermission && onDeletePermission ? (
        <PermissionCatalogDrawer
          isOpen={isManagingPermissions}
          permissions={catalogPermissions ?? permissions}
          onClose={() => setIsManagingPermissions(false)}
          onCreate={onCreatePermission}
          onUpdate={onUpdatePermission}
          onDelete={onDeletePermission}
        />
      ) : null}
      <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <RoleList
          roles={roles}
          selectedId={selected?.id ?? ""}
          onSelect={setSelectedId}
          onEdit={onUpdate ? openEditDrawer : undefined}
          noun={noun}
        />
        <div className="min-h-0 overflow-hidden pr-1">
          <div className="grid h-full min-h-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <PermissionEditor
              role={selected}
              permissions={permissions}
              allowPermissionId={allowPermissionId}
              onToggle={(permission, attached) =>
                run(
                  () => (selected ? onTogglePermission(selected, permission, attached) : Promise.resolve()),
                  "Unable to update permissions.",
                )
              }
              onToggleMany={(permissionBatch, attached) =>
                run(
                  () => (selected ? onTogglePermissions(selected, permissionBatch, attached) : Promise.resolve()),
                  "Unable to update permissions.",
                )
              }
            />
            <RoleAssignment
              role={selected}
              users={users}
              onAssign={(userId) =>
                run(() => (selected ? onAssign(selected, userId) : Promise.resolve()), "Unable to assign role.")
              }
              onRevoke={(userId) =>
                run(() => (selected ? onRevoke(selected, userId) : Promise.resolve()), "Unable to revoke role.")
              }
            />
          </div>
        </div>
      </div>
      {editingRole ? (
        <div className="fixed inset-0 z-50 flex justify-end bg-text-primary/35" onMouseDown={() => setEditingRole(null)}>
          <section
            aria-modal="true"
            aria-labelledby="edit-permission-group-title"
            role="dialog"
            className="flex h-full w-full max-w-xl flex-col bg-surface shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-border p-6">
              <div>
                <h2 id="edit-permission-group-title" className="text-lg font-semibold text-text-primary">
                  Edit permission group
                </h2>
                <p className="mt-1 text-sm text-text-secondary">Update this group or remove it when it is no longer needed.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRole(null)}
                className="cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised"
              >
                Close
              </button>
            </div>
            <form className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void saveGroup(event)}>
              <div className="flex-1 overflow-y-auto p-6">
                <label className="block">
                  <span className="mb-1 block text-sm font-medium text-text-primary">
                    Name <span className="text-error">*</span>
                  </span>
                  <input
                    value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    className={`w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand ${
                      editingError ? "border-error" : "border-border"
                    }`}
                    aria-invalid={Boolean(editingError)}
                  />
                  {editingError ? <span className="mt-1 block text-xs text-error">{editingError}</span> : null}
                </label>
                <label className="mt-4 block">
                  <span className="mb-1 block text-sm font-medium text-text-primary">Description</span>
                  <input
                    value={editingDescription}
                    onChange={(event) => setEditingDescription(event.target.value)}
                    className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand"
                  />
                </label>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border p-6">
                {!editingRole.isSystem && onDelete ? (
                  <button
                    type="button"
                    onClick={() => void deleteGroup()}
                    className="cursor-pointer rounded-md p-2 text-error hover:bg-surface-raised"
                    aria-label={`Delete ${editingRole.name}`}
                    title={`Delete ${editingRole.name}`}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="cursor-pointer rounded-md px-3 py-2 text-sm text-text-secondary hover:bg-surface-raised"
                  >
                    Cancel
                  </button>
                  <button className="cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-text-inverse">
                    Save changes
                  </button>
                </div>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function OrganizationRoleManagement({ organizationId }: { organizationId: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const [groups, availablePermissions, members] = await Promise.all([
        organizationAccessService.permissionGroups.list(organizationId) as Promise<Role[]>,
        organizationAccessService.listPermissions(organizationId) as Promise<Permission[]>,
        organizationManagementService.listMembers(organizationId) as unknown as Promise<Array<{ user: AssignableUser }>>,
      ]);
      setRoles(groups);
      setPermissions(availablePermissions);
      setUsers(members.map((member) => member.user));
      setLoadError("");
    } catch (reason) {
      setLoadError(messageFrom(reason, "Unable to load organization roles and permissions."));
    }
  }, [organizationId]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <RoleManagement
      title="Roles & permissions"
      description="Configure organization permission groups, their access, and member assignments."
      noun="Permission group"
      roles={roles}
      permissions={permissions}
      users={users}
      includeKey={false}
      allowPermissionId={false}
      loadError={loadError}
      onCreate={async (input) => {
        await organizationAccessService.permissionGroups.create(organizationId, input);
        await load();
      }}
      onUpdate={async (role, input) => {
        await organizationAccessService.permissionGroups.update(organizationId, role.id, input);
        await load();
      }}
      onDelete={async (role) => {
        await organizationAccessService.permissionGroups.remove(organizationId, role.id);
        await load();
      }}
      onTogglePermission={async (role, permission, attached) => {
        if (attached)
          await organizationAccessService.permissionGroups.removePermission(organizationId, role.id, permission.id);
        else await organizationAccessService.permissionGroups.attachPermission(organizationId, role.id, permission.id);
        await load();
      }}
      onTogglePermissions={async (role, permissionBatch, attached) => {
        await Promise.all(
          permissionBatch.map((permission) =>
            attached
              ? organizationAccessService.permissionGroups.removePermission(organizationId, role.id, permission.id)
              : organizationAccessService.permissionGroups.attachPermission(organizationId, role.id, permission.id),
          ),
        );
        await load();
      }}
      onAssign={async (role, userId) => {
        await organizationAccessService.permissionGroups.assignUser(organizationId, role.id, userId);
        await load();
      }}
      onRevoke={async (role, userId) => {
        await organizationAccessService.permissionGroups.revokeUser(organizationId, role.id, userId);
        await load();
      }}
    />
  );
}

export function PlatformRoleManagement() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [catalogPermissions, setCatalogPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<AssignableUser[]>([]);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    try {
      const [roleData, permissionData, permissionCatalogData, userData] = await Promise.all([
        controlPlatformService.listRoles(),
        controlPlatformService.listRolePermissions(),
        controlPlatformService.listPermissions(),
        controlPlatformService.listUsers({ limit: 100 }),
      ]);
      setRoles(roleData as ControlPlatformRole[]);
      setPermissions(permissionData);
      setCatalogPermissions(permissionCatalogData);
      setUsers(
        userData.items.map((user: PlatformUser) => ({ id: user.id, name: user.name ?? user.email, email: user.email })),
      );
      setLoadError("");
    } catch (reason) {
      setLoadError(messageFrom(reason, "Unable to load platform roles and permissions."));
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  return (
    <RoleManagement
      title="Platform roles"
      description="Manage internal platform roles, explicit permissions, and staff access."
      noun="Platform role"
      roles={roles}
      permissions={permissions}
      catalogPermissions={catalogPermissions}
      users={users}
      includeKey
      allowPermissionId={false}
      loadError={loadError}
      onCreate={async (input) => {
        await controlPlatformService.createRole({
          key: input.key ?? "",
          name: input.name,
          description: input.description,
        });
        await load();
      }}
      onCreatePermission={async (input) => {
        await controlPlatformService.createPermission(input);
        await load();
      }}
      onUpdatePermission={async (permission, input) => {
        await controlPlatformService.updatePermission(permission.id, input);
        await load();
      }}
      onDeletePermission={async (permission) => {
        await controlPlatformService.deletePermission(permission.id);
        await load();
      }}
      onTogglePermission={async (role, permission, attached) => {
        if (attached) await controlPlatformService.removeRolePermission(role.id, permission.id);
        else await controlPlatformService.attachRolePermission(role.id, permission.id);
        await load();
      }}
      onTogglePermissions={async (role, permissionBatch, attached) => {
        await Promise.all(
          permissionBatch.map((permission) =>
            attached
              ? controlPlatformService.removeRolePermission(role.id, permission.id)
              : controlPlatformService.attachRolePermission(role.id, permission.id),
          ),
        );
        await load();
      }}
      onAssign={async (role, userId) => {
        await controlPlatformService.assignRole(role.id, userId);
        await load();
      }}
      onRevoke={async (role, userId) => {
        await controlPlatformService.revokeRole(role.id, userId);
        await load();
      }}
    />
  );
}
