"use client";

import { useMemo, useState } from "react";
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

export default function PulseCalendar() {
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [visibleCalendars, setVisibleCalendars] = useState<MyCalendarName[]>([...myCalendarNames]);
  const workingDays = getWorkingDays(pulseOrganizationPolicy.workingDays);
  const timeSlots = getTimeSlots(pulseOrganizationPolicy.workingHours);
  const workingWeek = useMemo(
    () => getWorkingWeek(selectedDate, workingDays),
    [selectedDate, workingDays],
  );
  const nowLinePosition = useMemo(() => {
    const hours = selectedDate.getHours() + selectedDate.getMinutes() / 60;
    const { startHour, endHour } = pulseOrganizationPolicy.workingHours;

    return Math.min(Math.max((hours - startHour) * 80, 0), (endHour - startHour) * 80);
  }, [selectedDate]);
  const currentDayIndex = workingWeek.findIndex((date) => isSameCalendarDay(date, new Date()));

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
          />
          <PulseScheduleGrid
            nowLinePosition={nowLinePosition}
            workingWeek={workingWeek}
            currentDayIndex={currentDayIndex}
            timeSlots={timeSlots}
            workingDayStartHour={pulseOrganizationPolicy.workingHours.startHour}
            showCalendarEvents={visibleCalendars.includes("Calendar")}
            showBirthdays={visibleCalendars.includes("Birthdays")}
            showHolidays={visibleCalendars.includes("Holidays")}
          />
        </section>
      </div>
    </main>
  );
}
