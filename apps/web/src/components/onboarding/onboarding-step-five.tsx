import React, { useState } from "react";

interface OnboardingStepFiveProps {
    emails: string;
    onEmails: (v: string) => void;
    copied: boolean;
    onCopy: () => void;
    onNext: () => void;
    onBack: () => void;
}

export default function OnboardingStepFive({
    emails,
    onEmails,
    copied,
    onCopy,
    onNext,
    onBack,
}: OnboardingStepFiveProps) {
    const [showSkipModal, setShowSkipModal] = useState(false);

    return (
        <div className="animate-fadeIn">
            <div className="mb-8">
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                    style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                    </svg>
                    Step 5 of 6
                </div>
                <h1
                    className="text-3xl font-bold text-slate-900 mb-3 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Bring your team
                    <br />
                    <span style={{ color: "#036c5f" }}>onboard</span>
                </h1>
                <p className="text-slate-500 text-base">
                    Dhriti OS is better together. Add teammates to get started collaborating right away.
                </p>
            </div>

            <div className="space-y-4 mb-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Invite by email
                    </label>
                    <textarea
                        value={emails}
                        onChange={(e) => onEmails(e.target.value)}
                        placeholder="sarah@company.com, alex@company.com, ..."
                        rows={4}
                        className="w-full px-4 py-3 text-sm rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all resize-none"
                        style={{
                            borderColor: emails ? "#036c5f" : undefined,
                            boxShadow: emails ? "0 0 0 3px rgba(3,108,95,0.10)" : undefined,
                        }}
                        onFocus={(e) => {
                            e.currentTarget.style.borderColor = "#036c5f";
                            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(3,108,95,0.10)";
                        }}
                        onBlur={(e) => {
                            if (!emails) {
                                e.currentTarget.style.borderColor = "#e2e8f0";
                                e.currentTarget.style.boxShadow = "none";
                            }
                        }}
                    />
                    <p className="text-xs text-slate-400 mt-1.5">Separate multiple emails with commas</p>
                </div>

                {/* Copy link card */}
                <div
                    className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                    style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}
                >
                    <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: "#e6f4f2" }}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="2" strokeLinecap="round">
                            <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
                        </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700">Share an invite link</p>
                        <p className="text-xs text-slate-500 truncate font-mono">dhritios.app/join/abc123xyz</p>
                    </div>
                    <button
                        type="button"
                        onClick={onCopy}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex-shrink-0"
                        style={{
                            backgroundColor: copied ? "#036c5f" : "white",
                            color: copied ? "white" : "#036c5f",
                            border: `1px solid ${copied ? "#036c5f" : "#036c5f"}`,
                        }}
                    >
                        {copied ? "Copied!" : "Copy"}
                    </button>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onBack}
                    className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                >
                    Back
                </button>
                {emails.trim() ? (
                    <button
                        onClick={onNext}
                        className="flex-1 py-3 px-6 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        style={{ backgroundColor: "#036c5f", fontFamily: "var(--font-display)" }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44"; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f"; }}
                    >
                        Send invites & continue
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                ) : (
                    <button
                        onClick={() => setShowSkipModal(true)}
                        className="flex-1 py-3 px-6 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        style={{ backgroundColor: "#f1f5f9", color: "#475569" }}
                    >
                        Skip for now
                    </button>
                )}
            </div>

            {/* Skip confirmation modal */}
            {showSkipModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.4)" }}>
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4 shadow-xl">
                        <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                            Skip without inviting?
                        </h3>
                        <p className="text-sm text-slate-500 mb-5">
                            Dhriti OS works best with your team. You can still invite people later from Settings.
                        </p>
                        <div className="space-y-2 mb-5">
                            {[
                                { text: "Real-time team messaging" },
                                { text: "Shared project boards" },
                                { text: "Collaborative documents" },
                            ].map((item) => (
                                <div key={item.text} className="flex items-center gap-3">
                                    {/* <span>{item.icon}</span> */}
                                    <span className="text-sm text-slate-600">{item.text}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowSkipModal(false)}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
                            >
                                Go back
                            </button>
                            <button
                                onClick={() => { setShowSkipModal(false); onNext(); }}
                                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                                style={{ backgroundColor: "#036c5f" }}
                            >
                                Skip anyway
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}