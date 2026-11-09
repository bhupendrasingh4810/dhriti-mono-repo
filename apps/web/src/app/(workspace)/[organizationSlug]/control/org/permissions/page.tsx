"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { organizationAccessService } from "@/services/organization-management.service";

type Permission = { id: string; key: string };
type Group = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: Array<{ permission: Permission }>;
  _count: { assignments: number };
};

export default function RolesPermissions() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const [groups, setGroups] = useState<Group[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [nextGroups, nextPermissions] = await Promise.all([
        organizationAccessService.permissionGroups.list(organizationSlug) as Promise<Group[]>,
        organizationAccessService.listPermissions(organizationSlug) as Promise<Permission[]>,
      ]);
      setGroups(nextGroups);
      setPermissions(nextPermissions);
      setSelectedGroupId((current) => current || nextGroups[0]?.id || "");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load permission groups.");
    }
  }, [organizationSlug]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedPermissionIds = new Set(selectedGroup?.permissions.map(({ permission }) => permission.id));
  const togglePermission = async (permission: Permission) => {
    if (!selectedGroup) return;
    setError("");
    try {
      if (selectedPermissionIds.has(permission.id)) {
        await organizationAccessService.permissionGroups.removePermission(organizationSlug, selectedGroup.id, permission.id);
      } else {
        await organizationAccessService.permissionGroups.attachPermission(organizationSlug, selectedGroup.id, permission.id);
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update group permissions.");
    }
  };

  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-text-primary">Roles & permissions</h1><p className="mt-1 text-sm text-text-secondary">Configure what each organization permission group can access.</p></header>
    {error && <p role="alert" className="rounded-md border border-error p-3 text-sm text-error">{error}</p>}
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-lg border border-border bg-surface p-3">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Permission groups</p>
        <div className="space-y-1">{groups.map((group) => <button key={group.id} type="button" onClick={() => setSelectedGroupId(group.id)} className={`w-full cursor-pointer rounded-md px-3 py-2 text-left ${group.id === selectedGroupId ? "bg-brand-muted text-brand" : "text-text-primary hover:bg-surface-raised"}`}><span className="block text-sm font-semibold">{group.name}</span><span className="block text-xs text-text-muted">{group._count.assignments} members · {group.permissions.length} permissions</span></button>)}</div>
      </aside>
      <section className="overflow-hidden rounded-lg border border-border bg-surface">
        <div className="border-b border-border p-5"><h2 className="font-semibold text-text-primary">{selectedGroup?.name ?? "Select a permission group"}</h2><p className="mt-1 text-sm text-text-secondary">{selectedGroup?.description ?? "Toggle permissions granted to this group."}</p></div>
        <div className="divide-y divide-border">{permissions.map((permission) => <label key={permission.id} className="flex cursor-pointer items-center justify-between gap-4 px-5 py-3 hover:bg-surface-raised"><span className="font-mono text-sm text-text-primary">{permission.key}</span><input type="checkbox" checked={selectedPermissionIds.has(permission.id)} disabled={!selectedGroup} onChange={() => void togglePermission(permission)} className="cursor-pointer accent-brand disabled:cursor-not-allowed" /></label>)}</div>
      </section>
    </div>
  </div>;
}
