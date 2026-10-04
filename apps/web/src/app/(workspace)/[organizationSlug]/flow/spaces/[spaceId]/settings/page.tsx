"use client";

import { useState } from "react";
import { gp } from "@/components/flow/flow.data";
import { ProjAv } from "@/components/flow/flow.atoms";

type SettingsSection =
  | "general"
  | "details"
  | "members"
  | "roles"
  | "issue-types"
  | "statuses"
  | "workflow"
  | "fields"
  | "labels"
  | "components"
  | "versions"
  | "notifications"
  | "permissions"
  | "automation";

export default function ProjectSettings({ pk }: { pk: string }) {
  const p = gp(pk);
  const [sec, setSec] = useState<SettingsSection>("general");
  const [editing, setEditing] = useState(false);
  const NAV: [SettingsSection, string, string][] = [
    ["general", "General", "⚙"],
    ["details", "Details", "📄"],
    ["members", "Members", "👥"],
    ["roles", "Roles", "🎭"],
    ["issue-types", "Issue Types", "🐛"],
    ["statuses", "Statuses", "📊"],
    ["workflow", "Workflow", "🔄"],
    ["fields", "Fields", "📝"],
    ["labels", "Labels", "🏷"],
    ["components", "Components", "🧩"],
    ["versions", "Versions", "📦"],
    ["notifications", "Notifications", "🔔"],
    ["permissions", "Permissions", "🔒"],
    ["automation", "Automation", "⚡"],
  ];
  return (
    <div className="flex h-full w-full min-w-0 flex-1 gap-4 overflow-hidden pl-4">
      {/* Left Settings Nav */}
      <div className="flex w-56 shrink-0 mt-4 flex-col overflow-y-auto rounded-2xl border border-slate-100 bg-white">
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-3">
            <ProjAv pk={pk} size={28} />
            <div>
              <p className="text-xs font-bold text-slate-800">{p.name}</p>
              <p className="text-[10px] text-slate-400">{p.type}</p>
            </div>
          </div>
        </div>
        <div className="flex-1 py-2">
          <p className="px-4 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Settings</p>
          {NAV.map(([id, label, icon]) => (
            <button
              key={id}
              onClick={() => setSec(id)}
              className="w-full flex items-center gap-2.5 px-4 py-1.5 text-xs transition-colors"
              style={{
                backgroundColor: sec === id ? "#e6f4f2" : "transparent",
                color: sec === id ? "#036c5f" : "#475569",
                fontWeight: sec === id ? 700 : 500,
              }}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 overflow-y-auto flex">
        {sec === "general" ? (
          <div className="flex-1 p-4">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                General
              </h2>
              <button
                onClick={() => setEditing(!editing)}
                style={{
                  backgroundColor: editing ? "#036c5f" : "white",
                  color: editing ? "white" : "#036c5f",
                }}
              >
                {editing ? "Done" : "Edit"}
              </button>
            </div>
            <p className="text-xs text-slate-400 mb-6">Configure general settings and key details of this project.</p>
            <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Project Information</h3>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {[
                  ["Project Name", p.name],
                  ["Project Key", p.key],
                  ["Category", "Finance"],
                  ["Project Type", p.type],
                  ["Lead", p.lead],
                  ["Owner", p.owner],
                ].map(([l, v]) => (
                  <div key={l}>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{l}</p>
                    {editing ? (
                      <input
                        defaultValue={v}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700 focus:border-teal-500"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-700">{v}</p>
                    )}
                  </div>
                ))}
                <div className="col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Description</p>
                  {editing ? (
                    <textarea
                      defaultValue={p.desc}
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none text-sm text-slate-700 resize-none focus:border-teal-500"
                    />
                  ) : (
                    <p className="text-sm text-slate-600">{p.desc}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="mb-4 rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Project Settings</h3>
              <div className="space-y-0">
                {[
                  { l: "Project Access", v: "Private — only invited members", icon: "🔒" },
                  { l: "Language", v: "English (US)", icon: "🌐" },
                  { l: "Time Zone", v: "(GMT+05:30) Asia/Kolkata", icon: "🕐" },
                  { l: "Issue Key Format", v: "PAY-000", icon: "🔑" },
                  { l: "Template", v: "Scrum Software Development", icon: "📋" },
                ].map((row) => (
                  <div key={row.l} className="flex items-start justify-between py-3 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="text-base">{row.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-slate-700">{row.l}</p>
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{row.v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-100 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-2">Project Features</h3>
              <p className="text-xs text-slate-400 mb-4">Enable or disable features for this project.</p>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { l: "Sprints", v: true, i: "🔄" },
                  { l: "Backlog", v: true, i: "📋" },
                  { l: "Roadmap", v: true, i: "🗺" },
                  { l: "Time Tracking", v: false, i: "⏱" },
                ].map((f) => (
                  <div
                    key={f.l}
                    className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 p-4 hover:bg-slate-50"
                  >
                    <span className="text-2xl">{f.i}</span>
                    <span className="text-xs font-semibold text-slate-700">{f.l}</span>
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: f.v ? "#d1fae5" : "#f1f5f9", color: f.v ? "#059669" : "#64748b" }}
                    >
                      {f.v ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {editing && (
              <button
                onClick={() => setEditing(false)}
                className="mt-4 px-5 py-2 rounded-xl text-sm font-bold text-white"
                style={{ backgroundColor: "#036c5f" }}
              >
                Save Changes
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center p-4">
            <div className="text-center text-slate-400">
              <div className="text-4xl mb-3">{NAV.find((n) => n[0] === sec)?.[2]}</div>
              <p className="text-sm font-bold text-slate-600 mb-1">{NAV.find((n) => n[0] === sec)?.[1]}</p>
              <p className="text-xs">Settings coming soon.</p>
            </div>
          </div>
        )}
        {/* Right Info Sidebar */}
        <div className="w-60 shrink-0 overflow-y-auto border-l border-slate-100 p-4">
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
            <h3 className="text-xs font-bold text-slate-800 mb-3">Project Info</h3>
            {[
              ["Status", "Active"],
              ["Open Issues", p.openIssues],
              ["Members", p.members.length],
              ["Updated", p.updatedAt],
            ].map(([l, v]) => (
              <div
                key={l as string}
                className="flex items-center justify-between py-1.5 border-b border-slate-50 text-xs"
              >
                <span className="text-slate-400">{l}</span>
                <span className="font-semibold text-slate-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-teal-50 rounded-2xl p-4 mb-4">
            <p className="text-xs font-bold text-slate-700 mb-1">💡 Tips</p>
            <p className="text-xs text-slate-500">
              Keep settings up to date to maintain project health and team alignment.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 p-4 mb-4">
            <h3 className="text-xs font-bold text-slate-800 mb-1">Need Help?</h3>
            <p className="text-xs text-slate-500 mb-2">Learn about project settings in our docs.</p>
            <button className="text-xs font-semibold underline" style={{ color: "#036c5f" }}>
              View Docs ↗
            </button>
          </div>
          <div className="bg-red-50 rounded-2xl border border-red-100 p-4">
            <p className="text-[11px] text-slate-500 mb-3">These actions are permanent and cannot be undone.</p>
            <button className="w-full px-3 py-2 mb-2 rounded-xl border border-red-200 text-xs font-bold text-red-500 hover:bg-red-100">
              🗄 Archive
            </button>
            <button className="w-full px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600">
              🗑 Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
