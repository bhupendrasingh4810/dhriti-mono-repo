"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { controlPlatformService } from "@/services/control.service";

type PlatformUser = {
  id: string;
  name: string | null;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | string;
  createdAt: string;
  auth: { platformRole: string | null; mfaEnabled: boolean; lastLoginAt: string | null } | null;
};

export default function PlatformUsers() {
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const load = useEffectEvent(async () => {
    try {
      setUsers((await controlPlatformService.listUsers()) as PlatformUser[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load platform users");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const setSuspended = async (user: PlatformUser, suspended: boolean) => {
    setUpdatingUserId(user.id);
    try {
      await controlPlatformService.setUserSuspended(user.id, suspended);
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, status: suspended ? "SUSPENDED" : "ACTIVE" } : item));
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update user access");
    } finally {
      setUpdatingUserId(null);
    }
  };

  const filtered = users.filter((user) => `${user.name ?? ""} ${user.email}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-bold text-slate-950">Platform Users</h1><p className="mt-1 text-sm text-slate-500">Platform accounts and current access status.</p></div>
      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search users..." className="w-full max-w-md rounded border border-slate-300 px-3 py-2 text-sm" />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white"><table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Staff member", "Platform role", "Last active", "MFA", "Status", "Action"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>
        {filtered.map((user) => { const suspended = user.status === "SUSPENDED"; return <tr key={user.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3"><div className="font-medium text-slate-900">{user.name || "Unnamed user"}</div><div className="text-xs text-slate-500">{user.email}</div></td><td className="px-4 py-3 text-slate-600">{roleLabel(user.auth?.platformRole)}</td><td className="px-4 py-3 text-slate-600">{user.auth?.lastLoginAt ? new Date(user.auth.lastLoginAt).toLocaleString() : "Never"}</td><td className="px-4 py-3 text-slate-600">{user.auth?.mfaEnabled ? "Enabled" : "Not enabled"}</td><td className="px-4 py-3"><span className={suspended ? "text-red-700" : "text-green-700"}>{suspended ? "Suspended" : "Active"}</span></td><td className="px-4 py-3"><button className="rounded border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-50" disabled={updatingUserId === user.id} onClick={() => void setSuspended(user, !suspended)}>{suspended ? "Reactivate" : "Suspend"}</button></td></tr>; })}
        {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No platform users match the current search.</td></tr>}
      </tbody></table></div>
    </div>
  );
}

function roleLabel(role: string | null | undefined) {
  return role ? role.replaceAll("_", " ") : "No platform role";
}
