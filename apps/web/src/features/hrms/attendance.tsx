"use client";

import { useState } from "react";

import { Avatar, Badge, Button, Card, CardTitle, Icon } from "./components/ui-primitives";

export function HrmsAttendance({ onToast }: { onToast: (message: string) => void }) {
  const [tab, setTab] = useState("Overview");
  const [clockedIn, setClockedIn] = useState(true);
  const [onBreak, setOnBreak] = useState(false);
  const tabs = ["Overview", "My calendar", "Team attendance", "Shifts", "Regularization"];
  const week = [
    { day: "Mon", date: "7", in: "08:48", out: "17:34", hours: "8h 46m", status: "Present" },
    { day: "Tue", date: "8", in: "09:02", out: "17:41", hours: "8h 39m", status: "Present" },
    { day: "Wed", date: "9", in: "08:42", out: "—", hours: "2h 18m", status: "Working" },
    { day: "Thu", date: "10", in: "—", out: "—", hours: "—", status: "Upcoming" },
    { day: "Fri", date: "11", in: "—", out: "—", hours: "—", status: "Upcoming" },
  ];
  return (
    <>
      <div className="mb-5 flex gap-1 overflow-x-auto border-b border-border">
        {tabs.map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`shrink-0 border-b-2 px-4 py-3 text-sm font-semibold ${tab === item ? "border-brand text-brand" : "border-transparent text-text-muted hover:text-text-primary"}`}
          >
            {item}
          </button>
        ))}
      </div>
      {tab === "Overview" ? (
        <>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="overflow-hidden lg:col-span-2">
              <div className="bg-gradient-to-br from-teal-950 to-brand p-6 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-teal-100">
                      Wednesday, 9 October
                    </p>
                    <p className="mt-3 font-display text-4xl font-bold">11:00:24 AM</p>
                    <p className="mt-2 text-sm text-teal-100">Dhriti Bengaluru · Within office geofence</p>
                  </div>
                  <Badge tone={onBreak ? "warning" : "success"}>
                    {onBreak ? "On break" : clockedIn ? "Working" : "Clocked out"}
                  </Badge>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-5">
                  <div>
                    <p className="text-xs text-teal-100">Clock in</p>
                    <p className="mt-1 font-semibold">{clockedIn ? "08:42 AM" : "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-100">Work hours</p>
                    <p className="mt-1 font-semibold">{clockedIn ? "02h 18m" : "00h 00m"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-teal-100">Break time</p>
                    <p className="mt-1 font-semibold">24 min</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 p-5">
                <Button
                  onClick={() => {
                    setClockedIn(!clockedIn);
                    onToast(clockedIn ? "Clocked out successfully" : "Clocked in successfully");
                  }}
                >
                  {clockedIn ? "Clock out" : "Clock in"}
                </Button>
                <Button
                  variant="secondary"
                  disabled={!clockedIn}
                  onClick={() => {
                    setOnBreak(!onBreak);
                    onToast(onBreak ? "Break ended" : "Break started");
                  }}
                >
                  {onBreak ? "End break" : "Take a break"}
                </Button>
                <span className="ml-auto text-xs text-text-muted">Shift: General · 9:00 AM–5:30 PM</span>
              </div>
            </Card>
            <Card>
              <CardTitle title="This month" subtitle="October attendance summary" />
              <div className="grid grid-cols-2 gap-3 p-5">
                {[
                  ["Present", "7 days"],
                  ["Avg. hours", "8h 34m"],
                  ["Late arrivals", "1 day"],
                  ["Overtime", "4h 12m"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-md bg-slate-50 p-3">
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className="mt-1 text-sm font-bold text-text-primary">{value}</p>
                  </div>
                ))}
              </div>
              <div className="px-5 pb-5">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Attendance rate</span>
                  <span className="font-bold text-brand">96.2%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100">
                  <div className="h-2 w-[96%] rounded-full bg-brand" />
                </div>
              </div>
            </Card>
          </div>
          <Card className="mt-5 overflow-hidden">
            <CardTitle
              title="This week"
              subtitle="Your attendance log · 7–11 October"
              action={
                <Button variant="secondary" icon="download">
                  Export
                </Button>
              }
            />
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="bg-slate-50">
                    {["Day", "Clock in", "Clock out", "Work hours", "Status", "Action"].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {week.map((day) => (
                    <tr key={day.day} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold">
                          {day.day}, Oct {day.date}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{day.in}</td>
                      <td className="px-5 py-4 text-sm text-text-secondary">{day.out}</td>
                      <td className="px-5 py-4 text-sm font-medium">{day.hours}</td>
                      <td className="px-5 py-4">
                        <Badge
                          tone={day.status === "Present" ? "success" : day.status === "Working" ? "brand" : "neutral"}
                        >
                          {day.status}
                        </Badge>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => onToast("Regularization request opened")}
                          className="text-xs font-semibold text-brand disabled:text-text-muted"
                          disabled={day.status === "Upcoming"}
                        >
                          Regularize
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <CardTitle
            title={tab}
            subtitle={`Manage ${tab.toLowerCase()} records and requests`}
            action={<Button icon="plus">Create request</Button>}
          />
          <div className="grid gap-4 p-5 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="rounded-md border border-border p-5">
                <div className="flex items-center justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-muted text-brand">
                    <Icon name={tab === "Shifts" ? "clock" : tab === "Regularization" ? "file" : "calendar"} />
                  </div>
                  <Badge tone={item === 1 ? "success" : "neutral"}>{item === 1 ? "Active" : "Scheduled"}</Badge>
                </div>
                <p className="mt-4 text-sm font-semibold text-text-primary">
                  {tab === "Shifts"
                    ? ["General shift", "Early shift", "Night shift"][item - 1]
                    : tab === "Regularization"
                      ? ["Missed clock-out", "Work from client site", "Late arrival"][item - 1]
                      : ["October attendance", "Team availability", "Shift coverage"][item - 1]}
                </p>
                <p className="mt-1 text-xs leading-5 text-text-muted">
                  View details, exceptions, assignments, and approval history.
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </>
  );
}
