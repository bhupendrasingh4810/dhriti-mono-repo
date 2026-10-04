import React from "react";
import { Av } from "@/components/flow/flow.atoms";
import { ga } from "@/components/flow/flow.data";

export default function ProjectReports() {
  const burnPts = [89, 84, 76, 68, 60, 54, 49, 44, 39, 34, 28, 21, 14, 6];
  const velocities = [34, 42, 28, 42, 55, 41, 32];
  const maxV = Math.max(...velocities);
  const createdPts = [2, 4, 3, 6, 8, 7, 5, 9, 8, 6, 5, 4, 3];
  const resolvedPts = [1, 2, 4, 5, 7, 6, 7, 8, 7, 8, 6, 5, 4];
  return (
    <div className="h-full overflow-y-auto p-5">
      <div className="flex items-center gap-3 mb-5">
        <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          📅 01 May – 31 May 2025 ▾
        </button>
        <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          Sprint: All ▾
        </button>
        <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          Team: All ▾
        </button>
        <div className="flex-1" />
        <button className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
          ↑ Export
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* Burndown */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-800">Sprint Burndown</h3>
            <span className="text-lg font-black text-slate-900">6</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">Story Points remaining</p>
          <div className="bg-slate-50 rounded-xl p-2" style={{ height: 120 }}>
            <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
              <line x1="0" y1="0" x2="200" y2="100" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
              <polyline
                points={burnPts.map((p, i) => `${i * (200 / 13)},${p}`).join(" ")}
                fill="none"
                stroke="#036c5f"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        {/* Velocity */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-800">Velocity</h3>
            <span className="text-lg font-black text-slate-900">32</span>
          </div>
          <p className="text-[10px] text-slate-400 mb-3">Average Points</p>
          <div className="flex items-end gap-1.5" style={{ height: 120 }}>
            {velocities.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                <span className="text-[9px] text-slate-500">{v}</span>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${(v / maxV) * 90}%`,
                    backgroundColor: i === velocities.length - 1 ? "#036c5f" : "#e6f4f2",
                    minHeight: 4,
                  }}
                />
                <span className="text-[8px] text-slate-400">S{19 + i}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Created vs Resolved */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-bold text-slate-800">Created vs Resolved</h3>
            <span className="text-xs text-slate-500">
              Created <strong>58</strong> / Resolved <strong>46</strong>
            </span>
          </div>
          <div className="bg-slate-50 rounded-xl p-2" style={{ height: 120 }}>
            <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
              <polyline
                points={createdPts.map((p, i) => `${i * (200 / 12)},${100 - (p / 10) * 100}`).join(" ")}
                fill="none"
                stroke="#2563eb"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points={resolvedPts.map((p, i) => `${i * (200 / 12)},${100 - (p / 10) * 100}`).join(" ")}
                fill="none"
                stroke="#059669"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="flex gap-4 mt-2 text-[10px]">
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-500 rounded" />
              <span className="text-slate-400">Created</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-600 rounded" />
              <span className="text-slate-400">Resolved</span>
            </div>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {[
          { title: "Cycle Time", val: "5.2 days", c: "#7c3aed" },
          { title: "Lead Time", val: "12.6 days", c: "#2563eb" },
          { title: "Cumulative Flow", val: "", c: "" },
        ].map((ch, i) => (
          <div key={ch.title} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-slate-800">{ch.title}</h3>
              {ch.val && <span className="text-lg font-black text-slate-900">{ch.val}</span>}
            </div>
            <div className="bg-slate-50 rounded-xl overflow-hidden" style={{ height: 120 }}>
              {i < 2 ? (
                <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                  <polyline
                    points="0,50 20,45 40,60 60,40 80,55 100,35 120,50 140,45 160,60 180,40 200,35"
                    fill="none"
                    stroke={ch.c}
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <line
                    x1="0"
                    y1="50"
                    x2="200"
                    y2="50"
                    stroke={ch.c}
                    strokeWidth="1"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  />
                </svg>
              ) : (
                <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                  {[...Array(12)].map((_, j) => {
                    const x = j * (200 / 12),
                      w = 200 / 12;
                    const done = Math.min(70, (j + 1) * 7),
                      rev = Math.min(15, j * 2),
                      prog = Math.min(20, j * 2 + 5),
                      back = 100 - done - rev - prog;
                    return (
                      <g key={j}>
                        <rect x={x} y={100 - done} width={w} height={done} fill="#d1fae5" />
                        <rect x={x} y={100 - done - rev} width={w} height={rev} fill="#fef3c7" />
                        <rect x={x} y={100 - done - rev - prog} width={w} height={prog} fill="#dbeafe" />
                        <rect x={x} y={0} width={w} height={back} fill="#f1f5f9" />
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {/* Donut */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Work Distribution</h3>
          <div className="flex items-center gap-4">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
                <circle cx="18" cy="18" r="14" fill="none" stroke="#f1f5f9" strokeWidth="4" />
                {[
                  { pct: 32, c: "#dc2626" },
                  { pct: 36, c: "#059669" },
                  { pct: 23, c: "#2563eb" },
                  { pct: 9, c: "#7c3aed" },
                ].reduce((acc, { pct, c }, i, arr) => {
                  const off = arr.slice(0, i).reduce((s, x) => s + x.pct, 0);
                  return [
                    ...acc,
                    <circle
                      key={i}
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={c}
                      strokeWidth="4"
                      strokeDasharray={`${pct * 0.879} 87.9`}
                      strokeDashoffset={-off * 0.879}
                    />,
                  ];
                }, [] as React.ReactNode[])}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-black text-slate-900">44</span>
                <span className="text-[9px] text-slate-400">Total</span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {[
                ["Bug", "#dc2626", 14, 32],
                ["Story", "#059669", 16, 36],
                ["Task", "#2563eb", 10, 23],
                ["Improvement", "#7c3aed", 4, 9],
              ].map(([l, c, n, p]) => (
                <div key={l as string} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c as string }} />
                  <span className="text-slate-600">{l}</span>
                  <span className="text-slate-400 ml-auto">
                    {n} ({p}%)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {/* Priority bars */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Issues by Priority</h3>
          {[
            ["High", "#dc2626", 14],
            ["Medium", "#d97706", 18],
            ["Low", "#059669", 8],
            ["Lowest", "#94a3b8", 4],
          ].map(([l, c, v]) => (
            <div key={l as string} className="mb-3">
              <div className="flex items-center justify-between mb-0.5 text-xs">
                <span className="text-slate-600">{l}</span>
                <span className="font-bold text-slate-600">{v}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${((v as number) / 18) * 100}%`, backgroundColor: c as string }}
                />
              </div>
            </div>
          ))}
        </div>
        {/* Assignee bars */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Work by Assignee</h3>
          {[
            ["rahul", 18, 41],
            ["amit", 11, 25],
            ["priya", 7, 16],
            ["sneha", 5, 11],
            ["karthik", 3, 7],
          ].map(([id, n, pct]) => (
            <div key={id as string} className="flex items-center gap-2 mb-2.5">
              <Av id={id as string} size={22} />
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs mb-0.5">
                  <span className="text-slate-700">{ga(id as string)?.name.split(" ")[0]}</span>
                  <span className="font-bold text-slate-500">
                    {n} ({pct}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, backgroundColor: ga(id as string)?.color }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
