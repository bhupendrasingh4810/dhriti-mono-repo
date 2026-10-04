"use client";

import { useState } from "react";
import { RM_DATA, RM_MONTHS } from "@/components/flow/flow.data";
import { ProjectHealth } from "@/types/flow.types";
import { HealthBadge, ProjAv, Av } from "@/components/flow/flow.atoms";

const HC: Record<ProjectHealth, string> = { "on-track": "#059669", "at-risk": "#d97706", behind: "#dc2626" };

export default function OrgRoadmap() {
  const [groupExp, setGroupExp] = useState<Set<string>>(new Set(RM_DATA.map((g) => g.group)));
  const [projExp, setProjExp] = useState<Set<string>>(new Set(RM_DATA.flatMap((g) => g.items.map((i) => i.l))));
  const [view, setView] = useState<"Year" | "Quarter" | "Month">("Quarter");
  const N = RM_MONTHS.length;
  const toggleG = (k: string) =>
    setGroupExp((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  const toggleP = (k: string) =>
    setProjExp((p) => {
      const n = new Set(p);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Organization Roadmap
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Strategic initiatives and projects across the organization.</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            ↗ Share
          </button>
          <button
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
            Create Initiative
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2 px-5 py-2 border-b border-slate-100 flex-shrink-0 flex-wrap">
        {["Timeline", "Team", "Project", "Owner", "Status", "Priority"].map((f) => (
          <button
            key={f}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            {f}: All{" "}
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto">
        <div style={{ minWidth: 900 }}>
          {/* Header */}
          <div className="flex sticky top-0 z-10 bg-white border-b border-slate-100">
            <div
              className="flex items-center gap-2 px-3 py-2.5 border-r border-slate-100 flex-shrink-0"
              style={{ width: 300 }}
            >
              <button className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50">
                Today
              </button>
              <button className="p-1 rounded text-slate-400 hover:bg-slate-100">‹</button>
              <button className="p-1 rounded text-slate-400 hover:bg-slate-100">›</button>
              <span className="text-xs font-bold text-slate-600">2025 – 2026</span>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex border-b border-slate-50">
                {["Q2 2025", "Q3 2025", "Q4 2025", "Q1 2026"].map((q, qi) => (
                  <div
                    key={q}
                    className="flex-1 text-center py-1 text-[10px] font-bold text-slate-400"
                    style={{ borderLeft: qi > 0 ? "1px solid #f1f5f9" : "none" }}
                  >
                    {q}
                  </div>
                ))}
              </div>
              <div className="flex">
                {RM_MONTHS.map((m) => (
                  <div
                    key={m}
                    className="flex-1 text-center py-1 text-[10px] text-slate-400 border-r border-slate-50 last:border-0"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-0 border-l border-slate-100 px-2 flex-shrink-0">
              {(["Year", "Quarter", "Month"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className="px-2 py-1 rounded text-xs font-semibold"
                  style={{
                    backgroundColor: view === v ? "#e6f4f2" : "transparent",
                    color: view === v ? "#036c5f" : "#64748b",
                  }}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
          {/* Rows */}
          {RM_DATA.map((group) => (
            <div key={group.group}>
              <div
                className="flex items-center border-b border-slate-100 bg-slate-50 cursor-pointer hover:bg-slate-100"
                onClick={() => toggleG(group.group)}
              >
                <div
                  className="flex items-center gap-2 px-3 py-2.5 border-r border-slate-100 flex-shrink-0"
                  style={{ width: 300 }}
                >
                  <svg
                    width="11"
                    height="11"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    style={{
                      transform: groupExp.has(group.group) ? "rotate(0)" : "rotate(-90deg)",
                      transition: "transform 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                  <span className="text-xs font-bold text-slate-800 flex-1">{group.group}</span>
                  <HealthBadge h={group.health} />
                  <span className="text-xs font-bold ml-1" style={{ color: HC[group.health] }}>
                    {group.pct}%
                  </span>
                </div>
                <div className="flex-1 relative" style={{ height: 34 }}>
                  <div
                    className="absolute inset-y-2 rounded-lg opacity-15"
                    style={{ left: `${(0 / N) * 100}%`, width: `${(9 / N) * 100}%`, backgroundColor: HC[group.health] }}
                  />
                  <div
                    className="absolute inset-y-2 rounded-lg"
                    style={{
                      left: `${(0 / N) * 100}%`,
                      width: `${(group.pct / 100) * (9 / N) * 100}%`,
                      backgroundColor: HC[group.health],
                      opacity: 0.5,
                    }}
                  />
                </div>
                <div className="w-16 flex-shrink-0" />
              </div>
              {groupExp.has(group.group) &&
                group.items.map((proj) => (
                  <div key={proj.l}>
                    <div
                      className="flex items-center border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                      onClick={() => toggleP(proj.l)}
                    >
                      <div
                        className="flex items-center gap-2 pl-6 pr-3 py-2 border-r border-slate-100 flex-shrink-0"
                        style={{ width: 300 }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          style={{
                            transform: projExp.has(proj.l) ? "rotate(0)" : "rotate(-90deg)",
                            transition: "transform 0.15s",
                            flexShrink: 0,
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                        {"pk" in proj && proj.pk && <ProjAv pk={proj.pk} size={16} />}
                        <span className="text-xs font-semibold text-slate-700 flex-1 truncate">{proj.l}</span>
                        <HealthBadge h={proj.h} />
                        <span className="text-xs font-bold ml-1" style={{ color: HC[proj.h] }}>
                          {proj.pct}%
                        </span>
                      </div>
                      <div className="flex-1 relative" style={{ height: 32 }}>
                        {RM_MONTHS.map((_, mi) => (
                          <div
                            key={mi}
                            className="absolute top-0 bottom-0 border-r border-slate-50"
                            style={{ left: `${(mi / N) * 100}%`, width: `${(1 / N) * 100}%` }}
                          />
                        ))}
                        <div
                          className="absolute inset-y-1.5 rounded-lg"
                          style={{
                            left: `${(proj.s / N) * 100}%`,
                            width: `${((proj.e - proj.s) / N) * 100}%`,
                            backgroundColor: HC[proj.h] + "25",
                            border: `1.5px solid ${HC[proj.h]}50`,
                          }}
                        >
                          <div
                            className="absolute inset-y-0 left-0 rounded-l-lg"
                            style={{ width: `${proj.pct}%`, backgroundColor: HC[proj.h], opacity: 0.45 }}
                          />
                          <span
                            className="absolute inset-0 flex items-center px-2 text-[10px] font-bold truncate"
                            style={{ color: HC[proj.h] }}
                          >
                            {proj.pct}%
                          </span>
                        </div>
                        {"ms" in proj &&
                          proj.ms?.map((m) => (
                            <div
                              key={m.label}
                              className="absolute inset-y-0 flex flex-col items-center justify-center"
                              style={{ left: `${(m.pos / N) * 100}%`, transform: "translateX(-50%)" }}
                            >
                              <span className="text-[8px] font-bold text-slate-500 whitespace-nowrap">{m.label}</span>
                              <span style={{ color: "#7c3aed", fontSize: 14, lineHeight: 1 }}>◆</span>
                            </div>
                          ))}
                      </div>
                      <div className="flex items-center justify-end px-3 gap-1 flex-shrink-0" style={{ width: 64 }}>
                        <Av id={proj.owner} size={20} />
                        <button className="text-slate-300 hover:text-slate-500">⋯</button>
                      </div>
                    </div>
                    {projExp.has(proj.l) &&
                      proj.children.map((child) => (
                        <div key={child.l} className="flex items-center border-b border-slate-50 hover:bg-slate-50">
                          <div
                            className="flex items-center gap-2 pl-12 pr-3 py-2 border-r border-slate-100 flex-shrink-0"
                            style={{ width: 300 }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="#7c3aed">
                              <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
                            </svg>
                            <span className="text-xs text-slate-600 flex-1 truncate">{child.l}</span>
                            <HealthBadge h={child.h} />
                            <span className="text-xs font-bold ml-1" style={{ color: HC[child.h] }}>
                              {child.pct}%
                            </span>
                          </div>
                          <div className="flex-1 relative" style={{ height: 28 }}>
                            <div
                              className="absolute inset-y-1.5 rounded"
                              style={{
                                left: `${(child.s / N) * 100}%`,
                                width: `${((child.e - child.s) / N) * 100}%`,
                                backgroundColor: HC[child.h] + "18",
                                border: `1px solid ${HC[child.h]}35`,
                              }}
                            >
                              <div
                                className="absolute inset-y-0 left-0 rounded-l"
                                style={{ width: `${child.pct}%`, backgroundColor: HC[child.h], opacity: 0.35 }}
                              />
                              <span
                                className="absolute inset-0 flex items-center px-1.5 text-[9px] font-bold truncate"
                                style={{ color: HC[child.h] }}
                              >
                                {child.l}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-end px-3 gap-1 flex-shrink-0" style={{ width: 64 }}>
                            <Av id={child.owner} size={18} />
                          </div>
                        </div>
                      ))}
                  </div>
                ))}
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 bg-white text-xs text-slate-400">
            <span>Showing 1–20 of 20 items</span>
            <div className="flex items-center gap-3">
              {[
                { c: "◆", cl: "text-purple-500", l: "Milestone" },
                { c: "●", cl: "text-green-500", l: "On Track" },
                { c: "●", cl: "text-amber-500", l: "At Risk" },
                { c: "●", cl: "text-red-400", l: "Behind" },
              ].map((i) => (
                <div key={i.l} className="flex items-center gap-1">
                  <span className={`text-sm ${i.cl}`}>{i.c}</span>
                  <span>{i.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
