"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getTimeSlots,
  getWorkingDays,
  getWorkingWeek,
  isSameCalendarDay,
  myCalendarNames,
  type MyCalendarName,
  pulseOrganizationPolicy,
} from "./pulse-calendar.data";
import { PulseCalendarSidebar } from "./PulseCalendarSidebar";
import { PulseCalendarToolbar } from "./PulseCalendarToolbar";
import { PulseScheduleGrid } from "./PulseScheduleGrid";
import { useAuth } from "@/hooks/use-auth";
import { pulseService, type PulseSchedule } from "@/services/pulse.service";

export default function PulseCalendar() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [visibleCalendars, setVisibleCalendars] = useState<MyCalendarName[]>([...myCalendarNames]);
  const [schedule, setSchedule] = useState<PulseSchedule | null>(null);
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleVersion, setScheduleVersion] = useState(0);
  const workingDays = useMemo(() => getWorkingDays(pulseOrganizationPolicy.workingDays), []);
  const timeSlots = getTimeSlots(pulseOrganizationPolicy.workingHours);
  const workingWeek = useMemo(
    () => getWorkingWeek(selectedDate, workingDays),
    [selectedDate, workingDays],
  );
  const nowLinePosition = useMemo(() => {
    const hours = currentTime.getHours() + currentTime.getMinutes() / 60;
    const { startHour, endHour } = pulseOrganizationPolicy.workingHours;

    return Math.min(Math.max((hours - startHour) * 80, 0), (endHour - startHour) * 80);
  }, [currentTime]);
  const currentDayIndex = workingWeek.findIndex((date) => isSameCalendarDay(date, currentTime));

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!organizationId || !workingWeek[0] || !workingWeek.at(-1)) {
      return;
    }

    const from = new Date(workingWeek[0]);
    from.setHours(0, 0, 0, 0);
    const to = new Date(workingWeek.at(-1)!);
    to.setDate(to.getDate() + 1);
    to.setHours(0, 0, 0, 0);
    let cancelled = false;

    void pulseService.getSchedule(organizationId, { from: from.toISOString(), to: to.toISOString() })
      .then((result) => {
        if (!cancelled) {
          setSchedule(result);
          setScheduleError("");
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setScheduleError(error instanceof Error ? error.message : "Unable to load the schedule.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [organizationId, scheduleVersion, workingWeek]);

  function shiftWeek(amount: number) {
    setSelectedDate((current) => {
      const next = new Date(current);
      next.setDate(current.getDate() + amount * 7);
      return next;
    });
  }

  function toggleCalendar(calendar: MyCalendarName) {
    setVisibleCalendars((current) =>
      current.includes(calendar) ? current.filter((item) => item !== calendar) : [...current, calendar],
    );
  }

  return (
    <main className="flex h-full min-h-0 flex-col overflow-hidden bg-background p-4 text-text-primary">
      <div className="flex min-h-0 flex-1 gap-4">
        <PulseCalendarSidebar
          selectedDate={selectedDate}
          workingDays={workingDays}
          onSelectDate={setSelectedDate}
          visibleCalendars={visibleCalendars}
          onToggleCalendar={toggleCalendar}
        />
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl border border-border bg-background">
          <PulseCalendarToolbar
            workingWeek={workingWeek}
            onToday={() => setSelectedDate(new Date())}
            onPreviousWeek={() => shiftWeek(-1)}
            onNextWeek={() => shiftWeek(1)}
            onScheduleCreated={() => setScheduleVersion((version) => version + 1)}
          />
          {scheduleError ? <p role="alert" className="border-b border-error/30 bg-error/10 px-5 py-2 text-sm text-error">{scheduleError}</p> : null}
          <PulseScheduleGrid
            nowLinePosition={nowLinePosition}
            workingWeek={workingWeek}
            currentDayIndex={currentDayIndex}
            timeSlots={timeSlots}
            workingDayStartHour={pulseOrganizationPolicy.workingHours.startHour}
            showCalendarEvents={visibleCalendars.includes("Calendar")}
            showBirthdays={visibleCalendars.includes("Birthdays")}
            showHolidays={visibleCalendars.includes("Holidays")}
            schedule={schedule}
            onScheduleChanged={() => setScheduleVersion((version) => version + 1)}
          />
        </section>
      </div>
    </main>
  );
}
