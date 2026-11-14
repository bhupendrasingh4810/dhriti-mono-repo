"use client";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs, { type Dayjs } from "dayjs";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useAppSettingsState } from "@/features/settings/use-app-settings";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  hrmsService,
  type HrmsCompOffRequest,
  type HrmsEmployee,
  type HrmsLeaveBalance,
  type HrmsRequestStatus,
  type HrmsLeaveCenterRequest,
  type HrmsLeaveType,
  type HrmsTeamLeave,
} from "@/services/hrms.service";
import { useUpcomingHolidays } from "./components/upcoming-holidays";
import { Pagination } from "./attendance-regularization";
import { Avatar, Button, Card, CardTitle, Icon } from "./components/ui-primitives";
import {
  ApplyLeaveDialog,
  CompOffDialog,
  ReplyDialog,
  ReviewDialog,
  StatusBadge,
  errorText,
  type ReviewTarget,
} from "./leave-dialogs";

/**
 * Leave module. Header and tabs are fixed; each tab body scrolls internally.
 * Tab selection lives in `?tab=` so a refresh keeps the user on the same tab.
 */
type TabId = "dashboard" | "requests" | "policies";
type Dialog = "leave" | "compOff" | null;

const fmtRange = (start: string, end: string) =>
  start.slice(0, 10) === end.slice(0, 10)
    ? dayjs(start.slice(0, 10)).format("D MMM YYYY")
    : `${dayjs(start.slice(0, 10)).format("D MMM")} – ${dayjs(end.slice(0, 10)).format("D MMM YYYY")}`;

