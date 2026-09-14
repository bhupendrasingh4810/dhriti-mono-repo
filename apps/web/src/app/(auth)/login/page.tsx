
"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAlert } from "@/components/alerts/alert-provider";
import AuthLayout from "../../../components/auth/AuthLayout";
import { MicrosoftOAuthButton } from "@/components/shared/oauth/MicrosoftOAuthButton";
import { GoogleOAuthButton } from "@/components/shared/oauth/GoogleOAuthButton";
import { GitHubOAuthButton } from "@/components/shared/oauth/GitHubOAuthButton";

export type Page =
  | "login"
  | "signup"
  | "reset-password"
  | "verify-email"
  | "dashboard";

const getEmailError = (email: string): string | null => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return "Email is required";
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) ? null : "Email is invalid";
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [formFieldValidity, setFormFieldValidity] = useState({ email: null as string | null, password: true });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = String(formData.email).trim();
    const password = String(formData.password).trim();
    const emailError = getEmailError(email);
    const validity = { email: emailError, password: password !== "" };
    setFormFieldValidity(validity);

    if (validity.email || !validity.password) {
      return;
    }

    setFormData({ email, password });
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to sign in.");
      }
      const callbackUrl = searchParams.get("callbackUrl");
      const organizationSlug = data.user?.organization?.slug;
      const isOrganizationCallback = callbackUrl?.startsWith(`/${organizationSlug}/`)
        || callbackUrl === `/${organizationSlug}`;
      const destination = !organizationSlug
        ? "/onboarding"
        : callbackUrl && isOrganizationCallback
          ? callbackUrl
          : `/${organizationSlug}/home`;
      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      showAlert({
        title: submitError instanceof Error ? submitError.message : "Unable to sign in.",
        severity: "error",
        variant: "filled",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your workspace"
      illustration="login"
    >
      <form noValidate onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Work email {" "}
            <span style={{ color: "#dc2626" }}>*</span>
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => {
              const email = e.target.value;
              setFormData((currentValue) => ({ ...currentValue, email }));
              setFormFieldValidity((currentValue) => ({ ...currentValue, email: getEmailError(email) }));
            }}
            placeholder="you@company.com"
            className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
            style={{
              borderColor: formFieldValidity.email ? "#dc2626" : "#036c5f",
              boxShadow: formFieldValidity.email
                ? "0 0 0 3px rgba(220,38,38,0.12)"
                : "0 0 0 3px rgba(3,108,95,0.12)",
            }}
          />
          <div className="flex items-center justify-between mt-2">
            {formFieldValidity.email ? (
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: "#dc2626" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {formFieldValidity.email}
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">
              Password {" "}
              <span style={{ color: "#dc2626" }}>*</span>
            </label>
            <button
              type="button"
              onClick={() => router.push("/forgot-password")}
              className="text-xs text-[#036c5f] hover:text-[#024d44] font-medium cursor-pointer transition-colors"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => {
                const password = e.target.value;
                setFormData((currentValue) => ({ ...currentValue, password }));
                setFormFieldValidity((currentValue) => ({ ...currentValue, password: password.trim() !== "" }));
              }}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 pr-11 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
              style={{
                borderColor: !formFieldValidity.password ? "#dc2626" : "#036c5f",
                boxShadow: !formFieldValidity.password
                  ? "0 0 0 3px rgba(220,38,38,0.12)"
                  : "0 0 0 3px rgba(3,108,95,0.12)",
              }}
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              {showPw ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                  <path d="M9.75 12a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0z" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(180deg)" }}>
                  <path d="M3 13.5c2.35-2.1 5.25-3.15 9-3.15s6.65 1.05 9 3.15" />
                  <path d="M6.5 11.75 5 9.5" />
                  <path d="M12 10.35V7.75" />
                  <path d="m17.5 11.75 1.5-2.25" />
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center justify-between mt-2">
            {!formFieldValidity.password ? (
              <p className="text-xs font-medium flex items-center gap-1" style={{ color: "#dc2626" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                Password is required
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-[10px] bg-[#036c5f] hover:bg-[#024d44] text-white text-sm font-semibold cursor-pointer transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs text-slate-400 font-medium">or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <GoogleOAuthButton />
          <GitHubOAuthButton />
        </div>

        <p className="text-center text-sm text-slate-500 pt-2">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/get-started")}
            className="text-[#036c5f] hover:text-[#024d44] cursor-pointer font-semibold transition-colors"
          >
            Create one
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}