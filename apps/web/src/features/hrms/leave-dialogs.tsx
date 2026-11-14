"use client";

import dayjs, { type Dayjs } from "dayjs";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import {
  hrmsService,
  type HrmsCompOffRequest,
  type HrmsEmployee,
  type HrmsLeaveBalance,
  type HrmsLeaveCenterRequest,
  type HrmsRequestStatus,
} from "@/services/hrms.service";
import { filesService } from "@/services/files.service";
import { DateField } from "./components/date-fields";
import { Avatar, Badge, Button, Icon } from "./components/ui-primitives";

export const errorText = (error: unknown) => (error instanceof Error ? error.message : "Unable to complete this request.");

export const statusLabels: Record<HrmsRequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  WITHDRAWN: "Withdrawn",
  NEEDS_INFO: "Needs info",
};
export const statusTones: Record<HrmsRequestStatus, "success" | "warning" | "danger" | "info" | "neutral"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  CANCELLED: "neutral",
  WITHDRAWN: "neutral",
  NEEDS_INFO: "info",
};
export function StatusBadge({ status }: { status: HrmsRequestStatus }) {
  return <Badge tone={statusTones[status]}>{statusLabels[status]}</Badge>;
}

const inputClass = (invalid: boolean) =>
  `mt-1 w-full rounded-md border bg-surface px-3 py-2.5 text-sm text-text-primary outline-none focus:border-brand ${
    invalid ? "border-error focus:border-error" : "border-border"
  }`;

export function Modal({ title, label, onClose, children, wide = false }: { title: ReactNode; label: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`max-h-[90vh] w-full space-y-4 overflow-y-auto rounded-xl border border-border bg-surface p-5 shadow-xl ${wide ? "max-w-xl" : "max-w-md"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-base font-bold text-text-primary">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="shrink-0 cursor-pointer rounded-md p-1 text-text-muted hover:bg-surface-raised hover:text-text-primary">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function EmployeePicker({
  employees,
  value,
  onChange,
}: {
  employees: HrmsEmployee[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-text-secondary">
      Apply for
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${inputClass(false)} cursor-pointer`}>
        <option value="">Myself</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.user.name} ({employee.employeeNumber})
          </option>
        ))}
      </select>
    </label>
  );
}

/** Working days (per the HRMS working-week setting) in the inclusive range; half-day counts 0.5 on a single day. */
export function countLeaveDays(from: Dayjs, to: Dayjs, workingDays: number[], halfDay: boolean) {
  if (to.isBefore(from, "day")) return 0;
  if (halfDay && from.isSame(to, "day")) return 0.5;
  let total = 0;
  for (let day = from; !day.isAfter(to, "day"); day = day.add(1, "day")) {
    if (workingDays.includes(day.day() === 0 ? 7 : day.day())) total += 1;
  }
  return total;
}

/** Right-hand drawer shell shared by the apply-leave and comp-off forms. */
function Drawer({ title, subtitle, label, onClose, footer, children }: { title: string; subtitle: string; label: string; onClose: () => void; footer: ReactNode; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30" onClick={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(event) => event.stopPropagation()}
        className="ml-auto flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-bold">{title}</h2>
            <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="cursor-pointer rounded-md p-2 text-text-muted hover:bg-slate-100">
            <Icon name="close" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-6">{children}</div>
        <div className="flex justify-end gap-2 border-t border-border bg-slate-50 px-6 py-4">{footer}</div>
      </aside>
    </div>
  );
}

const ATTACHMENT_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const ATTACHMENT_MAX_BYTES = 2 * 1024 * 1024;

/** Optional supporting document picker (PDF/JPG/PNG up to 10 MB); upload happens on submit. */
function AttachmentPicker({ file, error, onChange }: { file: File | null; error: string; onChange: (file: File | null) => void }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold">
        Attachment <span className="font-normal text-text-muted">(optional)</span>
      </p>
      <label className={`flex w-full cursor-pointer flex-col items-center rounded-md border border-dashed p-6 text-center hover:border-brand ${error ? "border-error" : "border-border"}`}>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="sr-only"
          onChange={(event) => {
            onChange(event.target.files?.[0] ?? null);
            event.target.value = "";
          }}
        />
        <Icon name="file" className="text-brand" />
        <span className="mt-2 text-sm font-semibold">{file ? file.name : "Upload supporting document"}</span>
        <span className="mt-1 text-xs text-text-muted">{file ? `${(file.size / 1024).toFixed(0)} KB · click to replace` : "PDF, JPG or PNG · Maximum 2 MB"}</span>
      </label>
      {file && (
        <button type="button" onClick={() => onChange(null)} className="mt-1.5 cursor-pointer text-xs font-semibold text-error hover:underline">
          Remove file
        </button>
      )}
      {error && <p className="mt-1 text-xs text-error">{error}</p>}
    </div>
  );
}

