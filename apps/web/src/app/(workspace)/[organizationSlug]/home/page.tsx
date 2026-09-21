"use client";
import { useState } from "react";
import type { AppView } from "@/types/app.types";
interface Props {
  setView: (v: AppView) => void;
}

// ─── Tasks ───────────────────────────────────────────────────────────────────
type Priority = "High" | "Medium" | "Low";
type TaskTab = "All" | "Assigned to me" | "Due soon" | "Overdue";

interface Task {
  id: string;
  title: string;
  priority: Priority;
  app: string;
  due: string;
  done: boolean;
}

const ALL_TASKS: Task[] = [
  { id: "PAY-101", title: "Fix duplicate payment transactions", priority: "High", app: "Jira", due: "20 Sep", done: false },
  { id: "AUTH-82", title: "Review OAuth implementation", priority: "Medium", app: "Jira", due: "22 Sep", done: false },
  { id: "UI-203", title: "Review payment dashboard", priority: "Low", app: "Jira", due: "24 Sep", done: false },
  { id: "API-145", title: "Add rate limiting to API gateway", priority: "Medium", app: "Jira", due: "26 Sep", done: false },
  { id: "DOC-12", title: "Update authentication guide", priority: "Low", app: "Confluence", due: "28 Sep", done: false },
];

const PRIORITY_COLOR: Record<Priority, { text: string; bg: string }> = {
  High: { text: "#dc2626", bg: "#fef2f2" },
  Medium: { text: "#d97706", bg: "#fffbeb" },
  Low: { text: "#2563eb", bg: "#eff6ff" },
};

// ─── Mentions ────────────────────────────────────────────────────────────────
const MENTIONS = [
  { type: "channel", name: "#payments", preview: "Alex mentioned you", body: "@Jane please review the latest payment integration changes.", time: "5m ago", unread: true },
  { type: "channel", name: "#engineering", preview: "Sarah mentioned you", body: "@Jane can you update the deployment checklist?", time: "1h ago", unread: true },
  { type: "dm", name: "Mark Johnson", preview: "Direct Message", body: "@Jane can we sync up on the API changes?", time: "2h ago", unread: false, initials: "MJ", color: "#7C3AED" },
];

// ─── Meetings ────────────────────────────────────────────────────────────────
const MEETINGS = [
  { title: "Engineering Standup", sub: "Daily Standup", time: "10:00 AM – 10:30 AM" },
  { title: "Architecture Review", sub: "Project: Payment Gateway", time: "2:00 PM – 3:00 PM" },
  { title: "Sprint Review", sub: "Sprint 24", time: "4:00 PM – 5:00 PM" },
  { title: "Product Sync", sub: "Product Team", time: "5:30 PM – 6:00 PM" },
];

// ─── Knowledge ───────────────────────────────────────────────────────────────
const DOCS = [
  { title: "Payment Architecture", updated: "Updated 20 minutes ago" },
  { title: "Authentication Guidelines", updated: "Updated yesterday" },
  { title: "Engineering Handbook", updated: "Updated 2 days ago" },
  { title: "API Integration Guide", updated: "Updated 3 days ago" },
  { title: "Deployment Playbook", updated: "Updated 5 days ago" },
];

// ─── Activity ─────────────────────────────────────────────────────────────────
const ACTIVITY = [
  { icon: "J", iconBg: "#036c5f", title: "Jane created PAY-101", source: "Jira", time: "10 minutes ago" },
  { icon: "T", iconBg: "#5059C9", title: "Alex mentioned you in #payments", source: "Teams", time: "20 minutes ago" },
  { icon: "A", iconBg: "#172B4D", title: "Payment Architecture updated", source: "Atlas", time: "35 minutes ago" },
  { icon: "P", iconBg: "#ED7B53", title: "Sprint Review scheduled", source: "Parabol", time: "1 hour ago" },
  { icon: "J", iconBg: "#036c5f", title: "API rate limiting added", source: "Jira", time: "2 hours ago" },
];

// ─── AI suggestions ──────────────────────────────────────────────────────────
const AI_QUESTIONS = [
  "What are the biggest risks in our current sprint?",
  "Show me documents related to payment integration",
  "What changed in the payment project this week?",
];

