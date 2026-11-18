"use client";

import { DhritiButton, DhritiCheckboxField, DhritiTextField } from "@dhriti/ui";

import { type FormEvent, useState } from "react";
import { ArrowLeft, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Permission, PermissionInput } from "./types";
import { messageFrom } from "./utils";

export function PermissionCatalogDrawer({
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
  const [fieldErrors, setFieldErrors] = useState<{ key?: string; resource?: string; action?: string }>({});
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
    setFieldErrors({});
  };
  const openCreate = () => {
    setEditing({ id: "", key: "", resource: "", action: "" });
    setDraft({
      key: "",
      resource: "",
      action: "",
      productKey: "",
      description: "",
      isAssignable: true,
      isSystemOnly: false,
    });
    setError("");
    setFieldErrors({});
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
    setFieldErrors({});
  };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const errors = {
      ...(!draft.key.trim() ? { key: "Key is required." } : {}),
      ...(!draft.resource.trim() ? { resource: "Resource is required." } : {}),
      ...(!draft.action.trim() ? { action: "Action is required." } : {}),
    };
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSaving(true);
    try {
      if (editing?.id) {
        await onUpdate(editing, {
          resource: draft.resource,
          action: draft.action,
          productKey: draft.productKey,
          description: draft.description,
          isAssignable: draft.isAssignable,
          isSystemOnly: draft.isSystemOnly,
        });
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
              {editing
                ? editing.id
                  ? "Edit permission"
                  : "Create permission"
                : `Permission catalog (${permissions.length})`}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">
              {editing
                ? "Define the permission action and its product association."
                : "Manage reusable permissions for platform roles and permission groups."}
            </p>
          </div>
          <DhritiButton
            variant="secondary"
            type="button"
            onClick={editing ? closeForm : onClose}
            className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !p-2 !text-text-secondary hover:!bg-surface-raised"
            aria-label="Close permission catalog drawer"
            title="Close"
          >
            <X aria-hidden="true" size={18} />
          </DhritiButton>
        </div>
        {editing ? (
          <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void save(event)}>
            <div className="grid flex-1 content-start gap-4 overflow-y-auto p-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <DhritiTextField
                  label="Permission key"
                  required
                  value={draft.key}
                  disabled={Boolean(editing.id)}
                  onChange={(value) => setDraft((current) => ({ ...current, key: value }))}
                  error={fieldErrors.key}
                />
              </div>
              <DhritiTextField
                label="Resource"
                required
                value={draft.resource}
                onChange={(value) => setDraft((current) => ({ ...current, resource: value }))}
                error={fieldErrors.resource}
              />
              <DhritiTextField
                label="Action"
                required
                value={draft.action}
                onChange={(value) => setDraft((current) => ({ ...current, action: value }))}
                error={fieldErrors.action}
              />
              <DhritiTextField
                label="Product key"
                value={draft.productKey ?? ""}
                onChange={(value) => setDraft((current) => ({ ...current, productKey: value }))}
              />
              <DhritiTextField
                label="Description"
                value={draft.description ?? ""}
                onChange={(value) => setDraft((current) => ({ ...current, description: value }))}
              />
              <DhritiCheckboxField
                label="Assignable to roles"
                checked={draft.isAssignable}
                onChange={(checked) => setDraft((current) => ({ ...current, isAssignable: checked }))}
              />
              <DhritiCheckboxField
                label="System-only permission"
                checked={draft.isSystemOnly}
                onChange={(checked) => setDraft((current) => ({ ...current, isSystemOnly: checked }))}
              />
              {error ? (
                <p role="alert" className="text-sm text-error md:col-span-2">
                  {error}
                </p>
              ) : null}
            </div>
            <div className="flex items-center justify-between border-t border-border p-6">
              <DhritiButton
                variant="secondary"
                type="button"
                onClick={closeForm}
                className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal flex cursor-pointer items-center !gap-1 !rounded-md !px-3 !py-2 !text-sm !text-text-secondary hover:!bg-surface-raised"
              >
                <ArrowLeft aria-hidden="true" size={16} />
                Catalog
              </DhritiButton>
              <DhritiButton
                variant="primary"
                type="submit"
                disabled={isSaving}
                className="!min-h-0 !shadow-none !border-0 !gap-0 cursor-pointer !rounded-md !bg-brand !px-3 !py-2 !text-sm !font-semibold !text-text-inverse disabled:cursor-not-allowed disabled:opacity-60 hover:!bg-brand"
              >
                {isSaving ? "Saving…" : "Save permission"}
              </DhritiButton>
            </div>
          </form>
        ) : (
          <>
            <div className="flex gap-2 border-b border-border p-4">
              <div className="min-w-0 flex-1">
                <DhritiTextField
                  label="Search permissions"
                  showLabel={false}
                  value={query}
                  onChange={setQuery}
                  placeholder="Search permissions"
                />
              </div>
              <DhritiButton
                variant="primary"
                type="button"
                onClick={openCreate}
                className="!min-h-0 !shadow-none !border-0 flex shrink-0 cursor-pointer items-center !gap-1 !rounded-md !bg-brand !px-3 !py-2 !text-sm !font-semibold !text-text-inverse hover:!bg-brand"
              >
                <Plus aria-hidden="true" size={16} />
                Permission
              </DhritiButton>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {filteredPermissions.map((permission) => (
                  <div key={permission.id} className="flex items-center gap-2 rounded-md border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text-primary">{permission.key}</p>
                      <p className="truncate text-xs text-text-muted">
                        {permission.resource} · {permission.action}
                        {permission.productKey ? ` · ${permission.productKey}` : ""}
                      </p>
                    </div>
                    <DhritiButton
                      variant="secondary"
                      type="button"
                      onClick={() => openEdit(permission)}
                      className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !p-2 !text-text-secondary hover:!bg-surface-raised hover:!text-text-primary"
                      aria-label={`Edit ${permission.key}`}
                      title={`Edit ${permission.key}`}
                    >
                      <Pencil aria-hidden="true" size={16} />
                    </DhritiButton>
                    <DhritiButton
                      variant="danger"
                      type="button"
                      onClick={() => void remove(permission)}
                      className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !p-2 !text-error hover:!bg-surface-raised"
                      aria-label={`Delete ${permission.key}`}
                      title={`Delete ${permission.key}`}
                    >
                      <Trash2 aria-hidden="true" size={16} />
                    </DhritiButton>
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
