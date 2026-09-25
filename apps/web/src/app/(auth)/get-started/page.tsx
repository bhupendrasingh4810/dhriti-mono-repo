"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAlert } from "@/components/shared/alert";
import { register } from "@/services/auth.service";

export type Page = "login" | "signup" | "reset-password" | "verify-email" | "dashboard";

type FieldErrors = {
  name: string | null;
  email: string | null;
  password: string | null;
};

const getEmailError = (email: string): string | null => {
  const trimmedEmail = email.trim();
  if (!trimmedEmail) {
    return "Email is required";
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail) ? null : "Email is invalid";
};

export default function SignupPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({ name: null, email: null, password: null });
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((currentValue) => ({ ...currentValue, [field]: value }));
    setFieldErrors((currentValue) => ({
      ...currentValue,
      [field]:
        field === "email"
          ? getEmailError(value)
          : value.trim()
            ? null
            : `${field === "name" ? "Name" : "Password"} is required`,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: FieldErrors = {
      name: form.name.trim() ? null : "Name is required",
      email: getEmailError(form.email),
      password: form.password.trim() ? null : "Password is required",
    };
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean)) {
      return;
    }
    setLoading(true);

    try {
      const response = await register({
        name: form.name,
        email: form.email,
        password: form.password,
        isTermsAccepted,
      });
      router.push(`/verify?email=${encodeURIComponent(response.email)}&token=${encodeURIComponent(response.token)}`);
    } catch (error) {
      showAlert({
        message: error instanceof Error ? error.message : "Unable to create your account.",
        dismissible: true,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const strength = (() => {
    const p = form.password;
    if (!p) return 0;
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  })();

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#ef4444", "#f59e0b", "#3b82f6", "#036c5f"][strength];

  return (
    <AuthLayout title="Create your account" subtitle="Start your 14-day free trial" illustration="signup">
      <form noValidate onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Name <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            placeholder="Jane Smith"
            className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
            style={{
              borderColor: fieldErrors.name ? "#dc2626" : "#036c5f",
              boxShadow: fieldErrors.name ? "0 0 0 3px rgba(220,38,38,0.12)" : "0 0 0 3px rgba(3,108,95,0.12)",
            }}
          />
          {fieldErrors.name && <p className="mt-1 text-sm text-red-600">{fieldErrors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Work email <span className="text-red-600">*</span>
          </label>
          <input
            type="email"
            name="email"
            autoComplete="email"
            value={form.email}
            onChange={set("email")}
            placeholder="you@company.com"
            className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
            style={{
              borderColor: fieldErrors.email ? "#dc2626" : "#036c5f",
              boxShadow: fieldErrors.email ? "0 0 0 3px rgba(220,38,38,0.12)" : "0 0 0 3px rgba(3,108,95,0.12)",
            }}
          />
          {fieldErrors.email && <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Password <span className="text-red-600">*</span>
          </label>
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={set("password")}
              placeholder="Min. 8 characters"
              className="w-full px-4 py-2.5 pr-11 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
              style={{
                borderColor: fieldErrors.password ? "#dc2626" : "#036c5f",
                boxShadow: fieldErrors.password ? "0 0 0 3px rgba(220,38,38,0.12)" : "0 0 0 3px rgba(3,108,95,0.12)",
              }}
            />
            <button
              type="button"
              aria-label={showPw ? "Hide password" : "Show password"}
              onClick={() => setShowPw(!showPw)}
              className="absolute z-10 right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
            >
              {showPw ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6z" />
                  <path d="M9.75 12a2.25 2.25 0 1 0 4.5 0 2.25 2.25 0 0 0-4.5 0z" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ transform: "rotate(180deg)" }}
                >
                  <path d="M3 13.5c2.35-2.1 5.25-3.15 9-3.15s6.65 1.05 9 3.15" />
                  <path d="M6.5 11.75 5 9.5" />
                  <path d="M12 10.35V7.75" />
                  <path d="m17.5 11.75 1.5-2.25" />
                </svg>
              )}
            </button>
          </div>
          {form.password && (
            <div className="mt-2">
              <div className="flex gap-1 mb-1">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-1 flex-1 rounded-full transition-all duration-300"
                    style={{ backgroundColor: i <= strength ? strengthColor : "#e2e8f0" }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: strengthColor }}>
                {strengthLabel}
              </span>
            </div>
          )}
          {fieldErrors.password && <p className="mt-1 text-sm text-red-600">{fieldErrors.password}</p>}
        </div>

        <div className="flex items-start gap-3 pt-1">
          <input
            type="checkbox"
            required
            id="terms"
            checked={isTermsAccepted}
            onChange={(event) => setIsTermsAccepted(event.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-[#036c5f] accent-[#036c5f]"
          />
          <label htmlFor="terms" className="text-sm text-slate-500 leading-relaxed">
            I agree to the{" "}
            <button
              type="button"
              className="text-[#036c5f] font-medium cursor-pointer hover:underline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                router.push("/terms-and-conditions");
              }}
            >
              Terms of Service
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="text-[#036c5f] font-medium cursor-pointer hover:underline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                router.push("/privacy-policy");
              }}
            >
              Privacy Policy
            </button>
          </label>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 px-4 rounded-[10px] bg-[#036c5f] hover:bg-[#024d44] cursor-pointer text-white text-sm font-semibold transition-all duration-200 disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm mt-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {loading ? (
            <>
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Creating account…
            </>
          ) : (
            "Create account"
          )}
        </button>

        <p className="text-center text-sm text-slate-500 pt-1">
          Already have an account?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="text-[#036c5f] hover:text-[#024d44] cursor-pointer font-semibold transition-colors"
          >
            Sign in
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
