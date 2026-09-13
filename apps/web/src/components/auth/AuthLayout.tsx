import type { ReactNode } from "react";

type Illustration = "login" | "signup" | "reset" | "verify";

interface Props {
  title: string;
  subtitle: string;
  illustration: Illustration;
  children: ReactNode;
}

const ILLUS_CONFIG: Record<Illustration, { bg: string; accent: string; icon: ReactNode; tagline: string }> = {
  login: {
    bg: "from-[#036c5f] to-[#0a4a40]",
    accent: "#04b89a",
    tagline: "Your unified workspace for every team workflow.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill="white" fillOpacity="0.12"/>
        <path d="M14 20h28M14 28h20M14 36h16" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="42" cy="36" r="7" fill="#04b89a"/>
        <path d="M39 36l2 2 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  signup: {
    bg: "from-[#036c5f] to-[#023d35]",
    accent: "#04b89a",
    tagline: "Join thousands of teams who ship work faster.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill="white" fillOpacity="0.12"/>
        <circle cx="24" cy="22" r="7" stroke="white" strokeWidth="2.5"/>
        <path d="M12 42c0-6.627 5.373-12 12-12" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M38 30v12M32 36h12" stroke="#04b89a" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  reset: {
    bg: "from-[#036c5f] to-[#04503f]",
    accent: "#04b89a",
    tagline: "Secure access. We've got you covered.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill="white" fillOpacity="0.12"/>
        <rect x="16" y="26" width="24" height="16" rx="4" stroke="white" strokeWidth="2.5"/>
        <path d="M20 26v-5a8 8 0 0 1 16 0v5" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <circle cx="28" cy="34" r="3" fill="#04b89a"/>
      </svg>
    ),
  },
  verify: {
    bg: "from-[#036c5f] to-[#024d44]",
    accent: "#04b89a",
    tagline: "One last step to your workspace.",
    icon: (
      <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
        <rect width="56" height="56" rx="16" fill="white" fillOpacity="0.12"/>
        <rect x="12" y="18" width="32" height="22" rx="4" stroke="white" strokeWidth="2.5"/>
        <path d="M12 22l16 11 16-11" stroke="#04b89a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
};

const APP_LOGOS = [
  { name: "Teams", color: "#5059C9", letter: "T" },
  { name: "Calendar", color: "#036c5f", letter: "C" },
  { name: "Jira", color: "#0052CC", letter: "J" },
  { name: "Confluence", color: "#172B4D", letter: "C" },
  { name: "Parabol", color: "#ED7B53", letter: "P" },
  { name: "Admin", color: "#6B21A8", letter: "A" },
];

export default function AuthLayout({ title, subtitle, illustration, children }: Props) {
  const cfg = ILLUS_CONFIG[illustration];

  return (
    <div className="min-h-screen flex" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Left panel */}
      <div
        className={`hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 bg-gradient-to-br ${cfg.bg} p-10 relative overflow-hidden`}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 rounded-full bg-white/5" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-white/[0.03]" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.7"/>
                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.7"/>
                <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
              </svg>
            </div>
            <span className="text-white font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              Dhriti OS
            </span>
          </div>
        </div>

        {/* Center illustration */}
        <div className="relative z-10 flex flex-col items-start gap-8">
          {cfg.icon}
          <div>
            <h2
              className="text-white text-3xl font-bold leading-tight mb-3"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {cfg.tagline}
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              One platform for messaging, planning, documentation, and team management.
            </p>
          </div>

          {/* App logos */}
          <div className="flex gap-2 flex-wrap">
            {APP_LOGOS.map((app) => (
              <div
                key={app.name}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                title={app.name}
              >
                {app.letter}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { label: "Teams", value: "12k+" },
            { label: "Users", value: "280k" },
            { label: "Uptime", value: "99.9%" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-white text-xl font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {s.value}
              </div>
              <div className="text-white/50 text-xs mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-8 h-8 rounded-xl bg-[#036c5f] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="2" width="7" height="7" rx="2" fill="white"/>
                <rect x="11" y="2" width="7" height="7" rx="2" fill="white" fillOpacity="0.7"/>
                <rect x="2" y="11" width="7" height="7" rx="2" fill="white" fillOpacity="0.7"/>
                <rect x="11" y="11" width="7" height="7" rx="2" fill="white"/>
              </svg>
            </div>
            <span className="text-slate-900 font-semibold text-lg" style={{ fontFamily: "var(--font-display)" }}>
              WorkOS
            </span>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
            <div className="mb-8">
              <h1
                className="text-2xl font-bold text-slate-900 mb-1"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {title}
              </h1>
              <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
