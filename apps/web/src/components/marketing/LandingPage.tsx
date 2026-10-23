"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
/* ─────────────────────────────────────────────────────────
   Static data
───────────────────────────────────────────────────────── */

const BRANDS = [
  { name: "Velocity", style: "italic" },
  { name: "ACME", style: "normal" },
  { name: "NEXORA", style: "normal" },
  { name: "Pinnacle", style: "normal" },
  { name: "InspireLabs", style: "italic" },
  { name: "CLOUDWAY", style: "normal" },
  { name: "Meridian", style: "normal" },
  { name: "STRATUM", style: "normal" },
];

const FEATURES = [
  {
    icon: "⊞",
    title: "All-in-One Platform",
    text: "Chat, projects, docs, meetings, AI, and admin—unified in one seamless experience so your team never context-switches again.",
    accent: "#036c5f",
    bg: "#e6f4f2",
  },
  {
    icon: "⌕",
    title: "Context Everywhere",
    text: "Every message, task, and document is connected. You always have the right context exactly when you need it.",
    accent: "#2563eb",
    bg: "#dbeafe",
  },
  {
    icon: "✦",
    title: "Nexus AI",
    text: "Our AI learns your work patterns, summarizes threads, writes drafts, and helps you make smarter, faster decisions.",
    accent: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    icon: "⬡",
    title: "Built for Scale",
    text: "From 10-person startups to 10,000-person enterprises, Dhriti OS grows with your organization without friction.",
    accent: "#036c5f",
    bg: "#e6f4f2",
  },
  {
    icon: "⬤",
    title: "Secure by Default",
    text: "SOC 2 Type II, GDPR, SSO, SAML, audit logs, and custom data retention—enterprise-grade security built in from day one.",
    accent: "#059669",
    bg: "#d1fae5",
  },
  {
    icon: "⎇",
    title: "Extensible & Open",
    text: "Connect your existing tools via 200+ integrations. Build on top of Dhriti with our public API and webhook system.",
    accent: "#d97706",
    bg: "#fef3c7",
  },
];

const PRODUCTS = [
  {
    name: "Connect",
    emoji: "💬",
    text: "Real-time messaging, channels, and direct messages for your entire organization.",
    color: "#036c5f",
    bg: "#e6f4f2",
  },
  {
    name: "Flow",
    emoji: "📋",
    text: "Kanban boards, sprints, roadmaps, and time tracking—all your project work in one place.",
    color: "#2563eb",
    bg: "#dbeafe",
  },
  {
    name: "Atlas",
    emoji: "📄",
    text: "A living knowledge base where docs, wikis, and runbooks stay current and findable.",
    color: "#7c3aed",
    bg: "#ede9fe",
  },
  {
    name: "Pulse",
    emoji: "📅",
    text: "Run better meetings with shared agendas, live notes, and automatic action items.",
    color: "#d97706",
    bg: "#fef3c7",
  },
  {
    name: "Nexus AI",
    emoji: "✨",
    text: "Your intelligent work assistant that learns from your entire workspace graph.",
    color: "#059669",
    bg: "#d1fae5",
  },
];

const STATS = [
  { value: "50,000+", label: "Teams worldwide" },
  { value: "2.4M+", label: "Daily active users" },
  { value: "99.99%", label: "Uptime SLA" },
  { value: "4.9 / 5", label: "G2 rating" },
];

const TESTIMONIALS = [
  {
    quote:
      "Dhriti OS replaced six different tools we were juggling. Our team velocity went up 40% in the first month. It's genuinely the operating system for how we work.",
    author: "Priya Iyer",
    role: "VP Engineering, Nexora",
    initials: "PI",
    color: "#7c3aed",
  },
  {
    quote:
      "The AI features alone are worth the switch. Nexus summarises long threads instantly and writes first drafts that actually sound like us. I didn't think this was possible.",
    author: "Alex Turner",
    role: "Head of Product, Velocity",
    initials: "AT",
    color: "#036c5f",
  },
  {
    quote:
      "We evaluated Notion, Linear, and Slack separately. Dhriti OS does all three better and costs less. The onboarding took two hours, not two weeks.",
    author: "Meera Krishnan",
    role: "COO, Pinnacle Labs",
    initials: "MK",
    color: "#d97706",
  },
];

