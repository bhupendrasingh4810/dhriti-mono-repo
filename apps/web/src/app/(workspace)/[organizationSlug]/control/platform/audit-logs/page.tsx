"use client";

import { Search } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { Pagination } from "@/components/shared/pagination";
import { controlPlatformService, type PlatformAuditLog } from "@/services/control.service";

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}:${get("second")} ${get("dayPeriod")}`;
}

function actionLabel(action: string) {
  return action
    .split(".")
    .map((part) => part.replaceAll(/[_-]/g, " "))
    .join(" / ");
}

function actorLabel(entry: PlatformAuditLog) {
  if (!entry.actor) return entry.actorUserId ? `Deleted user (${entry.actorUserId.slice(0, 8)})` : "System";
  return entry.actor.name || entry.actor.email;
}

function metadataLabel(metadata: Record<string, unknown> | null) {
  if (!metadata || Object.keys(metadata).length === 0) return null;
  return Object.entries(metadata)
    .map(([key, value]) => `${key.replaceAll(/([A-Z])/g, " $1").trim()}: ${String(value)}`)
    .join(" · ");
}

export default function AuditLogs() {
  const [entries, setEntries] = useState<PlatformAuditLog[]>([]);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("");
  const [resourceType, setResourceType] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useEffectEvent(async () => {
    setLoading(true);
    try {
      const result = await controlPlatformService.auditLogs({
        search: search.trim() || undefined,
        action: action.trim() || undefined,
        resourceType: resourceType.trim() || undefined,
        page,
        limit: pageSize,
      });
      setEntries(result.items);
      setPagination(result.pagination);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load audit logs");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [search, action, resourceType, page, pageSize]);

  const exportCsv = () => {
    const csv = [
      ["Actor", "Action", "Scope", "Resource", "Context", "Occurred at"],
      ...entries.map((entry) => [
        actorLabel(entry),
        entry.action,
        entry.organization?.name ?? "Platform",
        [entry.resourceType, entry.resourceId].filter(Boolean).join(": ") || "-",
        metadataLabel(entry.metadata) ?? entry.ipAddress ?? "-",
        formatTimestamp(entry.createdAt),
      ]),
    ]
      .map((row) => row.map((value) => `"${value.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = href;
    link.download = `audit-logs-page-${pagination.page}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Audit Logs</h1>
          <p className="mt-1 text-sm text-slate-500">A searchable record of actions across every organization.</p>
        </div>
        <button
          className="rounded border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700"
          onClick={exportCsv}
        >
          Export current page
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_12rem_12rem]">
        <label className="relative block">
          <Search
            aria-hidden="true"
            size={17}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="Search actor, action, scope, or resource..."
            aria-label="Search audit logs"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </label>
        <input
          type="search"
          placeholder="Filter action"
          aria-label="Filter audit logs by action"
          value={action}
          onChange={(event) => {
            setAction(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
        <input
          type="search"
          placeholder="Filter resource"
          aria-label="Filter audit logs by resource type"
          value={resourceType}
          onChange={(event) => {
            setResourceType(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
        />
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {["Actor", "Action", "Scope", "Resource", "Context", "Occurred at"].map((heading) => (
                <th key={heading} className="px-4 py-3 font-semibold">
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{actorLabel(entry)}</p>
                  {entry.actor && <p className="mt-0.5 text-xs text-slate-500">{entry.actor.email}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium capitalize text-slate-800">{actionLabel(entry.action)}</p>
                  <code className="text-xs text-slate-500">{entry.action}</code>
                </td>
                <td className="px-4 py-3 text-slate-700">
                  <p>{entry.organization?.name ?? "Platform"}</p>
                  {entry.organization && <p className="mt-0.5 text-xs text-slate-500">{entry.organization.slug}</p>}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  <p>{entry.resourceType ?? "-"}</p>
                  {entry.resourceId && <p className="mt-0.5 font-mono text-xs text-slate-500">{entry.resourceId}</p>}
                </td>
                <td className="max-w-64 px-4 py-3 text-xs text-slate-600">
                  <p className="break-words">{metadataLabel(entry.metadata) ?? "-"}</p>
                  {entry.ipAddress && <p className="mt-1 font-mono text-slate-500">IP: {entry.ipAddress}</p>}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                  {formatTimestamp(entry.createdAt)}
                </td>
              </tr>
            ))}
            {!loading && entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  No audit logs match the current search and filters.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-500">
                  Loading audit logs...
                </td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          ariaLabel="Audit log pagination"
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(limit) => {
            setPageSize(limit);
            setPage(1);
          }}
          pageSizeOptions={[20, 50, 100]}
        />
      </div>
    </div>
  );
}
