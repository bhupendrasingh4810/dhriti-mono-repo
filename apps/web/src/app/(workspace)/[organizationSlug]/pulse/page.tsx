"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Filter, MoreVertical, Plus } from "lucide-react";

type EventTone = "info" | "success" | "warning" | "secondary" | "error";

type CalendarEvent = {
  id: string;
  day: number;
  startHour: number;
  durationHours: number;
  title: string;
  time: string;
  location: string;
  tone: EventTone;
};

const dayHeaders = ["Mon 25", "Tue 26", "Wed 27", "Thu 28", "Fri 29"];
const timeSlots = ["8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM"];

const events: CalendarEvent[] = [
  {
    id: "e1",
    day: 0,
    startHour: 9.5,
    durationHours: 0.75,
    title: "Daily Standup",
    time: "9:30 - 10:00",
    location: "Room 2B",
    tone: "secondary",
  },
  {
    id: "e2",
    day: 1,
    startHour: 10,
    durationHours: 2,
    title: "Sprint Planning",
    time: "10:00 - 12:00",
    location: "Room 2B",
    tone: "success",
  },
  {
    id: "e3",
    day: 2,
    startHour: 11,
    durationHours: 1.25,
    title: "Product Discussion",
    time: "11:00 - 12:15",
    location: "Room 3A",
    tone: "info",
  },
  {
    id: "e4",
    day: 3,
    startHour: 10,
    durationHours: 1.5,
    title: "Architecture Review",
    time: "10:00 - 11:30",
    location: "Room 2B",
    tone: "secondary",
  },
  {
    id: "e5",
    day: 4,
    startHour: 9.5,
    durationHours: 1,
    title: "Product Roadmap",
    time: "9:30 - 10:30",
    location: "Room 3A",
    tone: "warning",
  },
  {
    id: "e6",
    day: 0,
    startHour: 14,
    durationHours: 1.5,
    title: "Architecture Review",
    time: "2:00 - 3:30",
    location: "Room 3A",
    tone: "warning",
  },
  {
    id: "e7",
    day: 1,
    startHour: 15,
    durationHours: 2,
    title: "Focus Time",
    time: "3:00 - 5:00",
    location: "Heads down",
    tone: "error",
  },
  {
    id: "e8",
    day: 4,
    startHour: 15,
    durationHours: 1,
    title: "Team Sync",
    time: "3:00 - 4:00",
    location: "Room 2B",
    tone: "secondary",
  },
];

const eventToneClasses: Record<EventTone, string> = {
  success: "border-success bg-success/10 text-success",
  warning: "border-warning bg-warning/10 text-warning",
  secondary: "border-brand bg-brand-muted text-brand",
  error: "border-error bg-error/10 text-error",
  info: "border-info bg-info/10 text-info",
};

