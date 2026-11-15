"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsAttendanceRecord } from "@/services/hrms.service";
import { useMyShift } from "@/features/hrms/use-my-shift";
import { formatShiftRange } from "@/features/hrms/shift-format";
import { clockInOpensAt, formatInZone, nearestShiftStart } from "@/features/hrms/shift-window";
import { useAppSettings } from "@/features/settings/use-app-settings";
import type { AttendanceCapturePolicy, AttendanceWorkMode } from "@dhriti/types";
import { DhritiSelectMenu } from "@dhriti/ui";
import { captureSummary, collectAttendanceCapture } from "../attendance-capture";

function formatDuration(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60000));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}h ${String(minutes % 60).padStart(2, "0")}m`;
}

/**
 * Clock in/out and break controls, shown inside the Home welcome card.
 * State comes from the HRMS attendance API (`organization/hrms/attendance/me/*`); the server owns the record,
 * so a refresh or another device shows the same session. Users without an employee record see the error and no controls.
 */
export function AttendanceClockPanel({ onToast }: { onToast?: (message: string) => void }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const { shift, loading: shiftLoading } = useMyShift();
  const shiftLabel = shiftLoading ? "Shift: …" : shift ? `Shift: ${shift.name} · ${formatShiftRange(shift)} (${shift.timeZone})` : "No shift assigned";
  const rules = useAppSettings("hrms");
  const [now, setNow] = useState<number | null>(null);
  const [attendance, setAttendance] = useState<{
    organizationId: string;
    record: HrmsAttendanceRecord | null;
    capturePolicy: AttendanceCapturePolicy | null;
  } | null>(null);
  const record = attendance?.organizationId === organizationId ? attendance?.record ?? null : null;
  const capturePolicy = attendance?.organizationId === organizationId ? attendance?.capturePolicy ?? null : null;
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [workMode, setWorkMode] = useState<AttendanceWorkMode>("OFFICE");
  const [modeOpen, setModeOpen] = useState(false);

  // Time is set after mount so server and client markup match (avoids hydration mismatch).
  useEffect(() => {
    const tick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearTimeout(tick);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    hrmsService.attendanceSelf
      .today(organizationId, dayjs().format("YYYY-MM-DD"))
      .then((result) => {
        if (!cancelled) {
          setAttendance({ organizationId, record: result.record, capturePolicy: result.capturePolicy });
        }
      })
      .catch((reason) => !cancelled && setError(reason instanceof Error ? reason.message : "Unable to load attendance."))
      .finally(() => !cancelled && setReady(true));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const clockInAt = record?.checkIn && !record.checkOut ? new Date(record.checkIn).getTime() : null;
  const completed = Boolean(record?.checkOut);
  const breakStartedAt = record?.breakStartedAt ? new Date(record.breakStartedAt).getTime() : null;
  const onBreak = clockInAt !== null && breakStartedAt !== null;
  const current = now ?? 0;
  const totalBreak = (record?.breakMinutes ?? 0) * 60000 + (onBreak && now ? current - breakStartedAt : 0);
  const worked = completed
    ? (record?.workHours ?? 0) * 3600000
    : clockInAt && now
      ? current - clockInAt - totalBreak
      : 0;
  const status = completed ? "Day complete" : !clockInAt ? "Clocked out" : onBreak ? "On break" : "Working";
  const time = now === null ? null : new Date(now);
  const shownIn = record?.checkIn ? new Date(record.checkIn) : null;

  // Clock-in opens `attendanceClockInWindowMinutes` before the shift; the API enforces the same rule.
  const opensAt = shift && rules && now !== null ? clockInOpensAt(nearestShiftStart(shift, now), rules) : null;
  const notOpenYet = opensAt !== null && now !== null && now < opensAt;

  const run = async (action: (id: string) => Promise<HrmsAttendanceRecord>, message?: string) => {
    if (!organizationId || busy) return;
    setBusy(true);
    setError("");
    try {
      const updated = await action(organizationId);
      setAttendance((current) => ({
        organizationId,
        record: updated,
        capturePolicy: current?.organizationId === organizationId ? current.capturePolicy : null,
      }));
      if (message) onToast?.(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };
  const effectiveMode = clockInAt && record?.checkInCapture ? record.checkInCapture.mode : workMode;
  const punch = (out: boolean) => run(async (id) => {
    // Re-read policy immediately before capture; a stale page must not silently skip a newly enabled requirement.
    const latest = await hrmsService.attendanceSelf.today(id, dayjs().format("YYYY-MM-DD"));
    setAttendance({ organizationId: id, record: latest.record, capturePolicy: latest.capturePolicy });
    const capture = await collectAttendanceCapture(effectiveMode, latest.capturePolicy.enabled);
    return out
      ? hrmsService.attendanceSelf.clockOut(id, capture)
      : hrmsService.attendanceSelf.clockIn(id, dayjs().format("YYYY-MM-DD"), capture);
  }, out ? "Clocked out" : "Clocked in");
  const clockIn = () => punch(false);
  const clockOut = () => punch(true);
  const toggleBreak = () =>
    run((id) => (onBreak ? hrmsService.attendanceSelf.endBreak(id) : hrmsService.attendanceSelf.startBreak(id)));

  return (
    <section
      aria-label="Attendance"
      className="flex w-full shrink-0 flex-col justify-between gap-4 bg-brand p-5 text-text-inverse lg:w-[520px]"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest opacity-80">
            {time ? time.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" }) : "\u00a0"}
          </p>
          <p className="mt-1 font-display text-3xl font-bold tabular-nums">
            {time ? time.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "--:--:--"}
          </p>
        </div>
        <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-semibold text-brand">{status}</span>
      </div>
      <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-3 text-sm">
        <div>
          <p className="text-xs opacity-80">Clock in</p>
          <p className="font-semibold">
            {shownIn ? shownIn.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs opacity-80">Work hours</p>
          <p className="font-semibold tabular-nums">{formatDuration(worked)}</p>
        </div>
        <div>
          <p className="text-xs opacity-80">Break</p>
          <p className="font-semibold tabular-nums">{Math.floor(totalBreak / 60000)} min</p>
        </div>
      </div>
      {!completed && ready && capturePolicy && (
        <div className="space-y-2 rounded-md bg-surface p-3 text-text-primary">
          <DhritiSelectMenu
            label="Work mode"
            value={effectiveMode}
            options={[{ value: "OFFICE", label: "Office" }, { value: "REMOTE", label: "Remote" }, { value: "FIELD", label: "Field" }]}
            onChange={(value) => {
              if (value === "OFFICE" || value === "REMOTE" || value === "FIELD") setWorkMode(value);
            }}
            disabled={busy || Boolean(clockInAt && record?.checkInCapture)}
            open={modeOpen}
            onOpenChange={setModeOpen}
          />
          <p className="text-xs text-text-muted">
            {capturePolicy.enabled
              ? `GPS required at each punch (accuracy ≤ ${capturePolicy.maxAccuracyMeters} m). Office: ${capturePolicy.workLocation?.name ?? "no assigned location"}${capturePolicy.workLocation?.configured ? "" : " — fence not configured"}. Remote/field: GPS without office fence. Coordinates are retained with attendance.`
              : "GPS enforcement is off. Your work mode and client-reported device/source are recorded; location is not requested."}
          </p>
        </div>
      )}
      {record?.checkInCapture && <p className="text-xs">In: {captureSummary(record.checkInCapture)}</p>}
      {record?.checkOutCapture && <p className="text-xs">Out: {captureSummary(record.checkOutCapture)}</p>}
      {busy && <p role="status" className="text-xs">Processing attendance. Allow location access if prompted.</p>}
      <div className="flex flex-wrap items-center gap-2">
        {clockInAt ? (
          <>
            <button
              type="button"
              onClick={clockOut}
              disabled={busy}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 rounded-md bg-surface px-3.5 py-2 text-sm font-semibold text-brand hover:bg-surface-raised"
            >
              Clock out
            </button>
            <button
              type="button"
              onClick={toggleBreak}
              disabled={busy}
              className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 rounded-md border border-white/40 px-3.5 py-2 text-sm font-semibold hover:bg-white/10"
            >
              {onBreak ? "End break" : "Take a break"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={clockIn}
            disabled={busy || !ready || completed || notOpenYet}
            title={notOpenYet && opensAt ? `Clock in opens at ${formatInZone(opensAt, shift?.timeZone)}` : undefined}
            className="cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 rounded-md bg-surface px-3.5 py-2 text-sm font-semibold text-brand hover:bg-surface-raised"
          >
            Clock in
          </button>
        )}
        <span className="ml-auto text-xs opacity-80">{shiftLabel}</span>
      </div>
      {notOpenYet && opensAt && !clockInAt && (
        <p className="text-xs opacity-90">Clock in opens at {formatInZone(opensAt, shift?.timeZone)}.</p>
      )}
      {error && (
        <p role="alert" className="text-xs font-semibold">
          {error}
        </p>
      )}
    </section>
  );
}

// Placeholder monthly summary until the attendance summary API is wired.
const MONTH_KPIS = [
  { label: "Present", value: "7 days" },
  { label: "Avg. hours", value: "8h 34m" },
  { label: "Late arrivals", value: "1 day" },
  { label: "Overtime", value: "4h 12m" },
];

/** Monthly attendance KPIs, embedded in the Home welcome card. */
export function AttendanceMonthSummary() {
  return (
    <section aria-label="This month" className="rounded-xl bg-surface/80 p-4 shadow-sm ring-1 ring-border">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-text-primary">
          {new Date().toLocaleDateString(undefined, { month: "long" })} attendance
        </h3>
        <span className="rounded-full bg-brand-muted px-2.5 py-0.5 text-xs font-bold text-brand">96.2% rate</span>
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        {MONTH_KPIS.map((item) => (
          <div key={item.label}>
            <p className="font-display text-xl font-bold text-text-primary">{item.value}</p>
            <p className="text-xs text-text-muted">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-surface-raised">
        <div className="h-1.5 rounded-full bg-brand" style={{ width: "96.2%" }} />
      </div>
    </section>
  );
}
