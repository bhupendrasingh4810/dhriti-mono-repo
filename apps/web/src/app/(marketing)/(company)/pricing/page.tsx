"use client";

import { useState, useMemo, useId } from "react";
import { useRouter } from "next/navigation";
import PlanCard from "@/components/marketing/PlanCard";

/* ─────────────────────────────────────────────────────────
   Types & constants
───────────────────────────────────────────────────────── */
type Cycle = "monthly" | "yearly";
type PlanId = "free" | "standard" | "premium" | "enterprise";

const YEARLY_DISCOUNT = 0.2;
const MONTHLY_BASE_PRICES: Record<PlanId, number> = {
  free: 0,
  standard: 1499,
  premium: 2499,
  enterprise: 3499,
};

function fmt(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function recommendedPlan(users: number): PlanId {
  if (users <= 10) return "free";
  if (users <= 250) return "standard";
  if (users <= 750) return "premium";
  return "enterprise";
}

/* ─────────────────────────────────────────────────────────
   Feature catalogue
───────────────────────────────────────────────────────── */
type FeatureRow = {
  label: string;
  category: string;
  free: string | boolean;
  standard: string | boolean;
  premium: string | boolean;
  enterprise: string | boolean;
};

const FEATURES: FeatureRow[] = [
  // Workspace
  {
    category: "Workspace",
    label: "Team members",
    free: "Up to 10",
    standard: "Up to 250",
    premium: "Up to 2,500",
    enterprise: "Unlimited",
  },
  {
    category: "Workspace",
    label: "Channels",
    free: "5 channels",
    standard: "Unlimited",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    category: "Workspace",
    label: "Storage per user",
    free: "5 GB",
    standard: "50 GB",
    premium: "200 GB",
    enterprise: "Unlimited",
  },
  {
    category: "Workspace",
    label: "Message history",
    free: "30 days",
    standard: "Unlimited",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    category: "Workspace",
    label: "Guest access",
    free: false,
    standard: "5 guests",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  // Collaboration
  { category: "Collaboration", label: "Direct messaging", free: true, standard: true, premium: true, enterprise: true },
  {
    category: "Collaboration",
    label: "Threads & replies",
    free: true,
    standard: true,
    premium: true,
    enterprise: true,
  },
  {
    category: "Collaboration",
    label: "File sharing",
    free: "25 MB limit",
    standard: "1 GB limit",
    premium: "5 GB limit",
    enterprise: "Unlimited",
  },
  {
    category: "Collaboration",
    label: "Video calls",
    free: "1:1 only",
    standard: "Up to 25",
    premium: "Up to 100",
    enterprise: "Unlimited",
  },
  { category: "Collaboration", label: "Screen sharing", free: false, standard: true, premium: true, enterprise: true },
  {
    category: "Collaboration",
    label: "Collaborative docs",
    free: false,
    standard: true,
    premium: true,
    enterprise: true,
  },
  // Project management
  {
    category: "Project Management",
    label: "Task boards",
    free: "3 boards",
    standard: "Unlimited",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    category: "Project Management",
    label: "Sprint planning",
    free: false,
    standard: true,
    premium: true,
    enterprise: true,
  },
  {
    category: "Project Management",
    label: "Time tracking",
    free: false,
    standard: false,
    premium: true,
    enterprise: true,
  },
  {
    category: "Project Management",
    label: "Custom workflows",
    free: false,
    standard: false,
    premium: true,
    enterprise: true,
  },
  {
    category: "Project Management",
    label: "Gantt charts",
    free: false,
    standard: false,
    premium: true,
    enterprise: true,
  },
  // AI & Automation
  {
    category: "AI & Automation",
    label: "Nexus AI assistant",
    free: "10 queries/mo",
    standard: "500 queries/mo",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    category: "AI & Automation",
    label: "AI-generated summaries",
    free: false,
    standard: true,
    premium: true,
    enterprise: true,
  },
  {
    category: "AI & Automation",
    label: "Workflow automations",
    free: false,
    standard: "10/month",
    premium: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    category: "AI & Automation",
    label: "Custom AI agents",
    free: false,
    standard: false,
    premium: "5 agents",
    enterprise: "Unlimited",
  },
  // Security
  {
    category: "Security & Compliance",
    label: "Two-factor authentication",
    free: true,
    standard: true,
    premium: true,
    enterprise: true,
  },
  {
    category: "Security & Compliance",
    label: "SSO / SAML",
    free: false,
    standard: false,
    premium: true,
    enterprise: true,
  },
  {
    category: "Security & Compliance",
    label: "Audit logs",
    free: false,
    standard: false,
    premium: "90 days",
    enterprise: "Unlimited",
  },
  {
    category: "Security & Compliance",
    label: "Data residency",
    free: false,
    standard: false,
    premium: false,
    enterprise: true,
  },
  {
    category: "Security & Compliance",
    label: "HIPAA compliance",
    free: false,
    standard: false,
    premium: false,
    enterprise: true,
  },
  {
    category: "Security & Compliance",
    label: "Custom data retention",
    free: false,
    standard: false,
    premium: false,
    enterprise: true,
  },
  // Support
  { category: "Support", label: "Community forums", free: true, standard: true, premium: true, enterprise: true },
  { category: "Support", label: "Email support", free: false, standard: true, premium: true, enterprise: true },
  { category: "Support", label: "Priority support", free: false, standard: false, premium: true, enterprise: true },
  {
    category: "Support",
    label: "Dedicated success manager",
    free: false,
    standard: false,
    premium: false,
    enterprise: true,
  },
  { category: "Support", label: "SLA guarantee", free: false, standard: false, premium: "99.9%", enterprise: "99.99%" },
  { category: "Support", label: "Phone support", free: false, standard: false, premium: false, enterprise: true },
];

/* ─────────────────────────────────────────────────────────
   Plan bullets
───────────────────────────────────────────────────────── */
const PLAN_BULLETS: Record<PlanId, string[]> = {
  free: [
    "Up to 10 team members",
    "5 channels",
    "5 GB storage per user",
    "30-day message history",
    "1:1 video calls",
    "3 task boards",
    "10 Nexus AI queries/mo",
    "Community support",
  ],
  standard: [
    "Everything in Free, plus:",
    "Up to 250 members",
    "Unlimited channels",
    "50 GB storage per user",
    "Unlimited message history",
    "Video calls up to 25 people",
    "Collaborative docs",
    "500 Nexus AI queries/mo",
    "10 workflow automations",
    "Email support",
  ],
  premium: [
    "Everything in Standard, plus:",
    "Up to 2,500 members",
    "200 GB storage per user",
    "Video calls up to 100 people",
    "Unlimited AI queries & agents",
    "Time tracking & Gantt charts",
    "Custom workflows",
    "SSO / SAML",
    "90-day audit logs",
    "Priority support",
  ],
  enterprise: [
    "Everything in Premium, plus:",
    "Unlimited members & storage",
    "Custom SLA (99.99% uptime)",
    "Dedicated success manager",
    "HIPAA & custom compliance",
    "Data residency options",
    "Unlimited audit logs",
    "Custom AI agents (unlimited)",
    "On-premise deployment option",
    "24/7 phone & priority support",
  ],
};

/* ─────────────────────────────────────────────────────────
   Small atoms
───────────────────────────────────────────────────────── */
function Check({ color = "#036c5f" }: { color?: string }) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Dash() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#cbd5e1"
      strokeWidth="2.5"
      strokeLinecap="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function CellValue({ val, planColor }: { val: string | boolean; planColor: string }) {
  if (val === true) return <Check color={planColor} />;
  if (val === false) return <Dash />;
  return (
    <span className="text-xs font-medium" style={{ color: planColor }}>
      {val}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────
   Main page
───────────────────────────────────────────────────────── */

export default function PricingPage() {
  const router = useRouter();
  const [teamSize, setTeamSize] = useState<number>(25);
  const [inputVal, setInputVal] = useState("200");
  const [cycle, setCycle] = useState<Cycle>("monthly");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const inputId = useId();

  const recommended = useMemo(() => recommendedPlan(teamSize), [teamSize]);

  const yearlyPrice = (plan: PlanId) => Math.round(MONTHLY_BASE_PRICES[plan] * teamSize * 12 * (1 - YEARLY_DISCOUNT));

  const handleTeamInput = (raw: string) => {
    const value = raw.replace(/\D/g, "").slice(0, 6);
    setInputVal(value);
    const n = parseInt(value, 10);
    if (!isNaN(n) && n >= 1 && n <= 999999) setTeamSize(n);
  };

  /* ── categories deduped in order ── */
  const categories = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of FEATURES) {
      if (!seen.has(r.category)) {
        seen.add(r.category);
        out.push(r.category);
      }
    }
    return out;
  }, []);

  const faqs = [
    {
      q: "Can I change plans later?",
      a: "Yes — you can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades apply at the end of your billing cycle.",
    },
    {
      q: "What happens when my team exceeds the plan limit?",
      a: "We'll notify you when you're approaching the limit. You'll have 14 days to upgrade before new members are restricted.",
    },
    {
      q: "Is the yearly discount applied per seat?",
      a: "Yes. The 20% discount applies to the per-user monthly rate. You're billed annually as a single invoice.",
    },
    {
      q: "How does the volume discount work?",
      a: "For Standard and Premium, every additional user reduces the per-seat price by ₹2, down to the plan minimum (₹1,000 for Standard, ₹1,600 for Premium). The calculator above shows your exact rate.",
    },
    { q: "Do you offer a free trial?", a: "All paid plans include a 14-day free trial — no credit card required." },
    {
      q: "Can I get a custom quote for my enterprise?",
      a: "Absolutely. Click 'Contact sales' on the Enterprise card and our team will get back within one business day.",
    },
  ];

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#f8fafc", fontFamily: "var(--font-sans)" }}>
      {/* ── Hero ── */}
      <section className="max-w-4xl mx-auto px-6 pt-16 pb-12 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-5"
          style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          Transparent, usage-based pricing
        </div>
        <h1
          className="text-5xl font-black text-slate-900 mb-4 leading-none"
          style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
        >
          Pay for exactly what
          <br />
          <span style={{ color: "#036c5f" }}>your team needs</span>
        </h1>
        <p className="text-slate-500 text-lg leading-relaxed max-w-xl mx-auto">
          Adjust the calculator below — price updates in real time based on your team size and billing preference.
        </p>
      </section>

      {/* ── Calculator ── */}
      <section className="max-w-7xl mx-auto px-6 mb-14">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-center">
          {/* Team size */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label htmlFor={inputId} className="shrink-0 text-sm font-bold text-slate-700">
              Team size
            </label>
            <div className="flex items-center">
              <div className="relative w-full sm:w-40">
                <input
                  id={inputId}
                  type="number"
                  min={1}
                  max={999999}
                  value={inputVal}
                  onChange={(e) => handleTeamInput(e.target.value)}
                  onBlur={() => {
                    const n = parseInt(inputVal, 10);
                    const clamped = isNaN(n) ? 1 : Math.max(1, Math.min(n, 999999));
                    setTeamSize(clamped);
                    setInputVal(String(clamped));
                  }}
                  className="w-full px-4 py-3 rounded-xl text-slate-900 font-bold text-lg outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  style={{ border: "1.5px solid #036c5f", boxShadow: "0 0 0 3px rgba(3,108,95,0.10)" }}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                  users
                </span>
              </div>
            </div>
          </div>

          {/* Billing cycle */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="shrink-0 text-sm font-bold text-slate-700">Bill me</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(
                [
                  ["monthly", "Monthly"],
                  ["yearly", "Yearly"],
                ] as [Cycle, string][]
              ).map(([val, label]) => {
                const active = cycle === val;
                return (
                  <button
                    key={val}
                    onClick={() => setCycle(val)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left whitespace-nowrap"
                    style={{
                      borderColor: active ? "#036c5f" : "#e2e8f0",
                      backgroundColor: active ? "#e6f4f2" : "white",
                    }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                      style={{ borderColor: active ? "#036c5f" : "#cbd5e1" }}
                    >
                      {active && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#036c5f" }} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{label}</p>
                      {val === "yearly" && (
                        <p className="text-xs font-semibold" style={{ color: "#036c5f" }}>
                          Save up to 20%
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Plan cards ── */}
      <section className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {/* FREE */}
          <PlanCard
            id="free"
            recommended={recommended === "free"}
            title="Free"
            subtitle="For for 10 users"
            priceNode={
              cycle === "monthly" ? (
                <div style={{ color: recommended == "free" ? "#036c5f" : "#475569" }} className="text-center font-bold">
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    ₹0
                  </span>
                  <span className="ml-1 text-sm font-semibold">/ user / mo</span>
                </div>
              ) : (
                <div
                  style={{ color: recommended == "free" ? "#036c5f" : "#475569", fontWeight: "bold" }}
                  className="text-center"
                >
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    ₹0
                  </span>
                  <p className="mt-0.5 text-xs font-semibold">for {teamSize.toLocaleString("en-IN")} users / year</p>
                </div>
              )
            }
            bullets={PLAN_BULLETS.free}
            cta="Get started free"
            ctaAction={() => router.push("get-started")}
          />

          {/* STANDARD */}
          <PlanCard
            id="standard"
            recommended={recommended === "standard"}
            title="Standard"
            subtitle="Everything you need to get started"
            priceNode={
              cycle === "monthly" ? (
                <div
                  style={{ color: recommended == "standard" ? "#036c5f" : "#475569" }}
                  className="text-center font-bold"
                >
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    {fmt(MONTHLY_BASE_PRICES.standard)}
                  </span>
                  <span className="text-sm font-semibold ml-1">/ user / mo</span>
                </div>
              ) : (
                <div
                  style={{ color: recommended == "standard" ? "#036c5f" : "#475569" }}
                  className="text-center font-bold"
                >
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    {fmt(yearlyPrice("standard"))}
                  </span>
                  <p className="mt-0.5 text-xs font-semibold">for {teamSize.toLocaleString("en-IN")} users / year</p>
                </div>
              )
            }
            bullets={PLAN_BULLETS.standard}
            cta="Start free trial"
            ctaAction={() => router.push("get-started")}
          />

          {/* PREMIUM */}
          <PlanCard
            id="premium"
            recommended={recommended === "premium"}
            title="Premium"
            subtitle="Get your work automated"
            priceNode={
              cycle === "monthly" ? (
                <div
                  style={{ color: recommended == "premium" ? "#036c5f" : "#475569" }}
                  className="text-center font-bold"
                >
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    {fmt(MONTHLY_BASE_PRICES.premium)}
                  </span>
                  <span className="text-sm text-slate-400 ml-1">/ user / mo</span>
                </div>
              ) : (
                <div
                  style={{ color: recommended == "premium" ? "#036c5f" : "#475569" }}
                  className="text-center font-bold"
                >
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    {fmt(yearlyPrice("premium"))}
                  </span>
                  <p className="mt-0.5 text-xs font-semibold" style={{ color: recommended ? "#036c5f" : "#475569" }}>
                    for {teamSize.toLocaleString("en-IN")} users / year
                  </p>
                </div>
              )
            }
            bullets={PLAN_BULLETS.premium}
            cta="Start free trial"
            ctaAction={() => router.push("get-started")}
          />

          {/* ENTERPRISE */}
          <PlanCard
            id="enterprise"
            recommended={recommended === "enterprise"}
            title="Enterprise"
            subtitle="For large orgs with custom needs"
            priceNode={
              teamSize <= 750 ? (
                <div>
                  <p className="text-base font-bold text-center mb-2">Available for teams over 750 users</p>
                </div>
              ) : cycle === "monthly" ? (
                <div>
                  <p className="text-base font-bold">Billed annually</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Switch to annual billing above to view Enterprise pricing
                  </p>
                </div>
              ) : (
                <div
                  style={{ color: recommended == "enterprise" ? "#036c5f" : "#475569" }}
                  className="text-center font-bold"
                >
                  <span className="text-4xl" style={{ fontFamily: "var(--font-display)" }}>
                    {fmt(yearlyPrice("enterprise"))}
                  </span>
                  <p className="text-xs mt-1">for {teamSize.toLocaleString("en-IN")} users / year</p>
                </div>
              )
            }
            bullets={PLAN_BULLETS.enterprise}
            cta="Contact sales"
            ctaAction={() => router.push("contact-us")}
            annualOnly={teamSize > 750 && cycle === "monthly"}
          />
        </div>
      </section>

      {/* ── Trust bar ── */}
      <section className="max-w-5xl mx-auto px-6 mb-20">
        <div
          className="rounded-3xl px-8 py-6 flex flex-wrap gap-6 items-center justify-center"
          style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
        >
          {[
            { icon: "🔒", label: "SOC 2 Type II" },
            { icon: "🛡️", label: "GDPR Compliant" },
            { icon: "✅", label: "ISO 27001" },
            { icon: "💳", label: "No credit card for trial" },
            { icon: "🔄", label: "Cancel anytime" },
            { icon: "🌏", label: "Data in India available" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <span>{item.icon}</span>
              {item.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature comparison table ── */}
      <section className="max-w-7xl mx-auto px-6 mb-24" id="compare">
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-black text-slate-900 mb-3"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Compare all features
          </h2>
          <p className="text-slate-500 text-base">Every capability, side by side.</p>
        </div>

        <div className="rounded-3xl overflow-hidden" style={{ border: "1px solid #e2e8f0", backgroundColor: "white" }}>
          {/* Table header */}
          <div
            className="grid sticky top-16 z-10"
            style={{
              gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
              backgroundColor: "white",
              borderBottom: "2px solid #e2e8f0",
            }}
          >
            <div className="px-6 py-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Feature</p>
            </div>
            {(["free", "standard", "premium", "enterprise"] as PlanId[]).map((pid) => (
              <div key={pid} className="px-4 py-5 text-center" style={{ borderLeft: "1px solid #f1f5f9" }}>
                <p
                  className="text-sm font-bold capitalize"
                  style={{ color: recommended === pid ? "#036c5f" : "#475569" }}
                >
                  {pid}
                </p>
                {recommended === pid && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "#036c5f", color: "white", border: `1px solid ${"#036c5f"}30` }}
                  >
                    Recommended
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Rows by category */}
          {categories.map((cat) => {
            const rows = FEATURES.filter((r) => r.category === cat);
            return (
              <div key={cat} style={{ marginTop: "1.4rem" }}>
                {/* Category heading */}
                <div
                  className="px-6 py-3 flex items-center gap-2"
                  style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #f1f5f9" }}
                >
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-500">{cat}</span>
                </div>
                {rows.map((row, ri) => (
                  <div
                    key={row.label}
                    className="grid items-center transition-colors"
                    style={{
                      gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr",
                      borderTop: ri > 0 ? "1px solid #f8fafc" : undefined,
                    }}
                    onMouseOver={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa";
                    }}
                    onMouseOut={(e) => {
                      (e.currentTarget as HTMLElement).style.backgroundColor = "transparent";
                    }}
                  >
                    <div className="px-6 py-3.5">
                      <span className="text-sm text-slate-700">{row.label}</span>
                    </div>
                    {(["free", "standard", "premium", "enterprise"] as PlanId[]).map((pid) => (
                      <div
                        key={pid}
                        className="px-4 py-3.5 flex items-center justify-center"
                        style={{ borderLeft: "1px solid #f1f5f9" }}
                      >
                        <CellValue val={row[pid]} planColor={recommended === pid ? "#036c5f" : "#475569"} />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="max-w-3xl mx-auto px-6 mb-24">
        <div className="text-center mb-10">
          <h2
            className="text-3xl font-black text-slate-900 mb-3"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Frequently asked questions
          </h2>
        </div>
        <div
          className="rounded-3xl overflow-hidden divide-y"
          style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
        >
          {faqs.map((faq, i) => (
            <div key={i}>
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50"
              >
                <span className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#94a3b8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="flex-shrink-0 transition-transform"
                  style={{ transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)" }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq === i && (
                <div className="px-6 pb-5">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
