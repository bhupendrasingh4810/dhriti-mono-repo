import type { IssueType, IssueStatus, IssuePriority, ProjectHealth } from "@/types/flow.types";
import { STATUS_CFG, PRIORITY_CFG, ga, gp } from "./flow.data";

export function TypeIcon({ type, size = 14 }: { type: IssueType; size?: number }) {
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

export function StatusBadge({ status }: { status: IssueStatus }) {
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

export function Pri({ p }: { p: IssuePriority }) {
  const c = PRIORITY_CFG[p];
  return (
    <span className="text-xs font-black" style={{ color: c.color }}>
      {c.sym}
    </span>
  );
}

export function HealthBadge({ h }: { h: ProjectHealth }) {
  const cfg = {
    "on-track": { l: "On Track", c: "#059669" },
    "at-risk": { l: "At Risk", c: "#d97706" },
    behind: { l: "Behind", c: "#dc2626" },
  }[h];
  return (
    <span className="flex items-center gap-1 text-xs font-semibold whitespace-nowrap" style={{ color: cfg.c }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.c }} />
      {cfg.l}
    </span>
  );
}

export function Av({ id, size = 24 }: { id: string; size?: number }) {
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

export function AvStack({ ids, size = 22 }: { ids: string[]; size?: number }) {
  const show = ids.slice(0, 3);
  const extra = ids.length - show.length;
  return (
    <div className="flex items-center">
      {show.map((id, i) => (
        <div key={id} style={{ marginLeft: i === 0 ? 0 : -6, zIndex: show.length - i }}>
          <Av id={id} size={size} />
        </div>
      ))}
      {extra > 0 && (
        <div
          className="rounded-full flex items-center justify-center text-[9px] font-bold text-slate-600 bg-slate-200"
          style={{ width: size, height: size, marginLeft: -6 }}
        >
          +{extra}
        </div>
      )}
    </div>
  );
}

export function Pbar({ pct, color = "#036c5f", h = 4 }: { pct: number; color?: string; h?: number }) {
  return (
    <div className="rounded-full bg-slate-200 overflow-hidden flex-1" style={{ height: h }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export function IKey({ k, onClick }: { k: string; onClick?: () => void }) {
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

export function ProjAv({ pk, size = 24 }: { pk: string; size?: number }) {
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

export function LPill({ label }: { label: string }) {
  const M: Record<string, [string, string]> = {
    payments: ["#2563eb", "#dbeafe"],
    bug: ["#dc2626", "#fee2e2"],
    backend: ["#7c3aed", "#ede9fe"],
    webhook: ["#d97706", "#fef3c7"],
    tests: ["#059669", "#d1fae5"],
    logging: ["#64748b", "#f1f5f9"],
    refund: ["#d97706", "#fef3c7"],
    analytics: ["#0891b2", "#cffafe"],
    retry: ["#ea580c", "#fff7ed"],
    refunds: ["#7c3aed", "#ede9fe"],
  };
  const [fg, bg] = M[label] ?? ["#64748b", "#f1f5f9"];
  return (
    <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ color: fg, backgroundColor: bg }}>
      {label}
    </span>
  );
}
