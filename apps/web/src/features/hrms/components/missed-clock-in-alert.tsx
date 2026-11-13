"use client";

import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { useAuth } from "@/hooks/use-auth";
import { hrmsService } from "@/services/hrms.service";
import { useAppSettings } from "@/features/settings/use-app-settings";
import { useMyShift } from "@/features/hrms/use-my-shift";
import { formatShiftRange } from "@/features/hrms/shift-format";
import { isMissedClockIn, nearestShiftStart } from "@/features/hrms/shift-window";

const ALERT_SOUND = "/media/alert.mp3";
const POLL_MS = 60_000;

/**
 * Workspace-wide alert shown when an employee has not clocked in `missedClockInAlertMinutes` after their shift
 * starts (HRMS settings). The sound replays every `missedClockInAlertRepeatSeconds` until the user dismisses the
 * alert or clocks in. Dismissal is remembered per shift day for this browser session. Browsers may block audio
 * until the user has interacted with the page; the visual alert is shown regardless.
 */
export function MissedClockInAlert() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const rules = useAppSettings("hrms");
  const { shift } = useMyShift();
  const [now, setNow] = useState<number | null>(null);
  const [clockedIn, setClockedIn] = useState(true);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const repeatSeconds = rules?.missedClockInAlertRepeatSeconds ?? 5;

  useEffect(() => {
    const tick = window.setTimeout(() => setNow(Date.now()), 0);
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => {
      window.clearTimeout(tick);
      window.clearInterval(timer);
    };
  }, []);

  // Users without an employee record or HRMS access get an error here and simply never see the alert.
  useEffect(() => {
    if (!organizationId || !shift) return;
    let cancelled = false;
    const load = () =>
      hrmsService.attendanceSelf
        .today(organizationId, dayjs().format("YYYY-MM-DD"))
        .then((result) => !cancelled && setClockedIn(Boolean(result.record?.checkIn)))
        .catch(() => !cancelled && setClockedIn(true));
    load();
    const timer = window.setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [organizationId, shift]);

  // Keyed by shift occurrence so a night shift spanning midnight is dismissed once.
  const dayKey = `hrms-missed-clock-in:${organizationId}:${shift && now !== null ? nearestShiftStart(shift, now) : ""}`;
  const storedDismissed = typeof window !== "undefined" && window.sessionStorage.getItem(dayKey) === "1";
  const active =
    Boolean(shift && rules && now !== null && !clockedIn) &&
    isMissedClockIn(shift!, rules!, now!) &&
    !storedDismissed &&
    dismissedKey !== dayKey;

  const audioRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (!active) return;
    const audio = new Audio(ALERT_SOUND);
    audioRef.current = audio;
    let timer: number | undefined;
    const ring = () => void audio.play().catch(() => undefined);
    const scheduleNext = () => {
      timer = window.setTimeout(ring, repeatSeconds * 1000);
    };
    audio.addEventListener("ended", scheduleNext);
    ring();
    return () => {
      window.clearTimeout(timer);
      audio.removeEventListener("ended", scheduleNext);
      audio.pause();
      audioRef.current = null;
    };
  }, [active, repeatSeconds]);

  if (!active || !shift) return null;

  const dismiss = () => {
    window.sessionStorage.setItem(dayKey, "1");
    setDismissedKey(dayKey);
  };

  return (
    <div role="alertdialog" aria-labelledby="missed-clock-in-title" className="fixed inset-0 z-[1000] flex items-center justify-center bg-text-primary/35 p-4">
      <div className="w-full max-w-sm rounded-xl bg-surface p-5 shadow-xl ring-1 ring-border">
        <h2 id="missed-clock-in-title" className="font-display text-lg font-bold text-text-primary">
          You haven&apos;t clocked in
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Your {shift.name} shift ({formatShiftRange(shift)}) started and no clock-in is recorded yet. Clock in from Home, or
          dismiss this alert to stop the sound.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="mt-4 cursor-pointer rounded-md bg-brand px-3.5 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
