"use client";

import { DhritiButton, DhritiCheckboxField, DhritiTextField } from "@dhriti/ui";

import { useId, useState } from "react";
import { Plus, UserMinus } from "lucide-react";
import type { AssignableUser, Role } from "./types";

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
  const fieldId = useId();
  if (!role) return null;
  const assignedUsers = (
    role.assignments?.map(({ user }) => ({ ...user, designation: user.profile?.jobTitle ?? user.designation })) ?? []
  ).sort((first, second) => first.name.localeCompare(second.name));
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
          <h2 className="font-semibold text-text-primary">Assignees ({assignedUsers.length})</h2>
          <DhritiButton
            variant="secondary"
            type="button"
            onClick={() => setIsMemberMenuOpen((current) => !current)}
            className="!min-h-0 !shadow-none !bg-transparent flex cursor-pointer items-center !gap-1 !rounded-md !border !border-border !px-2 !py-1 !text-xs !font-semibold !text-text-primary hover:!bg-surface-raised"
            aria-expanded={isMemberMenuOpen}
          >
            <Plus aria-hidden="true" size={14} />
            Add member
          </DhritiButton>
        </div>
        <p className="mt-1 text-sm text-text-secondary">Users assigned to {role.name}.</p>
        <div className="mt-4">
          <DhritiTextField
            label="Search assignees"
            showLabel={false}
            value={query}
            onChange={setQuery}
            placeholder="Search users"
          />
        </div>
        {isMemberMenuOpen ? (
          <div className="absolute inset-x-3 top-full z-20 mt-2 rounded-md border border-border bg-surface p-3 shadow-lg">
            <DhritiTextField
              label="Find members to add"
              showLabel={false}
              value={memberQuery}
              onChange={setMemberQuery}
              placeholder="Search members"
            />
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto">
              {selectableUsers.map((user) => (
                <div key={user.id} className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-surface-raised">
                  <DhritiCheckboxField
                    id={`${fieldId}-${user.id}`}
                    label={`Select ${user.name}`}
                    showLabel={false}
                    checked={selectedMemberIds.has(user.id)}
                    onChange={() => toggleMember(user.id)}
                  />
                  <label htmlFor={`${fieldId}-${user.id}`} className="min-w-0 flex-1 cursor-pointer">
                    <span className="block truncate text-sm font-medium text-text-primary">{user.name}</span>
                    <span className="block truncate text-xs text-text-muted">{user.email}</span>
                  </label>
                </div>
              ))}
              {!selectableUsers.length ? <p className="px-2 py-3 text-sm text-text-muted">No members found.</p> : null}
            </div>
            <div className="mt-3 flex justify-end gap-2 border-t border-border pt-3">
              <DhritiButton
                variant="secondary"
                type="button"
                onClick={() => setIsMemberMenuOpen(false)}
                className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !px-2 !py-1 !text-xs !text-text-secondary hover:!bg-surface-raised"
              >
                Cancel
              </DhritiButton>
              <DhritiButton
                variant="primary"
                type="button"
                disabled={!selectedMemberIds.size || isSaving}
                onClick={() => void addMembers()}
                className="!min-h-0 !shadow-none !border-0 !gap-0 cursor-pointer !rounded-md !bg-brand !px-2 !py-1 !text-xs !font-semibold !text-text-inverse disabled:cursor-not-allowed disabled:opacity-60 hover:!bg-brand"
              >
                Add {selectedMemberIds.size || ""} member{selectedMemberIds.size === 1 ? "" : "s"}
              </DhritiButton>
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
            <DhritiButton
              variant="danger"
              type="button"
              onClick={() => setRevokeTarget(user)}
              className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !p-2 !text-error hover:!bg-surface-raised"
              aria-label={`Revoke ${role.name} from ${user.name}`}
              title={`Revoke ${role.name} from ${user.name}`}
            >
              <UserMinus aria-hidden="true" size={16} />
            </DhritiButton>
          </div>
        ))}
        {!visibleUsers.length ? <p className="px-2 py-4 text-sm text-text-muted">No assignees found.</p> : null}
      </div>
      {revokeTarget ? (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-text-primary/35 p-4"
          onMouseDown={() => setRevokeTarget(null)}
        >
          <section
            aria-modal="true"
            aria-labelledby="revoke-role-title"
            role="dialog"
            className="w-full max-w-md rounded-lg border border-border bg-surface p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 id="revoke-role-title" className="text-lg font-semibold text-text-primary">
              Revoke access?
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
              {revokeTarget.name} will no longer be assigned to {role.name}.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <DhritiButton
                variant="secondary"
                type="button"
                onClick={() => setRevokeTarget(null)}
                className="!min-h-0 !shadow-none !border-0 !bg-transparent !font-normal !gap-0 cursor-pointer !rounded-md !px-3 !py-2 !text-sm !text-text-secondary hover:!bg-surface-raised"
              >
                Cancel
              </DhritiButton>
              <DhritiButton
                variant="danger"
                type="button"
                onClick={() => void onRevoke(revokeTarget.id).then(() => setRevokeTarget(null))}
                className="!min-h-0 !shadow-none !border-0 !gap-0 cursor-pointer !rounded-md !bg-error !px-3 !py-2 !text-sm !font-semibold !text-text-inverse hover:!bg-error"
              >
                Revoke access
              </DhritiButton>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
