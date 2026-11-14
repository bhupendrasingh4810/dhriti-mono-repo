"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { hrmsService, type HrmsHoliday } from "@/services/hrms.service";

const formatDay = (holiday: HrmsHoliday) =>
  new Date(holiday.date).toLocaleDateString(undefined, { weekday: "short", day: "2-digit", month: "short", timeZone: "UTC" });
const daysAway = (holiday: HrmsHoliday) => {
  const now = new Date();
  return Math.round((new Date(holiday.date).getTime() - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86_400_000);
};

/** Holidays that apply to the signed-in employee (org-wide + their location), fetched once per organization. */
export function useUpcomingHolidays() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [state, setState] = useState<{ key: string | null; items: HrmsHoliday[] }>({ key: null, items: [] });

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    hrmsService.holidays
      .upcoming(organizationId)
      .then((items) => !cancelled && setState({ key: organizationId, items }))
      .catch(() => !cancelled && setState({ key: organizationId, items: [] }));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  return state.key === organizationId ? state.items : [];
}

/** Home widget: the next few holidays with a "in N days" hint. Renders nothing when there are none. */
export function UpcomingHolidaysCard() {
  const holidays = useUpcomingHolidays();
  if (holidays.length === 0) return null;
  return (
    <section aria-label="Upcoming holidays" className="rounded-lg border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-bold text-text-primary">Upcoming holidays</h3>
      <ul className="space-y-2">
        {holidays.map((holiday) => {
          const away = daysAway(holiday);
          return (
            <li key={holiday.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate text-text-primary">
                <span className="font-semibold">{formatDay(holiday)}</span> · {holiday.name}
                {holiday.isHalfDay ? " (half day)" : ""}
                {holiday.workLocation ? ` (${holiday.workLocation.name})` : ""}
              </span>
              <span className="shrink-0 text-xs text-text-muted">{away <= 0 ? "Today" : away === 1 ? "Tomorrow" : `in ${away} days`}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
