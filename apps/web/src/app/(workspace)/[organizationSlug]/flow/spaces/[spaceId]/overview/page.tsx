"use client";

import { SPRINTS, ALL_ISSUES, gp, ga } from "@/components/flow/flow.data";
import { IKey, HealthBadge, Pbar, Av } from "@/components/flow/flow.atoms";
import { ProjectTab, ProjectHealth } from "@/types/flow.types";

export default function ProjectOverview({ pk, onTabChange }: { pk: string; onTabChange: (t: ProjectTab) => void }) {
  const p = gp(pk);
  const sprint = SPRINTS.find((s) => s.status === "active" && s.projectKey === pk) ?? SPRINTS[0];
  const issues = ALL_ISSUES.filter((i) => i.projectKey === pk);
  const blocked = issues.filter((i) => i.status === "blocked");
  return (
    <div className="pl-4 pr-2 pt-4 overflow-y-auto h-full">
      <div className="grid grid-cols-4 gap-4 mb-4">
        {/* Summary */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Project Summary</h3>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">{p.desc}</p>
          {[
            ["Owner", p.owner],
            ["Lead", p.lead],
            ["Start", p.startDate],
            ["Target", p.targetDate],
            ["Type", p.type],
            ["Key", p.key],
          ].map(([l, v]) => (
            <div key={l} className="flex items-center justify-between py-1.5 border-t border-slate-50 text-xs">
              <span className="text-slate-400">{l}</span>
              <span className="font-semibold text-slate-700">{v}</span>
            </div>
          ))}
        </div>
        {/* Health */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Project Health</h3>
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-lg">⚡</span>
            <span className="text-lg font-bold text-green-600">On Track</span>
          </div>
          <p className="text-xs text-slate-500 mb-4">Progressing well, no immediate risks.</p>
          <div className="flex gap-5">
            {[
              ["Risks", "2", "#d97706"],
              ["Issues", "42", "#2563eb"],
              ["Blocked", "2", "#dc2626"],
            ].map(([l, v, c]) => (
              <div key={l as string} className="text-center">
                <p className="text-xs text-slate-400">{l}</p>
                <p className="text-2xl font-black" style={{ color: c, fontFamily: "var(--font-display)" }}>
                  {v}
                </p>
              </div>
            ))}
          </div>
        </div>
        {/* Progress donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Progress</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                <circle
                  cx="18"
                  cy="18"
                  r="14"
                  fill="none"
                  stroke="#036c5f"
                  strokeWidth="4"
                  strokeDasharray={`${p.progress * 0.879} 87.9`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-black text-slate-900">{p.progress}%</span>
                <span className="text-[9px] text-slate-400">Done</span>
              </div>
            </div>
            <div>
              {[
                ["Done", "#059669", 72],
                ["In Progress", "#2563eb", 18],
                ["To Do", "#94a3b8", 10],
              ].map(([l, c, v]) => (
                <div key={l as string} className="flex items-center gap-2 py-0.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                  <span className="text-xs text-slate-600">{l}</span>
                  <span className="text-xs font-bold text-slate-700 ml-auto">{v}</span>
                </div>
              ))}
              <button
                onClick={() => onTabChange("reports")}
                className="mt-2 text-xs font-semibold"
                style={{ color: "#036c5f" }}
              >
                View report →
              </button>
            </div>
          </div>
        </div>
        {/* Sprint */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-2">Current Sprint</h3>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-slate-900">{sprint.name}</span>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "#d1fae5", color: "#059669" }}
            >
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-3">18 May – 31 May · 13 days left</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-3">{sprint.goal}</p>
          <div className="flex items-center gap-2 mb-1">
            <Pbar pct={72} color="#036c5f" h={6} />
            <span className="text-sm font-bold">72%</span>
          </div>
          <p className="text-xs text-slate-400 mb-2">42 of 58 issues</p>
          <button onClick={() => onTabChange("sprints")} className="text-xs font-semibold" style={{ color: "#036c5f" }}>
            View sprint →
          </button>
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Open Issues <span className="text-slate-400 font-normal">42</span>
            </h3>
            <button
              className="text-xs font-semibold"
              style={{ color: "#036c5f" }}
              onClick={() => onTabChange("issue-list")}
            >
              View →
            </button>
          </div>
          {[
            ["High", "#dc2626", 14],
            ["Medium", "#d97706", 18],
            ["Low", "#059669", 10],
          ].map(([l, c, v]) => (
            <div
              key={l as string}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                <span className="text-slate-600">{l}</span>
              </div>
              <span className="font-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Overdue <span className="text-slate-400 font-normal">4</span>
            </h3>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View →
            </button>
          </div>
          {[
            ["High", "#dc2626", 2],
            ["Medium", "#d97706", 1],
            ["Low", "#059669", 1],
          ].map(([l, c, v]) => (
            <div
              key={l as string}
              className="flex items-center justify-between py-1.5 border-b border-slate-50 text-xs"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                <span className="text-slate-600">{l}</span>
              </div>
              <span className="font-bold">{v}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">
              Blocked <span className="text-slate-400 font-normal">2</span>
            </h3>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View →
            </button>
          </div>
          {blocked.slice(0, 2).map((issue) => (
            <div key={issue.key} className="py-2 border-b border-slate-50">
              <IKey k={issue.key} />
              <p className="text-xs text-slate-600 mt-0.5">{issue.summary}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Milestones</h3>
          {[
            ["Gateway Migration", "31 May", "on-track"],
            ["Idempotency Release", "15 Jun", "at-risk"],
            ["Multi-currency", "30 Jun", "on-track"],
          ].map(([n, d, h]) => (
            <div key={n} className="flex items-start gap-2 py-2 border-b border-slate-50">
              <span className="text-slate-400 mt-0.5">◆</span>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-700">{n}</p>
                <p className="text-[10px] text-slate-400">{d}</p>
              </div>
              <HealthBadge h={h as ProjectHealth} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-slate-800">Recent Activity</h3>
          <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
            View all →
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { who: "rahul", action: "updated PAY-101 status to Review", when: "2 hours ago" },
            { who: "amit", action: "commented on PAY-108", when: "4 hours ago" },
            { who: "priya", action: "completed PAY-98", when: "6 hours ago" },
            { who: "sneha", action: "created PAY-125", when: "2 days ago" },
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2 py-2 border-b border-slate-50 last:border-0">
              <Av id={a.who} size={24} />
              <div>
                <p className="text-xs text-slate-600">
                  <strong>{ga(a.who)?.name.split(" ")[0]}</strong> {a.action}
                </p>
                <p className="text-[10px] text-slate-400">{a.when}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
