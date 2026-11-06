"use client";

import { ArrowDownUp, Check, ChevronDown, CircleSlash, LockKeyhole, Search } from "lucide-react";
import { useEffect, useEffectEvent, useState } from "react";

import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { Pagination } from "@/components/shared/pagination";
import { useAlert } from "@/components/shared/alert";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import {
  controlPlatformService,
  type PlatformUser,
  type PlatformUserSortField,
} from "@/services/control.service";

function formatDateTime(value: string | null) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")} ${get("month")}, ${get("year")} ${get("hour")}:${get("minute")} ${get("dayPeriod")}`;
}

function initials(name: string | null, email: string) {
  return (name ?? email)
    .split(/\s|@/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function PlatformUsers() {
  const { showAlert } = useAlert();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "ACTIVE" | "SUSPENDED" | "LOCKED">("");
  const [mfaFilter, setMfaFilter] = useState<"" | "true" | "false">("");
  const [sortBy, setSortBy] = useState<PlatformUserSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [statusAnchor, setStatusAnchor] = useState<HTMLElement | null>(null);
  const [statusMenuUserId, setStatusMenuUserId] = useState<string | null>(null);

  const load = useEffectEvent(async () => {
    setLoading(true);
    try {
      const result = await controlPlatformService.listUsers({
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        mfaEnabled: mfaFilter ? mfaFilter === "true" : undefined,
        sortBy,
        sortOrder,
        page,
        limit: pageSize,
      });
      setUsers(result.items);
      setPagination(result.pagination);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load platform users");
    } finally {
      setLoading(false);
    }
  });

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [search, statusFilter, mfaFilter, sortBy, sortOrder, page, pageSize]);

  const toggleSort = (field: PlatformUserSortField) => {
    if (field === sortBy) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
    setPage(1);
  };

  const setSuspended = async (user: PlatformUser, suspended: boolean) => {
    setUpdatingUserId(user.id);
    try {
      await controlPlatformService.setUserSuspended(user.id, suspended);
      setUsers((current) =>
        current.map((item) => (item.id === user.id ? { ...item, status: suspended ? "SUSPENDED" : "ACTIVE" } : item)),
      );
      showAlert({
        message: `${user.name || user.email} has been ${suspended ? "suspended" : "reactivated"}.`,
        variant: "success",
        dismissible: true,
      });
    } catch (updateError) {
      showAlert({
        message: updateError instanceof Error ? updateError.message : "Unable to update user access.",
        variant: "error",
        dismissible: true,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const lockUser = async (user: PlatformUser) => {
    setUpdatingUserId(user.id);
    try {
      await controlPlatformService.lockUser(user.id);
      setUsers((current) => current.map((item) => (item.id === user.id ? { ...item, status: "LOCKED" } : item)));
      showAlert({
        message: `${user.name || user.email} has been locked.`,
        variant: "success",
        dismissible: true,
      });
    } catch (updateError) {
      showAlert({
        message: updateError instanceof Error ? updateError.message : "Unable to lock user account.",
        variant: "error",
        dismissible: true,
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const statusMenuUser = users.find((user) => user.id === statusMenuUserId) ?? null;
  const statusMenuItems: ConnectCascadingMenuItem[] = statusMenuUser
    ? [
        {
          id: "active",
          label: "Active",
          icon: <Check aria-hidden="true" size={16} />,
          selected: statusMenuUser.status === "ACTIVE",
          onClick: () => void setSuspended(statusMenuUser, false),
        },
        {
          id: "suspended",
          label: "Suspended",
          icon: <CircleSlash aria-hidden="true" size={16} />,
          selected: statusMenuUser.status === "SUSPENDED",
          onClick: () => void setSuspended(statusMenuUser, true),
        },
        {
          id: "locked",
          label: "Locked",
          icon: <LockKeyhole aria-hidden="true" size={16} />,
          selected: statusMenuUser.status === "LOCKED",
          onClick: () => void lockUser(statusMenuUser),
        },
      ]
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Platform Users</h1>
        <p className="mt-1 text-sm text-slate-500">Platform accounts and current access status.</p>
      </div>
      {error && (
        <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-2xl lg:flex-1">
          <Search aria-hidden="true" size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search users..."
            aria-label="Search platform users"
            className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          />
        </label>
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(event) => { setStatusFilter(event.target.value as typeof statusFilter); setPage(1); }}
            className="min-w-36 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            <option value="">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="LOCKED">Locked</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select
            aria-label="Filter by MFA"
            value={mfaFilter}
            onChange={(event) => { setMfaFilter(event.target.value as typeof mfaFilter); setPage(1); }}
            className="min-w-40 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15"
          >
            <option value="">All MFA states</option>
            <option value="true">MFA enabled</option>
            <option value="false">MFA not enabled</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 font-semibold"><SortButton label="Staff member" field="name" activeField={sortBy} order={sortOrder} onSort={toggleSort} /></th>
              <th className="px-4 py-3 font-semibold">Platform role</th>
              <th className="px-4 py-3 font-semibold"><SortButton label="Last active" field="createdAt" activeField={sortBy} order={sortOrder} onSort={toggleSort} /></th>
              <th className="px-4 py-3 font-semibold">MFA</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              return (
                <tr key={user.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="" className="size-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                          {initials(user.name, user.email)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <div className="truncate font-medium text-slate-900">{user.name || "Unnamed user"}</div>
                        <div className="truncate text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{roleLabel(user.auth?.platformRole)}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateTime(user.auth?.lastLoginAt ?? null)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{user.auth?.mfaEnabled ? "Enabled" : "Not enabled"}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      aria-label={`Set status for ${user.name || user.email}`}
                      className="min-w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:cursor-wait disabled:opacity-50"
                      disabled={updatingUserId === user.id}
                      onClick={(event) => {
                        setStatusMenuUserId(user.id);
                        setStatusAnchor(event.currentTarget);
                      }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <StatusIcon status={user.status} />
                        {statusLabel(user.status)}
                        <ChevronDown aria-hidden="true" size={14} />
                      </span>
                    </button>
                  </td>
                </tr>
              );
            })}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">
                  No platform users match the current search.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">Loading platform users...</td>
              </tr>
            )}
          </tbody>
        </table>
        <Pagination
          ariaLabel="Platform users pagination"
          page={pagination.page}
          pageSize={pagination.limit}
          total={pagination.total}
          totalPages={pagination.totalPages}
          onPageChange={setPage}
          onPageSizeChange={(limit) => {
            setPageSize(limit);
            setPage(1);
          }}
        />
      </div>
      <ConnectCascadingMenu
        anchorEl={statusAnchor}
        open={Boolean(statusAnchor && statusMenuUser)}
        onClose={() => {
          setStatusAnchor(null);
          setStatusMenuUserId(null);
        }}
        items={statusMenuItems}
        minWidth={160}
      />
    </div>
  );
}

function SortButton({
  label,
  field,
  activeField,
  order,
  onSort,
}: {
  label: string;
  field: PlatformUserSortField;
  activeField: PlatformUserSortField;
  order: "asc" | "desc";
  onSort: (field: PlatformUserSortField) => void;
}) {
  const active = field === activeField;
  return (
    <button type="button" className="inline-flex items-center gap-1" onClick={() => onSort(field)}>
      {label}
      <ArrowDownUp aria-hidden="true" size={14} className={active ? "text-brand" : "text-slate-400"} />
      <span className="sr-only">{active ? `sorted ${order === "asc" ? "ascending" : "descending"}` : ""}</span>
    </button>
  );
}

function roleLabel(role: string | null | undefined) {
  return role ? role.replaceAll("_", " ") : "No platform role";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "LOCKED") return <LockKeyhole aria-hidden="true" size={14} />;
  if (status === "SUSPENDED") return <CircleSlash aria-hidden="true" size={14} />;
  return <Check aria-hidden="true" size={14} />;
}

function statusLabel(status: string) {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
