import React from "react";

const USAGE_TYPE = [
    { id: "PROFESSIONAL", label: "Professional Teams", desc: "Manage projects, track sprints, and coordinate deliverables" },
    { id: "EDUCATION", label: "Education & Learning", desc: "Organize lectures, distribute assignments, and manage classrooms" },
    { id: "PERSONAL", label: "Personal & Side Projects", desc: "Track personal goals, organize ideas, and build a digital wiki" },
    { id: "OTHER", label: "Other", desc: "Custom workflows, communities, or anything else you want to create" },
];

export default function OnboardingStepThree({
    goal,
    onSelect,
    onNext,
    onBack,
}: {
    goal: string;
    onSelect: (id: string) => void;
    onNext: () => void;
    onBack: () => void;
}) {
    return (
        <div className="animate-fadeIn">
            <div className="mb-8">
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                    style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Step 3 of 6
                </div>
                <h1
                    className="text-3xl font-bold text-slate-900 mb-3 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    What will you use
                    <br />
                    <span style={{ color: "#036c5f" }}>Dhriti OS</span> for?
                </h1>
                <p className="text-slate-500 text-base">
                    Choose the option that best describes how you will use Dhriti OS.
                </p>
            </div>

            <div className="space-y-2.5 mb-7">
                {USAGE_TYPE.map((opt) => {
                    const selected = goal === opt.id;
                    return (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => onSelect(opt.id)}
                            aria-pressed={selected}
                            className="w-full text-left rounded-xl px-4 py-3.5 transition-all duration-150 flex items-center gap-4"
                            style={{
                                border: `1.5px solid ${selected ? "#036c5f" : "#e2e8f0"}`,
                                backgroundColor: selected ? "#e6f4f2" : "white",
                            }}
                        >
                            {/* <span className="text-xl flex-shrink-0">{opt.icon}</span> */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800">{opt.label}</p>
                                <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                            </div>
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                    backgroundColor: selected ? "#036c5f" : "white",
                                    border: `1.5px solid ${selected ? "#036c5f" : "#cbd5e1"}`,
                                }}
                            >
                                {selected && (
                                    <span className="w-2 h-2 rounded-full bg-white" />
                                )}
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                    Back
                </button>
                <button
                    onClick={onNext}
                    disabled={!goal}
                    className="flex-1 py-3 px-6 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#036c5f", fontFamily: "var(--font-display)" }}
                    onMouseOver={(e) => { if (goal) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f"; }}
                >
                    Continue
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </div>
    );
}