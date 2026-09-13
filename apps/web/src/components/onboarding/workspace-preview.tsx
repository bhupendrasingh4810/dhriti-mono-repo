import React from "react";

type Step = 1 | 2 | 3 | 4 | 5;

const GOAL_OPTIONS = [
    { id: "chat", icon: "💬", label: "Chat & Collaboration", desc: "Real-time messaging and team channels" },
    { id: "projects", icon: "📋", label: "Project Management", desc: "Tasks, sprints, and delivery tracking" },
    { id: "docs", icon: "📄", label: "Knowledge & Documentation", desc: "Wikis, runbooks, and shared knowledge" },
    { id: "clients", icon: "🤝", label: "Client & Partner Communication", desc: "External-facing workspaces" },
    { id: "ai", icon: "✨", label: "AI-Powered Workflows", desc: "Automate with AI assistants and agents" },
];

export default function WorkspacePreview({
    step,
    orgName,
    photoPreview,
    goals,
}: {
    step: Step;
    orgName: string;
    photoPreview: string | null;
    goals: string[];
}) {
    return (
        <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
        >
            {/* Mini header */}
            <div
                className="px-3 py-2 flex items-center gap-2"
                style={{ backgroundColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
                <div className="w-4 h-4 rounded flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                </div>
                <span className="text-white text-xs font-semibold truncate">{orgName || "Your Organization"}</span>
            </div>

            <div className="p-3 space-y-1.5">
                {/* Sidebar items */}
                {["# general", "# announcements", "# projects"].map((ch, i) => (
                    <div
                        key={ch}
                        className="flex items-center gap-2 px-2 py-1 rounded"
                        style={{
                            backgroundColor: i === 0 ? "rgba(255,255,255,0.15)" : "transparent",
                        }}
                    >
                        <span className="text-white/60 text-xs">{ch}</span>
                    </div>
                ))}

                <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />

                {/* DMs */}
                <div className="flex items-center gap-2 px-2 py-1">
                    <div
                        className="w-4 h-4 rounded-full flex-shrink-0 overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                        {photoPreview && step >= 2 && (
                            <img src={photoPreview} className="w-full h-full object-cover" alt="" />
                        )}
                    </div>
                    <span className="text-white/60 text-xs">Jane Smith</span>
                </div>

                {goals.length > 0 && step >= 3 && (
                    <>
                        <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
                        <div className="px-2">
                            <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">Active tools</p>
                            {goals.slice(0, 2).map((g) => {
                                const opt = GOAL_OPTIONS.find((o) => o.id === g);
                                return opt ? (
                                    <div key={g} className="flex items-center gap-1.5 py-0.5">
                                        <span className="text-[10px]">{opt.icon}</span>
                                        <span className="text-white/50 text-[10px] truncate">{opt.label}</span>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}