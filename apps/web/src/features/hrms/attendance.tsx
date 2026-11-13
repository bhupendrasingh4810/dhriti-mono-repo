"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";

import { buildAttendanceRange, formatWorkMinutes, type AttendanceDay, type AttendanceStatus } from "./attendance-data";
import {
  Pagination,
  RegularizationDetailDialog,
  RegularizationDialog,
  RegularizationList,
  type RegularizationInput,
} from "./attendance-regularization";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import { useAppSettingsState } from "@/features/settings/use-app-settings";
import { hrmsService, type HrmsAttendanceRecord, type HrmsAttendanceRegularization } from "@/services/hrms.service";
import { DateField, DateRangeField } from "./components/date-fields";
import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

type RangeMode = "week" | "month" | "custom";
type SortField = "date" | "workMinutes" | "status";

const logTab = "Attendance log" as const;
const requestsTab = "Regularization requests" as const;
const tone: Record<AttendanceStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  Present: "success",
  Late: "warning",
  Absent: "danger",
  Working: "info",
  "Not clocked in": "neutral",
  "Half day": "warning",
  "Work from home": "info",
  "On leave": "info",
  Holiday: "neutral",
  "Weekly off": "neutral",
  Upcoming: "neutral",
};

/**
 * HRMS attendance: a date-range attendance log and the regularization request list.
 * The clock in/out controls live in the Home welcome card. Records and regularization requests come from the
 * HRMS attendance API; managers (hrms.attendance.manage) also get a Regularization requests tab where a View dialog
 * approves or rejects with a reason; approving updates the attendance record, so the log is reloaded after each decision.
 * Days with a request show a status badge (opening the request details) instead of a Regularize button.
 */