function MiniCalendar({ value, onChange }: { value: Date; onChange: (date: Date) => void }) {
  const monthStart = new Date(value.getFullYear(), value.getMonth(), 1);
  const firstDayOffset = monthStart.getDay();
  const daysInMonth = new Date(value.getFullYear(), value.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: 42 }, (_, index) => {
    const day = index - firstDayOffset + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <section className="flex flex-col gap-1.5">
      <h2 className="text-lg font-bold text-text-primary">
        {value.toLocaleString("default", { month: "long", year: "numeric" })}
      </h2>
      <div className="grid grid-cols-7 gap-0.5">
        {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
          <span key={`${label}-${index}`} className="text-center text-xs font-bold text-text-muted">
            {label}
          </span>
        ))}
        {cells.map((day, index) => {
          const selected = day === value.getDate();
          return (
            <button
              key={`${day ?? "empty"}-${index}`}
              disabled={!day}
              onClick={() => day && onChange(new Date(value.getFullYear(), value.getMonth(), day))}
              className={`h-8 w-8 rounded-full text-sm font-medium ${
                selected ? "bg-brand text-white" : "text-text-secondary hover:bg-brand-muted"
              } disabled:cursor-default disabled:opacity-0`}
            >
              {day ?? ""}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function PulsePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date(2025, 7, 29));

  const nowLinePosition = useMemo(() => {
    const hours = selectedDate.getHours() + selectedDate.getMinutes() / 60;
    return Math.min(Math.max((hours - 8) * 80, 0), timeSlots.length * 80);
  }, [selectedDate]);

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-surface text-text-primary">
      <div className="flex min-h-0 flex-1">
        <aside className="w-75 overflow-y-auto border-r border-border bg-surface">
          <div className="p-5">
            <MiniCalendar value={selectedDate} onChange={setSelectedDate} />
          </div>
          <div className="border-t border-border" />
          <div className="flex flex-col gap-6 p-5">
            <section>
              <h2 className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">
                My Calendars
              </h2>
              <div className="flex flex-col gap-1.5">
                {[
                  { label: "Calendar", checked: true },
                  { label: "Birthdays", checked: true },
                  { label: "Holidays", checked: true },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                    <input checked={item.checked} readOnly type="checkbox" className="accent-brand" />
                    {item.label}
                  </label>
                ))}
              </div>
            </section>

            <section>
              <h2 className="mb-1.5 text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">
                Team: Rahul Sharma
              </h2>
              <div className="flex flex-col gap-1">
                {["Rahul Sharma (You)", "Amit Verma", "Priya Nair", "Neha Joshi", "Karan Mehta"].map((name, index) => (
                  <label key={name} className="flex items-center gap-2 text-sm font-semibold text-text-secondary">
                    <input checked={index === 0} readOnly type="checkbox" className="accent-brand" />
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[10px] text-white">
                      {name
                        .split(" ")
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    {name}
                  </label>
                ))}
              </div>
            </section>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex items-center justify-between gap-1.5 border-b border-border bg-surface p-5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary"
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Previous week"
                className="rounded-md p-1.5 text-text-secondary hover:bg-surface-raised"
              >
                <ChevronLeft aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Next week"
                className="rounded-md p-1.5 text-text-secondary hover:bg-surface-raised"
              >
                <ChevronRight aria-hidden="true" />
              </button>
              <h2 className="text-lg font-extrabold text-text-primary">25 - 29 August 2025</h2>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Filter"
                className="rounded-md border border-border p-1.5 text-text-secondary hover:bg-surface-raised"
              >
                <Filter aria-hidden="true" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Plus aria-hidden="true" />
                New Meeting
              </button>
              <button
                type="button"
                aria-label="More actions"
                className="rounded-md p-1.5 text-text-secondary hover:bg-surface-raised"
              >
                <MoreVertical aria-hidden="true" />
              </button>
            </div>
          </div>

          <div className="relative min-h-0 flex-1 overflow-auto">
            <div className="grid min-w-[980px] grid-cols-[80px_repeat(5,minmax(160px,1fr))] grid-rows-[56px_44px] auto-rows-[80px] bg-surface">
              <div className="sticky top-0 z-3 grid place-items-center border-b border-r border-border bg-surface">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">Time</span>
              </div>
              {dayHeaders.map((day, index) => (
                <div
                  key={day}
                  className={`sticky top-0 z-3 grid place-items-center border-b border-border bg-surface ${
                    index === 4 ? "text-brand" : "text-text-secondary"
                  }`}
                >
                  <span className="text-[13px] font-extrabold">{day}</span>
                </div>
              ))}

              <div className="grid place-items-center border-b border-r border-border">
                <span className="text-[11px] font-bold text-text-secondary">All Day</span>
              </div>
              {["Independence Day", "", "Priya Nair Birthday", "", ""].map((label, index) => (
                <div
                  key={`all-day-${index}`}
                  className={`border-b border-border p-0.75 ${index < 4 ? "border-r" : ""}`}
                >
                  {label ? (
                    <p className="border border-border bg-background px-1 py-0.65 text-[11px] font-bold">{label}</p>
                  ) : null}
                </div>
              ))}

              {timeSlots.map((slot) => (
                <div key={slot} className="contents">
                  <div className="border-b border-r border-border p-1">
                    <span className="text-[11px] font-bold text-text-secondary">{slot}</span>
                  </div>
                  {Array.from({ length: 5 }).map((_, colIndex) => (
                    <div
                      key={`${slot}-${colIndex}`}
                      className={`relative border-b border-border ${colIndex < 4 ? "border-r" : ""}`}
                    />
                  ))}
                </div>
              ))}

              {events.map((event) => {
                const top = 56 + 44 + (event.startHour - 8) * 80;
                return (
                  <div
                    key={event.id}
                    className={`absolute z-2 overflow-hidden rounded-md border-l-4 p-1 ${eventToneClasses[event.tone]}`}
                    style={{
                      top,
                      left: `calc(80px + (${event.day} * (100% - 80px) / 5) + 8px)`,
                      width: "calc((100% - 80px) / 5 - 16px)",
                      height: Math.max(event.durationHours * 80 - 8, 48),
                    }}
                  >
                    <p className="truncate text-[11px] font-extrabold leading-[1.25]">{event.title}</p>
                    <p className="mt-0.25 text-[10px] text-text-secondary">{event.time}</p>
                    <p className="mt-0.2 truncate text-[10px] text-text-muted">{event.location}</p>
                  </div>
                );
              })}

              <div
                className="absolute z-4 h-0.5 bg-error"
                style={{
                  left: "calc(80px + (3 * (100% - 80px) / 5))",
                  width: "calc((100% - 80px) / 5)",
                  top: 56 + 44 + nowLinePosition,
                }}
              >
                <span className="absolute -left-1 -top-1 size-2 rounded-full bg-error" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
