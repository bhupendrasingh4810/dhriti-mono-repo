"use client";

import { DhritiButton, DhritiTextField } from "@dhriti/ui";

import { type FormEvent, useState } from "react";
import { Trash2 } from "lucide-react";
import { ToastContainer, useToast } from "@/components/shared/Toast";
import type { AssignableUser, Permission, PermissionChange, PermissionInput, Role } from "./types";
import { messageFrom } from "./utils";
import { RoleList } from "./role-list";
import { RoleCreationForm } from "./role-creation-form";
import { PermissionCatalogDrawer } from "./permission-catalog-drawer";
import { PermissionEditor } from "./permission-editor";
import { RoleAssignment } from "./role-assignment";
import { usePermissionDraft } from "./use-permission-draft";
import { RoleManagementSkeleton } from "./role-management-skeleton";

export function RoleManagement({
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
  isLoading = false,
  onCreate,
  onUpdate,
  onDelete,
  onCreatePermission,
  onUpdatePermission,
  onDeletePermission,
  onSavePermissions,
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
  isLoading?: boolean;
  onCreate: (input: { name: string; key?: string; description?: string }) => Promise<void>;
  onUpdate?: (role: Role, input: { name: string; description?: string }) => Promise<void>;
  onDelete?: (role: Role) => Promise<void>;
  onCreatePermission?: (input: PermissionInput) => Promise<void>;
  onUpdatePermission?: (permission: Permission, input: Omit<PermissionInput, "key">) => Promise<void>;
  onDeletePermission?: (permission: Permission) => Promise<void>;
  onSavePermissions: (role: Role, changes: PermissionChange[]) => Promise<void>;
  onAssign: (role: Role, userId: string) => Promise<void>;
  onRevoke: (role: Role, userId: string) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState("");
  const { toasts, addToast, removeToast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isManagingPermissions, setIsManagingPermissions] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [editingError, setEditingError] = useState("");
  const permissionDraft = usePermissionDraft(
    roles,
    async (role, changes) => {
      await onSavePermissions(role, changes);
      addToast("Permissions saved successfully.", "success");
    },
    (reason) =>
      addToast(messageFrom(reason, "Unable to save permissions. Your changes are retained; please retry."), "error"),
  );
  const selected = permissionDraft.roles.find((role) => role.id === selectedId) ?? permissionDraft.roles[0];

  const run = async (action: () => Promise<void>, fallback: string) => {
    try {
      await action();
    } catch (reason) {
      addToast(messageFrom(reason, fallback), "error");
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
      addToast(messageFrom(reason, "Unable to update permission group."), "error");
    }
  };

  const deleteGroup = async () => {
    if (!editingRole || !onDelete) return;

    try {
      await onDelete(editingRole);
      setEditingRole(null);
    } catch (reason) {
      addToast(messageFrom(reason, "Unable to delete permission group."), "error");
    }
  };

  if (isLoading) return <RoleManagementSkeleton />;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <ToastContainer toasts={toasts} onRemove={removeToast} position="top-center" />
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          <p className="mt-1 text-sm text-text-secondary">{description}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {onCreatePermission ? (
            <DhritiButton
              variant="secondary"
              type="button"
              onClick={() => setIsManagingPermissions(true)}
              className="!min-h-0 !shadow-none !bg-transparent !gap-0 cursor-pointer !rounded-md !border !border-border !px-3 !py-2 !text-sm !font-semibold !text-text-primary hover:!bg-surface-raised"
            >
              Manage permissions
            </DhritiButton>
          ) : null}
          <DhritiButton
            variant="primary"
            type="button"
            onClick={() => setIsCreating((current) => !current)}
            className="!min-h-0 !shadow-none !border-0 !gap-0 cursor-pointer !rounded-md !bg-brand !px-3 !py-2 !text-sm !font-semibold !text-text-inverse transition-colors hover:!bg-brand-hover"
            aria-expanded={isCreating}
          >
            New {noun}
          </DhritiButton>
        </div>
      </header>
      {loadError ? (
        <p role="alert" className="rounded-md border border-error p-3 text-sm text-error">
          {loadError}
        </p>
      ) : null}
      <RoleCreationForm
        noun={noun}
        includeKey={includeKey}
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        onCreate={async (input) => {
          try {
            await onCreate(input);
            setIsCreating(false);
            return true;
          } catch (reason) {
            addToast(messageFrom(reason, `Unable to create ${noun.toLowerCase()}.`), "error");
            return false;
          }
        }}
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
          roles={permissionDraft.roles}
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
              onSave={selected ? () => permissionDraft.saveRole(selected) : undefined}
              hasChanges={selected ? permissionDraft.hasChanges(selected) : false}
              isSaving={permissionDraft.saving}
              onToggle={async (permission, attached) => {
                if (selected) permissionDraft.queue(selected, [permission], !attached);
              }}
              onToggleMany={async (permissionBatch, attached) => {
                if (selected) permissionDraft.queue(selected, permissionBatch, !attached);
              }}
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
        <div
          className="fixed inset-0 z-50 flex justify-end bg-text-primary/35"
          onMouseDown={() => setEditingRole(null)}
        >
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
                <p className="mt-1 text-sm text-text-secondary">
                  Update this group or remove it when it is no longer needed.
                </p>
              </div>
              <DhritiButton
                variant="secondary"
                type="button"
                onClick={() => setEditingRole(null)}
                className="!min-h-0 !shadow-none !border-0 !bg-transparent !gap-0 cursor-pointer !rounded-md !px-3 !py-2 !text-sm !font-medium !text-text-secondary hover:!bg-surface-raised"
              >
                Close
              </DhritiButton>
            </div>
            <form noValidate className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => void saveGroup(event)}>
              <div className="flex-1 overflow-y-auto p-6">
                <DhritiTextField
                  label="Name"
                  required
                  value={editingName}
                  onChange={(value) => {
                    setEditingName(value);
                    setEditingError("");
                  }}
                  error={editingError}
                />
                <div className="mt-4">
                  <DhritiTextField label="Description" value={editingDescription} onChange={setEditingDescription} />
                </div>
              </div>
              <div className="flex items-center justify-between gap-2 border-t border-border p-6">
                {!editingRole.isSystem && onDelete ? (
                  <DhritiButton
                    variant="danger"
                    type="button"
                    onClick={() => void deleteGroup()}
                    className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !p-2 !text-error hover:!bg-surface-raised"
                    aria-label={`Delete ${editingRole.name}`}
                    title={`Delete ${editingRole.name}`}
                  >
                    <Trash2 aria-hidden="true" size={18} />
                  </DhritiButton>
                ) : (
                  <span />
                )}
                <div className="flex gap-2">
                  <DhritiButton
                    variant="secondary"
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !px-3 !py-2 !text-sm !text-text-secondary hover:!bg-surface-raised"
                  >
                    Cancel
                  </DhritiButton>
                  <DhritiButton
                    variant="primary"
                    type="submit"
                    className="!min-h-0 !shadow-none !border-0 !gap-0 cursor-pointer !rounded-md !bg-brand !px-3 !py-2 !text-sm !font-semibold !text-text-inverse hover:!bg-brand"
                  >
                    Save changes
                  </DhritiButton>
                </div>
              </div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  );
}