export function HrmsAttendance({ onToast }: { onToast: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const { can } = usePermissions();
  const canApprove = can("hrms.attendance.manage");
  const tabs = canApprove ? [logTab, requestsTab] : [logTab];
  const workingDays = useAppSettingsState("hrms").data?.workingDays;
  // The active tab lives in the `?tab=` URL param so a refresh or shared link keeps it.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") === "requests" && canApprove ? requestsTab : logTab;
  const setTab = (next: typeof tab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next === requestsTab) params.set("tab", "requests");
    else params.delete("tab");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const [mode, setMode] = useState<RangeMode>("week");
  const [anchor, setAnchor] = useState<Dayjs>(() => dayjs());
  const [from, setFrom] = useState<Dayjs>(() => dayjs().subtract(13, "day"));
  const [to, setTo] = useState<Dayjs>(() => dayjs());
  const [sortBy, setSortBy] = useState<SortField>("date");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [target, setTarget] = useState<AttendanceDay | null>(null);
  const [records, setRecords] = useState<HrmsAttendanceRecord[]>([]);
  const [requests, setRequests] = useState<HrmsAttendanceRegularization[]>([]);
  const [viewing, setViewing] = useState<HrmsAttendanceRegularization | null>(null);
  const [approvals, setApprovals] = useState<HrmsAttendanceRegularization[]>([]);
  const [loadError, setLoadError] = useState("");
  const [joinDate, setJoinDate] = useState<Dayjs | null>(null);
  const today = dayjs().startOf("day");

  useEffect(() => {
    if (!organizationId) return;
    hrmsService.employees
      .myStartDate(organizationId)
      .then(({ startDate }) => setJoinDate(startDate ? dayjs(startDate).startOf("day") : null))
      .catch(() => setJoinDate(null));
  }, [organizationId]);

  const [start, end] = useMemo<[Dayjs, Dayjs]>(() => {
    // The log never starts before the joining date or runs past today.
    const clamp = (a: Dayjs, b: Dayjs): [Dayjs, Dayjs] => {
      const lo = joinDate && a.isBefore(joinDate) ? joinDate : a;
      const hi = b.isAfter(today) ? today : b;
      return [lo, hi.isBefore(lo) ? lo : hi];
    };
    if (mode === "week") return clamp(anchor.startOf("week"), anchor.endOf("week"));
    if (mode === "month") return clamp(anchor.startOf("month"), anchor.endOf("month"));
    return clamp(from, to.isBefore(from) ? from : to);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `today` is stable for the day
  }, [mode, anchor, from, to, joinDate]);

  const reloadRecords = useCallback(async () => {
    if (!organizationId) return;
    try {
      setRecords(
        await hrmsService.attendanceSelf.records(organizationId, {
          from: start.format("YYYY-MM-DD"),
          to: end.format("YYYY-MM-DD"),
        }),
      );
      setLoadError("");
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Unable to load attendance.");
    }
  }, [organizationId, start, end]);
  const reloadRequests = useCallback(async () => {
    if (!organizationId) return;
    try {
      setRequests(await hrmsService.attendanceSelf.myRegularizations(organizationId));
      if (canApprove) setApprovals(await hrmsService.attendanceSelf.regularizations(organizationId));
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Unable to load regularizations.");
    }
  }, [organizationId, canApprove]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on range change
    void reloadRecords();
  }, [reloadRecords]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on mount
    void reloadRequests();
  }, [reloadRequests]);

  const rows = useMemo(() => {
    const days = buildAttendanceRange(start, end, records, workingDays ?? [1, 2, 3, 4, 5]);
    const direction = order === "asc" ? 1 : -1;
    return days.sort((a, b) => {
      if (sortBy === "workMinutes") return direction * (a.workMinutes - b.workMinutes);
      if (sortBy === "status") return direction * a.status.localeCompare(b.status);
      return direction * (a.date.valueOf() - b.date.valueOf());
    });
  }, [start, end, records, workingDays, sortBy, order]);

  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);
  const first = rows.length ? (current - 1) * pageSize + 1 : 0;

  const toggleSort = (field: SortField) => {
    if (sortBy === field) setOrder((value) => (value === "asc" ? "desc" : "asc"));
    else {
      setSortBy(field);
      setOrder("asc");
    }
    setPage(1);
  };
  const unit = mode === "week" ? "week" : "month";
  const canPrev = !joinDate || anchor.startOf(unit).isAfter(joinDate);
  const canNext = anchor.endOf(unit).isBefore(today);
  const shift = (direction: 1 | -1) => {
    if (direction === 1 ? !canNext : !canPrev) return;
    setAnchor((value) => value.add(direction, unit));
    setPage(1);
  };
  const label = mode === "month" ? start.format("MMMM YYYY") : `${start.format("D MMM")} – ${end.format("D MMM YYYY")}`;

  const exportCsv = () => {
    const lines = [
      ["Date", "Clock in", "Clock out", "Work hours", "Status"],
      ...rows.map((row) => [row.key, row.clockIn, row.clockOut, formatWorkMinutes(row.workMinutes), row.status]),
    ];
    const url = URL.createObjectURL(new Blob([lines.map((line) => line.join(",")).join("\n")], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-${start.format("YYYYMMDD")}-${end.format("YYYYMMDD")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const submitRequest = async (input: RegularizationInput) => {
    if (!target || !organizationId) return;
    await hrmsService.attendanceSelf.createRegularization(organizationId, { ...input, date: target.key });
    setTarget(null);
    onToast("Regularization request submitted.");
    await reloadRequests();
  };

  // Throws on failure so the detail dialog can show the error and stay open.
  const decide = async (
    request: HrmsAttendanceRegularization,
    status: "APPROVED" | "REJECTED",
    decisionNote: string,
  ) => {
    if (!organizationId) return;
    await hrmsService.attendanceSelf.decideRegularization(organizationId, request.id, { status, decisionNote });
    onToast(status === "APPROVED" ? "Request approved; attendance updated." : "Request rejected.");
    await Promise.all([reloadRequests(), reloadRecords()]);
  };

  // Latest own request per day (lists arrive newest first).
  const requestByDay = new Map<string, HrmsAttendanceRegularization>();
  for (const request of requests) {
    const key = request.date.slice(0, 10);
    if (!requestByDay.has(key)) requestByDay.set(key, request);
  }

  const headings: { label: string; field?: SortField }[] = [
    { label: "Date", field: "date" },
    { label: "Clock in" },
    { label: "Clock out" },
    { label: "Work hours", field: "workMinutes" },
    { label: "Status", field: "status" },
    { label: "" },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div className="flex h-full min-h-0 flex-col">
        {tabs.length > 1 && (
          <div className="mb-5 flex shrink-0 gap-1 overflow-x-auto border-b border-border">
            {tabs.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setTab(item)}
                className={`cursor-pointer whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold ${
                  tab === item
                    ? "border-brand text-brand"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {loadError && (
          <p role="alert" className="mb-3 text-sm text-error">
            {loadError}
          </p>
        )}
        {tab === requestsTab ? (
          <RegularizationList
            requests={approvals}
            title="Regularization requests"
            subtitle="Open a request to review the attendance and approve or reject it with a reason"
            onDecide={decide}
          />
        ) : (
          <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <CardTitle
              title="Attendance log"
              subtitle={label}
              action={
                <Button variant="secondary" icon="download" onClick={exportCsv}>
                  Export
                </Button>
              }
            />
            <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-3">
              <div className="inline-flex rounded-md border border-border p-0.5" role="group" aria-label="Range">
                {(["week", "month", "custom"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setMode(item);
                      setPage(1);
                    }}
                    className={`cursor-pointer rounded px-3 py-1.5 text-sm font-semibold capitalize ${
                      mode === item ? "bg-brand text-white" : "text-text-secondary hover:bg-surface-raised"
                    }`}
                  >
                    {item === "custom" ? "Date range" : item}
                  </button>
                ))}
              </div>
              {mode === "custom" ? (
                <DateRangeField
                  label="Date range"
                  from={start}
                  to={end}
                  minDate={joinDate ?? undefined}
                  maxDate={today}
                  onChange={(nextFrom, nextTo) => {
                    setFrom(nextFrom);
                    setTo(nextTo);
                    setPage(1);
                  }}
                />
              ) : (
                <>
                  <button
                    type="button"
                    aria-label="Previous"
                    disabled={!canPrev}
                    onClick={() => shift(-1)}
                    className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="chevron" size={18} className="rotate-180" />
                  </button>
                  <DateField
                    label={mode === "week" ? "Any day in week" : "Any day in month"}
                    value={anchor}
                    minDate={joinDate ?? undefined}
                    maxDate={today}
                    onChange={(value) => {
                      setAnchor(value);
                      setPage(1);
                    }}
                  />
                  <button
                    type="button"
                    aria-label="Next"
                    disabled={!canNext}
                    onClick={() => shift(1)}
                    className="cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Icon name="chevron" size={18} />
                  </button>
                </>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[720px] text-left">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr className="bg-slate-50">
                    {headings.map(({ label: heading, field }) => (
                      <th
                        key={heading || "actions"}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                      >
                        {field ? (
                          <button
                            type="button"
                            onClick={() => toggleSort(field)}
                            className="inline-flex cursor-pointer items-center gap-1 uppercase"
                            aria-label={`Sort by ${heading}`}
                          >
                            {heading} <Icon name="sort" size={14} />
                          </button>
                        ) : (
                          heading
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((row) => {
                    const request = requestByDay.get(row.key);
                    const canRegularize =
                      request?.status !== "PENDING" &&
                      request?.status !== "APPROVED" &&
                      !["Weekly off", "Upcoming", "Holiday", "On leave", "Not clocked in", "Working"].includes(
                        row.status,
                      );
                    return (
                      <tr key={row.key} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-sm font-semibold">{row.date.format("ddd, D MMM YYYY")}</td>
                        <td className="px-5 py-4 text-sm">{row.clockIn}</td>
                        <td className="px-5 py-4 text-sm">{row.clockOut}</td>
                        <td className="px-5 py-4 text-sm">{formatWorkMinutes(row.workMinutes)}</td>
                        <td className="px-5 py-4">
                          <Badge tone={tone[row.status]}>{row.status}</Badge>
                        </td>
                        <td className="space-x-3 px-5 py-4 text-right">
                          {request && (
                            <button
                              type="button"
                              onClick={() => setViewing(request)}
                              title="View regularization details"
                              className="cursor-pointer"
                            >
                              <Badge
                                tone={
                                  request.status === "APPROVED"
                                    ? "success"
                                    : request.status === "PENDING"
                                      ? "warning"
                                      : "danger"
                                }
                              >
                                {request.status === "APPROVED"
                                  ? "Regularized"
                                  : request.status === "PENDING"
                                    ? "Regularization pending"
                                    : "Regularization rejected"}
                              </Badge>
                            </button>
                          )}
                          {canRegularize && (
                            <button
                              type="button"
                              onClick={() => setTarget(row)}
                              className="cursor-pointer text-sm font-semibold text-brand hover:underline"
                            >
                              Regularize
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              pageSize={pageSize}
              onPageSize={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              range={`${first}–${Math.min(current * pageSize, rows.length)} of ${rows.length}`}
              canPrev={current > 1}
              canNext={current < pages}
              onPrev={() => setPage(current - 1)}
              onNext={() => setPage(current + 1)}
            />
          </Card>
        )}
        {viewing && <RegularizationDetailDialog request={viewing} onClose={() => setViewing(null)} />}
        {target && <RegularizationDialog date={target.date} onClose={() => setTarget(null)} onSubmit={submitRequest} />}
      </div>
    </LocalizationProvider>
  );
}
