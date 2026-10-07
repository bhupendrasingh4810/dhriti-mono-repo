"use client";

import { useState } from "react";

const MEETINGS = [
  {
    id: 1,
    title: "Sprint 43 Retrospective",
    type: "Retrospective",
    date: "Tonight, 7:00 PM",
    team: "Engineering",
    participants: 8,
    status: "upcoming",
    color: "#ED7B53",
  },
  {
    id: 2,
    title: "Q3 Action Items Review",
    type: "Action Meeting",
    date: "Sep 13, 10:00 AM",
    team: "Product",
    participants: 5,
    status: "upcoming",
    color: "#5059C9",
  },
  {
    id: 3,
    title: "Sprint 42 Retrospective",
    type: "Retrospective",
    date: "Aug 28, 7:00 PM",
    team: "Engineering",
    participants: 8,
    status: "completed",
    color: "#ED7B53",
  },
];

const ACTIONS = [
  { id: 1, text: "Update API docs before the sprint ends", owner: "Alex Chen", done: true },
  { id: 2, text: "Schedule 1:1 with new engineering hire", owner: "Emily Park", done: false },
  { id: 3, text: "Create issue for mobile nav regression", owner: "Mark Johnson", done: false },
  { id: 4, text: "Share retro summary to #general", owner: "Sarah Kim", done: true },
];

export default function ParabolView() {
  const [actions, setActions] = useState(ACTIONS);
  const [tab, setTab] = useState<"meetings" | "actions">("meetings");

  const toggle = (id: number) => {
    setActions((a) => a.map((item) => item.id === id ? { ...item, done: !item.done } : item));
  };

  return (
    <div className="w-full p-4">
      <div className="flex gap-2 mb-4">
        {(["meetings", "actions"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium capitalize border transition-all"
            style={{
              backgroundColor: tab === t ? "#ED7B53" : "white",
              color: tab === t ? "white" : "#64748b",
              borderColor: tab === t ? "#ED7B53" : "#e2e8f0",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "meetings" && (
        <div className="space-y-3">
          {MEETINGS.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-5"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg flex-shrink-0"
                style={{ backgroundColor: m.color }}
              >
                {m.type === "Retrospective" ? "🔁" : "✓"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900">{m.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-400">{m.type}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{m.team}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{m.participants} people</span>
                </div>
                <p className="text-xs font-medium mt-1" style={{ color: m.status === "upcoming" ? "#ED7B53" : "#94a3b8" }}>
                  {m.date}
                </p>
              </div>
              {m.status === "upcoming" ? (
                <button
                  className="flex-shrink-0 px-4 py-2 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90"
                  style={{ backgroundColor: m.color }}
                >
                  Start
                </button>
              ) : (
                <span className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-500">
                  Completed
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === "actions" && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              Action items
            </h3>
            <span className="text-xs text-slate-400">
              {actions.filter((a) => a.done).length}/{actions.length} done
            </span>
          </div>
          <div className="divide-y divide-slate-50">
            {actions.map((action) => (
              <div
                key={action.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors"
              >
                <button
                  onClick={() => toggle(action.id)}
                  className="w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    borderColor: action.done ? "#036c5f" : "#cbd5e1",
                    backgroundColor: action.done ? "#036c5f" : "transparent",
                  }}
                >
                  {action.done && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-slate-800 leading-snug"
                    style={{ textDecoration: action.done ? "line-through" : "none", color: action.done ? "#94a3b8" : "#1e293b" }}
                  >
                    {action.text}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.owner}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
