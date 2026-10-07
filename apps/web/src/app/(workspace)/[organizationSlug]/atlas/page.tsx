"use client";

import { useState } from "react";

const SPACES = [
  { id: 1, name: "Engineering", key: "ENG", color: "#0052CC" },
  { id: 2, name: "Product", key: "PROD", color: "#ED7B53" },
  { id: 3, name: "Design", key: "DES", color: "#EC4899" },
  { id: 4, name: "General", key: "GEN", color: "#036c5f" },
];

const PAGES = [
  { id: 1, title: "API Documentation v3", space: "ENG", author: "Alex Chen", updated: "2h ago", views: 142, spaceColor: "#0052CC" },
  { id: 2, title: "Q3 Product Roadmap", space: "PROD", author: "Emily Park", updated: "Today", views: 89, spaceColor: "#ED7B53" },
  { id: 3, title: "Design System Guidelines", space: "DES", author: "Mia Torres", updated: "Yesterday", views: 203, spaceColor: "#EC4899" },
  { id: 4, title: "Sprint 42 Retrospective", space: "ENG", author: "Mark Johnson", updated: "2d ago", views: 56, spaceColor: "#0052CC" },
  { id: 5, title: "Onboarding Checklist", space: "GEN", author: "Sarah Kim", updated: "3d ago", views: 317, spaceColor: "#036c5f" },
  { id: 6, title: "Infrastructure Architecture", space: "ENG", author: "Alex Chen", updated: "1w ago", views: 98, spaceColor: "#0052CC" },
];

export default function ConfluenceView() {
  const [activeSpace, setActiveSpace] = useState<number | null>(null);

  const filtered = activeSpace ? PAGES.filter(p => SPACES.find(s => s.id === activeSpace)?.key === p.space) : PAGES;

  return (
    <div className="w-full p-4">
      {/* Spaces */}
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3" style={{ fontFamily: "var(--font-display)" }}>Spaces</h3>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveSpace(null)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
            style={{
              backgroundColor: activeSpace === null ? "#036c5f" : "white",
              color: activeSpace === null ? "white" : "#64748b",
              borderColor: activeSpace === null ? "#036c5f" : "#e2e8f0",
            }}
          >
            All spaces
          </button>
          {SPACES.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSpace(s.id)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all"
              style={{
                backgroundColor: activeSpace === s.id ? s.color : "white",
                color: activeSpace === s.id ? "white" : "#64748b",
                borderColor: activeSpace === s.id ? s.color : "#e2e8f0",
              }}
            >
              {/* <span
                className="w-4 h-4 rounded text-white text-xs font-bold flex items-center justify-center"
                style={{ backgroundColor: activeSpace === s.id ? "rgba(255,255,255,0.3)" : s.color, fontSize: "9px" }}
              >
                {s.key[0]}
              </span> */}
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Recent pages */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Recent Spaces
          </h3>
          <button className="flex items-center gap-1.5 text-xs text-[#036c5f] font-medium hover:text-[#024d44]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Space
          </button>
        </div>
        <div className="divide-y divide-slate-50">
          {filtered.map((page) => (
            <div key={page.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/60 transition-colors cursor-pointer group">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: page.spaceColor }}
              >
                {page.space[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 group-hover:text-[#036c5f] transition-colors truncate">
                  {page.title}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-slate-400">{page.space}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{page.author}</span>
                  <span className="text-slate-200">·</span>
                  <span className="text-xs text-slate-400">{page.updated}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-xs flex-shrink-0">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                </svg>
                {page.views}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
