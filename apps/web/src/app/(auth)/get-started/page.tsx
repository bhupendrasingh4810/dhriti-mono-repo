"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { useAlert } from "@/components/alerts/alert-provider";
import { register } from "@/services/auth.service";

export type Page =
  | "login"
  | "signup"
  | "reset-password"
  | "verify-email"
  | "dashboard";

export default function SignupPage() {
  const router = useRouter();
  const { showAlert } = useAlert();
  const [form, setForm] = useState({ name: "", email: "", password: "", company: "" });
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        title: error instanceof Error ? error.message : "Unable to create your account.",
        severity: "error",
        variant: "filled",
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
      <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={set("name")}
              placeholder="Jane Smith"
              className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
            />
          </div>
          {/* <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
            <input
              type="text"
              value={form.company}
              onChange={set("company")}
              placeholder="Acme Corp"
              className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
            />
          </div> */}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Work email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={set("email")}
            placeholder="you@company.com"
            className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
          <input
            type="password"
            required
            value={form.password}
            onChange={set("password")}
            placeholder="Min. 8 characters"
            className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#036c5f]/30 focus:border-[#036c5f] transition-all"
          />
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
              }}
            >
              Terms of Service
            </button>
            {" "}and{" "}
            <button
              type="button"
              className="text-[#036c5f] font-medium cursor-pointer hover:underline"
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
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