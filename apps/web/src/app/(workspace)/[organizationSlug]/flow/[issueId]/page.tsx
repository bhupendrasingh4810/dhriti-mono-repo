"use client";

import { useState } from "react";
import { Issue, STATUS_CFG, PRIORITY_CFG, ga, gp, EPICS } from "@/components/flow/flow.data";
import { Av, Pri, TypeIcon, LPill, StatusBadge, IKey } from "@/components/flow/flow.atoms";
import { IssueStatus, IssuePriority } from "@/types/flow.types";
export default function IssueDetailPage({
  issue,
  onBack,
  onProjectClick,
  onCreateIssue,
}: {
  issue: Issue;
  onBack: () => void;
  onProjectClick: (k: string) => void;
  onCreateIssue: () => void;
}) {
  const [tab, setTab] = useState("comments");
  const [comment, setComment] = useState("");
  const a = ga(issue.assigneeId);
  const p = gp(issue.projectKey);
  const epic = issue.epicKey ? EPICS.find((e) => e.key === issue.epicKey) : null;
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-100 text-xs text-slate-500 bg-white flex-shrink-0">
        <button
          className="hover:underline font-semibold"
          style={{ color: "#036c5f" }}
          onClick={() => onProjectClick("")}
        >
          Projects
        </button>
        <span>/</span>
        <button
          className="hover:underline font-semibold"
          style={{ color: "#036c5f" }}
          onClick={() => onProjectClick(issue.projectKey)}
        >
          {p.name}
        </button>
        <span>/</span>
        <button className="hover:underline font-semibold" style={{ color: "#036c5f" }} onClick={onBack}>
          Issues
        </button>
        <span>/</span>
        <span className="text-slate-700 font-semibold">{issue.key}</span>
        <div className="flex-1" />
        <button className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
          ↗ Share
        </button>
        <button className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">⋯</button>
      </div>
      <div className="flex flex-1 overflow-hidden">
        {/* Main */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex items-center gap-2 mb-3">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold"
              style={{
                color: STATUS_CFG[issue.status].color,
                backgroundColor: STATUS_CFG[issue.status].bg,
                borderColor: STATUS_CFG[issue.status].color + "40",
              }}
            >
              {STATUS_CFG[issue.status].label}
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">⋯</button>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-display)" }}>
            {issue.summary}
          </h1>
          <div className="flex items-center gap-2 flex-wrap mb-6">
            {[
              { l: "✏️ Edit", primary: true },
              { l: "👤 Assign" },
              { l: "🔄 Change status" },
              { l: "📝 Create subtask" },
              { l: "🔗 Link issue" },
              { l: "⋯" },
            ].map((b) => (
              <button
                key={b.l}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors"
                style={{
                  borderColor: b.primary ? "#036c5f" : "#e2e8f0",
                  color: b.primary ? "white" : "#475569",
                  backgroundColor: b.primary ? "#036c5f" : "white",
                }}
              >
                {b.l}
              </button>
            ))}
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">Description</h3>
            <div className="text-sm text-slate-600 leading-relaxed p-4 rounded-xl border border-slate-100 bg-slate-50 min-h-24">
              <p className="mb-3">
                Users are experiencing duplicate transactions being created when they retry failed payments. This is
                causing customers to be charged multiple times for the same order.
              </p>
              <ul className="list-disc list-inside space-y-1 mb-3 text-slate-500 text-xs">
                <li>Issue observed in both card and wallet payment flows.</li>
                <li>More frequent under high load and network latency.</li>
                <li>Affects reconciliation and financial reporting.</li>
              </ul>
            </div>
          </div>
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Attachments <span className="text-slate-400 font-normal text-xs">3</span>
            </h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { n: "duplicate_txn_logs.csv", s: "24 KB", i: "📊" },
                { n: "payment-flow-diagram.png", s: "128 KB", i: "🖼️" },
                { n: "error-trace.log", s: "18 KB", i: "📄" },
              ].map((f) => (
                <div
                  key={f.n}
                  className="border border-slate-200 rounded-xl p-3 bg-slate-50 hover:bg-white cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{f.i}</span>
                    <button className="text-slate-400 text-xs">↓</button>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{f.n}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{f.s}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-0 border-b border-slate-100 mb-4">
            {[
              { id: "comments", l: "Comments", n: issue.comments ?? 0 },
              { id: "activity", l: "Activity" },
              { id: "worklog", l: "Work log" },
              { id: "history", l: "History" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap"
                style={{
                  borderColor: tab === t.id ? "#036c5f" : "transparent",
                  color: tab === t.id ? "#036c5f" : "#64748b",
                }}
              >
                {"n" in t && (t.n ?? 0) > 0 ? `${t.l} ${t.n}` : t.l}
              </button>
            ))}
          </div>
          {tab === "comments" && (
            <div>
              <div className="flex items-start gap-3 mb-5">
                <Av id="rahul" size={30} />
                <div className="flex-1">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment… (Pro tip: press M)"
                    className="w-full px-4 py-3 text-sm outline-none text-slate-700 placeholder-slate-300 rounded-xl border border-slate-200 focus:border-teal-500"
                  />
                  {comment && (
                    <button
                      className="mt-2 px-4 py-1.5 rounded-xl text-xs font-bold text-white"
                      style={{ backgroundColor: "#036c5f" }}
                    >
                      Save
                    </button>
                  )}
                </div>
              </div>
              {[
                {
                  who: "rahul",
                  txt: "Root cause identified — the payment callback isn't checking for existing transaction IDs before creating new ones. Working on idempotency fix.",
                  when: "2 days ago",
                },
                {
                  who: "amit",
                  txt: "Can we add a safeguard at the gateway level to prevent duplicate captures?",
                  when: "2 days ago",
                },
                { who: "priya", txt: "QA validated the fix in staging. Looks good to merge.", when: "1 day ago" },
              ].map((c, i) => (
                <div key={i} className="flex items-start gap-3 mb-4">
                  <Av id={c.who} size={28} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-800">{ga(c.who)?.name}</span>
                      <span className="text-xs text-slate-400">{c.when}</span>
                    </div>
                    <p className="text-sm text-slate-600">{c.txt}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-400">
                      <button className="hover:text-slate-600">👍 Like</button>
                      <button className="hover:text-slate-600">Reply</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {tab !== "comments" && <div className="text-sm text-slate-400 py-8 text-center">No {tab} entries yet.</div>}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-800 mb-3">
              Subtasks <span className="text-slate-400 font-normal text-xs">2</span>
            </h3>
            <div className="border border-slate-100 rounded-xl overflow-hidden mb-2">
              {[
                {
                  key: "PAY-123",
                  summary: "Add idempotency key validation to API",
                  status: "done" as IssueStatus,
                  assigneeId: "amit",
                  priority: "high" as IssuePriority,
                  points: 3,
                },
                {
                  key: "PAY-124",
                  summary: "Prevent duplicate capture at gateway level",
                  status: "in-progress" as IssueStatus,
                  assigneeId: "priya",
                  priority: "high" as IssuePriority,
                  points: 5,
                },
              ].map(
                (st: {
                  key: string;
                  summary: string;
                  status: IssueStatus;
                  assigneeId: string;
                  priority: IssuePriority;
                  points: number;
                }) => (
                  <div
                    key={st.key}
                    className="flex items-center gap-3 px-3 py-2.5 border-b border-slate-50 hover:bg-slate-50 text-xs"
                  >
                    {st.status === "done" ? (
                      <span className="text-green-500">✔</span>
                    ) : (
                      <span className="text-slate-300 text-base">○</span>
                    )}
                    <IKey k={st.key} />
                    <span className="flex-1 text-slate-700">{st.summary}</span>
                    <Av id={st.assigneeId} size={18} />
                    <StatusBadge status={st.status} />
                    <Pri p={st.priority} />
                    <span className="font-bold text-slate-400">{st.points}</span>
                  </div>
                ),
              )}
            </div>
            <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
              + Create subtask
            </button>
          </div>
        </div>
        {/* Right Sidebar */}
        <div className="w-72 flex-shrink-0 border-l border-slate-100 overflow-y-auto">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-800">Details</h3>
            </div>
            <div className="space-y-0">
              {[
                { l: "Status", v: <StatusBadge status={issue.status} /> },
                {
                  l: "Assignee",
                  v: (
                    <div className="flex items-center gap-1.5">
                      <Av id={issue.assigneeId} size={18} />
                      <span>{a?.name}</span>
                    </div>
                  ),
                },
                {
                  l: "Reporter",
                  v: (
                    <div className="flex items-center gap-1.5">
                      <Av id="amit" size={18} />
                      <span>Amit Singh</span>
                    </div>
                  ),
                },
                {
                  l: "Priority",
                  v: (
                    <div className="flex items-center gap-1">
                      <Pri p={issue.priority} />
                      <span style={{ color: PRIORITY_CFG[issue.priority].color }}>
                        {PRIORITY_CFG[issue.priority].label}
                      </span>
                    </div>
                  ),
                },
                {
                  l: "Type",
                  v: (
                    <div className="flex items-center gap-1">
                      <TypeIcon type={issue.type} size={13} />
                      <span className="capitalize">{issue.type}</span>
                    </div>
                  ),
                },
                { l: "Sprint", v: issue.sprint ?? <span className="text-slate-300">None</span> },
                {
                  l: "Epic",
                  v: epic ? (
                    <span className="font-semibold" style={{ color: "#7c3aed" }}>
                      {epic.name}
                    </span>
                  ) : (
                    <span className="text-slate-300">None</span>
                  ),
                },
                {
                  l: "Labels",
                  v: (
                    <div className="flex flex-wrap gap-1">
                      {issue.labels.map((l) => (
                        <LPill key={l} label={l} />
                      ))}
                    </div>
                  ),
                },
                { l: "Points", v: issue.points },
                { l: "Due Date", v: issue.dueDate || "—" },
              ].map((row) => (
                <div
                  key={row.l as string}
                  className="flex items-start justify-between py-2 border-b border-slate-50 text-xs"
                >
                  <span className="text-slate-400 w-20 flex-shrink-0">{row.l}</span>
                  <div className="font-medium text-slate-700 flex-1 text-right">{row.v}</div>
                </div>
              ))}
            </div>
          </div>
          {[
            { l: "Linked Issues", n: 3 },
            { l: "Dependencies", n: 1 },
            { l: "Conversations", n: 2 },
            { l: "Knowledge", n: 1 },
            { l: "Meetings", n: 1 },
            { l: "Decisions", n: 1 },
          ].map((r) => (
            <div
              key={r.l}
              className="p-4 border-b border-slate-100 flex items-center justify-between cursor-pointer hover:bg-slate-50"
            >
              <span className="text-xs font-bold text-slate-700">{r.l}</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{r.n}</span>
                <svg
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
