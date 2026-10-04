"use client";

import { useState } from "react";
import { PROJECTS, ASSIGNEES } from "@/components/flow/flow.data";
import { HealthBadge, Pbar, AvStack, Av } from "@/components/flow/flow.atoms";

export default function ProjectsListView({ onProjectClick }: { onProjectClick: (k: string) => void }) {
  const [tab, setTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [search, setSearch] = useState("");
  const filtered = PROJECTS.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="h-full w-full min-w-0 flex-1 flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100">
        <h1 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
          Projects
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">All projects you have access to</p>
      </div>
      <div className="flex items-center gap-3 px-6 py-3 border-b border-slate-100">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects…"
            className="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
            style={{ width: 200 }}
          />
        </div>
        <div className="flex-1" />
        <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden">
          <button
            onClick={() => setViewMode("grid")}
            className="p-2"
            style={{ backgroundColor: viewMode === "grid" ? "#f1f5f9" : "white" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode("list")}
            className="p-2"
            style={{ backgroundColor: viewMode === "list" ? "#f1f5f9" : "white" }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
        <button
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white"
          style={{ backgroundColor: "#036c5f" }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Create Project
        </button>
      </div>
      <div className="flex items-center gap-0 px-6 border-b border-slate-100">
        {["all", "active", "favorites", "archived"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2.5 text-xs font-semibold capitalize border-b-2 whitespace-nowrap transition-colors"
            style={{ borderColor: tab === t ? "#036c5f" : "transparent", color: tab === t ? "#036c5f" : "#64748b" }}
          >
            {t === "all" ? "All Projects" : t.replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-5">
        {viewMode === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
            {filtered.map((p) => (
              <div
                key={p.key}
                onClick={() => onProjectClick(p.key)}
                className="bg-white rounded-2xl border border-slate-100 p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm"
                      style={{ backgroundColor: p.color }}
                    >
                      {p.initials}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.key}</p>
                    </div>
                  </div>
                  <button className="text-slate-300 hover:text-amber-400 text-xl">{p.starred ? "★" : "☆"}</button>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{p.desc}</p>
                <HealthBadge h={p.health} />
                <div className="flex items-center gap-2 mt-2 mb-3">
                  <Pbar
                    pct={p.progress}
                    color={p.health === "on-track" ? "#059669" : p.health === "at-risk" ? "#d97706" : "#dc2626"}
                  />
                  <span className="text-xs font-bold text-slate-600">{p.progress}%</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div>
                    <span className="font-bold text-slate-700">{p.openIssues}</span> Open
                  </div>
                  <AvStack ids={p.members} size={20} />
                  <span className="text-[10px] text-slate-400">{p.updatedAt}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <table className="w-full text-xs">
              <thead className="border-b border-slate-100">
                <tr>
                  {["Project", "Key", "Owner", "Health", "Progress", "Open", "Members", "Updated", ""].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, idx) => (
                  <tr
                    key={p.key}
                    onClick={() => onProjectClick(p.key)}
                    className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer"
                    style={{ backgroundColor: idx % 2 === 0 ? "white" : "#fafafa" }}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-[10px]"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.initials}
                        </div>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono">{p.key}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <Av id={ASSIGNEES.find((a) => a.name === p.owner)?.id ?? "rahul"} size={20} />
                        <span className="text-slate-700">{p.owner.split(" ")[0]}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <HealthBadge h={p.health} />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2" style={{ width: 100 }}>
                        <Pbar
                          pct={p.progress}
                          color={p.health === "on-track" ? "#059669" : p.health === "at-risk" ? "#d97706" : "#dc2626"}
                        />
                        <span className="font-bold text-slate-600">{p.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <button className="font-bold" style={{ color: "#036c5f" }}>
                        {p.openIssues}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <AvStack ids={p.members} size={20} />
                    </td>
                    <td className="py-3 px-4 text-slate-400">{p.updatedAt}</td>
                    <td className="py-3 px-4">
                      <button className="text-slate-300 hover:text-slate-500">⋯</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
