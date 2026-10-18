"use client";

import { useEffect, useEffectEvent, useState } from "react";

import { controlPlatformService } from "@/services/control.service";

type AuditEntry = {
  id: string;
  actorUserId: string | null;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  ipAddress: string | null;
  createdAt: string;
};

export default function AuditLogs() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const load = useEffectEvent(async () => {
    try {
      setEntries((await controlPlatformService.auditLogs(500)) as AuditEntry[]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load audit logs");
    }
  });

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  const filtered = entries.filter((entry) => {
    const value = `${entry.actorUserId ?? "system"} ${entry.action} ${entry.resourceType ?? ""} ${entry.resourceId ?? ""}`;
    return value.toLowerCase().includes(search.toLowerCase());
  });

  const exportCsv = () => {
    const csv = [
      ["Actor", "Action", "Resource", "IP address", "Timestamp", "Status"],
      ...filtered.map((entry) => [entry.actorUserId ?? "system", entry.action, resourceLabel(entry), entry.ipAddress ?? "-", entry.createdAt, "success"]),
    ].map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(",")).join("\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = "audit-logs.csv";
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-950">Audit Logs</h1><p className="mt-1 text-sm text-slate-500">Complete record of administrative actions</p></div>
        <button className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700" onClick={exportCsv}>Export CSV</button>
      </div>
      {error && <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <input type="search" placeholder="Search by actor, action, or resource..." value={search} onChange={(event) => setSearch(event.target.value)} className="w-full rounded border border-slate-300 px-3 py-2 text-sm" />
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm"><thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500"><tr>{["Actor", "Action", "Resource", "IP Address", "Timestamp", "Status"].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody>
          {filtered.map((entry) => <tr key={entry.id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3 font-medium text-slate-900">{entry.actorUserId ?? "system"}</td><td className="px-4 py-3"><code className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">{entry.action}</code></td><td className="px-4 py-3 text-slate-600">{resourceLabel(entry)}</td><td className="px-4 py-3 font-mono text-xs text-slate-500">{entry.ipAddress ?? "-"}</td><td className="px-4 py-3 whitespace-nowrap text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString()}</td><td className="px-4 py-3"><span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">Success</span></td></tr>)}
          {filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">No audit logs match the current search.</td></tr>}
        </tbody></table>
        <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">Showing {filtered.length} of {entries.length} entries</div>
      </div>
    </div>
  );
}

function resourceLabel(entry: AuditEntry) {
  return [entry.resourceType, entry.resourceId].filter(Boolean).join(": ") || "-";
}
