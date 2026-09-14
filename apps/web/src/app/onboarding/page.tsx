"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Logo from "../../components/shared/logo";
import OnboardingStepOne from "@/components/onboarding/onboarding-step-one";
import OnboardingStepTwo from "@/components/onboarding/onboarding-step-two";
import OnboardingStepThree from "@/components/onboarding/onboarding-step-three";
import OnboardingStepFour from "@/components/onboarding/onboarding-step-four";
import OnboardingStepFive from "@/components/onboarding/onboarding-step-five";
import WorkspacePreview from "@/components/onboarding/workspace-preview";
import { createOrganization } from "@/services/organization.service";
import { uploadProfilePhoto } from "@/services/auth.service";
import { useAlert } from "@/components/alerts/alert-provider";
import { useAuth } from "@/hooks/use-auth";

type Step = 1 | 2 | 3 | 4 | 5;

const STEPS = [
    { id: 1, label: "Your Organization" },
    { id: 2, label: "Profile Photo" },
    { id: 3, label: "Your Goals" },
    { id: 4, label: "Invite Team" },
    { id: 5, label: "All Set" },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { showAlert } = useAlert();
    const { user } = useAuth();
    const [step, setStep] = useState<Step>(1);
    const [orgName, setOrgName] = useState("");
    const [orgSlug, setOrgSlug] = useState("");
    const [hasOrganization, setHasOrganization] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [goals, setGoals] = useState<string[]>(["chat"]);
    const [inviteEmails, setInviteEmails] = useState("");
    const [copied, setCopied] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {

        if (user?.organization) {
            setOrgName(user.organization.name);
            setOrgSlug(user.organization.slug);
            setHasOrganization(true);
            setStep(2);
        }
    }, [user]);

    const handleOrgName = (val: string) => {
        setOrgName(val);
        setOrgSlug(val.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, ""));
    };

    const handlePhotoFile = (file: File) => {
        setProfilePhoto(file);
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreview(e.target?.result as string);
        reader.readAsDataURL(file);
    };

    const removePhoto = () => {
        setProfilePhoto(null);
        setPhotoPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const toggleGoal = (id: string) => {
        setGoals((prev) =>
            prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
        );
    };

    const handleCopyLink = () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const createOnboardingOrganization = async () => {
        try {
            const organization = await createOrganization({ name: orgName.trim(), slug: orgSlug });
            const refreshResponse = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
            if (!refreshResponse.ok) {
                throw new Error("Unable to refresh your session for the new organization.");
            }
            setOrgName(organization.name);
            setOrgSlug(organization.slug);
            setHasOrganization(true);
        } catch (error) {
            showAlert({
                title: error instanceof Error ? error.message : "Unable to create your organization.",
                severity: "error",
                variant: "filled",
            });
            throw error;
        }
    };

    const continueFromProfilePhoto = async () => {
        if (!profilePhoto) {
            next();
            return;
        }

        setIsUploadingPhoto(true);
        try {
            await uploadProfilePhoto(profilePhoto);
            next();
        } catch (error) {
            showAlert({
                title: error instanceof Error ? error.message : "Unable to upload your profile photo.",
                severity: "error",
                variant: "filled",
            });
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const next = () => setStep((s) => Math.min(s + 1, 5) as Step);
    const back = () => setStep((s) => Math.max(s - 1, hasOrganization ? 2 : 1) as Step);

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: "#f8fafc" }}>
            {/* Left panel */}
            <div
                className="hidden lg:flex flex-col w-80 xl:w-96 min-h-screen sticky top-0"
                style={{ backgroundColor: "#036c5f" }}
            >
                {/* Logo */}
                <div className="px-8 pt-8 pb-6">
                    <div className="flex items-center">
                        <Logo size="medium" />
                        <span className="text-white font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
                            Dhriti OS
                        </span>
                    </div>
                </div>

                {/* Step indicators */}
                <div className="px-8 flex-1">
                    <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-6">
                        Setup steps
                    </p>
                    <div className="space-y-1">
                        {STEPS.map((s, i) => {
                            const isCompleted = step > s.id;
                            const isActive = step === s.id;
                            return (
                                <div key={s.id} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 flex-shrink-0"
                                            style={{
                                                backgroundColor: isCompleted
                                                    ? "rgba(255,255,255,0.95)"
                                                    : isActive
                                                        ? "rgba(255,255,255,0.2)"
                                                        : "rgba(255,255,255,0.08)",
                                                color: isCompleted ? "#036c5f" : "white",
                                                border: isActive ? "2px solid rgba(255,255,255,0.7)" : "2px solid transparent",
                                            }}
                                        >
                                            {isCompleted ? (
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20 6 9 17 4 12" />
                                                </svg>
                                            ) : (
                                                s.id
                                            )}
                                        </div>
                                        {i < STEPS.length - 1 && (
                                            <div
                                                className="w-px mt-1 mb-1 transition-all duration-500"
                                                style={{
                                                    height: "24px",
                                                    backgroundColor: step > s.id ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.15)",
                                                }}
                                            />
                                        )}
                                    </div>
                                    <div className="pt-0.5 pb-7">
                                        <p
                                            className="text-sm font-medium transition-all"
                                            style={{ color: isActive ? "white" : isCompleted ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.4)" }}
                                        >
                                            {s.id === 1 && hasOrganization ? `Organization: ${orgName}` : s.label}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Illustration area */}
                <div className="px-8 pb-8">
                    <WorkspacePreview step={step} orgName={orgName} photoPreview={photoPreview} goals={goals} />
                </div>
            </div>

            {/* Right content */}
            <div className="flex-1 flex flex-col">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                        <span className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Dhriti OS</span>
                    </div>
                    {/* Mobile progress dots */}
                    <div className="flex gap-1.5">
                        {STEPS.map((s) => (
                            <div
                                key={s.id}
                                className="rounded-full transition-all duration-300"
                                style={{
                                    width: step === s.id ? "20px" : "6px",
                                    height: "6px",
                                    backgroundColor: step >= s.id ? "#036c5f" : "#e2e8f0",
                                }}
                            />
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex items-center justify-center px-6 py-12">
                    <div className="w-full max-w-lg">
                        {step === 1 && !hasOrganization && (
                            <OnboardingStepOne
                                orgName={orgName}
                                orgSlug={orgSlug}
                                onOrgName={handleOrgName}
                                onNext={next}
                                onCreateOrganization={createOnboardingOrganization}
                            />
                        )}
                        {step === 2 && (
                            <OnboardingStepTwo
                                photoPreview={photoPreview}
                                isDragging={isDragging}
                                isUploading={isUploadingPhoto}
                                fileInputRef={fileInputRef}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    const file = e.dataTransfer.files[0];
                                    if (file?.type.startsWith("image/")) handlePhotoFile(file);
                                }}
                                onFileChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handlePhotoFile(file);
                                }}
                                onRemove={removePhoto}
                                onNext={continueFromProfilePhoto}
                                onBack={back}
                            />
                        )}
                        {step === 3 && (
                            <OnboardingStepThree goals={goals} onToggle={toggleGoal} onNext={next} onBack={back} />
                        )}
                        {step === 4 && (
                            <OnboardingStepFour
                                emails={inviteEmails}
                                onEmails={setInviteEmails}
                                copied={copied}
                                onCopy={handleCopyLink}
                                onNext={next}
                                onBack={back}
                            />
                        )}
                        {step === 5 && (
                            <OnboardingStepFive orgName={orgName} onEnter={() => router.push(`/${orgSlug}/home`)} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}