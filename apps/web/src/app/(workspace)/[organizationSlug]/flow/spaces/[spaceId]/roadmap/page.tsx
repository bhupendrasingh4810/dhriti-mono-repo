"use client";

import { useState } from "react";
import { Av, Pbar } from "@/components/flow/flow.atoms";
import { ga } from "@/components/flow/flow.data";

const MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan 26"];
const ROADMAP_DATA = [
  {
    section: "Initiatives",
    rows: [
      { l: "Payments Modernization", aid: "rahul", s: 0, e: 4, pct: 72, c: "#7c3aed", ms: { pos: 2, lbl: "Beta" } },
      { l: "Platform Scalability", aid: "priya", s: 1, e: 3, pct: 54, c: "#2563eb" },
      { l: "Customer Experience", aid: "karthik", s: 2, e: 5, pct: 63, c: "#059669" },
    ],
  },
  {
    section: "Epics",
    rows: [
      { l: "Reliability & Idempotency", aid: "rahul", s: 0, e: 3, pct: 85, c: "#059669", ms: { pos: 3, lbl: "v2" } },
      { l: "Payment Experience", aid: "priya", s: 1, e: 4, pct: 60, c: "#7c3aed" },
      { l: "Global Expansion", aid: "amit", s: 3, e: 6, pct: 35, c: "#2563eb" },
      { l: "Developer Platform", aid: "karthik", s: 1, e: 5, pct: 70, c: "#0891b2" },
    ],
  },
  {
    section: "Projects",
    rows: [
      { l: "Payments Platform", aid: "rahul", s: 0, e: 4, pct: 72, c: "#7c3aed" },
      { l: "Platform Core", aid: "amit", s: 0, e: 3, pct: 54, c: "#2563eb" },
      { l: "Mobile App", aid: "priya", s: 2, e: 6, pct: 48, c: "#059669" },
      { l: "Website Redesign", aid: "karthik", s: 1, e: 4, pct: 75, c: "#d97706" },
    ],
  },
];

export default function ProjectRoadmap() {
  const [sel, setSel] = useState<string | null>("Reliability & Idempotency");
  const cols = MONTHS.length;
  return (
    <div className="flex h-full overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-100">
          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            🗺 Roadmap ▾
          </button>
          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            📅 May – Dec 2025 →
          </button>
          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            Quarter ▾
          </button>
          <div className="flex-1" />
          <button
            className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold"
            style={{ color: "#036c5f" }}
          >
            Today
          </button>
          <button className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600">
            Filters ▾
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div style={{ minWidth: 800 }}>
            <div className="flex sticky top-0 z-10 bg-white border-b border-slate-100">
              <div className="w-48 flex-shrink-0 border-r border-slate-100 py-2.5 px-3 text-xs font-bold text-slate-400 uppercase">
                2025
              </div>
              <div className="flex flex-1">
                {MONTHS.map((m) => (
                  <div
                    key={m}
                    className="flex-1 text-center py-2.5 text-xs font-bold text-slate-400 border-r border-slate-100 last:border-0"
                  >
                    {m}
                  </div>
                ))}
              </div>
            </div>
            {ROADMAP_DATA.map(({ section, rows }) => (
              <div key={section}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 border-b border-slate-100">
                  <div
                    className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: "#036c5f" }}
                  >
                    {section[0]}
                  </div>
                  <span className="text-xs font-bold text-slate-600">{section}</span>
                </div>
                {rows.map((row) => (
                  <div
                    key={row.l}
                    className="flex items-center border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSel(row.l)}
                  >
                    <div className="w-48 flex-shrink-0 flex items-center gap-2 py-2.5 px-3 border-r border-slate-100">
                      <Av id={row.aid} size={18} />
                      <span className="text-xs text-slate-700 truncate">{row.l}</span>
                    </div>
                    <div className="flex flex-1 relative py-2">
                      {MONTHS.map((m) => (
                        <div key={m} className="flex-1 border-r border-slate-100 last:border-0 h-8" />
                      ))}
                      <div
                        className="absolute inset-y-1.5 rounded-xl flex items-center px-2 overflow-hidden"
                        style={{
                          left: `calc(${(row.s / cols) * 100}% + 2px)`,
                          width: `calc(${((row.e - row.s) / cols) * 100}% - 4px)`,
                          backgroundColor: row.c + "28",
                          border: `1.5px solid ${row.c}55`,
                        }}
                      >
                        <div
                          className="absolute inset-y-0 left-0 rounded-l-xl"
                          style={{ width: `${row.pct}%`, backgroundColor: row.c, opacity: 0.4 }}
                        />
                        <span className="text-[10px] font-bold relative z-10 truncate" style={{ color: row.c }}>
                          {row.l} {row.pct}%
                        </span>
                        <Av id={row.aid} size={14} />
                      </div>
                      {"ms" in row && row.ms && (
                        <div
                          className="absolute inset-y-0 flex items-center"
                          style={{ left: `calc(${(row.ms.pos / cols) * 100}%)` }}
                        >
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-slate-500">{row.ms.lbl}</span>
                            <span className="text-sm" style={{ color: "#7c3aed" }}>
                              ◆
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      {sel && (
        <div className="w-64 flex-shrink-0 border-l border-slate-100 overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800">Details</h3>
            <button onClick={() => setSel(null)} className="text-slate-400 text-xs">
              ✕
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm font-bold text-slate-900 mb-1">{sel}</p>
            <div className="flex items-center gap-2 mb-3">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold"
                style={{ backgroundColor: "#d1fae5", color: "#059669" }}
              >
                On Track
              </span>
              <span className="text-xs font-bold text-green-600">85% complete</span>
            </div>
            <Pbar pct={85} color="#059669" h={6} />
            <div className="mt-4 space-y-2 text-xs">
              {[
                ["Owner", "rahul"],
                ["Start", "12 May 2025"],
                ["Target", "18 Aug 2025"],
              ].map(([l, v]) => (
                <div key={l} className="flex items-center justify-between">
                  <span className="text-slate-400">{l}</span>
                  {l === "Owner" ? (
                    <div className="flex items-center gap-1.5">
                      <Av id={v} size={18} />
                      <span className="text-slate-700">{ga(v)?.name}</span>
                    </div>
                  ) : (
                    <span className="font-medium text-slate-700">{v}</span>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-700 mb-2">Milestones</p>
              {[
                ["Beta Launch", "25 Jul"],
                ["v2 Launch", "10 Oct"],
              ].map(([n, d]) => (
                <div key={n} className="flex items-center justify-between py-1.5 text-xs border-b border-slate-50">
                  <div className="flex items-center gap-1.5">
                    <span style={{ color: "#7c3aed" }}>◆</span>
                    <span className="text-slate-700">{n}</span>
                  </div>
                  <span className="text-slate-400">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
