"use client";

import { useState, type FormEvent } from "react";
import dayjs from "dayjs";

import { TimeField } from "./components/date-fields";
import { Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";
import { regularizationStatusLabels, regularizationTypeLabels, regularizationTypes } from "./attendance-data";
import { isOvernightShift } from "./shift-format";
import { useMyShift } from "./use-my-shift";
import type {
  HrmsAttendanceRegularization,
  HrmsRegularizationStatus,
  HrmsRegularizationType,
} from "@/services/hrms.service";

const tone = { PENDING: "warning", APPROVED: "success", REJECTED: "danger" } as const;
const statuses = Object.keys(regularizationStatusLabels) as HrmsRegularizationStatus[];
/** Mirrors the API: these types must state the corrected time(s). */
const requiredTimes: Partial<Record<HrmsRegularizationType, ("in" | "out")[]>> = {
  MISSED_CLOCK_IN: ["in"],
  MISSED_CLOCK_OUT: ["out"],
  LATE_ARRIVAL: ["in"],
};

export interface RegularizationInput {
  type: HrmsRegularizationType;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
}

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-md border bg-surface px-3 py-2 text-sm text-text-primary ${invalid ? "border-error" : "border-border"}`;

/** Raises a regularization request for one attendance day; reason (and the times the type needs) are required. */
export function RegularizationDialog({
  date,
  onClose,
  onSubmit,
}: {
  date: dayjs.Dayjs;
  onClose: () => void;
  onSubmit: (input: RegularizationInput) => Promise<void>;
}) {
  const { shift } = useMyShift();
  const [type, setType] = useState<HrmsRegularizationType>(regularizationTypes[0]);
  // null = untouched, so the field follows the user's shift times until they edit it.
  const [editedIn, setTimeIn] = useState<string | null>(null);
  const [editedOut, setTimeOut] = useState<string | null>(null);
  const timeIn = editedIn ?? shift?.startTime ?? "";
  const timeOut = editedOut ?? shift?.endTime ?? "";
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"in" | "out" | "reason", string>>>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    const required = requiredTimes[type] ?? [];
    if (required.includes("in") && !timeIn) next.in = "Clock-in time is required";
    if (required.includes("out") && !timeOut) next.out = "Clock-out time is required";
    if (!reason.trim()) next.reason = "Reason is required";
    setErrors(next);
    if (Object.keys(next).length) return;

    const at = (time: string, plusDays = 0) => dayjs(`${date.format("YYYY-MM-DD")}T${time}`).add(plusDays, "day");
    const checkIn = timeIn ? at(timeIn) : null;
    // An overnight shift clocks out on the following calendar day.
    const checkOut = timeOut
      ? at(timeOut, shift && isOvernightShift(shift) && (!checkIn || !at(timeOut).isAfter(checkIn)) ? 1 : 0)
      : null;
    if (checkIn && checkOut && !checkOut.isAfter(checkIn)) {
      setErrors({ out: "Clock-out must be after clock-in" });
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      await onSubmit({
        type,
        ...(checkIn ? { requestedCheckIn: checkIn.toISOString() } : {}),
        ...(checkOut ? { requestedCheckOut: checkOut.toISOString() } : {}),
        reason: reason.trim(),
      });
    } catch (reasonError) {
      setFormError(reasonError instanceof Error ? reasonError.message : "Unable to submit the request.");
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-text-primary/40"
      />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-label="Regularize attendance"
        className="relative w-full max-w-md space-y-4 rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-bold text-text-primary">
            Regularize · {date.format("ddd, D MMM YYYY")}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="shrink-0 cursor-pointer rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text-primary"
          >
            <Icon name="close" size={18} />
          </button>
        </div>
        <label className="block text-sm font-medium text-text-secondary">
          Type
          <select
            value={type}
            onChange={(event) => {
              setType(event.target.value as HrmsRegularizationType);
              setErrors({});
            }}
            className={`${inputClass(false)} cursor-pointer`}
          >
            {regularizationTypes.map((item) => (
              <option key={item} value={item}>
                {regularizationTypeLabels[item]}
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(["in", "out"] as const).map((kind) => {
            const required = requiredTimes[type]?.includes(kind);
            const value = kind === "in" ? timeIn : timeOut;
            return (
              <label key={kind} className="block text-sm font-medium text-text-secondary">
                {kind === "in" ? "Clock in" : "Clock out"} {required && <span className="text-error">*</span>}
                <TimeField
                  label={kind === "in" ? "Clock in" : "Clock out"}
                  value={value}
                  invalid={Boolean(errors[kind])}
                  onChange={(next) => {
                    (kind === "in" ? setTimeIn : setTimeOut)(next);
                    setErrors((current) => ({ ...current, [kind]: undefined }));
                  }}
                />
                {errors[kind] && (
                  <span role="alert" className="mt-1 block text-xs text-error">
                    {errors[kind]}
                  </span>
                )}
              </label>
            );
          })}
        </div>
        <label className="block text-sm font-medium text-text-secondary">
          Reason <span className="text-error">*</span>
          <textarea
            value={reason}
            rows={3}
            aria-invalid={Boolean(errors.reason)}
            onChange={(event) => {
              setReason(event.target.value);
              setErrors((current) => ({ ...current, reason: undefined }));
            }}
            className={inputClass(Boolean(errors.reason))}
          />
          {errors.reason && (
            <span role="alert" className="mt-1 block text-xs text-error">
              {errors.reason}
            </span>
          )}
        </label>
        {formError && (
          <p role="alert" className="text-xs text-error">
            {formError}
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Submitting…" : "Submit request"}
          </button>
        </div>
      </form>
    </div>
  );
}

const timeLabel = (value: string | null) => (value ? dayjs(value).format("HH:mm") : "—");

const hoursLabel = (value: unknown) => (value == null || value === "" ? "—" : `${Number(value).toFixed(2)} h`);

/**
 * Read-only view of one request: the day's current attendance beside what was requested, plus the decision.
 * With `onDecide` and a pending request, a reason is required to approve or reject.
 */
export function RegularizationDetailDialog({
  request,
  onClose,
  onDecide,
}: {
  request: HrmsAttendanceRegularization;
  onClose: () => void;
  onDecide?: (status: "APPROVED" | "REJECTED", note: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const record = request.attendanceRecord;
  const canDecide = Boolean(onDecide) && request.status === "PENDING";

  const decide = async (status: "APPROVED" | "REJECTED") => {
    if (!onDecide) return;
    if (!note.trim()) {
      setError("Reason is required");
      return;
    }
    setBusy(true);
    try {
      await onDecide(status, note.trim());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save the decision.");
      setBusy(false);
    }
  };

  const row = (label: string, value: string) => (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-text-primary">{value}</dd>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-pointer bg-text-primary/40"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Regularization details"
        className="relative max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-bold text-text-primary">
            {request.employee.user.name} · {dayjs(request.date.slice(0, 10)).format("ddd, D MMM YYYY")}
          </h2>
          <div className="flex items-center gap-2">
            <Badge tone={tone[request.status]}>{regularizationStatusLabels[request.status]}</Badge>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="shrink-0 cursor-pointer rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text-primary"
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        <section className="space-y-2 rounded-md border border-border p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Current attendance</h3>
          <dl className="space-y-1">
            {row("Clock in", timeLabel(record?.checkIn ?? null))}
            {row("Clock out", timeLabel(record?.checkOut ?? null))}
            {row("Status", record?.status ?? "No record")}
            {row("Work hours", hoursLabel(record?.workHours))}
          </dl>
        </section>
        <section className="space-y-2 rounded-md border border-border p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Requested</h3>
          <dl className="space-y-1">
            {row("Type", regularizationTypeLabels[request.type])}
            {row("Clock in", timeLabel(request.requestedCheckIn))}
            {row("Clock out", timeLabel(request.requestedCheckOut))}
            {row("Submitted", dayjs(request.createdAt).format("D MMM YYYY, HH:mm"))}
          </dl>
          <p className="whitespace-pre-wrap text-sm text-text-secondary">{request.reason}</p>
        </section>
        {request.status !== "PENDING" && (
          <section className="space-y-1 rounded-md border border-border p-3 text-sm">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Decision</h3>
            {request.decidedAt && (
              <p className="text-text-muted">{dayjs(request.decidedAt).format("D MMM YYYY, HH:mm")}</p>
            )}
            <p className="whitespace-pre-wrap text-text-secondary">{request.decisionNote || "No reason recorded."}</p>
          </section>
        )}
        {canDecide && (
          <label className="block text-sm font-medium text-text-secondary">
            Reason <span className="text-error">*</span>
            <textarea
              value={note}
              rows={3}
              aria-invalid={Boolean(error)}
              onChange={(event) => {
                setNote(event.target.value);
                setError("");
              }}
              className={inputClass(Boolean(error))}
            />
            {error && (
              <span role="alert" className="mt-1 block text-xs text-error">
                {error}
              </span>
            )}
          </label>
        )}
        {canDecide && (
          <div className="flex justify-end gap-2">
            <>
              <Button variant="secondary" disabled={busy} onClick={() => decide("REJECTED")}>
                Reject
              </Button>
              <Button disabled={busy} onClick={() => decide("APPROVED")}>
                Approve
              </Button>
            </>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Regularization requests, newest first. With `onDecide` (managers) the list shows the requester and
 * a View action that opens the detail dialog, where pending rows can be approved or rejected with a reason.
 */
export function RegularizationList({
  requests,
  title = "Regularization requests",
  subtitle = "All attendance corrections you have requested",
  onDecide,
}: {
  requests: HrmsAttendanceRegularization[];
  title?: string;
  subtitle?: string;
  onDecide?: (request: HrmsAttendanceRegularization, status: "APPROVED" | "REJECTED", note: string) => Promise<void>;
}) {
  const [status, setStatus] = useState<"" | HrmsRegularizationStatus>("");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState<HrmsAttendanceRegularization | null>(null);

  const rows = requests
    .filter((item) => !status || item.status === status)
    .sort((a, b) => (order === "asc" ? 1 : -1) * a.createdAt.localeCompare(b.createdAt));
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const current = Math.min(page, pages);
  const visible = rows.slice((current - 1) * pageSize, current * pageSize);
  const from = rows.length ? (current - 1) * pageSize + 1 : 0;
  const headings = [...(onDecide ? ["Employee"] : []), "Type", "Requested", "Reason", "Submitted", "Status", ""];

  return (
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <CardTitle
        title={title}
        subtitle={subtitle}
        action={
          <select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as "" | HrmsRegularizationStatus);
              setPage(1);
            }}
            className="cursor-pointer rounded-md border border-border bg-surface px-3 py-2 text-sm"
          >
            <option value="">All statuses</option>
            {statuses.map((item) => (
              <option key={item} value={item}>
                {regularizationStatusLabels[item]}
              </option>
            ))}
          </select>
        }
      />
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-[860px] text-left">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr className="bg-slate-50">
              <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted">Date</th>
              {headings.map((heading, index) => (
                <th
                  key={heading || `actions-${index}`}
                  className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                >
                  {heading === "Submitted" ? (
                    <button
                      type="button"
                      onClick={() => setOrder((value) => (value === "asc" ? "desc" : "asc"))}
                      className="inline-flex cursor-pointer items-center gap-1 uppercase"
                    >
                      Requested at <Icon name="sort" size={14} />
                    </button>
                  ) : (
                    heading
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {visible.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50">
                <td className="px-5 py-4 text-sm font-semibold">
                  {dayjs(item.date.slice(0, 10)).format("ddd, D MMM YYYY")}
                </td>
                {onDecide && <td className="px-5 py-4 text-sm">{item.employee.user.name}</td>}
                <td className="px-5 py-4 text-sm">{regularizationTypeLabels[item.type]}</td>
                <td className="px-5 py-4 text-sm tabular-nums text-text-secondary">
                  {timeLabel(item.requestedCheckIn)} – {timeLabel(item.requestedCheckOut)}
                </td>
                <td className="max-w-xs truncate px-5 py-4 text-sm text-text-secondary" title={item.reason}>
                  {item.reason}
                </td>
                <td className="px-5 py-4 text-sm text-text-secondary">{dayjs(item.createdAt).format("D MMM YYYY, HH:mm")}</td>
                <td className="px-5 py-4" title={item.decisionNote ?? undefined}>
                  <Badge tone={tone[item.status]}>{regularizationStatusLabels[item.status]}</Badge>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      aria-label={`View request for ${dayjs(item.date.slice(0, 10)).format("D MMM YYYY")}`}
                      title="View"
                      onClick={() => setViewing(item)}
                      className="cursor-pointer rounded-md p-2 text-text-primary hover:bg-surface-raised hover:text-brand"
                    >
                      <Icon name="view" size={22} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && (
          <p className="py-14 text-center text-sm text-text-muted">No regularization requests yet.</p>
        )}
      </div>
      {viewing && (
        <RegularizationDetailDialog
          request={viewing}
          onClose={() => setViewing(null)}
          onDecide={
            onDecide
              ? async (status, note) => {
                  await onDecide(viewing, status, note);
                  setViewing(null);
                }
              : undefined
          }
        />
      )}
      <Pagination
        pageSize={pageSize}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
        range={`${from}–${Math.min(current * pageSize, rows.length)} of ${rows.length}`}
        canPrev={current > 1}
        canNext={current < pages}
        onPrev={() => setPage(current - 1)}
        onNext={() => setPage(current + 1)}
      />
    </Card>
  );
}

/** Compact pagination: rows-per-page selector, visible range, previous/next chevrons. */
export function Pagination({
  pageSize,
  onPageSize,
  range,
  canPrev,
  canNext,
  onPrev,
  onNext,
}: {
  pageSize: number;
  onPageSize: (size: number) => void;
  range: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const button =
    "cursor-pointer rounded-md p-1.5 text-text-muted hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-4 border-t border-border p-4 text-sm text-text-secondary">
      <label className="flex items-center gap-2">
        Rows per page:
        <select
          value={pageSize}
          onChange={(event) => onPageSize(Number(event.target.value))}
          className="cursor-pointer border-0 bg-transparent font-semibold text-text-primary outline-none"
        >
          {[10, 20, 50].map((size) => (
            <option key={size}>{size}</option>
          ))}
        </select>
      </label>
      <span>{range}</span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={!canPrev} onClick={onPrev} className={button}>
          <Icon name="chevron" size={18} className="rotate-180" />
        </button>
        <button type="button" aria-label="Next page" disabled={!canNext} onClick={onNext} className={button}>
          <Icon name="chevron" size={18} />
        </button>
      </div>
    </div>
  );
}
