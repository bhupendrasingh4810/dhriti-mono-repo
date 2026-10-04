"use client";

import { ALL_ISSUES, SPRINTS, PROJECTS, PRIORITY_CFG, Issue, gp } from "@/components/flow/flow.data";
import { StatusBadge, IKey, Pri, Av, Pbar, ProjAv } from "@/components/flow/flow.atoms";

export default function DashboardView({
  onIssueClick,
  onProjectClick,
}: {
  onIssueClick: (i: Issue) => void;
  onProjectClick: (k: string) => void;
}) {
  const myIssues = ALL_ISSUES.filter((i) => i.assigneeId === "rahul").slice(0, 5);
  const sprint = SPRINTS.find((s) => s.status === "active")!;
  const blocked = ALL_ISSUES.filter((i) => i.status === "blocked").slice(0, 2);
  return (
    <div className="pt-0 pl-4 pr-2 overflow-y-auto h-full">
      <div className="sticky top-0 z-10 mb-5 flex items-start justify-between rounded-lg border border-slate-100 bg-white p-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Your work overview and real-time progress.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* My Work Table */}
        <div className="col-span-2 bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-50">
            <h2 className="text-sm font-bold text-slate-800">My Work</h2>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View all →
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-50 text-slate-400">
                {["Issue", "Summary", "Project", "Status", "Priority", "Due Date", "Assignee"].map((h) => (
                  <th key={h} className="text-left py-2 px-3 font-semibold uppercase tracking-wider text-[10px]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {myIssues.map((issue, idx) => (
                <tr
                  key={issue.key}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onIssueClick(issue)}
                  style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa" }}
                >
                  <td className="py-2.5 px-3">
                    <IKey k={issue.key} />
                  </td>
                  <td className="py-2.5 px-3 max-w-[180px]">
                    <span className="text-slate-700 truncate block">{issue.summary}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{gp(issue.projectKey).name.split(" ")[0]}</td>
                  <td className="py-2.5 px-3">
                    <StatusBadge status={issue.status} />
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex items-center gap-1">
                      <Pri p={issue.priority} />
                      <span style={{ color: PRIORITY_CFG[issue.priority].color }}>
                        {PRIORITY_CFG[issue.priority].label}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500">{issue.dueDate.replace(" 2025", "") || "—"}</td>
                  <td className="py-2.5 px-3">
                    <Av id={issue.assigneeId} size={22} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-2 border-t border-slate-50 flex items-center">
            <span className="text-xs text-slate-400">Showing 5 of 18</span>
            <div className="flex gap-1 ml-auto">
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  className="w-6 h-6 rounded text-xs font-semibold"
                  style={{ backgroundColor: n === 1 ? "#036c5f" : "transparent", color: n === 1 ? "white" : "#64748b" }}
                >
                  {n}
                </button>
              ))}
              <button className="w-6 h-6 rounded text-xs text-slate-400">›</button>
            </div>
          </div>
        </div>

        {/* Sprint Progress */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Sprint Progress</h2>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View →
            </button>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-slate-900">{sprint.name}</h3>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: "#d1fae5", color: "#059669" }}
            >
              Active
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-1">May 18 – 31 · 13 days left</p>
          <p className="text-xs font-semibold text-slate-600 mt-3 mb-1">Sprint Goal</p>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">{sprint.goal}</p>
          <div className="flex items-center gap-2 mb-1">
            <Pbar pct={72} color="#036c5f" h={6} />
            <span className="text-sm font-bold">72%</span>
          </div>
          <p className="text-xs text-slate-400 mb-3">42 of 58 issues completed</p>
          {[
            ["Completed", "#059669", 42],
            ["In Progress", "#2563eb", 8],
            ["Remaining", "#94a3b8", 6],
            ["Blocked", "#dc2626", 2],
          ].map(([l, c, v]) => (
            <div key={l as string} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                <span className="text-xs text-slate-600">{l}</span>
              </div>
              <span className="text-xs font-bold text-slate-700">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-4 gap-4">
        {/* Blocked */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Blocked Work</h2>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View all →
            </button>
          </div>
          {blocked.map((issue) => (
            <div key={issue.key} className="mb-3 cursor-pointer" onClick={() => onIssueClick(issue)}>
              <div className="flex items-center justify-between mb-0.5">
                <IKey k={issue.key} />
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ color: "#dc2626", backgroundColor: "#fee2e2" }}
                >
                  Blocked
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-1">{issue.summary}</p>
              <p className="text-[10px] text-slate-400">
                Blocked by{" "}
                <span className="font-bold" style={{ color: "#036c5f" }}>
                  AUTH-92
                </span>
              </p>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Upcoming Work</h2>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View all →
            </button>
          </div>
          <p className="text-xs font-bold text-slate-500 mb-2">Due Today (2)</p>
          {ALL_ISSUES.filter((i) => i.dueDate && i.status !== "done")
            .slice(0, 4)
            .map((issue) => (
              <div
                key={issue.key}
                className="flex items-start gap-2 mb-2 cursor-pointer"
                onClick={() => onIssueClick(issue)}
              >
                <Av id={issue.assigneeId} size={22} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-700">{issue.key}</p>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{issue.summary}</p>
                </div>
                <Pri p={issue.priority} />
              </div>
            ))}
        </div>

        {/* Projects mini */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">Projects</h2>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              View all →
            </button>
          </div>
          <div className="space-y-0 border rounded-xl border-slate-100 overflow-hidden">
            {PROJECTS.slice(0, 5).map((p) => (
              <div
                key={p.key}
                className="flex items-center gap-2 px-3 py-2 text-xs border-b border-slate-50 last:border-0 hover:bg-slate-50 cursor-pointer"
                onClick={() => onProjectClick(p.key)}
              >
                <ProjAv pk={p.key} size={18} />
                <span className="text-slate-700 font-medium flex-1 truncate">{p.name.split(" ")[0]}</span>
                <div className="w-14">
                  <Pbar
                    pct={p.progress}
                    color={p.health === "on-track" ? "#059669" : p.health === "at-risk" ? "#d97706" : "#dc2626"}
                  />
                </div>
                <span
                  className="font-bold text-xs"
                  style={{
                    color: p.health === "on-track" ? "#059669" : p.health === "at-risk" ? "#d97706" : "#dc2626",
                  }}
                >
                  {p.progress}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity + Nexus */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-slate-800">Recent Activity</h2>
              <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
                View →
              </button>
            </div>
            {[
              { t: "Rahul moved PAY-101 to In Progress", w: "10m ago" },
              { t: "Amit assigned AUTH-82 to Priya", w: "32m ago" },
              { t: "Sprint 24 started", w: "1h ago" },
              { t: "Priya commented on PAY-108", w: "2h ago" },
            ].map((a, i) => (
              <div key={i} className="flex items-start gap-2 mb-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-slate-600">{a.t}</p>
                  <p className="text-[10px] text-slate-400">{a.w}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm">✦</span>
              <h2 className="text-sm font-bold text-slate-800">Nexus AI</h2>
            </div>
            <div
              className="p-3 rounded-xl mb-2 text-xs"
              style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d" }}
            >
              <p className="font-bold text-slate-800 mb-1">⚠️ Payments project may be at risk</p>
              <p className="text-slate-600">3 high-priority issues blocked, velocity 18% below average.</p>
            </div>
            <div className="flex gap-2">
              <input
                placeholder="Ask Nexus…"
                className="flex-1 px-3 py-1.5 rounded-xl border border-slate-100 text-xs outline-none bg-slate-50"
              />
              <button
                className="w-7 h-7 rounded-xl flex items-center justify-center text-white"
                style={{ backgroundColor: "#036c5f" }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
