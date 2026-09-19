import React from "react";

export default function OnboardingStepOne({
    orgName,
    orgSlug,
    onOrgName,
    onNext,
    onCreateOrganization,
}: {
    orgName: string;
    orgSlug: string;
    onOrgName: (v: string) => void;
    onNext: () => void;
    onCreateOrganization: () => Promise<void>;
}) {

    const [hasError, setHasError] = React.useState(false);
    const [hasSubmitted, setHasSubmitted] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const showError = hasSubmitted && hasError;

    const onOrgNameChange = (val: string) => {
        onOrgName(val);
        if (hasSubmitted) {
            setHasError(!val.trim());
        }
    };

    const onNextClick = async () => {
        setHasSubmitted(true);
        if (!orgName.trim()) {
            setHasError(true);
            return;
        }
        setHasError(false);
        setIsSubmitting(true);
        try {
            await onCreateOrganization();
            onNext();
        } finally {
            setIsSubmitting(false);
        }
    };
    return (
        <div className="animate-fadeIn">
            <div className="mb-8">
                <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
                    style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    Step 1 of 6
                </div>
                <h1
                    className="text-3xl font-bold text-slate-900 mb-3 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Create your organization
                    <br />
                    <span style={{ color: "#036c5f" }}>in Dhriti OS</span>
                </h1>
                <p className="text-slate-500 text-base leading-relaxed">
                    Give your workspace a name your team will recognize — like your company or team name.
                </p>
            </div>

            <div className="space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Organization name {" "}
                        <span style={{ color: "#dc2626" }}>*</span>
                    </label>
                    <input
                        type="text"
                        value={orgName}
                        onChange={(e) => onOrgNameChange(e.target.value)}
                        placeholder="Acme Corporation"
                        maxLength={50}
                        className="w-full px-4 py-3 text-base rounded-xl border text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all"
                        style={{
                            borderColor: showError ? "#dc2626" : "#036c5f",
                            boxShadow: showError
                                ? "0 0 0 3px rgba(220,38,38,0.12)"
                                : "0 0 0 3px rgba(3,108,95,0.12)",
                            fontFamily: "var(--font-display)",
                        }}
                        autoFocus
                    />
                    <div className="flex items-center justify-between mt-2">
                        {showError ? (
                            <p className="text-xs font-medium flex items-center gap-1" style={{ color: "#dc2626" }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                Organization name is required
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400">You can always change this later</p>
                        )}
                        <span className="text-xs text-slate-400">{orgName.length}/50</span>
                    </div>
                </div>

                <div
                    className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round">
                        <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
                        <path d="M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
                    </svg>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-500 mb-0.5">Your workspace URL</p>
                        <p className="text-sm font-mono font-medium text-slate-700 truncate">
                            dhritios.app/<span style={{ color: "#036c5f" }}>{orgSlug || "your-org"}</span>
                        </p>
                    </div>
                </div>

                <button
                    onClick={onNextClick}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-xl text-white text-sm font-semibold cursor-pointer transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 mt-2"
                    style={{ backgroundColor: "#036c5f", fontFamily: "var(--font-display)" }}
                    onMouseOver={(e) => { if (orgName.trim()) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44"; }}
                    onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f"; }}
                >
                    {isSubmitting ? "Creating organization..." : "Continue"}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                    </svg>
                </button>
            </div>
        </div>
    );
}