function checkAttachment(file: File) {
  if (!ATTACHMENT_TYPES.includes(file.type)) return "Only PDF, JPG or PNG files are allowed.";
  if (file.size > ATTACHMENT_MAX_BYTES) return "File must be 2 MB or smaller.";
  return "";
}

/** Right-hand drawer for applying leave; the optional employee picker appears only when on-behalf filing is enabled. */
export function ApplyLeaveDialog({
  balances,
  workingDays,
  halfDayAllowed,
  employees,
  initialDate,
  onClose,
  onDone,
}: {
  balances: HrmsLeaveBalance[];
  workingDays: number[];
  halfDayAllowed: boolean;
  employees: HrmsEmployee[] | null;
  /** Prefills From/To, e.g. when opened by double-clicking a calendar day. */
  initialDate?: Dayjs;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [typeId, setTypeId] = useState("");
  const [from, setFrom] = useState<Dayjs>(() => initialDate ?? dayjs());
  const [to, setTo] = useState<Dayjs>(() => initialDate ?? dayjs());
  const [halfDay, setHalfDay] = useState(false);
  const [reason, setReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [attempted, setAttempted] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const pickFile = (next: File | null) => {
    setFileError(next ? checkAttachment(next) : "");
    setFile(next);
  };
  const selected = balances.find((balance) => balance.typeId === typeId);
  const sameDay = from.isSame(to, "day");
  const canHalfDay = halfDayAllowed && !!selected?.allowHalfDay && sameDay;
  const days = useMemo(
    () => countLeaveDays(from, to, workingDays, canHalfDay && halfDay),
    [from, to, workingDays, canHalfDay, halfDay],
  );
  const rangeInvalid = to.isBefore(from, "day") || days <= 0;

  const submit = async () => {
    setAttempted(true);
    if (!typeId || !reason.trim() || rangeInvalid || fileError || !organizationId) return;
    setSaving(true);
    setApiError("");
    try {
      const uploaded = file ? await filesService.upload(organizationId, file) : null;
      await hrmsService.leave.apply(
        organizationId,
        { attachmentFileId: uploaded?.id, leaveTypeId: typeId, startDate: from.format("YYYY-MM-DD"), endDate: to.format("YYYY-MM-DD"), totalDays: days, reason: reason.trim(), employeeId: employeeId || undefined },
        !!employeeId,
      );
      onDone("Leave request submitted for approval");
    } catch (error) {
      setApiError(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Apply for leave"
      subtitle="Your manager will receive this request"
      label="Apply for leave"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={saving}>{saving ? "Submitting…" : "Submit request"}</Button>
        </>
      }
    >
          {employees && <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} />}
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Leave type <span className="text-error">*</span>
            </span>
            <select
              value={typeId}
              onChange={(event) => {
                setTypeId(event.target.value);
                setHalfDay(false);
              }}
              className={`w-full cursor-pointer rounded-md border bg-surface px-3 py-2.5 text-sm ${attempted && !typeId ? "border-error" : "border-border"}`}
            >
              <option value="">Select leave type</option>
              {balances
                .filter((balance) => !balance.isCompOff || (balance.available ?? 0) > 0)
                .map((balance) => (
                  <option key={balance.typeId} value={balance.typeId}>
                    {balance.name}
                    {balance.available === null ? "" : ` · ${balance.available} days`}
                  </option>
                ))}
            </select>
            {attempted && !typeId && <p className="mt-1 text-xs text-error">Select a leave type.</p>}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <DateField
              labelOutside
              label="From date"
              value={from}
              onChange={(value) => {
                setFrom(value);
                if (to.isBefore(value, "day")) setTo(value);
              }}
            />
            <DateField labelOutside label="To date" value={to} minDate={from} onChange={setTo} />
          </div>
          {attempted && rangeInvalid && <p className="-mt-3 text-xs text-error">Choose a valid range that includes at least one working day.</p>}
          <label className={`flex items-center gap-3 rounded-md border border-border p-3 ${canHalfDay ? "cursor-pointer" : "opacity-50"}`}>
            <input type="checkbox" disabled={!canHalfDay} checked={canHalfDay && halfDay} onChange={(event) => setHalfDay(event.target.checked)} />
            <span>
              <span className="block text-sm font-semibold">Half day</span>
              <span className="block text-xs text-text-muted">
                {canHalfDay ? "Apply for the first or second half only" : "Available for a single day on leave types that allow it"}
              </span>
            </span>
          </label>
          <p className="text-sm text-text-secondary">
            Total: <span className="font-semibold text-text-primary">{days} day(s)</span>
          </p>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold">
              Reason <span className="text-error">*</span>
            </span>
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Tell your approver why you need time off"
              className={`w-full resize-none rounded-md border bg-surface px-3 py-2.5 text-sm outline-none focus:border-brand ${attempted && !reason.trim() ? "border-error focus:border-error" : "border-border"}`}
            />
            {attempted && !reason.trim() && <p className="mt-1 text-xs text-error">Add a reason for your request.</p>}
          </label>
          <AttachmentPicker file={file} error={fileError} onChange={pickFile} />
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Approval chain</p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar initials="HR" index={1} size="sm" />
              <span className="text-sm font-semibold">HR / Admin</span>
            </div>
          </div>
          {apiError && <p role="alert" className="text-sm text-error">{apiError}</p>}
    </Drawer>
  );
}

/** Comp-off request for one or more days worked (from/to); credit is chosen in half-day steps up to the days worked. */
export function CompOffDialog({ employees, onClose, onDone }: { employees: HrmsEmployee[] | null; onClose: () => void; onDone: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [from, setFrom] = useState<Dayjs>(() => dayjs());
  const [to, setTo] = useState<Dayjs>(() => dayjs());
  const [days, setDays] = useState("1");
  const [reason, setReason] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState("");
  const [saving, setSaving] = useState(false);
  const span = Math.max(1, to.startOf("day").diff(from.startOf("day"), "day") + 1);
  const options = Array.from({ length: Math.min(span, 31) * 2 }, (_, index) => String((index + 1) / 2));
  const credit = options.includes(days) ? days : String(span);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (to.isBefore(from, "day")) next.to = "End date cannot be before start date.";
    if (!reason.trim()) next.reason = "Tell us why you worked on these days.";
    setErrors(next);
    if (Object.keys(next).length || !organizationId) return;
    setSaving(true);
    setApiError("");
    try {
      await hrmsService.leave.applyCompOff(
        organizationId,
        {
          workedDate: from.format("YYYY-MM-DD"),
          workedEndDate: to.isSame(from, "day") ? undefined : to.format("YYYY-MM-DD"),
          days: Number(credit),
          reason: reason.trim(),
          employeeId: employeeId || undefined,
        },
        !!employeeId,
      );
      onDone("Comp-off request submitted.");
    } catch (error) {
      setApiError(errorText(error));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      title="Request comp off"
      subtitle="Earn leave credit for days you worked on a day off"
      label="Request comp off"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => void submit()} disabled={saving}>{saving ? "Submitting…" : "Submit request"}</Button>
        </>
      }
    >
        {employees && <EmployeePicker employees={employees} value={employeeId} onChange={setEmployeeId} />}
        <div className="grid grid-cols-2 gap-4">
          <DateField labelOutside label="From date" value={from} maxDate={dayjs()} onChange={(value) => { setFrom(value); if (to.isBefore(value, "day")) setTo(value); setDays(String(1)); }} />
          <DateField labelOutside label="To date" value={to} minDate={from} maxDate={dayjs()} onChange={(value) => { setTo(value); setDays("1"); }} />
        </div>
        {errors.to && <p className="text-xs text-error">{errors.to}</p>}
        <label className="block text-sm font-medium text-text-secondary">
          Credit requested
          <select value={credit} onChange={(e) => setDays(e.target.value)} className={`${inputClass(false)} cursor-pointer`}>
            {options.map((value) => (
              <option key={value} value={value}>{value} day(s)</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-text-secondary">
          Reason <span className="text-error">*</span>
          <textarea rows={3} value={reason} aria-invalid={!!errors.reason} onChange={(e) => { setReason(e.target.value); setErrors((c) => ({ ...c, reason: "" })); }} className={inputClass(!!errors.reason)} />
          {errors.reason && <p className="mt-1 text-xs text-error">{errors.reason}</p>}
        </label>
        {apiError && <p role="alert" className="text-sm text-error">{apiError}</p>}
    </Drawer>
  );
}

export type ReviewTarget = { kind: "leave"; request: HrmsLeaveCenterRequest } | { kind: "compOff"; request: HrmsCompOffRequest };

/** Opens a short-lived presigned download URL for a leave attachment. */
function AttachmentLink({ fileId, name }: { fileId: string; name: string | null }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [error, setError] = useState("");
  const open = async () => {
    if (!organizationId) return;
    try {
      const { url } = await filesService.download(organizationId, fileId);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (reason) {
      setError(errorText(reason));
    }
  };
  return (
    <span>
      <button type="button" onClick={() => void open()} className="cursor-pointer font-semibold text-brand hover:underline">
        {name ?? "Download"}
      </button>
      {error && <span className="block text-xs text-error">{error}</span>}
    </span>
  );
}

/** HR/admin dialog: full request details plus approve, reject (reason required) or "request more info" with a note. */
export function ReviewDialog({ target, onClose, onDone }: { target: ReviewTarget; onClose: () => void; onDone: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const { request } = target;
  const open = request.status === "PENDING" || request.status === "NEEDS_INFO";
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [noteError, setNoteError] = useState("");

  const run = async (action: "APPROVED" | "REJECTED" | "INFO") => {
    if (!organizationId) return;
    if (action !== "APPROVED" && !note.trim()) {
      setNoteError(action === "INFO" ? "Write what information you need." : "A reason is required to reject.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (target.kind === "leave") {
        if (action === "INFO") await hrmsService.leave.requestInfo(organizationId, request.id, note.trim());
        else await hrmsService.leave.decide(organizationId, request.id, action, note.trim() || undefined);
      } else if (action === "INFO") await hrmsService.leave.requestCompOffInfo(organizationId, request.id, note.trim());
      else await hrmsService.leave.decideCompOff(organizationId, request.id, action, note.trim() || undefined);
      onDone(action === "INFO" ? "Information requested." : `Request ${action.toLowerCase()}.`);
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };

  const row = (label: string, value: ReactNode) => (
    <div className="flex justify-between gap-4 text-sm">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium text-text-primary">{value}</dd>
    </div>
  );
  const range = (start: string, end: string) =>
    start === end ? dayjs(start.slice(0, 10)).format("D MMM YYYY") : `${dayjs(start.slice(0, 10)).format("D MMM")} – ${dayjs(end.slice(0, 10)).format("D MMM YYYY")}`;

  return (
    <Modal
      wide
      label="Request details"
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          {request.employee?.user.name} · {target.kind === "leave" ? "Leave" : "Comp off"} <StatusBadge status={request.status} />
        </span>
      }
    >
      <dl className="space-y-1.5 rounded-md border border-border p-3">
        {target.kind === "leave" ? (
          <>
            {row("Type", target.request.type?.name ?? "—")}
            {row("Dates", range(target.request.startDate, target.request.endDate))}
            {row("Days", target.request.totalDays)}
            {row("Reason", target.request.reason ?? "—")}
            {target.request.rejectionReason && row("Rejection reason", target.request.rejectionReason)}
            {target.request.attachmentFileId && row("Attachment", <AttachmentLink fileId={target.request.attachmentFileId} name={target.request.attachmentName} />)}
          </>
        ) : (
          <>
            {row("Days worked", range(target.request.workedDate, target.request.workedEndDate ?? target.request.workedDate))}
            {row("Credit requested", `${target.request.days} day(s)`)}
            {row("Reason", target.request.reason ?? "—")}
            {target.request.decisionReason && row("Decision note", target.request.decisionReason)}
          </>
        )}
        {request.moreInfoNote && row("Info requested", request.moreInfoNote)}
        {request.moreInfoReply && row("Employee reply", request.moreInfoReply)}
      </dl>
      {open && (
        <>
          <label className="block text-sm font-medium text-text-secondary">
            Note (required to reject or ask for more info)
            <textarea rows={3} value={note} onChange={(e) => { setNote(e.target.value); setNoteError(""); }} className={inputClass(!!noteError)} />
            {noteError && <p className="mt-1 text-xs text-error">{noteError}</p>}
          </label>
          {error && <p role="alert" className="text-sm text-error">{error}</p>}
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" disabled={busy} onClick={() => void run("INFO")}>Request more info</Button>
            <Button variant="danger" disabled={busy} onClick={() => void run("REJECTED")}>Reject</Button>
            <Button disabled={busy} onClick={() => void run("APPROVED")}>Approve</Button>
          </div>
        </>
      )}
    </Modal>
  );
}

/** Employee reply to an info request. */
export function ReplyDialog({ target, onClose, onDone }: { target: ReviewTarget; onClose: () => void; onDone: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reply.trim()) {
      setError("Reply is required.");
      return;
    }
    if (!organizationId) return;
    setBusy(true);
    try {
      if (target.kind === "leave") await hrmsService.leave.reply(organizationId, target.request.id, reply.trim());
      else await hrmsService.leave.replyCompOff(organizationId, target.request.id, reply.trim());
      onDone("Reply sent.");
    } catch (reason) {
      setError(errorText(reason));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="More information requested" label="Reply to information request" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="rounded-md bg-surface-raised p-3 text-sm text-text-primary">{target.request.moreInfoNote}</p>
        <label className="block text-sm font-medium text-text-secondary">
          Your reply
          <textarea rows={3} value={reply} onChange={(e) => { setReply(e.target.value); setError(""); }} className={inputClass(!!error)} />
          {error && <p className="mt-1 text-xs text-error">{error}</p>}
        </label>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <button type="submit" disabled={busy} className="cursor-pointer rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-40">
            Send reply
          </button>
        </div>
      </form>
    </Modal>
  );
}
