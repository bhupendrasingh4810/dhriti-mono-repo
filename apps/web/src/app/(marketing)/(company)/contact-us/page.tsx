"use client";

import { useState } from "react";

interface Props {
  navigate: (p: string) => void;
}

type Category = "general" | "sales" | "support" | "press";

const CATEGORIES: { id: Category; label: string; icon: string; desc: string }[] = [
  { id: "general", label: "General inquiry", icon: "💬", desc: "Questions or feedback" },
  { id: "sales", label: "Talk to sales", icon: "📈", desc: "Enterprise plans & demos" },
  { id: "support", label: "Technical support", icon: "🛠️", desc: "Help with the product" },
  { id: "press", label: "Press & media", icon: "📰", desc: "Journalists & analysts" },
];

const CONTACT_CARDS = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    label: "Email us",
    value: "hello@dhritios.app",
    sub: "We reply within 24 hours",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    label: "Live chat",
    value: "Available in-app",
    sub: "Mon–Fri, 9am–6pm IST",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    label: "Office",
    value: "Bengaluru, India",
    sub: "1234 Tech Park, HSR Layout",
  },
];

export default function ContactPage({ navigate }: Props) {
  const [category, setCategory] = useState<Category>("general");
  const [form, setForm] = useState({ name: "", email: "", company: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1000);
  };

  const inputClass = "w-full px-4 py-3 text-sm rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all";
  const inputFocus = {
    onFocus: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#036c5f";
      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(3,108,95,0.10)";
    },
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      e.currentTarget.style.borderColor = "#e2e8f0";
      e.currentTarget.style.boxShadow = "none";
    },
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      <div className="flex-1 flex">
        {/* Left — form */}
        <div className="flex-1 px-8 py-12">
          {/* Header */}
          <div className="mb-8">
            <h1
              className="text-4xl font-black text-slate-900 mb-3 leading-tight"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
            >
              Get in touch
            </h1>
            <p className="text-slate-500 text-base">
              Choose what brings you here and we'll connect you with the right team.
            </p>
          </div>

          {/* Category selector */}
          <div className="grid grid-cols-2 gap-2.5 mb-8">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className="text-left px-4 py-3.5 rounded-xl transition-all flex items-start gap-3"
                style={{
                  border: `1.5px solid ${category === c.id ? "#036c5f" : "#e2e8f0"}`,
                  backgroundColor: category === c.id ? "#e6f4f2" : "white",
                }}
              >
                <span className="text-lg">{c.icon}</span>
                <div>
                  <p className="text-sm font-bold" style={{ color: category === c.id ? "#036c5f" : "#0f172a" }}>{c.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{c.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Form */}
          {sent ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ backgroundColor: "#e6f4f2", border: "1px solid rgba(3,108,95,0.2)" }}
            >
              <div
                className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: "#036c5f" }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                Message sent!
              </h3>
              <p className="text-sm text-slate-600 mb-5">
                We've received your message and will get back to you at <strong>{form.email}</strong> within 24 hours.
              </p>
              <button
                onClick={() => { setSent(false); setForm({ name: "", email: "", company: "", message: "" }); }}
                className="text-sm font-semibold text-[#036c5f] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Full name <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input type="text" required value={form.name} onChange={set("name")} placeholder="Jane Smith" className={inputClass} {...inputFocus} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Work email <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input type="email" required value={form.email} onChange={set("email")} placeholder="jane@company.com" className={inputClass} {...inputFocus} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Company</label>
                <input type="text" value={form.company} onChange={set("company")} placeholder="Acme Corp" className={inputClass} {...inputFocus} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Message <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <textarea
                  required
                  value={form.message}
                  onChange={set("message")}
                  rows={5}
                  placeholder={
                    category === "sales"
                      ? "Tell us about your team size and what you're looking for..."
                      : category === "support"
                      ? "Describe the issue you're facing..."
                      : "How can we help you?"
                  }
                  className={inputClass + " resize-none"}
                  {...inputFocus}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 transition-all"
                style={{ backgroundColor: "#036c5f" }}
                onMouseOver={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44"; }}
                onMouseOut={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f"; }}
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
                  "Send message →"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right — info panel */}
        <div
          className="hidden lg:flex flex-col w-80 xl:w-96 border-l p-10"
          style={{ borderColor: "#e2e8f0", backgroundColor: "white" }}
        >
          <div className="mb-10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-5">Contact details</p>
            <div className="space-y-5">
              {CONTACT_CARDS.map((card) => (
                <div key={card.label} className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
                  >
                    {card.icon}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 mb-0.5">{card.label}</p>
                    <p className="text-sm font-bold text-slate-900">{card.value}</p>
                    <p className="text-xs text-slate-400">{card.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px mb-10" style={{ backgroundColor: "#f1f5f9" }} />

          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Response times</p>
            <div className="space-y-3">
              {[
                { plan: "Free", time: "Within 3 business days" },
                { plan: "Pro", time: "Within 24 hours" },
                { plan: "Enterprise", time: "Within 4 hours (SLA)" },
              ].map((r) => (
                <div key={r.plan} className="flex items-center justify-between">
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                    style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
                  >
                    {r.plan}
                  </span>
                  <span className="text-xs text-slate-500">{r.time}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto">
            <div
              className="rounded-2xl p-5"
              style={{ background: "linear-gradient(135deg, #036c5f 0%, #024d44 100%)" }}
            >
              <p className="text-sm font-bold text-white mb-1">Need faster help?</p>
              <p className="text-xs text-white/70 mb-4">Check our FAQ — most answers are there instantly.</p>
              <button
                onClick={() => navigate("faq" as string)}
                className="text-xs font-semibold text-white flex items-center gap-1 underline underline-offset-2"
              >
                Browse FAQ →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
