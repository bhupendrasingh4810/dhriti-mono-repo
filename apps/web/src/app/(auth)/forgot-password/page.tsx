"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "../../../components/auth/AuthLayout";
import { useAlert } from "@/components/shared/alert";
import { forgotPassword } from "@/services/auth.service";

const getEmailError = (email: string): string | null => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return "Email is required";
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) ? null : "Email is invalid";
};

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = getEmailError(email);
    setEmailError(error);
    if (error) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      await forgotPassword({ email });
      setSent(true);
    } catch (error) {
      showAlert({
        message: error instanceof Error ? error.message : "Unable to request a password reset.",
        variant: "error",
        dismissible: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? "Check your email" : "Forgot your password"}
      subtitle={
        sent
          ? "If an account exists for this email, you will receive a password reset link shortly."
          : "We'll send you a link to reset your password"
      }
      illustration="reset"
    >
      {sent ? (
        <div className="space-y-5">
          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#036c5f]/10 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="6" width="20" height="14" rx="3" stroke="#036c5f" strokeWidth="1.5" />
                <path
                  d="M2 9l10 7 10-7"
                  stroke="#036c5f"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 space-y-2">
            <p className="text-sm text-slate-600 text-center">
              Didn&apos;t receive the email? Check your spam folder, or
            </p>
            <button
              onClick={() => setSent(false)}
              className="w-full text-sm text-[#036c5f] font-semibold hover:text-[#024d44] cursor-pointer transition-colors text-center"
            >
              Try a different address
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-2.5 px-4 rounded-[10px] bg-[#036c5f] hover:bg-[#024d44] cursor-pointer text-white text-sm font-semibold transition-all duration-200 shadow-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Back to sign in
          </button>
        </div>
      ) : (
        <form noValidate onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Work email <span className="text-red-600">*</span>
            </label>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                const email = e.target.value;
                setEmail(email);
                setEmailError(getEmailError(email));
              }}
              placeholder="you@company.com"
              className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
              style={{
                borderColor: emailError ? "#dc2626" : "#036c5f",
                boxShadow: emailError ? "0 0 0 3px rgba(220,38,38,0.12)" : "0 0 0 3px rgba(3,108,95,0.12)",
              }}
            />
            {emailError && <p className="mt-1 text-sm text-red-600">{emailError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-[10px] bg-[#036c5f] hover:bg-[#024d44] cursor-pointer text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Sending…
              </>
            ) : (
              "Send reset link"
            )}
          </button>

          <button
            type="button"
            onClick={() => router.push("/login")}
            className="w-full py-2.5 px-4 rounded-[10px] cursor-pointer border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold transition-all duration-200"
          >
            ← Back to sign in
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
