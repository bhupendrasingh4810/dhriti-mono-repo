"use client";

import { useState } from "react";
import { SPRINTS, ALL_ISSUES, Issue, ga } from "@/components/flow/flow.data";
import IssueTable from "@/components/flow/IssueTable";
import { Av } from "@/components/flow/flow.atoms";

export default function ProjSprints({ pk, onIssueClick }: { pk: string; onIssueClick: (i: Issue) => void }) {
  const [tab, setTab] = useState("all");
  const sprint = SPRINTS.find((s) => s.status === "active" && s.projectKey === pk) ?? SPRINTS[0];
  const issues = ALL_ISSUES.filter((i) => i.projectKey === pk && i.sprint === sprint.name);
  const filtered = tab === "all" ? issues : issues.filter((i) => i.status === tab);
  const burnPts = [89, 84, 76, 65, 60, 52, 48, 43, 38, 35, 28, 20, 12, 6];
  const tabs = [
    { id: "all", l: "All Issues", n: sprint.totalIssues },
    { id: "todo", l: "To Do", n: sprint.remaining },
    { id: "in-progress", l: "In Progress", n: sprint.inProgress },
    { id: "done", l: "Done", n: sprint.completed },
    { id: "blocked", l: "Blocked", n: sprint.blocked },
  ];
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              {sprint.name}
            </h1>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "#d1fae5", color: "#059669" }}
            >
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            📅 {sprint.startDate} – {sprint.endDate} · {sprint.daysLeft} days left
          </p>
          <p className="text-xs text-slate-500 mb-4">{sprint.goal}</p>
          <div className="grid grid-cols-6 gap-3">
            {[
              { l: "Progress", v: `${Math.round((sprint.completed / sprint.totalIssues) * 100)}%`, c: "#036c5f" },
              { l: "Total", v: sprint.totalIssues, c: "#0f172a" },
              { l: "Completed", v: sprint.completed, c: "#059669" },
              { l: "In Progress", v: sprint.inProgress, c: "#2563eb" },
              { l: "Remaining", v: sprint.remaining, c: "#94a3b8" },
              { l: "Blocked", v: sprint.blocked, c: "#dc2626" },
            ].map((s) => (
              <div key={s.l} className="bg-white rounded-xl border border-slate-100 p-3">
                <p className="text-[10px] text-slate-400 font-semibold mb-1">{s.l}</p>
                <p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: s.c }}>
                  {s.v}
                </p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center px-5 border-b border-slate-100">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors"
              style={{
                borderColor: tab === t.id ? "#036c5f" : "transparent",
                color: tab === t.id ? "#036c5f" : "#64748b",
              }}
            >
              {t.l} {t.n}
            </button>
          ))}
        </div>
        <IssueTable issues={filtered} onIssueClick={onIssueClick} />
        <div className="flex items-center gap-2 px-5 py-2 border-t border-slate-100 text-xs">
          <button className="flex items-center gap-1 font-semibold" style={{ color: "#036c5f" }}>
            + Add issue
          </button>
          <div className="flex-1" />
          <span className="text-slate-400">
            1–{filtered.length} of {sprint.totalIssues}
          </span>
        </div>
      </div>
      {/* Right panel */}
      <div className="w-64 flex-shrink-0 border-l border-slate-100 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-2">Burndown</h3>
          <div className="relative bg-slate-50 rounded-xl p-2" style={{ height: 120 }}>
            <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="200" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 3" />
              <polyline
                points={burnPts.map((p, i) => `${i * (200 / 13)},${p}`).join(" ")}
                fill="none"
                stroke="#036c5f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 border-b border-slate-100">
          <h3 className="text-xs font-bold text-slate-800 mb-3">Sprint Activity</h3>
          {[
            { who: "rahul", msg: "moved PAY-101 to In Progress", time: "2h ago" },
            { who: "amit", msg: "commented on PAY-102", time: "3h ago" },
            { who: "priya", msg: "completed PAY-098", time: "5h ago" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2 mb-3">
              <Av id={a.who} size={22} />
              <div>
                <p className="text-[11px] text-slate-700">
                  <strong>{ga(a.who)?.name.split(" ")[0]}</strong> {a.msg}
                </p>
                <p className="text-[10px] text-slate-400">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="p-4">
          <h3 className="text-xs font-bold text-slate-800 mb-3">Sprint Risks</h3>
          {[
            { icon: "🚩", t: "2 issues blocked", c: "#fee2e2" },
            { icon: "⚠️", t: "Velocity 18% below avg", c: "#fef3c7" },
          ].map((r) => (
            <div key={r.t} className="flex items-start gap-2 p-2.5 rounded-xl mb-2" style={{ backgroundColor: r.c }}>
              <span>{r.icon}</span>
              <p className="text-[11px] font-bold text-slate-800">{r.t}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
