"use client";

import { useState } from "react";
import { REPORT_SECTIONS, ga } from "@/components/flow/flow.data";
import { Av } from "@/components/flow/flow.atoms";

export default function ReportsHub() {
  const [tab, setTab] = useState("all");
  const [openReport, setOpenReport] = useState<string | null>(null);
  if (openReport) {
    const burnPts = [89, 84, 76, 68, 60, 54, 49, 44, 39, 34, 28, 21, 14, 6];
    const velocities = [34, 42, 28, 42, 55, 41, 32];
    const maxV = Math.max(...velocities);
    return (
      <div className="h-full flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 flex-shrink-0">
          <button
            onClick={() => setOpenReport(null)}
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "#036c5f" }}
          >
            ← Back to Reports
          </button>
          <span className="text-slate-300">|</span>
          <h1 className="text-sm font-bold text-slate-900">{openReport}</h1>
          <div className="flex-1" />
          <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            📅 May 2025 ▾
          </button>
          <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            Sprint 24 ▾
          </button>
          <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
            ↑ Export
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { l: "Total Issues", v: "44", c: "#2563eb" },
              { l: "Completed", v: "32", c: "#059669" },
              { l: "Velocity", v: "32 pts", c: "#036c5f" },
            ].map((s) => (
              <div key={s.l} className="bg-white rounded-2xl border border-slate-100 p-5 text-center">
                <p className="text-xs text-slate-400 mb-1">{s.l}</p>
                <p className="text-4xl font-black" style={{ fontFamily: "var(--font-display)", color: s.c }}>
                  {s.v}
                </p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Sprint Burndown</h3>
              <div className="bg-slate-50 rounded-xl p-3" style={{ height: 160 }}>
                <svg className="w-full h-full" viewBox="0 0 300 140" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="300" y2="140" stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="5 4" />
                  <polyline
                    points={burnPts.map((v, i) => `${i * (300 / 13)},${(v / 89) * 140}`).join(" ")}
                    fill="none"
                    stroke="#036c5f"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx={burnPts.length * (300 / 13) - 300 / 13}
                    cy={(burnPts[burnPts.length - 1] / 89) * 140}
                    r="4"
                    fill="#036c5f"
                  />
                </svg>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-slate-200" />
                  <span className="text-slate-400">Ideal</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0.5 bg-teal-600" />
                  <span className="text-slate-400">Actual</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Team Velocity</h3>
              <div className="flex items-end gap-2" style={{ height: 160 }}>
                {velocities.map((v, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
                    <span className="text-[10px] text-slate-500">{v}</span>
                    <div
                      className="w-full rounded-t transition-all"
                      style={{
                        height: `${(v / maxV) * 130}px`,
                        backgroundColor: i === velocities.length - 1 ? "#036c5f" : "#e6f4f2",
                        minHeight: 4,
                      }}
                    />
                    <span className="text-[9px] text-slate-400">S{19 + i}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="col-span-2 bg-white rounded-2xl border border-slate-100 p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Issues by Assignee</h3>
              <div className="space-y-3">
                {[
                  ["rahul", 18, 41],
                  ["amit", 11, 25],
                  ["priya", 7, 16],
                  ["sneha", 5, 11],
                  ["karthik", 3, 7],
                ].map(([id, n, pct]) => (
                  <div key={id as string} className="flex items-center gap-3">
                    <Av id={id as string} size={24} />
                    <div className="w-28 text-xs font-medium text-slate-700 flex-shrink-0">
                      {ga(id as string)?.name.split(" ")[0]}
                    </div>
                    <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: ga(id as string)?.color }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-16 text-right">
                      {n} ({pct}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Reports
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">Explore and analyze data to improve team delivery.</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          ⚙ Customize Reports
        </button>
      </div>
      <div className="flex items-center gap-0 px-6 border-b border-slate-100">
        {[
          { id: "all", l: "All Reports" },
          { id: "mine", l: "My Reports" },
          { id: "recent", l: "Recently Viewed" },
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
            {t.l}
          </button>
        ))}
      </div>
      <div className="px-6 py-6 space-y-8">
        {REPORT_SECTIONS.map((section) => (
          <div key={section.id}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: section.bg }}
                >
                  {section.icon}
                </div>
                <h2 className="text-base font-bold text-slate-800">{section.label}</h2>
              </div>
              <button className="text-xs font-semibold" style={{ color: "#036c5f" }}>
                View all
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {section.reports.map((report) => (
                <div
                  key={report.name}
                  className="bg-white rounded-2xl border border-slate-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: section.bg }}
                  >
                    <span className="text-lg">{section.icon}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 mb-1.5">{report.name}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed flex-1">{report.desc}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-50">
                    <span className="text-[10px] text-slate-400">Last generated {report.gen}</span>
                    <button
                      onClick={() => setOpenReport(report.name)}
                      className="text-xs font-bold hover:underline"
                      style={{ color: "#036c5f" }}
                    >
                      Open →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
