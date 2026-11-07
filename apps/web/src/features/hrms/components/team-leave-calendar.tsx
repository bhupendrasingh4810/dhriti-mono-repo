"use client";

import { Avatar, Card, CardTitle, Icon } from "./ui-primitives";

const days = [
  { day: "MON", date: "12", people: [] },
  { day: "TUE", date: "13", people: ["AS"] },
  { day: "WED", date: "14", people: ["AS", "NM"] },
  { day: "THU", date: "15", people: ["NM"] },
  { day: "FRI", date: "16", people: ["PV", "IK"] },
];

export function TeamLeaveCalendar() {
  return (
    <Card>
      <CardTitle
        title="Team leave calendar"
        subtitle="12–16 October"
        action={
          <div className="flex gap-1">
            <button className="rounded-md border border-border p-1.5 text-text-muted">
              <Icon name="chevron" size={14} className="rotate-180" />
            </button>
            <button className="rounded-md border border-border p-1.5 text-text-muted">
              <Icon name="chevron" size={14} />
            </button>
          </div>
        }
      />
      <div className="grid grid-cols-5 gap-2 p-5">
        {days.map((day) => (
          <div key={day.date} className="min-h-32 rounded-md border border-border p-3">
            <p className="text-[10px] font-bold text-text-muted">{day.day}</p>
            <p className="mt-1 font-display text-lg font-bold text-text-primary">{day.date}</p>
            <div className="mt-4 flex -space-x-1.5">
              {day.people.map((person, index) => (
                <Avatar key={person} initials={person} index={index + Number(day.date)} size="sm" />
              ))}
            </div>
            {day.people.length === 0 && <p className="mt-5 text-[10px] text-text-muted">No leave</p>}
          </div>
        ))}
      </div>
    </Card>
  );
}
