"use client";

import { useState } from "react";
import { ALL_ISSUES, Issue } from "@/components/flow/flow.data";
import IssueTable from "@/components/flow/IssueTable";

export default function ProjectIssueList({ pk, onIssueClick }: { pk: string; onIssueClick: (i: Issue) => void }) {
  const [search, setSearch] = useState("");
  const issues = ALL_ISSUES.filter((i) => i.projectKey === pk);
  const filtered = issues.filter(
    (i) => i.summary.toLowerCase().includes(search.toLowerCase()) || i.key.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-slate-100">
        <h2 className="text-base font-bold text-slate-900 mb-2">Issues</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none"
              style={{ width: 160 }}
            />
          </div>
          {["Assignee", "Status", "Priority", "Sprint", "Epic", "Labels", "Due date"].map((f) => (
            <button
              key={f}
              className="px-2.5 py-1 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 whitespace-nowrap"
            >
              {f} ▾
            </button>
          ))}
        </div>
      </div>
      <IssueTable issues={filtered} onIssueClick={onIssueClick} />
      <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          Rows per page:{" "}
          <select className="border rounded px-1 outline-none text-xs">
            <option>25</option>
            <option>50</option>
          </select>
        </div>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              className="w-6 h-6 rounded text-xs font-semibold"
              style={{ backgroundColor: n === 1 ? "#036c5f" : "transparent", color: n === 1 ? "white" : "#64748b" }}
            >
              {n}
            </button>
          ))}
          <button className="w-6 h-6 rounded hover:bg-slate-100">›</button>
        </div>
      </div>
    </div>
  );
}
