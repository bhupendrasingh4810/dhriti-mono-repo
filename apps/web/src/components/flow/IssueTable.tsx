import { useState } from "react";
import type { IssueType, IssueStatus, IssuePriority, ProjectHealth } from "@/types/flow.types";
import { Issue, STATUS_CFG, PRIORITY_CFG, ga, gp } from "./flow.data";

function TypeIcon({ type, size = 14 }: { type: IssueType; size?: number }) {
  const s = size;
  if (type === "bug")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="13" r="6" fill="#fecaca" stroke="#dc2626" strokeWidth="1.5" />
        <path d="M9 13h6M12 10v6" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M8 7l-2-2M16 7l2-2" stroke="#dc2626" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (type === "story")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="3" width="16" height="18" rx="2" fill="#bbf7d0" stroke="#059669" strokeWidth="1.5" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  if (type === "improvement")
    return (
      <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
        <polygon
          points="12,2 15,9 22,9 16,14 18,21 12,17 6,21 8,14 2,9 9,9"
          fill="#ddd6fe"
          stroke="#7c3aed"
          strokeWidth="1.5"
        />
      </svg>
    );
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="#bfdbfe" stroke="#2563eb" strokeWidth="1.5" />
      <polyline
        points="9 11 12 14 20 6"
        stroke="#2563eb"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatusBadge({ status }: { status: IssueStatus }) {
  const c = STATUS_CFG[status];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold whitespace-nowrap"
      style={{ color: c.color, backgroundColor: c.bg }}
    >
      {c.label}
    </span>
  );
}

function Pri({ p }: { p: IssuePriority }) {
  const c = PRIORITY_CFG[p];
  return (
    <span className="text-xs font-black" style={{ color: c.color }}>
      {c.sym}
    </span>
  );
}

function Av({ id, size = 24 }: { id: string; size?: number }) {
  const a = ga(id);
  if (!a) return <div className="rounded-full bg-slate-200 flex-shrink-0" style={{ width: size, height: size }} />;
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: a.color, fontSize: size * 0.38 }}
    >
      {a.initials}
    </div>
  );
}

function IKey({ k, onClick }: { k: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-bold whitespace-nowrap hover:underline"
      style={{ color: "#036c5f" }}
    >
      {k}
    </button>
  );
}

function ProjAv({ pk, size = 24 }: { pk: string; size?: number }) {
  const p = gp(pk);
  return (
    <div
      className="rounded-lg flex items-center justify-center text-white font-black flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: p.color, fontSize: size * 0.4 }}
    >
      {p.initials}
    </div>
  );
}

export default function IssueTable({
  issues,
  onIssueClick,
  showProject = false,
}: {
  issues: Issue[];
  onIssueClick: (i: Issue) => void;
  showProject?: boolean;
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const toggle = (k: string) =>
    setSel((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <div className="flex-1 overflow-auto">
      {sel.size > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-teal-50 border-b border-teal-100 text-xs">
          <span className="font-bold text-teal-800">{sel.size} selected</span>
          {["Edit", "Assign", "Change Status"].map((a) => (
            <button
              key={a}
              className="px-2.5 py-1 rounded-lg border border-teal-200 font-semibold text-teal-700 hover:bg-teal-100"
            >
              {a}
            </button>
          ))}
        </div>
      )}
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 bg-white border-b border-slate-100 z-10">
          <tr>
            <th className="py-2.5 px-3 w-8">
              <input
                type="checkbox"
                className="rounded"
                onChange={(e) => (e.target.checked ? setSel(new Set(issues.map((i) => i.key))) : setSel(new Set()))}
              />
            </th>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Key ↑
            </th>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Summary
            </th>
            {showProject && (
              <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Project
              </th>
            )}
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Status ↓
            </th>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Priority ↓
            </th>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Assignee
            </th>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">
              Due Date ↓
            </th>
            <th className="text-left py-2.5 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Updated ↓
            </th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {issues.map((issue, idx) => (
            <tr
              key={issue.key}
              className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
              style={{ backgroundColor: sel.has(issue.key) ? "#f0fdf4" : idx % 2 === 0 ? "white" : "#fafafa" }}
            >
              <td className="py-2.5 px-3">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={sel.has(issue.key)}
                  onChange={() => toggle(issue.key)}
                  onClick={(e) => e.stopPropagation()}
                />
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-1.5">
                  <TypeIcon type={issue.type} size={13} />
                  <IKey k={issue.key} onClick={() => onIssueClick(issue)} />
                </div>
              </td>
              <td className="py-2.5 px-3 max-w-[220px]" onClick={() => onIssueClick(issue)}>
                <span className="text-slate-700 line-clamp-1">{issue.summary}</span>
              </td>
              {showProject && (
                <td className="py-2.5 px-3" onClick={() => onIssueClick(issue)}>
                  <div className="flex items-center gap-1.5">
                    <ProjAv pk={issue.projectKey} size={16} />
                    <span className="text-slate-600">{gp(issue.projectKey).name.split(" ").slice(0, 2).join(" ")}</span>
                  </div>
                </td>
              )}
              <td className="py-2.5 px-3" onClick={() => onIssueClick(issue)}>
                <StatusBadge status={issue.status} />
              </td>
              <td className="py-2.5 px-3" onClick={() => onIssueClick(issue)}>
                <div className="flex items-center gap-1">
                  <Pri p={issue.priority} />
                  <span style={{ color: PRIORITY_CFG[issue.priority].color }}>
                    {PRIORITY_CFG[issue.priority].label}
                  </span>
                </div>
              </td>
              <td className="py-2.5 px-3" onClick={() => onIssueClick(issue)}>
                <div className="flex items-center gap-1.5">
                  <Av id={issue.assigneeId} size={20} />
                  <span className="text-slate-600">{ga(issue.assigneeId)?.name.split(" ")[0]}</span>
                </div>
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap" onClick={() => onIssueClick(issue)}>
                <span className={issue.dueDate.match(/1[89] May/) ? "font-bold text-red-500" : "text-slate-500"}>
                  {issue.dueDate.replace(" 2025", "") || "—"}
                </span>
              </td>
              <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap" onClick={() => onIssueClick(issue)}>
                {issue.updated}
              </td>
              <td className="py-2.5 px-3">
                <button className="text-slate-300 hover:text-slate-500">⋯</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
