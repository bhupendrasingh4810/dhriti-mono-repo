"use client";

import { useEffect, useState } from "react";
import type { WorkWeekScheduleDay } from "@dhriti/types";
import { hrmsService } from "@/services/hrms.service";

/** Key responses by tenant, employee and dates so old policy data cannot authorize a new request. */
export function useWorkWeekSchedule(organizationId: string | undefined, from: string, to: string, employeeId?: string) {
  const key = `${organizationId}:${employeeId ?? "me"}:${from}:${to}`;
  const [result, setResult] = useState<{ key: string; days?: WorkWeekScheduleDay[]; error?: string } | null>(null);
  const [retry, setRetry] = useState(0);
  const span = (Date.parse(to) - Date.parse(from)) / 86_400_000;
  const invalid = !Number.isFinite(span) || span < 0 || span > 365;
  useEffect(() => {
    if (!organizationId || invalid) return;
    let active = true;
    hrmsService.workWeeks
      .schedule(organizationId, from, to, employeeId)
      .then(({ days }) => {
        if (active) setResult({ key, days });
      })
      .catch((reason) => {
        if (active)
          setResult({
            key,
            error: reason instanceof Error ? reason.message : "Unable to load the work-week schedule.",
          });
      });
    return () => {
      active = false;
    };
  }, [organizationId, from, to, employeeId, key, invalid, retry]);
  const current = result?.key === key ? result : null;
  return {
    days: current?.days ?? null,
    error: invalid ? "Choose a date range of at most 366 days." : (current?.error ?? null),
    loading: !invalid && !!organizationId && !current,
    retry: () => {
      setResult(null);
      setRetry((value) => value + 1);
    },
  };
}
