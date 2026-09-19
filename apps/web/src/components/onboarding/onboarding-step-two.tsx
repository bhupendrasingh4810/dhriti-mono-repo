import React from "react";

export default function OnboardingStepTwo({
    photoPreview,
    isDragging,
    isUploading,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileChange,
    onRemove,
    onNext,
    onBack,
}: {
    photoPreview: string | null;
    isDragging: boolean;
    isUploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: () => void;
    onDrop: (e: React.DragEvent) => void;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: () => void;
    onNext: () => void | Promise<void>;
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
                        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Step 2 of 6
                </div>
                <h1
                    className="text-3xl font-bold text-slate-900 mb-3 leading-tight"
                    style={{ fontFamily: "var(--font-display)" }}
                >
                    Add your <span style={{ color: "#036c5f" }}>profile photo</span>
                </h1>
                <p className="text-slate-500 text-base">
                    A photo helps teammates recognize you across channels and conversations.
                </p>
            </div>

            <div className="space-y-6">
                {/* Upload zone */}
                <div
                    className="relative flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-200"
                    style={{
                        height: "240px",
                        border: `2px dashed ${isDragging ? "#036c5f" : photoPreview ? "#036c5f" : "#cbd5e1"}`,
                        backgroundColor: isDragging ? "#e6f4f2" : photoPreview ? "#f0fbf9" : "#f8fafc",
                    }}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !photoPreview && fileInputRef.current?.click()}
                >
                    {photoPreview ? (
                        <>
                            <img
                                src={photoPreview}
                                alt="Profile preview"
                                className="w-36 h-36 rounded-full object-cover shadow-lg"
                                style={{ border: "4px solid #036c5f" }}
                            />
                            <div className="mt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                                    disabled={isUploading}
                                    className="px-4 py-1.5 text-xs font-semibold rounded-lg text-white transition-all"
                                    style={{ backgroundColor: "#036c5f" }}
                                >
                                    Change
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); onRemove(); }}
                                    disabled={isUploading}
                                    className="px-4 py-1.5 text-xs font-semibold rounded-lg text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                                >
                                    Remove
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div
                                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                                style={{ backgroundColor: "#e6f4f2" }}
                            >
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#036c5f" strokeWidth="1.5" strokeLinecap="round">
                                    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                                {isDragging ? "Drop your photo here" : "Drag & drop your photo"}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">or click to browse — JPG, PNG, WebP, GIF up to 2MB</p>
                        </>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={onFileChange}
                />

                {/* Initials fallback hint */}
                {!photoPreview && (
                    <div
                        className="flex items-center gap-3 rounded-xl px-4 py-3"
                        style={{ backgroundColor: "#f1f5f9", border: "1px solid #e2e8f0" }}
                    >
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                            style={{ backgroundColor: "#036c5f" }}
                        >
                            JS
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">Prefer to skip for now?</p>
                            <p className="text-xs text-slate-500">Your initials avatar will be used until you add a photo</p>
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onBack}
                        className="px-5 py-3 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
                    >
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={isUploading}
                        className="flex-1 py-3 px-6 rounded-xl text-white text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                        style={{ backgroundColor: "#036c5f", fontFamily: "var(--font-display)" }}
                        onMouseOver={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44"; }}
                        onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f"; }}
                    >
                        {isUploading ? "Uploading..." : photoPreview ? "Continue" : "Skip for now"}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}