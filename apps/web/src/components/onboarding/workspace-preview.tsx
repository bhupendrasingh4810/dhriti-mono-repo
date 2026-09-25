import React from "react";

type Step = 1 | 2 | 3 | 4 | 5 | 6;

export default function WorkspacePreview({
  step,
  orgName,
  photoPreview,
}: {
  step: Step;
  orgName: string;
  photoPreview: string | null;
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
        <div
          className="w-4 h-4 rounded flex items-center justify-center"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
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
            {photoPreview && step >= 2 && <img src={photoPreview} className="w-full h-full object-cover" alt="" />}
          </div>
          <span className="text-white/60 text-xs">Jane Smith</span>
        </div>
      </div>
    </div>
  );
}
