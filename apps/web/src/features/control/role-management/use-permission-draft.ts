"use client";

import { useRef, useState } from "react";
import type { Permission, PermissionChange, Role } from "./types";

/**
 * Keep independent local drafts per role; only Save persists the selected role.
 * Failed saves retain the draft for retry, including after a partial server update.
 * Edits made during a save stay local for the next Save instead of locking the grid.
 * Nothing is written on a timer, role switch, or unmount.
 */
export function usePermissionDraft(
  roles: Role[],
  save: (role: Role, changes: PermissionChange[]) => Promise<void>,
  onError: (reason: unknown) => void,
) {
  const [drafts, setDrafts] = useState(new Map<string, Map<string, PermissionChange>>());
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);

  const changesFor = (role: Role) => {
    const stored = roles.find((entry) => entry.id === role.id) ?? role;
    const selectedIds = new Set(stored.permissions.map(({ permission }) => permission.id));
    return [...(drafts.get(role.id)?.values() ?? [])].filter(
      (change) => selectedIds.has(change.permission.id) !== change.selected,
    );
  };

  const queue = (role: Role, permissions: Permission[], selected: boolean) => {
    setDrafts((current) => {
      const next = new Map(current);
      const changes = new Map(next.get(role.id));
      for (const permission of permissions) changes.set(permission.id, { permission, selected });
      next.set(role.id, changes);
      return next;
    });
  };

  const saveRole = async (role: Role) => {
    if (savingRef.current) return;
    const changes = changesFor(role);
    if (!changes.length) return;
    const submittedDraft = drafts.get(role.id);
    savingRef.current = true;
    setSaving(true);
    try {
      await save(role, changes);
      setDrafts((current) => {
        const next = new Map(current);
        const remaining = new Map(next.get(role.id));
        for (const [permissionId, change] of submittedDraft ?? []) {
          if (remaining.get(permissionId) === change) remaining.delete(permissionId);
        }
        if (remaining.size) next.set(role.id, remaining);
        else next.delete(role.id);
        return next;
      });
    } catch (reason) {
      onError(reason);
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const displayedRoles = roles.map((role) => {
    const selected = new Map(role.permissions.map(({ permission }) => [permission.id, permission]));
    for (const { permission, selected: attached } of drafts.get(role.id)?.values() ?? []) {
      if (attached) selected.set(permission.id, permission);
      else selected.delete(permission.id);
    }
    return { ...role, permissions: [...selected.values()].map((permission) => ({ permission })) };
  });
  return { roles: displayedRoles, queue, saving, saveRole, hasChanges: (role: Role) => changesFor(role).length > 0 };
}
