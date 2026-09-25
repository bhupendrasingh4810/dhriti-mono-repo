import React from "react";

interface OnboardingStepSixProps {
  orgName: string;
  onEnter: () => void;
}

export default function OnboardingStepSix({ orgName, onEnter }: OnboardingStepSixProps) {
  return (
    <div className="animate-fadeIn text-center">
      {/* Animated checkmark */}
      <div className="flex justify-center mb-8">
        <div className="w-24 h-24 rounded-full flex items-center justify-center" style={{ backgroundColor: "#e6f4f2" }}>
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#036c5f" }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
        You're all set! 🎉
      </h1>
      <p className="text-slate-500 text-base mb-2">
        <strong className="text-slate-700">{orgName}</strong> is ready on Dhriti OS.
      </p>
      <p className="text-slate-400 text-sm mb-10">
        Your workspace has been configured based on your goals. Let's get to work.
      </p>

      {/* Feature highlights */}
      <div className="grid grid-cols-3 gap-3 mb-10">
        {[
          { icon: "💬", label: "Team Channels", desc: "Organized conversations" },
          { icon: "📋", label: "Project Boards", desc: "Track every task" },
          { icon: "✨", label: "AI Assistant", desc: "Smarter workflows" },
        ].map((feat) => (
          <div
            key={feat.label}
            className="rounded-xl py-4 px-3 text-center"
            style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
          >
            <div className="text-2xl mb-2">{feat.icon}</div>
            <p className="text-xs font-semibold text-slate-700">{feat.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{feat.desc}</p>
          </div>
        ))}
      </div>

      <button
        onClick={onEnter}
        className="w-full py-4 px-6 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
        style={{
          backgroundColor: "#036c5f",
          fontFamily: "var(--font-display)",
          boxShadow: "0 8px 24px rgba(3,108,95,0.3)",
        }}
        onMouseOver={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44";
        }}
        onMouseOut={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f";
        }}
      >
        Open my Dhriti OS workspace
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>

      <p className="text-xs text-slate-400 mt-4">You can update any settings at any time from your profile</p>
    </div>
  );
}
