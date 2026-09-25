import { AppView } from "@/types/app.types";
import { useState } from "react";
// import { useOrganization } from "@/hooks/use-organization";

interface Props {
  activeView: AppView;
  onViewChange: (v: AppView) => void;
}

const APP_VIEW_TITLES: Partial<Record<AppView, string>> = {
  connect: "Connect",
  pulse: "Pulse",
  flow: "Flow",
  atlas: "Atlas",
  cadence: "Cadence",
  control: "Control",
};

export default function Header({ activeView, onViewChange }: Props) {
  // const { currentOrg, organization } = useOrganization();
  const [appsOpen, setAppsOpen] = useState(false);

  return (
    <header
      className="flex items-center gap-4 px-6 border-b border-slate-100 flex-shrink-0 bg-white relative z-10"
      style={{ height: "60px" }}
    >
      {/* Brand name */}
      <span className="text-lg font-bold text-slate-900 mr-2" style={{ fontFamily: "var(--font-display)" }}>
        <div className="flex items-center justify-center py-4 border-b border-slate-100" style={{ height: "60px" }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="2" width="7" height="7" rx="2" fill="white" />
              <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.6" />
              <rect x="11" y="11" width="7" height="7" rx="2" fill="white" />
            </svg>
          </div>
        </div>
      </span>

      {/* Nav */}
      <nav className="flex items-center gap-1">
        <button
          onClick={() => onViewChange("home")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
          style={{
            backgroundColor: activeView === "home" ? "#e6f4f2" : "transparent",
            color: activeView === "home" ? "#036c5f" : "#64748b",
          }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </button>

        <div className="relative">
          <button
            onClick={() => setAppsOpen((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all text-slate-600 hover:bg-slate-50"
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Apps
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {appsOpen && (
            <div className="absolute top-full left-0 mt-1 w-40 bg-white rounded-xl border border-slate-100 shadow-lg py-1.5 z-50">
              {(Object.entries(APP_VIEW_TITLES) as [AppView, string][]).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => {
                    onViewChange(id);
                    setAppsOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#036c5f]" />
        </button>
        <button className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-all">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </button>
        <div className="flex items-center gap-2 ml-1 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#036c5f] flex items-center justify-center">
            <span className="text-white text-xs font-bold">JS</span>
          </div>
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#94a3b8"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>
    </header>
  );
}
