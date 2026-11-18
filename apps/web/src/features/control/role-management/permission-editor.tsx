"use client";

import { DhritiButton, DhritiCheckboxField, DhritiTextField } from "@dhriti/ui";

import { type FormEvent, useId, useState } from "react";
import type { Permission, Role } from "./types";
import { applicationFor } from "./utils";

export function PermissionEditor({
  role,
  permissions,
  allowPermissionId,
  onToggle,
  onToggleMany,
  onSave,
  hasChanges = false,
  isSaving = false,
}: {
  role: Role | undefined;
  permissions: Permission[];
  allowPermissionId: boolean;
  onToggle: (permission: Permission, attached: boolean) => Promise<void>;
  onToggleMany: (permissions: Permission[], attached: boolean) => Promise<void>;
  onSave?: () => Promise<void>;
  hasChanges?: boolean;
  isSaving?: boolean;
}) {
  const [permissionId, setPermissionId] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [query, setQuery] = useState("");
  const fieldId = useId();
  const selectedIds = new Set(role?.permissions.map(({ permission }) => permission.id));
  const visiblePermissions = permissions.length
    ? permissions
    : (role?.permissions.map(({ permission }) => permission) ?? []);
  const normalizedQuery = query.trim().toLowerCase();
  const filteredPermissions = normalizedQuery
    ? visiblePermissions.filter((permission) =>
        `${permission.name ?? ""} ${permission.key} ${applicationFor(permission)}`
          .toLowerCase()
          .includes(normalizedQuery),
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
  const allPermissionsSelected =
    visiblePermissions.length > 0 && visiblePermissions.every((permission) => selectedIds.has(permission.id));

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
            <div className="whitespace-nowrap">
              <DhritiCheckboxField
                label="Select all"
                checked={allPermissionsSelected}
                onChange={() => void onToggleMany(visiblePermissions, allPermissionsSelected)}
              />
            </div>
            <div className="w-72">
              <DhritiTextField
                label="Search permissions"
                showLabel={false}
                value={query}
                onChange={setQuery}
                placeholder="Search permissions"
              />
            </div>
          </div>
        ) : null}
      </div>
      {role ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
            {groupedPermissions.length ? (
              groupedPermissions.map(([application, applicationPermissions]) => (
                <section key={application} aria-labelledby={`permission-application-${application}`}>
                  <div className="mb-2 flex items-center justify-between gap-3 px-1">
                    <h3
                      id={`permission-application-${application}`}
                      className="text-xs font-semibold uppercase tracking-wide text-text-muted"
                    >
                      {application}
                    </h3>
                    <DhritiCheckboxField
                      label="Select all"
                      checked={applicationPermissions.every((permission) => selectedIds.has(permission.id))}
                      onChange={() =>
                        void onToggleMany(
                          applicationPermissions,
                          applicationPermissions.every((permission) => selectedIds.has(permission.id)),
                        )
                      }
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    {applicationPermissions.map((permission) => {
                      const attached = selectedIds.has(permission.id);
                      return (
                        <div
                          key={permission.id}
                          className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                            attached
                              ? "border-brand bg-brand-muted"
                              : "border-border bg-surface hover:bg-surface-raised"
                          }`}
                        >
                          <DhritiCheckboxField
                            id={`${fieldId}-${permission.id}`}
                            label={`${attached ? "Remove" : "Add"} ${permission.key}`}
                            showLabel={false}
                            checked={attached}
                            onChange={() => void onToggle(permission, attached)}
                          />
                          <label htmlFor={`${fieldId}-${permission.id}`} className="min-w-0 flex-1 cursor-pointer">
                            <span
                              className="block truncate text-sm font-medium text-text-primary"
                              title={permission.name ?? permission.key}
                            >
                              {permission.name ?? permission.key}
                            </span>
                            <span className="block truncate text-xs text-text-muted" title={permission.key}>
                              {permission.key}
                            </span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))
            ) : (
              <p className="px-1 py-4 text-sm text-text-muted">No permissions match your search.</p>
            )}
          </div>
          {allowPermissionId ? (
            <form onSubmit={(event) => void addById(event)} className="flex gap-2 border-t border-border p-4">
              <div className="min-w-0 flex-1">
                <DhritiTextField
                  label="Permission ID"
                  showLabel={false}
                  value={permissionId}
                  onChange={setPermissionId}
                  placeholder="Permission ID"
                />
              </div>
              <DhritiButton
                variant="secondary"
                type="submit"
                disabled={isAdding}
                className="!min-h-0 !shadow-none !bg-transparent !gap-0 cursor-pointer !rounded-md !border !border-border !px-3 !py-2 !text-sm !font-medium !text-text-primary hover:!bg-surface-raised disabled:cursor-not-allowed"
              >
                Attach
              </DhritiButton>
            </form>
          ) : null}
          {onSave ? (
            <div className="flex justify-end border-t border-border p-4">
              <DhritiButton onClick={() => void onSave()} disabled={!hasChanges || isSaving} loading={isSaving}>
                Save permissions
              </DhritiButton>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