// ─── Hero landscape SVG ──────────────────────────────────────────────────────
function LandscapeIllustration() {
  return (
    <svg viewBox="0 0 340 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <circle cx="270" cy="72" r="58" fill="#036c5f" fillOpacity="0.15" />
      <circle cx="270" cy="72" r="44" fill="#036c5f" fillOpacity="0.2" />
      {/* Mountains */}
      <path d="M0 180 L80 90 L130 130 L180 60 L240 120 L290 80 L340 110 L340 180Z" fill="#036c5f" fillOpacity="0.12" />
      <path d="M0 180 L60 110 L100 140 L150 80 L200 120 L260 70 L310 100 L340 85 L340 180Z" fill="#036c5f" fillOpacity="0.18" />
      <path d="M0 180 L40 130 L90 155 L140 100 L190 140 L230 105 L280 130 L340 115 L340 180Z" fill="#036c5f" fillOpacity="0.1" />
      {/* Birds */}
      <path d="M200 42 Q203 39 206 42" stroke="#036c5f" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M212 36 Q215 33 218 36" stroke="#036c5f" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.4" />
      <path d="M222 44 Q225 41 228 44" stroke="#036c5f" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.3" />
    </svg>
  );
}

export default function DashboardHome({ setView }: Props) {
  const [tasks, setTasks] = useState(ALL_TASKS);
  const [taskTab, setTaskTab] = useState<TaskTab>("All");
  const [aiQuery, setAiQuery] = useState("");

  const toggleTask = (id: string) =>
    setTasks((t) => t.map((tk) => tk.id === id ? { ...tk, done: !tk.done } : tk));

  const TABS: TaskTab[] = ["All", "Assigned to me", "Due soon", "Overdue"];
  const TAB_COUNT: Record<TaskTab, number> = {
    "All": tasks.length,
    "Assigned to me": 5,
    "Due soon": 4,
    "Overdue": 3,
  };

  return (
    <div className="p-4 space-y-4">

      {/* ── Hero greeting card ───────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden flex"
        style={{ backgroundColor: "#ffffff", border: "1px solid #e2e8f0", minHeight: "160px" }}
      >
        {/* Left text */}
        <div className="flex-1 p-7 flex flex-col justify-center">
          <div className="w-10 h-10 rounded-xl bg-[#e6f4f2] flex items-center justify-center mb-4">
            <span style={{ fontSize: "22px" }}>👋</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-1" style={{ fontFamily: "var(--font-display)" }}>
            Good morning, Jane!
          </h2>
          <p className="text-sm text-slate-400 mb-1">Thursday, 11 September 2026</p>
          <p className="text-sm text-slate-500">Here's what's happening across your workspace.</p>
        </div>

        {/* Center stats */}
        <div className="flex flex-col justify-center gap-4 px-8 border-l border-slate-100">
          {[
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>, label: "Organization", value: "Acme Technologies" },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>, label: "Active members", value: "38" },
            { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>, label: "Applications", value: "6" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#e6f4f2] flex items-center justify-center flex-shrink-0">
                {s.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">{s.value}</p>
                <p className="text-xs text-slate-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Right illustration */}
        <div className="w-72 flex-shrink-0 overflow-hidden" style={{ backgroundColor: "#f0faf8" }}>
          <LandscapeIllustration />
        </div>
      </div>

      {/* ── Middle three-column ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* My Work */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
              <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>My Work</span>
            </div>
            <button className="text-xs text-[#036c5f] font-medium hover:text-[#024d44]">View all</button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 px-5 pt-3 pb-0 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setTaskTab(tab)}
                className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium mr-1 transition-all"
                style={{
                  backgroundColor: taskTab === tab ? "#036c5f" : "#f1f5f9",
                  color: taskTab === tab ? "white" : "#64748b",
                }}
              >
                {tab} {tab === "All" ? `(${TAB_COUNT[tab]})` : `(${TAB_COUNT[tab]})`}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-50 mt-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-start gap-3 px-5 py-3 hover:bg-slate-50/60 transition-colors">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all"
                  style={{ borderColor: task.done ? "#036c5f" : "#cbd5e1", backgroundColor: task.done ? "#036c5f" : "transparent" }}
                >
                  {task.done && (
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs text-slate-400 font-mono">{task.id}</p>
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded flex-shrink-0"
                      style={{ backgroundColor: PRIORITY_COLOR[task.priority].bg, color: PRIORITY_COLOR[task.priority].text }}
                    >
                      {task.priority}
                    </span>
                  </div>
                  <p
                    className="text-sm text-slate-700 mt-0.5 leading-snug"
                    style={{ textDecoration: task.done ? "line-through" : "none", color: task.done ? "#94a3b8" : undefined }}
                  >
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{task.app}</span>
                    <span className="text-slate-200 text-xs">·</span>
                    <span className="text-xs text-slate-400">{task.due}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-slate-50">
            <button className="flex items-center gap-1.5 text-xs text-[#036c5f] font-medium hover:text-[#024d44] transition-colors">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add task
            </button>
          </div>
        </div>

        {/* Mentions */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Mentions in Teams</span>
            </div>
            <button className="text-xs text-[#036c5f] font-medium hover:text-[#024d44]">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {MENTIONS.map((m, i) => (
              <div key={i} className="px-5 py-4 hover:bg-slate-50/60 transition-colors cursor-pointer">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: m.type === "channel" ? "#e6f4f2" : (m.color ?? "#036c5f") }}
                  >
                    {m.type === "channel" ? (
                      <span className="text-sm font-bold text-[#036c5f]">#</span>
                    ) : (
                      <span className="text-xs font-bold text-white">{m.initials}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-800">{m.name}</p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-slate-400">{m.time}</span>
                        {m.unread && <span className="w-2 h-2 rounded-full bg-[#036c5f]" />}
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">{m.preview}</p>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.body}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Meetings */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Upcoming Meetings</span>
            </div>
            <button className="text-xs text-[#036c5f] font-medium hover:text-[#024d44]">View all</button>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
            {MEETINGS.map((m, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-[#e6f4f2] flex items-center justify-center flex-shrink-0">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 leading-snug">{m.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{m.sub}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className="text-xs text-slate-400">{m.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom three-column ──────────────────────────────────── */}
      <div className="grid lg:grid-cols-3 gap-4">

        {/* Recent Knowledge */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Recent Knowledge</span>
            </div>
            <button className="text-xs text-[#036c5f] font-medium hover:text-[#024d44]">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {DOCS.map((doc, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group">
                <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 group-hover:text-[#036c5f] transition-colors truncate">{doc.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{doc.updated}</p>
                </div>
                <span
                  className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded"
                  style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
                >
                  Atlas
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
              <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Recent Activity</span>
            </div>
            <button className="text-xs text-[#036c5f] font-medium hover:text-[#024d44]">View all</button>
          </div>
          <div className="divide-y divide-slate-50">
            {ACTIVITY.map((a, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: a.iconBg }}
                >
                  {a.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 leading-snug">{a.title}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-400">{a.source}</span>
                    <span className="text-slate-200">·</span>
                    <span className="text-xs text-slate-400">{a.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI / Intelligence */}
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>AI / Intelligence</span>
          </div>
          <div className="flex-1 p-5 flex flex-col gap-4">
            <div className="bg-[#f0faf8] rounded-xl p-4">
              <p className="text-sm font-semibold text-slate-800 mb-0.5" style={{ fontFamily: "var(--font-display)" }}>
                Ask anything about your workspace
              </p>
              <p className="text-xs text-slate-500">Get AI-powered insights across your work graph.</p>
            </div>
            <div className="flex flex-col gap-2">
              {AI_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => setAiQuery(q)}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-100 hover:border-[#036c5f]/30 hover:bg-[#f0faf8] transition-all text-left group"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 flex-shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="text-xs text-slate-600 group-hover:text-slate-800 leading-relaxed">{q}</span>
                </button>
              ))}
            </div>
            <div className="mt-auto flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-[#036c5f] focus-within:ring-1 focus-within:ring-[#036c5f]/20 transition-all">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask a question…"
                className="flex-1 text-sm bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
              />
              <button
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 transition-all"
                style={{ backgroundColor: aiQuery.trim() ? "#036c5f" : "#cbd5e1" }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}