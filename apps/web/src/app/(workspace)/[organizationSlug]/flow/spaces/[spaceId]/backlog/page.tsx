"use client";

import { useState } from "react";
import { EPICS, SPRINTS, ALL_ISSUES } from "@/components/flow/flow.data";
import type { Issue } from "@/components/flow/flow.data";
import { Pbar, TypeIcon, IKey, StatusBadge, Pri, Av, LPill } from "@/components/flow/flow.atoms";

export default function ProjBacklog({ pk, onIssueClick }: { pk: string; onIssueClick: (i: Issue) => void }) {
  const [exp, setExp] = useState<Set<string>>(new Set(["PAY-EPIC-1"]));
  const epics = EPICS.filter((e) => e.projectKey === pk);
  const sprints = SPRINTS.filter((s) => s.projectKey === pk);
  const active = sprints.find((s) => s.status === "active");
  const planned = sprints.filter((s) => s.status === "planned");
  const unplanned = ALL_ISSUES.filter((i) => i.projectKey === pk && !i.sprint);
  const toggle = (k: string) =>
    setExp((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 flex-wrap">
        {["Filters", "Epic ▾", "Assignee ▾", "Priority ▾", "More ▾"].map((f) => (
          <button
            key={f}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap"
          >
            {f}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-800">
            BACKLOG <span className="text-slate-400 font-normal ml-1">58</span>
          </h2>
          {/* <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
            + Create issue
          </button> */}
        </div>
        {epics.map((epic) => {
          const epicIssues = ALL_ISSUES.filter((i) => i.epicKey === epic.key);
          const isExp = exp.has(epic.key);
          return (
            <div key={epic.key} className="mb-3">
              <div
                className="flex items-center gap-2 py-2 hover:bg-slate-50 rounded-xl px-2 cursor-pointer"
                onClick={() => toggle(epic.key)}
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transform: isExp ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.15s" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                <svg width="13" height="13" viewBox="0 0 24 24" fill={epic.color}>
                  <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                </svg>
                <span className="text-xs font-bold" style={{ color: "#036c5f" }}>
                  {epic.key}
                </span>
                <span className="text-sm font-bold text-slate-800">{epic.name}</span>
                <span className="text-xs text-slate-400 flex-1 truncate">{epic.desc}</span>
                <div className="w-16 flex-shrink-0">
                  <Pbar pct={epic.progress} color={epic.color} />
                </div>
                <span className="text-xs font-bold text-slate-500">{epic.progress}%</span>
                <span className="text-xs text-slate-400">{epic.issueCount}</span>
              </div>
              {isExp && (
                <div className="border border-slate-100 rounded-xl overflow-hidden mb-2">
                  <table className="w-full text-xs">
                    <tbody>
                      {epicIssues.map((issue) => (
                        <tr
                          key={issue.key}
                          className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                          onClick={() => onIssueClick(issue)}
                        >
                          <td className="py-2 px-3 text-slate-300">⠿</td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-1">
                              <TypeIcon type={issue.type} size={12} />
                              <IKey k={issue.key} onClick={() => onIssueClick(issue)} />
                            </div>
                          </td>
                          <td className="py-2 px-3 max-w-[240px]">
                            <span className="text-slate-700 line-clamp-1">{issue.summary}</span>
                          </td>
                          <td className="py-2 px-3">
                            <StatusBadge status={issue.status} />
                          </td>
                          <td className="py-2 px-3">
                            <Pri p={issue.priority} />
                          </td>
                          <td className="py-2 px-3">
                            <Av id={issue.assigneeId} size={20} />
                          </td>
                          <td className="py-2 px-3 font-bold text-slate-400">{issue.points}</td>
                          <td className="py-2 px-3">
                            <div className="flex flex-wrap gap-1">
                              {issue.labels.slice(0, 2).map((l) => (
                                <LPill key={l} label={l} />
                              ))}
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <button className="text-slate-300">⋯</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            FUTURE SPRINTS <span className="font-normal text-slate-400">24</span>
          </h3>
          {planned.map((sprint) => (
            <div key={sprint.id} className="flex items-center gap-3 py-2.5 border-b border-slate-50 text-xs">
              <span className="font-bold text-slate-700">{sprint.name}</span>
              <span className="text-slate-400">
                {sprint.startDate} – {sprint.endDate}
              </span>
              <div className="flex-1" />
              <span className="text-slate-400">{sprint.totalIssues} issues</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ backgroundColor: "#f1f5f9", color: "#64748b" }}
              >
                Planned
              </span>
            </div>
          ))}
        </div>
        {active && (
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">CURRENT SPRINT</h3>
            <div className="flex items-center gap-3 py-2.5 border border-slate-100 rounded-xl px-3 text-xs">
              <span className="font-bold text-slate-700">{active.name}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ backgroundColor: "#d1fae5", color: "#059669" }}
              >
                Active
              </span>
              <span className="text-slate-400">
                {active.startDate} – {active.endDate}
              </span>
              <div className="flex items-center gap-2 flex-1">
                <Pbar pct={72} color="#036c5f" />
                <span className="font-bold">72%</span>
              </div>
              <span className="text-slate-400">
                {active.completed}/{active.totalIssues} issues
              </span>
            </div>
          </div>
        )}
        <div>
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            BACKLOG (UNPLANNED) <span className="font-normal text-slate-400">{unplanned.length}</span>
          </h3>
          {unplanned.map((issue) => (
            <div
              key={issue.key}
              className="flex items-center gap-3 py-2 border-b border-slate-50 hover:bg-slate-50 cursor-pointer text-xs"
              onClick={() => onIssueClick(issue)}
            >
              <span className="text-slate-300">⠿</span>
              <TypeIcon type={issue.type} size={12} />
              <IKey k={issue.key} onClick={() => onIssueClick(issue)} />
              <span className="flex-1 text-slate-700">{issue.summary}</span>
              <Pri p={issue.priority} />
              <Av id={issue.assigneeId} size={20} />
              <span className="font-bold text-slate-400">{issue.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
