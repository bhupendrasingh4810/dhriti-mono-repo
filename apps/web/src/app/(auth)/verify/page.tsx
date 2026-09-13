"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
// import type { Page } from "../App";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAlert } from "@/components/alerts/alert-provider";
import { resendVerification, verifyEmail } from "@/services/auth.service";

interface Props {
  email: string;
}

export default function VerifyEmailPage({ email }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showAlert } = useAlert();
  const verificationEmail = searchParams.get("email") ?? email;
  const verificationToken = searchParams.get("token");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (i: number, val: string) => {
    const v = val.replace(/\D/, "").slice(-1);
    const next = [...code];
    next[i] = v;
    setCode(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length) {
      const next = text.split("").concat(Array(6).fill("")).slice(0, 6);
      setCode(next);
      inputs.current[Math.min(text.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEmail || !verificationToken) {
      showAlert({ title: "Verification link is invalid or incomplete.", severity: "error", variant: "filled" });
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ email: verificationEmail, token: verificationToken, otp: code.join("") });
      router.push("/onboarding");
    } catch (error) {
      showAlert({
        title: error instanceof Error ? error.message : "Unable to verify your email.",
        severity: "error",
        variant: "filled",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!verificationEmail || !verificationToken) {
      showAlert({ title: "Verification link is invalid or incomplete.", severity: "error", variant: "filled" });
      return;
    }

    setResending(true);
    try {
      await resendVerification({ email: verificationEmail, token: verificationToken });
    } catch (error) {
      showAlert({
        title: error instanceof Error ? error.message : "Unable to resend the verification email.",
        severity: "error",
        variant: "filled",
      });
      return;
    } finally {
      setResending(false);
    }

    setResent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const filled = code.every((c) => c !== "");

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={`Enter the 6-digit code sent to ${verificationEmail || "your email"}`}
      illustration="verify"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-2 justify-between" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-[10px] border-2 text-slate-900 transition-all focus:outline-none"
              style={{
                borderColor: digit ? "#036c5f" : "#e2e8f0",
                backgroundColor: digit ? "#e6f4f2" : "white",
                fontFamily: "var(--font-mono)",
              }}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!filled || loading}
          className="w-full py-2.5 px-4 rounded-[10px] bg-[#036c5f] hover:bg-[#024d44] cursor-pointer text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Verifying…
            </>
          ) : (
            "Verify email"
          )}
        </button>

        <div className="text-center space-y-3">
          {resent && countdown > 0 ? (
            <p className="text-sm text-slate-500">
              Code resent. Resend again in{" "}
              <span className="font-semibold text-slate-700">{countdown}s</span>
            </p>
          ) : (
            <p className="text-sm text-slate-500">
              Didn't receive a code?{" "}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[#036c5f] font-semibold hover:text-[#024d44] cursor-pointer transition-colors"
              >
                {resending ? "Resending..." : "Resend"}
              </button>
            </p>
          )}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-sm text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
          >
            ← Back to sign in
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
