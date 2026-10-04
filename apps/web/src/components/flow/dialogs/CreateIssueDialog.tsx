import { useState } from "react";
import type { IssueType, IssuePriority, IssueStatus } from "@/types/flow.types";
import { ASSIGNEES, PROJECTS, EPICS, PRIORITY_CFG, STATUS_CFG, SPRINTS, ga } from "@/components/flow/flow.data";
import { Pri, Av, LPill, ProjAv, TypeIcon, StatusBadge } from "../flow.atoms";

interface CreateIssueDialogProps {
  onClose: () => void;
  projectKey?: string;
}
export function CreateIssueDialog({ onClose, projectKey: initPk }: CreateIssueDialogProps) {
  const [type, setType] = useState<IssueType>("task");
  const [summary, setSummary] = useState("");
  const [desc, setDesc] = useState("");
  const [priority, setPriority] = useState<IssuePriority>("medium");
  const [status, setStatus] = useState<IssueStatus>("todo");
  const [assigneeId, setAssigneeId] = useState("rahul");
  const [sprint, setSprint] = useState("Sprint 24");
  const [epic, setEpic] = useState(EPICS[0].key);
  const [pk, setPk] = useState(initPk ?? "PAY");
  const [showAdv, setShowAdv] = useState(false);
  const [labels, setLabels] = useState<string[]>(["payments"]);
  const [points, setPoints] = useState("5");
  const [newLabel, setNewLabel] = useState("");
  const projEpics = EPICS.filter((e) => e.projectKey === pk);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-5xl mx-4 rounded-2xl bg-white shadow-2xl border border-slate-200 flex overflow-hidden"
        style={{ maxHeight: "90vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
            <h2 className="text-base font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
              Create Issue
            </h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Project *
                </label>
                <select
                  value={pk}
                  onChange={(e) => setPk(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {PROJECTS.map((pr) => (
                    <option key={pr.key} value={pr.key}>
                      {pr.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Issue Type *
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as IssueType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {(["bug", "story", "task", "improvement"] as IssueType[]).map((v) => (
                    <option key={v} value={v} className="capitalize">
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Summary *
              </label>
              <div className="relative">
                <input
                  autoFocus
                  value={summary}
                  onChange={(e) => setSummary(e.target.value.slice(0, 255))}
                  placeholder="Enter a concise summary"
                  className={`w-full px-3 py-2.5 rounded-xl border outline-none text-sm text-slate-800 placeholder-slate-300 ${summary === "" ? "border-slate-200" : "border-teal-400"}`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
                  {summary.length}/255
                </span>
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Description
              </label>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-slate-100 bg-slate-50 flex-wrap">
                  {["B", "I", "U"].map((t) => (
                    <button key={t} className="w-7 h-7 rounded font-bold text-xs text-slate-600 hover:bg-slate-200">
                      {t}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  {["≡", "⊡", "≣"].map((t) => (
                    <button key={t} className="w-7 h-7 rounded text-sm text-slate-500 hover:bg-slate-200">
                      {t}
                    </button>
                  ))}
                  <div className="w-px h-4 bg-slate-200 mx-1" />
                  {["🔗", "📷", "</>"].map((t) => (
                    <button key={t} className="w-7 h-7 rounded text-xs text-slate-500 hover:bg-slate-200">
                      {t}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={4}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Describe the issue in detail…"
                  className="w-full px-3 py-2.5 text-sm text-slate-700 placeholder-slate-300 outline-none resize-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Assignee
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {ASSIGNEES.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Reporter
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 bg-slate-50">
                  <Av id="rahul" size={18} />
                  <span className="text-sm text-slate-700">Rahul Sharma</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Priority *
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as IssuePriority)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {(["highest", "high", "medium", "low", "lowest"] as IssuePriority[]).map((v) => (
                    <option key={v} value={v}>
                      {PRIORITY_CFG[v].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as IssueStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {(["todo", "in-progress", "in-review", "done", "blocked"] as IssueStatus[]).map((v) => (
                    <option key={v} value={v}>
                      {STATUS_CFG[v].label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Sprint
                </label>
                <select
                  value={sprint}
                  onChange={(e) => setSprint(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {SPRINTS.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name} ({s.status})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Epic
                </label>
                <select
                  value={epic}
                  onChange={(e) => setEpic(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                >
                  {projEpics.map((e) => (
                    <option key={e.key} value={e.key}>
                      {e.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Story Points
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Labels
              </label>
              <div className="flex flex-wrap gap-1.5 items-center border border-slate-200 rounded-xl px-3 py-2 min-h-10">
                {labels.map((l) => (
                  <div key={l} className="flex items-center gap-1">
                    <LPill label={l} />
                    <button
                      onClick={() => setLabels((ls) => ls.filter((x) => x !== l))}
                      className="text-slate-300 hover:text-slate-500 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && newLabel.trim()) {
                      setLabels((l) => [...l, newLabel.trim()]);
                      setNewLabel("");
                    }
                  }}
                  placeholder="Add label…"
                  className="text-xs outline-none text-slate-600 placeholder-slate-300 min-w-16 flex-1"
                />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">
                Attachments
              </label>
              <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center gap-1 text-center">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                >
                  <polyline points="16 16 12 12 8 16" />
                  <line x1="12" y1="12" x2="12" y2="21" />
                  <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
                </svg>
                <p className="text-xs text-slate-500">
                  Drag and drop or{" "}
                  <button className="underline font-semibold" style={{ color: "#036c5f" }}>
                    browse
                  </button>
                </p>
                <p className="text-[10px] text-slate-400">Max 50 MB</p>
              </div>
            </div>
            <div>
              <button
                onClick={() => setShowAdv(!showAdv)}
                className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-3"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ transform: showAdv ? "rotate(0)" : "rotate(-90deg)", transition: "transform 0.15s" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Advanced
              </button>
              {showAdv && (
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ["Parent Issue", "Search parent issue"],
                    ["Dependencies", "Blocked by…"],
                    ["Related Docs", "Search Atlas docs"],
                    ["Related Conversation", "Search conversations"],
                  ].map(([l, ph]) => (
                    <div key={l}>
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                        {l}
                      </label>
                      <input
                        placeholder={ph}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-xs text-slate-600 placeholder-slate-300"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 text-sm font-bold text-white rounded-xl shadow-md"
              style={{ backgroundColor: "#036c5f" }}
            >
              Create Issue
            </button>
          </div>
        </div>
        {/* Preview Panel */}
        <div className="w-72 flex-shrink-0 border-l border-slate-100 flex flex-col bg-slate-50 overflow-y-auto">
          <div className="px-5 py-4 border-b border-slate-100 bg-white flex-shrink-0">
            <p className="text-xs font-bold text-slate-700">Live Preview</p>
            <p className="text-[10px] text-slate-400">How your issue will look.</p>
          </div>
          <div className="p-4">
            <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4">
              <div className="flex items-center gap-1.5 mb-2">
                <ProjAv pk={pk} size={16} />
                <span className="text-xs font-bold text-slate-500">{pk}-NEW</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-3 min-h-8">
                {summary || <span className="text-slate-300">Summary will appear here</span>}
              </p>
              <div className="flex items-center gap-2 mb-3">
                <TypeIcon type={type} size={14} />
                <span className="text-xs capitalize text-slate-500">{type}</span>
                <StatusBadge status={status} />
              </div>
              <div className="space-y-1.5 text-xs">
                {[
                  [
                    "Assignee",
                    <div key="a" className="flex items-center gap-1 justify-end">
                      <Av id={assigneeId} size={16} />
                      <span>{ga(assigneeId)?.name.split(" ")[0]}</span>
                    </div>,
                  ],
                  [
                    "Priority",
                    <div key="p" className="flex items-center gap-1 justify-end">
                      <Pri p={priority} />
                      <span style={{ color: PRIORITY_CFG[priority].color }}>{PRIORITY_CFG[priority].label}</span>
                    </div>,
                  ],
                  ["Sprint", sprint],
                  ["Points", points],
                  [
                    "Labels",
                    <div key="l" className="flex flex-wrap gap-1 justify-end">
                      {labels.map((l) => (
                        <LPill key={l} label={l} />
                      ))}
                    </div>,
                  ],
                ].map(([l, v], i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-slate-400">{l}</span>
                    <div className="font-medium text-slate-700">{v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-xl" style={{ backgroundColor: "#e6f4f2" }}>
              <p className="text-xs font-bold text-slate-700 mb-1">💡 Writing tips</p>
              <p className="text-[11px] text-slate-600">
                Use clear, actionable summaries. Add reproduction steps in the description for bugs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