/* ─────────────────────────────────────────────────────────
   Tiny atoms
───────────────────────────────────────────────────────── */
function CheckCircle({ color = "#036c5f" }: { color?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10" fill={color} fillOpacity="0.15" />
      <polyline
        points="8 12 11 15 16 9"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Mesh / pattern background SVG (inline, no external dep)
───────────────────────────────────────────────────────── */
function DotGrid({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

function HexGrid({ opacity = 0.05 }: { opacity?: number }) {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity }}
    >
      <defs>
        <pattern id="hex" x="0" y="0" width="56" height="48" patternUnits="userSpaceOnUse">
          <polygon points="28,2 52,14 52,38 28,50 4,38 4,14" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hex)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────
   Dashboard mockup card (SVG illustration)
───────────────────────────────────────────────────────── */
function DashboardMockup() {
  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        backgroundColor: "white",
        border: "1px solid #e2e8f0",
        boxShadow: "0 32px 80px rgba(3,108,95,0.18), 0 8px 24px rgba(0,0,0,0.08)",
        transform: "rotate(-1.5deg)",
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-1.5 px-4 py-3 border-b"
        style={{ borderColor: "#f1f5f9", backgroundColor: "#f8fafc" }}
      >
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
        <div className="w-3 h-3 rounded-full bg-green-400" />
        <div className="flex-1 mx-4 h-5 rounded-md bg-slate-200" />
      </div>

      {/* Body */}
      <div className="flex" style={{ height: 340 }}>
        {/* Sidebar */}
        <div
          className="w-16 flex-shrink-0 border-r flex flex-col items-center py-4 gap-3"
          style={{ borderColor: "#f1f5f9", backgroundColor: "#fafafa" }}
        >
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <div className="w-4 h-4 rounded-sm bg-white opacity-80" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="w-9 h-9 rounded-xl" style={{ backgroundColor: i === 0 ? "#e6f4f2" : "#f1f5f9" }} />
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 p-5 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="h-4 w-28 rounded bg-slate-800 mb-1.5" />
              <div className="h-3 w-20 rounded bg-slate-300" />
            </div>
            <div className="flex gap-2">
              <div className="h-7 w-20 rounded-lg" style={{ backgroundColor: "#e6f4f2" }} />
              <div className="h-7 w-24 rounded-lg" style={{ backgroundColor: "#036c5f" }} />
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              ["#e6f4f2", "#036c5f"],
              ["#dbeafe", "#2563eb"],
              ["#fef3c7", "#d97706"],
            ].map(([bg, fg], i) => (
              <div key={i} className="rounded-xl p-3" style={{ backgroundColor: bg }}>
                <div className="h-3 w-10 rounded mb-2" style={{ backgroundColor: fg, opacity: 0.4 }} />
                <div className="h-5 w-14 rounded" style={{ backgroundColor: fg, opacity: 0.7 }} />
              </div>
            ))}
          </div>

          {/* Activity rows */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 mb-3">
              <div
                className="w-7 h-7 rounded-full flex-shrink-0"
                style={{ backgroundColor: ["#e6f4f2", "#ede9fe", "#dbeafe", "#fef3c7", "#d1fae5"][i] }}
              />
              <div className="flex-1">
                <div className="h-2.5 rounded mb-1.5" style={{ backgroundColor: "#e2e8f0", width: `${60 + i * 7}%` }} />
                <div className="h-2 rounded" style={{ backgroundColor: "#f1f5f9", width: `${40 + i * 5}%` }} />
              </div>
              <div
                className="h-5 w-12 rounded-full flex-shrink-0"
                style={{ backgroundColor: i % 2 === 0 ? "#e6f4f2" : "#f1f5f9" }}
              />
            </div>
          ))}
        </div>

        {/* Right panel */}
        <div className="w-44 border-l flex-shrink-0 p-4" style={{ borderColor: "#f1f5f9", backgroundColor: "#fafafa" }}>
          <div className="h-3 w-20 rounded bg-slate-300 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-2 mb-3">
              <div
                className="w-6 h-6 rounded-full flex-shrink-0"
                style={{ backgroundColor: ["#e6f4f2", "#dbeafe", "#ede9fe", "#fef3c7"][i] }}
              />
              <div>
                <div className="h-2 rounded mb-1" style={{ backgroundColor: "#e2e8f0", width: 60 }} />
                <div className="h-1.5 rounded" style={{ backgroundColor: "#f1f5f9", width: 40 }} />
              </div>
            </div>
          ))}
          <div className="mt-4 rounded-xl p-3" style={{ backgroundColor: "#e6f4f2" }}>
            <div className="h-2 rounded mb-2" style={{ backgroundColor: "#036c5f", opacity: 0.4, width: "70%" }} />
            <div className="h-6 rounded" style={{ backgroundColor: "#036c5f", opacity: 0.2 }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main component
───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
      router.push("get-started");
    }
  };

  return (
    <div className="min-h-screen" style={{ fontFamily: "var(--font-sans)", color: "#0f172a" }}>
      {/* ── HERO ─────────────────────────────────────── */}
      <section
        className="relative min-h-screen flex items-center overflow-hidden pt-16"
        style={{ background: "linear-gradient(160deg, #f0fbf9 0%, #f8fafc 40%, #ede9fe10 100%)" }}
      >
        {/* Background layers */}
        <div className="absolute inset-0 text-[#036c5f]">
          <DotGrid opacity={0.07} />
        </div>
        <div
          className="absolute top-0 right-0 w-2/3 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(3,108,95,0.07) 0%, transparent 60%)" }}
        />
        <div
          className="absolute bottom-0 left-0 w-1/2 h-1/2 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(124,58,237,0.05) 0%, transparent 60%)" }}
        />

        {/* Floating accent blobs */}
        <div
          className="absolute top-24 right-1/4 w-64 h-64 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(3,108,95,0.08) 0%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />
        <div
          className="absolute bottom-32 left-1/3 w-80 h-80 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className="max-w-xl">
              {/* Eyebrow */}
              <div className="flex items-center gap-3 mb-7">
                <div
                  className="flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold"
                  style={{ backgroundColor: "#e6f4f2", color: "#036c5f", border: "1px solid rgba(3,108,95,0.2)" }}
                >
                  <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: "#036c5f" }} />
                  The Operating System for Modern Teams
                </div>
              </div>

              <h1
                className="mb-6 leading-none"
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 900,
                  fontSize: "clamp(44px, 7vw, 80px)",
                  letterSpacing: "-0.035em",
                  color: "#0f172a",
                }}
              >
                One System.
                <br />
                Every Team.
                <br />
                <span style={{ color: "#036c5f" }}>Limitless Impact.</span>
              </h1>

              <p className="text-xl text-slate-500 leading-relaxed mb-10" style={{ maxWidth: 520 }}>
                Dhriti OS unifies communication, projects, knowledge, meetings, and AI in one seamless platform—so your
                teams move faster and achieve more.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <button
                  onClick={() => router.push("get-started")}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-white font-bold text-base transition-all"
                  style={{
                    backgroundColor: "#036c5f",
                    boxShadow: "0 8px 24px rgba(3,108,95,0.3)",
                    fontFamily: "var(--font-display)",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#024d44";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(3,108,95,0.4)";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#036c5f";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(3,108,95,0.3)";
                  }}
                >
                  Get started free
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
                <button
                  onClick={() => router.push("contact-us")}
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all border"
                  style={{
                    color: "#036c5f",
                    borderColor: "#036c5f",
                    backgroundColor: "white",
                    fontFamily: "var(--font-display)",
                  }}
                  onMouseOver={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "#e6f4f2";
                  }}
                  onMouseOut={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = "white";
                  }}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect x="1" y="5" width="15" height="14" rx="2" />
                  </svg>
                  Book a demo
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                {["No credit card required", "14-day free trial", "Cancel anytime"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle />
                    <span className="text-sm text-slate-500 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — dashboard mockup */}
            <div className="relative hidden lg:block">
              {/* Floating stat cards */}
              <div
                className="absolute -top-6 -left-10 z-10 flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: "#e6f4f2" }}
                >
                  💬
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">Messages today</p>
                  <p className="text-base font-bold text-slate-900">24,812</p>
                </div>
              </div>

              <div
                className="absolute -bottom-4 -right-6 z-10 flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{
                  backgroundColor: "white",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
                  style={{ backgroundColor: "#ede9fe" }}
                >
                  ✨
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium">AI tasks automated</p>
                  <p className="text-base font-bold text-slate-900">1,340 this week</p>
                </div>
              </div>

              <div
                className="absolute top-1/2 -right-8 z-10 -translate-y-1/2 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#036c5f", boxShadow: "0 4px 16px rgba(3,108,95,0.3)" }}
              >
                <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse" />
                <span className="text-white text-xs font-semibold">48 online</span>
              </div>

              <DashboardMockup />
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none" style={{ height: 80, width: "100%" }}>
            <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Social proof / brands ─────────────────── */}
      <section className="py-16 border-b" style={{ borderColor: "#f1f5f9" }}>
        <div className="max-w-6xl mx-auto px-6">
          <p className="text-center text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
            Trusted by innovative teams at
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-6">
            {BRANDS.map((brand) => (
              <span
                key={brand.name}
                className="text-xl font-black text-slate-300 hover:text-slate-400 transition-colors select-none"
                style={{
                  fontStyle: brand.style === "italic" ? "italic" : "normal",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "-0.02em",
                }}
              >
                {brand.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ────────────────────────────────── */}
      <section className="py-20" style={{ backgroundColor: "white" }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p
                  className="text-4xl font-black mb-2"
                  style={{ fontFamily: "var(--font-display)", color: "#036c5f", letterSpacing: "-0.03em" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>
        <div className="absolute inset-0 text-slate-400">
          <DotGrid opacity={0.04} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-5"
              style={{ backgroundColor: "#e6f4f2", color: "#036c5f", border: "1px solid rgba(3,108,95,0.2)" }}
            >
              Powerful by Design
            </div>
            <h2
              className="text-4xl font-black text-slate-900 mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Designed to help your team thrive
            </h2>
            <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
              Every feature is intentional. Every integration is seamless. Dhriti OS removes friction so great work
              happens naturally.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feat) => (
              <div
                key={feat.title}
                className="group rounded-3xl p-8 bg-white border transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                style={{ borderColor: "#e2e8f0" }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = feat.accent + "40";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5 transition-all"
                  style={{ backgroundColor: feat.bg, color: feat.accent }}
                >
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3" style={{ fontFamily: "var(--font-display)" }}>
                  {feat.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{feat.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Work graph / orbit section ───────────── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #036c5f 0%, #024d44 60%, #01342e 100%)" }}
      >
        {/* Background hex pattern */}
        <div className="absolute inset-0 text-white">
          <HexGrid opacity={0.06} />
        </div>
        <div
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 80% 50%, rgba(255,255,255,0.06) 0%, transparent 60%)" }}
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-4"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Built for the way teams work today
              </p>
              <h2
                className="text-4xl font-black text-white mb-6 leading-tight"
                style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
              >
                Everything connected.
                <br />
                Everything in context.
              </h2>
              <p className="text-lg mb-10 leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
                Dhriti OS creates a unified work graph — every conversation, task, and document is linked. Your team
                always has the full picture.
              </p>

              <div className="space-y-4 mb-10">
                {[
                  {
                    icon: "⚡",
                    title: "Break down silos",
                    desc: "All your tools talk to each other. Context flows automatically.",
                  },
                  {
                    icon: "🎯",
                    title: "Keep everyone aligned",
                    desc: "One source of truth for goals, progress, and decisions.",
                  },
                  {
                    icon: "✨",
                    title: "Move faster with AI",
                    desc: "Nexus AI surfaces insights before you need to ask.",
                  },
                ].map((item) => (
                  <div key={item.title} className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
                    >
                      {item.icon}
                    </div>
                    <div>
                      <p className="font-bold text-white mb-1">{item.title}</p>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => router.push("get-started")}
                className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-base transition-all"
                style={{ backgroundColor: "white", color: "#036c5f", fontFamily: "var(--font-display)" }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#e6f4f2";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "white";
                }}
              >
                See it in action
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>

            {/* Right — orbit diagram */}
            <div className="relative flex items-center justify-center" style={{ height: 480 }}>
              {/* Orbit rings */}
              {[380, 280, 180].map((size, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border"
                  style={{
                    width: size,
                    height: size,
                    borderColor: `rgba(255,255,255,${0.06 + i * 0.04})`,
                  }}
                />
              ))}

              {/* Center hub */}
              <div
                className="absolute w-36 h-36 rounded-full flex flex-col items-center justify-center z-10"
                style={{
                  backgroundColor: "white",
                  border: "6px solid rgba(255,255,255,0.3)",
                  boxShadow: "0 16px 48px rgba(0,0,0,0.2)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                  style={{ backgroundColor: "#036c5f" }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p className="text-sm font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  Dhriti OS
                </p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">Work Graph</p>
              </div>

              {/* Orbit nodes */}
              {PRODUCTS.map((prod, i) => {
                const angles = [270, 342, 54, 126, 198];
                const rad = (angles[i] * Math.PI) / 180;
                const r = 190;
                const x = r * Math.cos(rad);
                const y = r * Math.sin(rad);
                return (
                  <div
                    key={prod.name}
                    className="absolute flex items-center gap-2 px-3 py-2.5 rounded-2xl"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid rgba(255,255,255,0.2)",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                      transform: `translate(${x}px, ${y}px) translate(-50%, -50%)`,
                      width: 150,
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-base flex-shrink-0"
                      style={{ backgroundColor: prod.bg }}
                    >
                      {prod.emoji}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{prod.name}</p>
                      <p className="text-[10px] text-slate-400 leading-tight">{prod.text.split(".")[0]}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Product suite ────────────────────────── */}
      <section className="py-24" style={{ backgroundColor: "white" }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">One platform. Five apps.</p>
            <h2
              className="text-4xl font-black text-slate-900 mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              The Dhriti Product Suite
            </h2>
            <p className="text-lg text-slate-500 max-w-lg mx-auto">
              Each product is powerful alone. Together, they create something unprecedented.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {PRODUCTS.map((prod) => (
              <div
                key={prod.name}
                className="group rounded-3xl p-6 border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                style={{ borderColor: "#e2e8f0", backgroundColor: "#fafafa" }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = prod.bg;
                  (e.currentTarget as HTMLElement).style.borderColor = prod.color + "30";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#fafafa";
                  (e.currentTarget as HTMLElement).style.borderColor = "#e2e8f0";
                }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                  style={{ backgroundColor: prod.bg, border: `1px solid ${prod.color}20` }}
                >
                  {prod.emoji}
                </div>
                <h3
                  className="text-base font-bold text-slate-900 mb-2"
                  style={{ fontFamily: "var(--font-display)", color: prod.color }}
                >
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{prod.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: "#f8fafc" }}>
        <div className="absolute inset-0 text-slate-400">
          <DotGrid opacity={0.04} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="text-4xl font-black text-slate-900 mb-4"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Teams love working in Dhriti OS
            </h2>
            <p className="text-lg text-slate-500">Real words from real teams.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.author}
                className="rounded-3xl p-8 bg-white border flex flex-col"
                style={{ borderColor: "#e2e8f0" }}
              >
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ))}
                </div>

                <p className="text-sm text-slate-600 leading-relaxed flex-1 mb-6">&quot;{t.quote}&quot;</p>

                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA dark section ──────────────────────── */}
      <section className="py-24 relative overflow-hidden" style={{ backgroundColor: "#0f172a" }}>
        {/* Background layers */}
        <div className="absolute inset-0 text-slate-700">
          <DotGrid opacity={0.3} />
        </div>
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(3,108,95,0.2) 0%, transparent 60%)" }}
        />

        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6"
              style={{
                backgroundColor: "rgba(3,108,95,0.2)",
                color: "#4ade80",
                border: "1px solid rgba(3,108,95,0.3)",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              Ready to get started?
            </div>
            <h2
              className="text-5xl font-black text-white mb-5"
              style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
            >
              Your team&apos;s best work
              <br />
              <span style={{ color: "#4ade80" }}>starts here.</span>
            </h2>
            <p className="text-lg mb-10" style={{ color: "rgba(255,255,255,0.5)" }}>
              Join 50,000+ teams already using Dhriti OS to work smarter, move faster, and build better together.
            </p>
          </div>

          {/* Email capture */}
          {!submitted ? (
            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
              <input
                ref={emailRef}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your work email"
                required
                className="flex-1 px-5 py-4 rounded-2xl text-sm outline-none transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "white",
                  fontFamily: "var(--font-sans)",
                }}
                onFocus={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "rgba(3,108,95,0.7)";
                  (e.target as HTMLInputElement).style.backgroundColor = "rgba(255,255,255,0.12)";
                }}
                onBlur={(e) => {
                  (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.15)";
                  (e.target as HTMLInputElement).style.backgroundColor = "rgba(255,255,255,0.08)";
                }}
              />
              <button
                type="submit"
                className="px-7 py-4 rounded-2xl font-bold text-sm text-white transition-all flex-shrink-0"
                style={{ backgroundColor: "#036c5f", fontFamily: "var(--font-display)" }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#024d44";
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.backgroundColor = "#036c5f";
                }}
              >
                Get started for free
              </button>
            </form>
          ) : (
            <div
              className="flex items-center justify-center gap-3 py-4 px-8 rounded-2xl mx-auto mb-8 max-w-sm"
              style={{ backgroundColor: "rgba(3,108,95,0.2)", border: "1px solid rgba(3,108,95,0.4)" }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#4ade80"
                strokeWidth="2.5"
                strokeLinecap="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-green-400 font-semibold text-sm">You&apos;re on the list! Check your inbox.</span>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-6">
            {["No credit card required", "14-day free trial", "Cancel anytime", "SOC 2 Type II"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle color="#4ade80" />
                <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