function BalancesCard({ balances }: { balances: HrmsLeaveBalance[] }) {
  return (
    <Card>
      <CardTitle title="Leave balances" />
      <ul className="divide-y divide-border">
        {balances.length === 0 && <li className="p-4 text-sm text-text-muted">No leave types configured.</li>}
        {balances.map((balance) => (
          <li key={balance.typeId} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <div className="min-w-0">
              <p className="truncate font-semibold text-text-primary">{balance.name}</p>
              <p className="text-xs text-text-muted">
                Used {balance.used}
                {balance.pending > 0 ? ` · Pending ${balance.pending}` : ""}
                {balance.unlimited ? "" : ` · of ${balance.entitled} (${balance.annualDays}/yr, credited monthly)`}
              </p>
            </div>
            <span className="shrink-0 text-lg font-bold text-text-primary">{balance.available === null ? "∞" : balance.available}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function HolidaysCard() {
  const holidays = useUpcomingHolidays().slice(0, 3);
  return (
    <Card>
      <CardTitle title="Upcoming holidays" />
      <ul className="divide-y divide-border">
        {holidays.length === 0 && <li className="p-4 text-sm text-text-muted">No upcoming holidays.</li>}
        {holidays.map((holiday, index) => {
          const day = dayjs(holiday.date.slice(0, 10));
          return (
            <li key={holiday.id} className="flex items-center gap-3 p-4">
              <div className={`rounded-md px-3 py-2 text-center ${index === 0 ? "bg-brand-muted text-brand" : "bg-slate-100 text-text-secondary"}`}>
                <p className="text-lg font-bold">{day.format("DD")}</p>
                <p className="text-[9px] font-bold">{day.format("MMM").toUpperCase()}</p>
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {holiday.name}
                  {holiday.isHalfDay ? " (half day)" : ""}
                </p>
                <p className="text-xs text-text-muted">
                  {day.format("dddd")} · {holiday.workLocation ? holiday.workLocation.name : "Company holiday"}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

/** Team leave calendar (month grid or single week) backed by approved/pending leave from the API. */
function TeamCalendar({ refreshKey, onPickDate }: { refreshKey: number; onPickDate: (day: Dayjs) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [mode, setMode] = useState<"month" | "week">("month");
  const [anchor, setAnchor] = useState(() => dayjs());
  const [items, setItems] = useState<HrmsTeamLeave[]>([]);

  const cells = useMemo(() => {
    if (mode === "week") {
      const start = anchor.subtract((anchor.day() + 6) % 7, "day");
      return Array.from({ length: 7 }, (_, index) => start.add(index, "day"));
    }
    const first = anchor.startOf("month");
    const offset = (first.day() + 6) % 7;
    const rows = Math.ceil((offset + first.daysInMonth()) / 7);
    return Array.from({ length: rows * 7 }, (_, index) => first.subtract(offset, "day").add(index, "day"));
  }, [anchor, mode]);
  const from = cells[0]?.format("YYYY-MM-DD");
  const to = cells[cells.length - 1]?.format("YYYY-MM-DD");

  useEffect(() => {
    if (!organizationId || !from || !to) return;
    let cancelled = false;
    hrmsService.leave
      .team(organizationId, from, to)
      .then((result) => !cancelled && setItems(result))
      .catch(() => !cancelled && setItems([]));
    return () => {
      cancelled = true;
    };
  }, [organizationId, from, to, refreshKey]);

  const step = (direction: 1 | -1) => setAnchor((current) => current.add(direction, mode));
  const subtitle = mode === "month" ? anchor.format("MMMM YYYY") : `${cells[0]?.format("D MMM")} – ${cells[6]?.format("D MMM YYYY")}`;
  const onLeave = (day: Dayjs) =>
    items.filter((item) => !day.isBefore(dayjs(item.startDate.slice(0, 10)), "day") && !day.isAfter(dayjs(item.endDate.slice(0, 10)), "day"));

  return (
    <Card>
      <CardTitle
        title="Team leave calendar"
        subtitle={subtitle}
        action={
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Previous" onClick={() => step(-1)} className="cursor-pointer rounded-md border border-border p-1.5 text-text-muted hover:bg-surface-raised">
              <Icon name="chevron" size={14} className="rotate-180" />
            </button>
            <button type="button" aria-label="Next" onClick={() => step(1)} className="cursor-pointer rounded-md border border-border p-1.5 text-text-muted hover:bg-surface-raised">
              <Icon name="chevron" size={14} />
            </button>
            <select value={mode} onChange={(event) => setMode(event.target.value as "month" | "week")} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs">
              <option value="month">Month</option>
              <option value="week">Week</option>
            </select>
          </div>
        }
      />
      <div className="p-5">
        <div className="grid grid-cols-7 gap-px overflow-hidden rounded-md border border-border bg-border">
          {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
            <div key={day} className="bg-slate-50 p-2 text-center text-[10px] font-bold text-text-muted">
              {day}
            </div>
          ))}
          {cells.map((day) => {
            const people = onLeave(day);
            const outside = mode === "month" && !day.isSame(anchor, "month");
            return (
              <div
                key={day.format("YYYY-MM-DD")}
                title="Double-click to apply leave"
                onDoubleClick={() => onPickDate(day)}
                className={`min-h-20 cursor-pointer select-none bg-white p-2 hover:bg-surface-raised ${outside ? "text-slate-300" : "text-text-primary"}`}>
                <span className={`text-xs font-semibold ${day.isSame(dayjs(), "day") ? "text-brand" : ""}`}>{day.date()}</span>
                {people.length > 0 && (
                  <div className="mt-2 flex -space-x-1">
                    {people.slice(0, 3).map((item, index) => (
                      <span key={item.id} title={`${item.employee.user.name} · ${item.type?.name ?? "Leave"}`}>
                        <Avatar initials={item.employee.user.name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase()} index={index + day.date()} size="sm" />
                      </span>
                    ))}
                    {people.length > 3 && <span className="pl-2 text-[10px] font-semibold text-text-muted">+{people.length - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

function MyRequests({
  leave,
  compOff,
  onChanged,
  onReply,
  onToast,
}: {
  leave: HrmsLeaveCenterRequest[];
  compOff: HrmsCompOffRequest[];
  onChanged: () => void;
  onReply: (target: ReviewTarget) => void;
  onToast: (message: string) => void;
}) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const rows = useMemo(
    () =>
      [
        ...leave.map((request) => ({ kind: "leave" as const, request, created: request.createdAt })),
        ...compOff.map((request) => ({ kind: "compOff" as const, request, created: request.createdAt })),
      ].sort((a, b) => ((a.created ?? "") < (b.created ?? "") ? 1 : -1)),
    [leave, compOff],
  );

  const cancel = async (row: (typeof rows)[number]) => {
    if (!organizationId) return;
    try {
      if (row.kind === "leave") await hrmsService.leave.cancel(organizationId, row.request.id);
      else await hrmsService.leave.cancelCompOff(organizationId, row.request.id);
      onToast("Request cancelled.");
      onChanged();
    } catch (error) {
      onToast(errorText(error));
    }
  };

  return (
    <Card>
      <CardTitle title="My requests" />
      <ul className="divide-y divide-border">
        {rows.length === 0 && <li className="p-4 text-sm text-text-muted">You have not raised any requests yet.</li>}
        {rows.map((row) => {
          const open = row.request.status === "PENDING" || row.request.status === "NEEDS_INFO";
          return (
            <li key={`${row.kind}-${row.request.id}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-semibold text-text-primary">
                  {row.kind === "leave" ? (row.request.type?.name ?? "Leave") : "Comp off"} ·{" "}
                  {row.kind === "leave" ? fmtRange(row.request.startDate, row.request.endDate) : fmtRange(row.request.workedDate, row.request.workedEndDate ?? row.request.workedDate)}
                </p>
                <p className="text-xs text-text-muted">
                  {row.kind === "leave" ? row.request.totalDays : row.request.days} day(s)
                  {row.request.moreInfoNote && row.request.status === "NEEDS_INFO" ? ` · Info requested: ${row.request.moreInfoNote}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={row.request.status} />
                {row.request.status === "NEEDS_INFO" && (
                  <Button variant="secondary" onClick={() => onReply(row as ReviewTarget)}>Reply</Button>
                )}
                {open && <Button variant="secondary" onClick={() => void cancel(row)}>Cancel</Button>}
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

type SortKey = "employee" | "type" | "date" | "days" | "created" | "status";
type RequestRow = {
  id: string;
  employee: string;
  type: string;
  date: string;
  dates: string;
  days: number;
  duration: string;
  created: string;
  status: HrmsRequestStatus;
  target: ReviewTarget;
};

/** Requests table: client-side search, status filter, column sorting and pagination (newest first by default). */
function RequestsTab({
  refreshKey,
  onReview,
  onChanged,
  onToast,
}: {
  refreshKey: number;
  onReview: (target: ReviewTarget) => void;
  onChanged: () => void;
  onToast: (message: string) => void;
}) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [kind, setKind] = useState<"leave" | "compOff">("leave");
  const [leave, setLeave] = useState<HrmsLeaveCenterRequest[]>([]);
  const [compOff, setCompOff] = useState<HrmsCompOffRequest[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    Promise.all([hrmsService.leave.requests(organizationId), hrmsService.leave.compOff(organizationId)])
      .then(([l, c]) => {
        if (cancelled) return;
        setLeave(l);
        setCompOff(c);
      })
      .catch((reason) => !cancelled && onToast(errorText(reason)));
    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey, onToast]);

  const approve = async (target: ReviewTarget) => {
    if (!organizationId) return;
    try {
      if (target.kind === "leave") await hrmsService.leave.decide(organizationId, target.request.id, "APPROVED");
      else await hrmsService.leave.decideCompOff(organizationId, target.request.id, "APPROVED");
      onToast("Request approved");
      onChanged();
    } catch (error) {
      onToast(errorText(error));
    }
  };

  const actions = (target: ReviewTarget) => {
    const open = target.request.status === "PENDING" || target.request.status === "NEEDS_INFO";
    if (!open) {
      return (
        <button type="button" onClick={() => onReview(target)} className="cursor-pointer rounded-md bg-slate-100 px-2 py-2 text-xs font-semibold text-text-secondary">
          Details
        </button>
      );
    }
    return (
      <div className="flex gap-1">
        <button type="button" onClick={() => void approve(target)} className="cursor-pointer rounded-md bg-brand-muted p-2 text-brand" title="Approve" aria-label="Approve">
          <Icon name="check" size={15} />
        </button>
        <button type="button" onClick={() => onReview(target)} className="cursor-pointer rounded-md bg-red-50 p-2 text-error" title="Reject" aria-label="Reject">
          <Icon name="close" size={15} />
        </button>
        <button type="button" onClick={() => onReview(target)} className="cursor-pointer rounded-md bg-blue-50 px-2 text-xs font-semibold text-info">
          More info
        </button>
      </div>
    );
  };

  const initials = (name?: string) => (name ?? "?").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const employeeCell = (name: string | undefined, index: number) => (
    <td className="px-5 py-4">
      <div className="flex items-center gap-3">
        <Avatar initials={initials(name)} index={index} size="sm" />
        <span className="text-sm font-semibold">{name}</span>
      </div>
    </td>
  );
  const columns: Array<{ key: SortKey; label: string }> =
    kind === "leave"
      ? [{ key: "employee", label: "Employee" }, { key: "type", label: "Leave type" }, { key: "date", label: "Dates" }, { key: "days", label: "Duration" }, { key: "created", label: "Requested" }, { key: "status", label: "Status" }]
      : [{ key: "employee", label: "Employee" }, { key: "type", label: "Request" }, { key: "date", label: "Day worked" }, { key: "days", label: "Credit" }, { key: "created", label: "Requested" }, { key: "status", label: "Status" }];
  const count = (items: Array<{ status: string }>) => items.filter((item) => item.status === "PENDING" || item.status === "NEEDS_INFO").length;

  const rows: RequestRow[] = useMemo(
    () =>
      kind === "leave"
        ? leave.map((request) => ({
            id: request.id,
            employee: request.employee?.user.name ?? "",
            type: request.type?.name ?? "Leave",
            date: request.startDate,
            dates: fmtRange(request.startDate, request.endDate),
            days: request.totalDays,
            duration: request.totalDays === 0.5 ? "Half day" : `${request.totalDays} day(s)`,
            created: request.createdAt ?? "",
            status: request.status,
            target: { kind: "leave", request },
          }))
        : compOff.map((request) => ({
            id: request.id,
            employee: request.employee?.user.name ?? "",
            type: "Comp off",
            date: request.workedDate,
            dates: fmtRange(request.workedDate, request.workedEndDate ?? request.workedDate),
            days: request.days,
            duration: `${request.days} day(s)`,
            created: request.createdAt ?? "",
            status: request.status,
            target: { kind: "compOff", request },
          })),
    [kind, leave, compOff],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    const filtered = rows.filter(
      (row) => (!status || row.status === status) && (!term || `${row.employee} ${row.type}`.toLowerCase().includes(term)),
    );
    const direction = order === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const left = a[sortKey];
      const right = b[sortKey];
      return direction * (typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right)));
    });
  }, [rows, search, status, sortKey, order]);

  const pageCount = Math.max(Math.ceil(visible.length / pageSize), 1);
  const current = Math.min(page, pageCount);
  const pageRows = visible.slice((current - 1) * pageSize, current * pageSize);
  const first = visible.length === 0 ? 0 : (current - 1) * pageSize + 1;
  const toggleSort = (key: SortKey) => {
    if (key === sortKey) setOrder((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setOrder(key === "created" ? "desc" : "asc");
    }
    setPage(1);
  };

  return (
    <Card className="flex h-full min-h-0 flex-col overflow-hidden">
      <CardTitle
        title={kind === "leave" ? "Leave requests" : "Comp-off requests"}
        subtitle="Review, approve, reject, or request more information"
        action={
          <select
            value={kind}
            onChange={(event) => {
              setKind(event.target.value as "leave" | "compOff");
              setPage(1);
            }}
            className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs"
          >
            <option value="leave">Leave requests ({count(leave)} open)</option>
            <option value="compOff">Comp-off requests ({count(compOff)} open)</option>
          </select>
        }
      />
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border px-5 pb-3">
        <label className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm focus-within:border-brand">
          <Icon name="search" size={16} className="text-text-muted" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search by employee or type"
            aria-label="Search requests"
            className="w-full bg-transparent outline-none"
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          aria-label="Filter by status"
          className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="NEEDS_INFO">Needs info</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[900px] text-left">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-5 py-3 text-xs font-semibold uppercase text-text-muted">
                  <button type="button" onClick={() => toggleSort(column.key)} className="inline-flex cursor-pointer items-center gap-1 uppercase" aria-label={`Sort by ${column.label}`}>
                    {column.label}
                    <Icon name="sort" size={14} className={sortKey === column.key ? "text-brand" : undefined} />
                  </button>
                </th>
              ))}
              <th className="px-5 py-3 text-xs font-semibold uppercase text-text-muted">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {pageRows.length === 0 && (
              <tr><td colSpan={7} className="px-5 py-8 text-center text-sm text-text-muted">No requests.</td></tr>
            )}
            {pageRows.map((row, index) => (
              <tr key={row.id} className="hover:bg-slate-50">
                {employeeCell(row.employee, index)}
                <td className="px-5 py-4 text-sm">{row.type}</td>
                <td className="px-5 py-4 text-sm text-text-secondary">{row.dates}</td>
                <td className="px-5 py-4 text-sm">{row.duration}</td>
                <td className="px-5 py-4 text-sm text-text-secondary">{dayjs(row.created).format("D MMM, h:mm A")}</td>
                <td className="px-5 py-4"><StatusBadge status={row.status} /></td>
                <td className="px-5 py-4">{actions(row.target)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        pageSize={pageSize}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        range={`${first}-${Math.min(current * pageSize, visible.length)} of ${visible.length}`}
        canPrev={current > 1}
        canNext={current < pageCount}
        onPrev={() => setPage(current - 1)}
        onNext={() => setPage(current + 1)}
      />
    </Card>
  );
}

function PoliciesTab({ types, canManage }: { types: HrmsLeaveType[]; canManage: boolean }) {
  const { user } = useAuth();
  const slug = user?.organization?.slug;
  const settings = useAppSettingsState("hrms").data;
  const rules: Array<[string, string]> = settings
    ? [
        ["Minimum notice", settings.leaveMinNoticeDays ? `${settings.leaveMinNoticeDays} day(s) before start` : "None"],
        ["Back-dating", settings.leaveBackdateLimitDays === null ? "No limit" : `Up to ${settings.leaveBackdateLimitDays} day(s)`],
        ["Max days per request", settings.maxLeaveRequestDays ? String(settings.maxLeaveRequestDays) : "No limit"],
        ["Half-day leave", settings.allowHalfDayLeave ? "Allowed" : "Not allowed"],
        ["Apply on behalf of others", settings.leaveOnBehalfEnabled ? "Enabled for HR/admins" : "Disabled"],
      ]
    : [];
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <Card>
        <CardTitle title="Leave types" />
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-left text-xs text-text-muted">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Type</th>
              <th className="px-4 py-2.5 font-semibold">Days / year</th>
              <th className="px-4 py-2.5 font-semibold">Carry forward</th>
              <th className="px-4 py-2.5 font-semibold">Paid</th>
              <th className="px-4 py-2.5 font-semibold">Half day</th>
            </tr>
          </thead>
          <tbody>
            {types.filter((t) => t.isActive).map((type) => (
              <tr key={type.id} className="border-t border-border">
                <td className="px-4 py-2.5 font-medium text-text-primary">{type.name}</td>
                <td className="px-4 py-2.5">{type.isCompOff ? "Earned" : type.annualDays === 0 ? "Unlimited" : type.annualDays}</td>
                <td className="px-4 py-2.5">{type.carryForwardDays}</td>
                <td className="px-4 py-2.5">{type.isPaid ? "Yes" : "No"}</td>
                <td className="px-4 py-2.5">{type.allowHalfDay ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Card>
        <CardTitle title="Rules" />
        <dl className="space-y-2 p-4 text-sm">
          {rules.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3">
              <dt className="text-text-muted">{label}</dt>
              <dd className="text-right font-medium text-text-primary">{value}</dd>
            </div>
          ))}
        </dl>
        {canManage && slug && (
          <div className="flex flex-wrap gap-3 border-t border-border p-4 text-sm font-semibold text-brand">
            <Link href={`/${slug}/hrms/settings/leave-types`} className="cursor-pointer hover:underline">Manage leave types</Link>
            <Link href={`/${slug}/hrms/settings`} className="cursor-pointer hover:underline">Leave rules</Link>
          </div>
        )}
      </Card>
    </div>
  );
}

export function HrmsLeave({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const { can } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const settings = useAppSettingsState("hrms").data;
  const canManage = can("hrms.leave.manage");

  const requested = searchParams.get("tab");
  const tab: TabId = requested === "requests" ? "requests" : requested === "policies" ? "policies" : "dashboard";
  const setTab = (next: TabId) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const [balances, setBalances] = useState<HrmsLeaveBalance[]>([]);
  const [types, setTypes] = useState<HrmsLeaveType[]>([]);
  const [myLeave, setMyLeave] = useState<HrmsLeaveCenterRequest[]>([]);
  const [myCompOff, setMyCompOff] = useState<HrmsCompOffRequest[]>([]);
  const [employees, setEmployees] = useState<HrmsEmployee[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [pickedDate, setPickedDate] = useState<Dayjs | null>(null);
  const [review, setReview] = useState<ReviewTarget | null>(null);
  const [reply, setReply] = useState<ReviewTarget | null>(null);
  const reload = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    // Independent loads: one failing (e.g. no employee profile) must not blank the rest.
    Promise.allSettled([
      hrmsService.leave.balances(organizationId),
      hrmsService.leave.types(organizationId),
      hrmsService.leave.myRequests(organizationId),
      hrmsService.leave.myCompOff(organizationId),
    ]).then(([b, t, l, c]) => {
      if (cancelled) return;
      if (b.status === "fulfilled") setBalances(b.value);
      if (t.status === "fulfilled") setTypes(t.value);
      if (l.status === "fulfilled") setMyLeave(l.value);
      if (c.status === "fulfilled") setMyCompOff(c.value);
      const failed = [b, t, l, c].find((result) => result.status === "rejected");
      if (failed?.status === "rejected") onToast(errorText(failed.reason));
    });
    return () => {
      cancelled = true;
    };
  }, [organizationId, refreshKey, onToast]);

  const onBehalf = !!settings?.leaveOnBehalfEnabled && canManage;
  useEffect(() => {
    if (!organizationId || !onBehalf) return;
    let cancelled = false;
    hrmsService.employees
      .list(organizationId, { pageSize: 100 })
      .then((page) => !cancelled && setEmployees(page.items))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [organizationId, onBehalf]);

  const done = (message: string) => {
    setDialog(null);
    setReview(null);
    setReply(null);
    onToast(message);
    reload();
  };

  const tabs: Array<[TabId, string]> = [["dashboard", "Dashboard"], ["requests", "Requests"], ["policies", "Leave Policies"]];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
          <div role="tablist" aria-label="Leave sections" className="flex gap-1">
            {tabs.map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`cursor-pointer rounded-md px-3.5 py-2 text-sm font-semibold ${tab === id ? "bg-brand/10 text-brand" : "text-text-secondary hover:bg-surface-raised"}`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDialog("compOff")}>Request comp off</Button>
            <Button onClick={() => { setPickedDate(null); setDialog("leave"); }}><Icon name="plus" size={14} /> Apply leave</Button>
          </div>
        </div>

        <div className={`min-h-0 flex-1 pt-4 ${tab === "requests" ? "" : tab === "dashboard" ? "overflow-y-auto xl:overflow-hidden" : "overflow-y-auto"}`}>
          {tab === "dashboard" && (
            <div className="grid gap-5 xl:h-full xl:grid-cols-[1fr_340px]">
              <div className="min-w-0 xl:overflow-y-auto">
                <TeamCalendar
                  refreshKey={refreshKey}
                  onPickDate={(day) => {
                    setPickedDate(day);
                    setDialog("leave");
                  }}
                />
              </div>
              <div className="space-y-5 xl:min-h-0 xl:overflow-y-auto">
                <BalancesCard balances={balances} />
                <HolidaysCard />
                <MyRequests leave={myLeave} compOff={myCompOff} onChanged={reload} onReply={setReply} onToast={onToast} />
              </div>
            </div>
          )}
          {tab === "requests" && <RequestsTab refreshKey={refreshKey} onReview={setReview} onChanged={reload} onToast={onToast} />}
          {tab === "policies" && <PoliciesTab types={types} canManage={canManage} />}
        </div>

        {dialog === "leave" && (
          <ApplyLeaveDialog
            balances={balances}
            workingDays={settings?.workingDays ?? [1, 2, 3, 4, 5]}
            halfDayAllowed={settings?.allowHalfDayLeave ?? false}
            employees={onBehalf ? employees : null}
            initialDate={pickedDate ?? undefined}
            onClose={() => {
              setDialog(null);
              setPickedDate(null);
            }}
            onDone={done}
          />
        )}
        {dialog === "compOff" && <CompOffDialog employees={onBehalf ? employees : null} onClose={() => setDialog(null)} onDone={done} />}
        {review && <ReviewDialog target={review} onClose={() => setReview(null)} onDone={done} />}
        {reply && <ReplyDialog target={reply} onClose={() => setReply(null)} onDone={done} />}
      </div>
    </LocalizationProvider>
  );
}
