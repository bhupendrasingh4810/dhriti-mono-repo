"use client";

import { useState } from "react";
import { ProjectsLayout } from "./projects/projects-layout";
import type { FlowNavView, IssueType, IssueStatus, IssuePriority, ProjectHealth, ProjectTab, NavView } from "@/types/flow.types";
import { StatusBadge, Pri, HealthBadge, Av, AvStack, Pbar, IKey, ProjAv, LPill, TypeIcon } from "@/components/flow/flow.atoms";
import { Issue, PROJECTS, EPICS, ALL_ISSUES, ASSIGNEES, SPRINTS, PRIORITY_CFG, STATUS_CFG, ga, gp } from "@/components/flow/flow.data";
import { CreateIssueDialog } from "@/components/flow/dialogs/CreateIssueDialog";
import { redirect } from "next/navigation";
import Link from "next/link";
import IssueTable from "@/components/flow/IssueTable";
import IssueDetailPage from "./[issueId]/page";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}

/* ═══════════════════════════════════════════
   ISSUE DRAWER
═══════════════════════════════════════════ */
function IssueDrawer({ issue, onClose }: { issue: Issue; onClose: () => void }) {
  const a = ga(issue.assigneeId); const p = gp(issue.projectKey);
  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative h-full w-full max-w-xl bg-white shadow-2xl flex flex-col" style={{ borderLeft: "1px solid #e2e8f0" }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2"><ProjAv pk={issue.projectKey} size={20} /><span className="text-xs font-bold text-slate-400">{issue.key}</span><TypeIcon type={issue.type} /><StatusBadge status={issue.status} /></div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <h2 className="text-xl font-bold text-slate-900 mb-4" style={{ fontFamily: "var(--font-display)" }}>{issue.summary}</h2>
          {issue.labels.length > 0 && <div className="flex flex-wrap gap-1 mb-4">{issue.labels.map(l => <LPill key={l} label={l} />)}</div>}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 mb-5 text-sm">
            {[{ l: "Assignee", v: <div className="flex items-center gap-1.5"><Av id={issue.assigneeId} size={20} /><span>{a?.name}</span></div> }, { l: "Reporter", v: "Rahul Sharma" }, { l: "Priority", v: <div className="flex items-center gap-1.5"><Pri p={issue.priority} /><span>{PRIORITY_CFG[issue.priority].label}</span></div> }, { l: "Status", v: <StatusBadge status={issue.status} /> }, { l: "Project", v: p.name }, { l: "Sprint", v: issue.sprint ?? "Backlog" }, { l: "Points", v: issue.points }, { l: "Due Date", v: issue.dueDate || "—" }].map(row => (
              <div key={row.l}><p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{row.l}</p><div className="text-sm font-medium text-slate-700">{row.v}</div></div>
            ))}
          </div>
          <div className="mb-5"><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Description</p><div className="text-sm text-slate-500 leading-relaxed p-3 rounded-xl border border-slate-100 min-h-16">No description added yet.</div></div>
          <div><p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Activity ({issue.comments ?? 0})</p><div className="flex gap-2"><Av id="rahul" size={26} /><input placeholder="Add a comment…" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-teal-500" /></div></div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   GLOBAL ISSUES VIEW
═══════════════════════════════════════════ */
// function GlobalIssuesView({ onIssueClick, onCreateIssue }: { onIssueClick: (i: Issue) => void; onCreateIssue: () => void }) {
//   const [savedFilter, setSavedFilter] = useState("All Issues");
//   const [projF, setProjF] = useState("All");
//   const [typeF, setTypeF] = useState("All");
//   const [statusF, setStatusF] = useState("All");
//   const [priF, setPriF] = useState("All");
//   const [assigneeF, setAssigneeF] = useState("All");
//   const [search, setSearch] = useState("");
//   const SAVED = [
//     { l: "My Open Issues", n: 11 }, { l: "Reported by Me", n: 7 }, { l: "Due This Week", n: 9 },
//     { l: "Overdue Issues", n: 6, red: true }, { l: "High Priority", n: 14 }, { l: "Blocked Issues", n: 3 },
//     { l: "Recently Updated", n: 20 }, { l: "All Issues", n: 142 }
//   ];
//   const RECENT = ["payment failure", "login issue", "bug", "API timeout", "refund"];
//   let issues = ALL_ISSUES;
//   if (projF !== "All") issues = issues.filter(i => i.projectKey === projF);
//   if (typeF !== "All") issues = issues.filter(i => i.type === typeF);
//   if (statusF !== "All") issues = issues.filter(i => i.status === statusF);
//   if (priF !== "All") issues = issues.filter(i => i.priority === priF);
//   if (assigneeF !== "All") issues = issues.filter(i => i.assigneeId === assigneeF);
//   if (search) issues = issues.filter(i => i.summary.toLowerCase().includes(search.toLowerCase()) || i.key.toLowerCase().includes(search.toLowerCase()));
//   return (
//     <div className="flex h-full overflow-hidden">
//       {/* Saved Filters Sidebar */}
//       <div className="w-52 flex-shrink-0 border-r border-slate-100 flex flex-col overflow-y-auto">
//         <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
//           <span className="text-xs font-bold text-slate-700">Saved filters</span>
//           <button className="text-slate-400 hover:text-slate-600 font-bold text-lg leading-none">+</button>
//         </div>
//         <div className="flex-1 py-1">
//           {SAVED.map(f => (
//             <button key={f.l} onClick={() => setSavedFilter(f.l)} className="w-full flex items-center justify-between px-4 py-1.5 text-xs transition-colors"
//               style={{ backgroundColor: savedFilter === f.l ? "#e6f4f2" : "transparent", color: savedFilter === f.l ? "#036c5f" : ("red" in f && f.red) ? "#dc2626" : "#475569", fontWeight: savedFilter === f.l ? 700 : 500 }}>
//               <span>{f.l}</span>
//               <span className="font-bold" style={{ color: ("red" in f && f.red) ? "#dc2626" : savedFilter === f.l ? "#036c5f" : "#94a3b8" }}>{f.n}</span>
//             </button>
//           ))}
//         </div>
//         <div className="border-t border-slate-100 px-4 py-3">
//           <div className="flex items-center justify-between mb-2">
//             <span className="text-xs font-bold text-slate-700">Recent searches</span>
//             <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>Clear</button>
//           </div>
//           {RECENT.map(r => (
//             <button key={r} onClick={() => setSearch(r)} className="flex items-center gap-2 py-1 text-xs text-slate-500 hover:text-slate-700 w-full text-left">
//               <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//               {r}
//             </button>
//           ))}
//         </div>
//       </div>
//       {/* Main Content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
//           <div>
//             <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Issues</h1>
//             <p className="text-xs text-slate-400 mt-0.5">Search and manage issues across all projects.</p>
//           </div>
//           <div className="flex items-center gap-2">
//             <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 flex items-center gap-1.5">
//               <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v14a2 2 0 0 1-2 2z" /></svg>
//               Save filter
//             </button>
//             <button onClick={onCreateIssue} className="px-4 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5" style={{ backgroundColor: "#036c5f" }}>
//               <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
//               Create Issue
//             </button>
//           </div>
//         </div>
//         {/* Filter Bar */}
//         <div className="px-5 py-3 border-b border-slate-100 space-y-2">
//           <div className="flex flex-wrap gap-2">
//             {[
//               { l: "Project", v: projF, opts: ["All", ...PROJECTS.map(p => p.key)], set: setProjF },
//               { l: "Issue Type", v: typeF, opts: ["All", "bug", "story", "task", "improvement"], set: setTypeF },
//               { l: "Status", v: statusF, opts: ["All", "backlog", "todo", "in-progress", "in-review", "done", "blocked"], set: setStatusF },
//               { l: "Priority", v: priF, opts: ["All", "highest", "high", "medium", "low", "lowest"], set: setPriF },
//               { l: "Assignee", v: assigneeF, opts: ["All", ...ASSIGNEES.map(a => a.id)], set: setAssigneeF },
//             ].map(f => (
//               <div key={f.l} className="flex flex-col">
//                 <label className="text-[10px] text-slate-400 mb-0.5">{f.l}</label>
//                 <select value={f.v} onChange={e => f.set(e.target.value)} className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none min-w-24">
//                   {f.opts.map(o => <option key={o}>{o}</option>)}
//                 </select>
//               </div>
//             ))}
//             {["Reporter", "Sprint", "Epic", "Label", "Created", "Updated", "Due Date"].map(f => (
//               <div key={f} className="flex flex-col">
//                 <label className="text-[10px] text-slate-400 mb-0.5">{f}</label>
//                 <select className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none min-w-24"><option>All</option></select>
//               </div>
//             ))}
//           </div>
//           <div className="flex items-center gap-2">
//             <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-500 hover:bg-slate-50">Reset</button>
//             <button className="px-4 py-1.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#036c5f" }}>Apply filters</button>
//             <div className="flex-1" />
//             <div className="relative">
//               <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
//               <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues…" className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none" style={{ width: 160 }} />
//             </div>
//             <button className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">Columns ▾</button>
//           </div>
//         </div>
//         <IssueTable issues={issues} onIssueClick={onIssueClick} showProject={true} />
//         <div className="flex items-center justify-between px-5 py-2.5 border-t border-slate-100 text-xs text-slate-400">
//           <div className="flex items-center gap-2">Rows per page:<select className="border rounded px-1 outline-none text-xs ml-1"><option>25</option><option>50</option><option>100</option></select></div>
//           <span>1–{Math.min(25, issues.length)} of {issues.length}</span>
//           <div className="flex gap-1 items-center">
//             {[1, 2, 3, 4, 5].map(n => <button key={n} className="w-6 h-6 rounded text-xs font-semibold" style={{ backgroundColor: n === 1 ? "#036c5f" : "transparent", color: n === 1 ? "white" : "#64748b" }}>{n}</button>)}
//             <button className="w-6 h-6 flex items-center justify-center text-slate-400 hover:bg-slate-100">›</button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

/* ═══════════════════════════════════════════
   GLOBAL SPRINTS VIEW
═══════════════════════════════════════════ */
// function GlobalSprintsView({ onCreateSprint }: { onCreateSprint?: () => void }) {
//   const [projF, setProjF] = useState("All");
//   const [statusF, setStatusF] = useState("All");
//   const [search, setSearch] = useState("");
//   const allSprints = [
//     ...SPRINTS,
//     { id: "sp23", name: "Sprint 23", projectKey: "PAY", status: "completed" as const, startDate: "04 May", endDate: "17 May 2025", goal: "Complete auth flow refactor.", totalIssues: 38, completed: 38, inProgress: 0, remaining: 0, blocked: 0, estimate: 0 },
//     { id: "sp22", name: "Sprint 22", projectKey: "PLAT", status: "completed" as const, startDate: "20 Apr", endDate: "03 May 2025", goal: "API rate limiting improvements.", totalIssues: 30, completed: 30, inProgress: 0, remaining: 0, blocked: 0, estimate: 0 },
//     { id: "sp21", name: "Sprint 21", projectKey: "MOB", status: "completed" as const, startDate: "06 Apr", endDate: "19 Apr 2025", goal: "Onboarding UX overhaul.", totalIssues: 24, completed: 24, inProgress: 0, remaining: 0, blocked: 0, estimate: 0 },
//     { id: "sp20", name: "Sprint 20", projectKey: "WEB", status: "completed" as const, startDate: "23 Mar", endDate: "05 Apr 2025", goal: "Homepage redesign.", totalIssues: 28, completed: 28, inProgress: 0, remaining: 0, blocked: 0, estimate: 0 },
//     { id: "sp19", name: "Sprint 19", projectKey: "DATA", status: "completed" as const, startDate: "09 Mar", endDate: "22 Mar 2025", goal: "Analytics pipeline rebuild.", totalIssues: 32, completed: 32, inProgress: 0, remaining: 0, blocked: 0, estimate: 0 },
//   ];
//   let filtered = allSprints;
//   if (projF !== "All") filtered = filtered.filter(s => s.projectKey === projF);
//   if (statusF !== "All") filtered = filtered.filter(s => s.status === statusF);
//   if (search) filtered = filtered.filter(s => s.name.toLowerCase().includes(search.toLowerCase()) || s.goal.toLowerCase().includes(search.toLowerCase()));
//   const active = filtered.filter(s => s.status === "active");
//   const planned = filtered.filter(s => s.status === "planned");
//   const completed = filtered.filter(s => s.status === "completed");
//   const pct = (s: typeof allSprints[0]) => s.totalIssues > 0 ? Math.round((s.completed / s.totalIssues) * 100) : 0;
//   const SprintRow = ({ s }: { s: typeof allSprints[0] }) => (
//     <tr className="border-b border-slate-50 hover:bg-slate-50 text-xs">
//       <td className="py-3 px-4">
//         <div className="flex items-center gap-2">
//           <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.status === "active" ? "bg-purple-500" : s.status === "completed" ? "bg-green-500" : "bg-slate-300"}`} />
//           <span className="font-bold text-slate-800">{s.name}</span>
//           {s.status === "active" && <span className="text-[10px] text-blue-500 font-semibold px-1.5 py-0.5 bg-blue-50 rounded-full">Active</span>}
//         </div>
//       </td>
//       <td className="py-3 px-4"><div className="flex items-center gap-1.5"><ProjAv pk={s.projectKey} size={16} /><span className="text-slate-600">{gp(s.projectKey).name.split(" ")[0]}</span></div></td>
//       <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{s.startDate}</td>
//       <td className="py-3 px-4 text-slate-500 whitespace-nowrap">{s.endDate}</td>
//       <td className="py-3 px-4 text-slate-500 max-w-48"><span className="line-clamp-1">{s.goal || <span className="text-slate-300 italic">No goal</span>}</span></td>
//       <td className="py-3 px-4 text-center font-semibold text-slate-600">{s.totalIssues}</td>
//       <td className="py-3 px-4 text-center font-semibold text-green-600">{s.completed}</td>
//       <td className="py-3 px-4">
//         <div className="flex items-center gap-2 min-w-24">
//           <Pbar pct={pct(s)} color={s.status === "completed" ? "#059669" : s.status === "active" ? "#036c5f" : "#94a3b8"} h={6} />
//           <span className="font-bold text-slate-600 whitespace-nowrap">{pct(s)}%</span>
//         </div>
//       </td>
//       <td className="py-3 px-4">
//         <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
//           style={{ backgroundColor: s.status === "active" ? "#dbeafe" : s.status === "completed" ? "#d1fae5" : "#f1f5f9", color: s.status === "active" ? "#2563eb" : s.status === "completed" ? "#059669" : "#64748b" }}>
//           {s.status === "active" ? "In Progress" : s.status === "completed" ? "Completed" : "Planned"}
//         </span>
//       </td>
//       <td className="py-3 px-4">
//         <div className="flex items-center gap-1">
//           {s.status === "planned" && <button className="p-1 rounded hover:bg-slate-100 text-slate-400 text-[11px] font-semibold">▶ Start</button>}
//           {s.status === "completed" && <button className="p-1 rounded hover:bg-slate-100 text-slate-400">↺</button>}
//           <button className="p-1 rounded hover:bg-slate-100 text-slate-400">✏️</button>
//           <button className="p-1 rounded hover:bg-slate-100 text-slate-400">⋯</button>
//         </div>
//       </td>
//     </tr>
//   );
//   const HEADERS = ["Name", "Project", "Start", "End", "Goal", "Issues", "Done", "Progress", "Status", "Actions"];
//   const SprintTable = ({ rows }: { rows: typeof allSprints }) => (
//     <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden mb-6">
//       <table className="w-full text-xs min-w-max">
//         <thead className="border-b border-slate-100 bg-slate-50"><tr>{HEADERS.map(h => <th key={h} className="text-left py-2.5 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
//         <tbody>{rows.map(s => <SprintRow key={s.id} s={s} />)}</tbody>
//       </table>
//     </div>
//   );
//   return (
//     <div className="flex flex-col h-full overflow-hidden">
//       <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
//         <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Sprints</h1><p className="text-sm text-slate-400 mt-0.5">Plan, track and manage sprints across all projects.</p></div>
//         <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#036c5f" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Create Sprint</button>
//       </div>
//       <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 flex-shrink-0 flex-wrap">
//         <div className="relative"><svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search sprints…" className="pl-7 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs outline-none" style={{ width: 180 }} /></div>
//         <div className="flex items-center gap-1.5"><span className="text-xs text-slate-500">Project:</span><select value={projF} onChange={e => setProjF(e.target.value)} className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none"><option>All</option>{PROJECTS.map(p => <option key={p.key} value={p.key}>{p.name}</option>)}</select></div>
//         <div className="flex items-center gap-1.5"><span className="text-xs text-slate-500">Status:</span><select value={statusF} onChange={e => setStatusF(e.target.value)} className="px-2 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-700 outline-none"><option>All</option><option value="active">Active</option><option value="planned">Planned</option><option value="completed">Completed</option></select></div>
//       </div>
//       <div className="flex-1 overflow-y-auto px-6 py-5">
//         {active.length > 0 && <><div className="flex items-center gap-2 mb-3"><h2 className="text-sm font-bold text-slate-800">Active Sprint</h2><span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-600">{active.length}</span></div><SprintTable rows={active} /></>}
//         {planned.length > 0 && <><div className="flex items-center gap-2 mb-3"><h2 className="text-sm font-bold text-slate-800">Future Sprints</h2><span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-slate-100 text-slate-500">{planned.length}</span></div><SprintTable rows={planned} /></>}
//         {completed.length > 0 && <><div className="flex items-center gap-2 mb-3"><h2 className="text-sm font-bold text-slate-800">Completed Sprints</h2><span className="text-xs px-1.5 py-0.5 rounded-full font-bold bg-green-100 text-green-600">{completed.length}</span></div><SprintTable rows={completed} /></>}
//         {filtered.length === 0 && <div className="flex items-center justify-center h-40 text-slate-400 text-sm">No sprints match your filters.</div>}
//       </div>
//     </div>
//   );
// }

/* ═══════════════════════════════════════════
   MY WORK
═══════════════════════════════════════════ */
function MyWorkView({ onIssueClick }: { onIssueClick: (i: Issue) => void }) {
  const [tab, setTab] = useState("all");
  const tabs = [{ id: "all", l: "All", n: 26 }, { id: "todo", l: "To Do", n: 8 }, { id: "in-progress", l: "In Progress", n: 9 }, { id: "in-review", l: "Review", n: 3 }, { id: "done", l: "Completed", n: 12 }, { id: "blocked", l: "Blocked", n: 2 }];
  const filtered = tab === "all" ? ALL_ISSUES : ALL_ISSUES.filter(i => i.status === tab);
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex items-start justify-between">
        <div><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>My Work</h1><p className="text-sm text-slate-400 mt-0.5">Work items assigned to you or you are involved in</p></div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#036c5f" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Create Issue</button>
      </div>
      <div className="flex gap-4 px-6 py-3 border-b border-slate-100">
        {[{ icon: "📋", label: "Total", count: 26, color: "#2563eb", bg: "#dbeafe" }, { icon: "📅", label: "Due Today", count: 4, color: "#d97706", bg: "#fef3c7" }, { icon: "⚠️", label: "Overdue", count: 3, color: "#dc2626", bg: "#fee2e2" }, { icon: "🚫", label: "Blocked", count: 2, color: "#7c3aed", bg: "#ede9fe" }].map(t => (
          <div key={t.label} className="flex items-center gap-3 flex-1 p-4 rounded-2xl border border-slate-100 bg-white">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: t.bg }}>{t.icon}</div>
            <div><p className="text-xs text-slate-400">{t.label}</p><p className="text-2xl font-black" style={{ fontFamily: "var(--font-display)", color: t.color }}>{t.count}</p></div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-0 px-6 border-b border-slate-100">
        {tabs.map(t => <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-colors" style={{ borderColor: tab === t.id ? "#036c5f" : "transparent", color: tab === t.id ? "#036c5f" : "#64748b" }}>{t.l} ({t.n})</button>)}
        <div className="flex-1" />
        <div className="py-1.5 flex items-center gap-2">
          <div className="relative"><svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input placeholder="Search…" className="pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs outline-none" style={{ width: 140 }} /></div>
          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">Filters ▾</button>
        </div>
      </div>
      <IssueTable issues={filtered} onIssueClick={onIssueClick} showProject={true} />
      <div className="flex items-center justify-between px-6 py-2.5 border-t border-slate-100 text-xs text-slate-400">
        <div className="flex items-center gap-2">Rows per page: <select className="border rounded px-1 outline-none text-xs"><option>25</option><option>50</option></select></div>
        <div className="flex gap-1">{[1, 2, 3].map(n => <button key={n} className="w-6 h-6 rounded text-xs font-semibold" style={{ backgroundColor: n === 1 ? "#036c5f" : "transparent", color: n === 1 ? "white" : "#64748b" }}>{n}</button>)}<button className="w-6 h-6 rounded hover:bg-slate-100">›</button></div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   PROJECTS LIST
═══════════════════════════════════════════ */
function ProjectsListView({ onProjectClick }: { onProjectClick: (k: string) => void }) {
  const [tab, setTab] = useState("all");
  const [vm, setVm] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const filtered = PROJECTS.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100"><h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Projects</h1><p className="text-sm text-slate-400 mt-0.5">All projects you have access to</p></div>
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100">
        <div className="relative"><svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…" className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none" style={{ width: 200 }} /></div>
        <div className="flex-1" />
        <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
          <button onClick={() => setVm("grid")} className="p-2" style={{ backgroundColor: vm === "grid" ? "#f1f5f9" : "white" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg></button>
          <button onClick={() => setVm("list")} className="p-2" style={{ backgroundColor: vm === "list" ? "#f1f5f9" : "white" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /></svg></button>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: "#036c5f" }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>Create Project</button>
      </div>
      <div className="flex items-center gap-0 px-6 border-b border-slate-100">
        {["all", "active", "favorites", "archived"].map(t => <button key={t} onClick={() => setTab(t)} className="px-4 py-2.5 text-xs font-semibold capitalize border-b-2 whitespace-nowrap transition-colors" style={{ borderColor: tab === t ? "#036c5f" : "transparent", color: tab === t ? "#036c5f" : "#64748b" }}>{t === "all" ? "All Projects" : t.replace(/\b\w/g, c => c.toUpperCase())}</button>)}
      </div>
      <div className="flex-1 overflow-auto p-5">
        {vm === "grid" && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {filtered.map(p => (
              <div key={p.key} onClick={() => onProjectClick(p.key)} className="bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: p.color }}>{p.initials}</div><div><p className="text-sm font-bold text-slate-900">{p.name}</p><p className="text-[10px] text-slate-400">{p.key}</p></div></div>
                  <button className="text-slate-300 hover:text-amber-400 text-xl">{p.starred ? "★" : "☆"}</button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{p.desc}</p>
                <HealthBadge h={p.health} />
                <div className="flex items-center gap-2 mt-2 mb-3"><Pbar pct={p.progress} color={p.health === "on-track" ? "#059669" : p.health === "at-risk" ? "#d97706" : "#dc2626"} /><span className="text-xs font-bold text-slate-600">{p.progress}%</span></div>
                <div className="flex items-center justify-between text-xs text-slate-500"><div><span className="font-bold text-slate-700">{p.openIssues}</span> Open</div><AvStack ids={p.members} size={20} /><span className="text-[10px] text-slate-400">{p.updatedAt}</span></div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
          <table className="w-full text-xs"><thead className="border-b border-slate-100"><tr>{["Project", "Key", "Owner", "Health", "Progress", "Open", "Members", "Updated", ""].map(h => <th key={h} className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>)}</tr></thead>
            <tbody>{filtered.map((p, idx) => (
              <tr key={p.key} onClick={() => onProjectClick(p.key)} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa" }}>
                <td className="py-3 px-4"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px]" style={{ backgroundColor: p.color }}>{p.initials}</div><span className="font-semibold text-slate-800">{p.name}</span></div></td>
                <td className="py-3 px-4 text-slate-400 font-mono">{p.key}</td>
                <td className="py-3 px-4"><div className="flex items-center gap-1.5"><Av id={ASSIGNEES.find(a => a.name === p.owner)?.id ?? "rahul"} size={20} /><span className="text-slate-700">{p.owner.split(" ")[0]}</span></div></td>
                <td className="py-3 px-4"><HealthBadge h={p.health} /></td>
                <td className="py-3 px-4"><div className="flex items-center gap-2" style={{ width: 100 }}><Pbar pct={p.progress} color={p.health === "on-track" ? "#059669" : p.health === "at-risk" ? "#d97706" : "#dc2626"} /><span className="font-bold text-slate-600">{p.progress}%</span></div></td>
                <td className="py-3 px-4"><button className="font-bold" style={{ color: "#036c5f" }}>{p.openIssues}</button></td>
                <td className="py-3 px-4"><AvStack ids={p.members} size={20} /></td>
                <td className="py-3 px-4 text-slate-400">{p.updatedAt}</td>
                <td className="py-3 px-4"><button className="text-slate-300 hover:text-slate-500">⋯</button></td>
              </tr>
            ))}</tbody></table>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════ */
export default function FlowPage({ initialView = "dashboard" }: { initialView?: NavView }) {
  const [navView, setNavView] = useState<NavView>(initialView);
  const [selProj, setSelProj] = useState<string | null>(null);
  const [selIssue, setSelIssue] = useState<Issue | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleNav = (v: NavView) => { setNavView(v); setSelProj(null); setSelIssue(null); };
  const navToTab = (v: NavView): ProjectTab => { const m: Partial<Record<NavView, ProjectTab>> = { backlog: "backlog", boards: "board" }; return m[v] ?? "overview"; };
  const starredProjects = PROJECTS.filter(p => ["PAY", "PLAT", "MOB", "WEB"].includes(p.key));

  if (selIssue) return (
    <>
      <div className="flex-1 overflow-hidden">
        <IssueDetailPage issue={selIssue} onBack={() => setSelIssue(null)} onProjectClick={k => { setSelIssue(null); if (k) setSelProj(k); }} onCreateIssue={() => setShowCreate(true)} />
      </div>
      {showCreate && <CreateIssueDialog onClose={() => setShowCreate(false)} projectKey={selProj ?? undefined} />}
    </>
  );

  return (
    <>
      <div className="flex-1 overflow-hidden flex flex-col">
        {selProj ? (
          <ProjectsLayout
            pk={selProj}
            renderTab={(tab) => {
              // if (tab === "issues") return <ProjIssues pk={selProj} onIssueClick={setSelIssue} />;
              // if (tab === "sprints") return <ProjSprints pk={selProj} onIssueClick={setSelIssue} />;
              // if (tab === "roadmap") return <ProjRoadmap />;
              return null;
            }}
          />
        ) : (
          <>
            {/* {navView === "dashboard" && <DashboardView onIssueClick={setSelIssue} onProjectClick={k => setSelProj(k)} />} */}
            {navView === "my-work" && <MyWorkView onIssueClick={setSelIssue} />}
            {navView === "projects" && <ProjectsListView onProjectClick={k => setSelProj(k)} />}
            {/* {navView === "filters" && <GlobalIssuesView onIssueClick={setSelIssue} onCreateIssue={() => setShowCreate(true)} />}
            {navView === "sprints" && <GlobalSprintsView />} */}
            {/* {navView === "roadmap" && <OrgRoadmap />} */}
            {/* {navView === "reports" && <ReportsHub />} */}
            {["backlog", "boards"].includes(navView) && (
              <ProjectsLayout
                pk="PAY"
                initTab={navToTab(navView)}
                renderTab={(tab) => {
                  // if (tab === "issues") return <ProjIssues pk="PAY" onIssueClick={setSelIssue} />;
                  // if (tab === "sprints") return <ProjSprints pk="PAY" onIssueClick={setSelIssue} />;
                  // if (tab === "roadmap") return <ProjRoadmap />;
                  return null;
                }}
              />
            )}
          </>
        )}
      </div>
      {showCreate && <CreateIssueDialog onClose={() => setShowCreate(false)} projectKey={selProj ?? undefined} />}
    </>
  );
}
