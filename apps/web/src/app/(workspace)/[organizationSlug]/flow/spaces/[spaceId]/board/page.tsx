"use client";

import { useState } from "react";
import { SPRINTS, ALL_ISSUES, Issue } from "@/components/flow/flow.data";
import { IssueStatus } from "@/types/flow.types";
import { Av, IKey, Pri, TypeIcon, LPill } from "@/components/flow/flow.atoms";

const BOARD_COLS: { id: IssueStatus; label: string; color: string }[] = [
  // { id: "backlog", label: "BACKLOG", color: "#94a3b8" },
  { id: "todo", label: "TO DO", color: "#94a3b8" },
  { id: "in-progress", label: "IN PROGRESS", color: "#2563eb" },
  { id: "in-review", label: "REVIEW", color: "#7c3aed" },
  { id: "done", label: "DONE", color: "#059669" },
];

export default function ProjectBoard({
  pk,
  onIssueClick,
  onCreateIssue,
}: {
  pk: string;
  onIssueClick: (i: Issue) => void;
  onCreateIssue: () => void;
}) {
  const [dragOver, setDragOver] = useState<IssueStatus | null>(null);
  const sprint = SPRINTS.find((s) => s.status === "active" && s.projectKey === pk) ?? SPRINTS[0];
  const issues = ALL_ISSUES.filter((i) => i.projectKey === pk);
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 py-2.5 border-b border-slate-100">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          {sprint.name} (Active) ▾
        </div>
        <span className="text-xs text-slate-400">
          {sprint.startDate} – {sprint.endDate} · {sprint.daysLeft ?? 13} days left
        </span>
        <div className="flex-1" />
        <button className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          Filters ▾
        </button>
        {/* <button
          onClick={onCreateIssue}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold text-white"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Issue
        </button> */}
      </div>
      <div className="flex gap-3 p-4 overflow-x-auto flex-1 min-h-0">
        {BOARD_COLS.map((col) => {
          const colIssues = issues.filter((i) => i.status === col.id);
          return (
            <div
              key={col.id}
              className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden"
              style={{
                width: 240,
                backgroundColor: dragOver === col.id ? "#e6f4f2" : "#f8fafc",
                border: `1px solid ${dragOver === col.id ? "#036c5f40" : "#e2e8f0"}`,
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(col.id);
              }}
              onDragLeave={() => setDragOver(null)}
              onDrop={() => setDragOver(null)}
            >
              <div className="px-3 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="h-0.5 w-5 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[10px] font-bold text-slate-600 tracking-wider">{col.label}</span>
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        col.id === "in-progress"
                          ? "#dbeafe"
                          : col.id === "in-review"
                            ? "#ede9fe"
                            : col.id === "done"
                              ? "#d1fae5"
                              : "#f1f5f9",
                      color: col.color,
                    }}
                  >
                    {colIssues.length}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {colIssues.map((issue) => (
                  <div
                    key={issue.key}
                    draggable
                    onClick={() => onIssueClick(issue)}
                    className="bg-white rounded-xl p-3 cursor-pointer border border-slate-100 hover:shadow-md hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-1.5">
                      <IKey k={issue.key} />
                      <Av id={issue.assigneeId} size={20} />
                    </div>
                    <p className="text-xs font-medium text-slate-800 mb-2 leading-snug">{issue.summary}</p>
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <TypeIcon type={issue.type} size={11} />
                      <Pri p={issue.priority} />
                      {issue.labels.slice(0, 1).map((l) => (
                        <LPill key={l} label={l} />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400">{issue.dueDate?.replace(" 2025", "")}</span>
                      <span className="text-[10px] font-bold text-slate-400">{issue.points}</span>
                    </div>
                  </div>
                ))}
                <button className="w-full flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 py-1.5 px-2 rounded-lg hover:bg-slate-100">
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Create issue
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
