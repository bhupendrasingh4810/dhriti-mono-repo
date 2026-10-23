"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TEAM = [
  { name: "Arjun Mehta", role: "Co-founder & CEO", initials: "AM", color: "#036c5f" },
  { name: "Priya Sharma", role: "Co-founder & CTO", initials: "PS", color: "#2563eb" },
  { name: "Rohan Verma", role: "VP of Product", initials: "RV", color: "#7c3aed" },
  { name: "Ananya Singh", role: "VP of Design", initials: "AS", color: "#d97706" },
  { name: "Karan Patel", role: "Head of Engineering", initials: "KP", color: "#dc2626" },
  { name: "Meera Nair", role: "Head of Customer Success", initials: "MN", color: "#059669" },
];

const VALUES = [
  {
    icon: "🧠",
    title: "Deep Work First",
    desc: "We build tools that reduce noise and amplify focused, meaningful work.",
  },
  {
    icon: "🌐",
    title: "Built for Teams",
    desc: "Every feature is designed with collaboration and async-first workflows in mind.",
  },
  {
    icon: "🔒",
    title: "Trust by Design",
    desc: "Security and privacy are foundational, not features bolted on later.",
  },
  {
    icon: "⚡",
    title: "Move with Purpose",
    desc: "We ship fast, learn faster, and always anchor decisions to user outcomes.",
  },
];

const MILESTONES = [
  { year: "2022", event: "Founded in Bengaluru with a team of 6" },
  { year: "2023", event: "Launched beta — 500 early access teams" },
  { year: "2024", event: "Series A · $18M raised · 10,000 workspaces" },
  { year: "2025", event: "AI layer launched · Enterprise tier introduced" },
  { year: "2026", event: "250,000 users across 60 countries" },
];

const STATS = [
  { value: "250K+", label: "Active users" },
  { value: "60", label: "Countries" },
  { value: "99.98%", label: "Uptime SLA" },
  { value: "4.9★", label: "G2 rating" },
];

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      {/* Nav */}
      <nav
        className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b"
        style={{ backgroundColor: "white", borderColor: "#e2e8f0" }}
      >
        <button onClick={() => router.push("login")} className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
            Dhriti OS
          </span>
        </button>
        <div className="flex items-center gap-5">
          {(["careers", "contact-us", "faq"] as string[]).map((p) => (
            <button
              key={p}
              onClick={() => router.push(p)}
              className="text-sm text-slate-500 hover:text-slate-800 capitalize transition-colors"
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => router.push("login")}
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white"
            style={{ backgroundColor: "#036c5f" }}
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative overflow-hidden px-8 py-20"
        style={{ background: "linear-gradient(135deg, #0d1b2a 0%, #036c5f 60%, #024d44 100%)" }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        <div className="relative max-w-4xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.9)" }}
          >
            🌱 Founded 2022 · Bengaluru, India
          </div>
          <h1
            className="text-5xl md:text-6xl font-black text-white mb-6 leading-none"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.03em" }}
          >
            We&apos;re building the OS
            <br />
            for modern teams
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto leading-relaxed">
            Dhriti OS unifies messaging, projects, docs, and AI into a single workspace so teams can focus on work that
            matters — not tool-switching.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 px-8 border-b" style={{ backgroundColor: "white", borderColor: "#e2e8f0" }}>
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-black mb-1" style={{ fontFamily: "var(--font-display)", color: "#036c5f" }}>
                {s.value}
              </p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Our mission</p>
            <h2
              className="text-3xl font-bold text-slate-900 mb-5 leading-tight"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Eliminate the complexity of enterprise work
            </h2>
            <p className="text-slate-500 leading-relaxed mb-5">
              Modern teams juggle dozens of tools. We believe the future of work is unified — where communication,
              context, and action live in one place, guided by intelligence that learns how your team works.
            </p>
            <p className="text-slate-500 leading-relaxed">
              We started Dhriti OS because we felt the pain ourselves: scattered conversations, lost decisions,
              duplicated context. We&apos;re building the workspace we always wished we had.
            </p>
          </div>
          <div className="space-y-3">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="rounded-2xl p-5 flex items-start gap-4"
                style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
              >
                <span className="text-2xl flex-shrink-0">{v.icon}</span>
                <div>
                  <p className="text-sm font-bold text-slate-900 mb-1">{v.title}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section
        className="py-16 px-8"
        style={{ backgroundColor: "white", borderTop: "1px solid #e2e8f0", borderBottom: "1px solid #e2e8f0" }}
      >
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2 text-center">Our journey</p>
          <h2
            className="text-2xl font-bold text-slate-900 mb-10 text-center"
            style={{ fontFamily: "var(--font-display)" }}
          >
            From a small idea to a global platform
          </h2>
          <div className="relative">
            <div className="absolute left-16 top-0 bottom-0 w-px" style={{ backgroundColor: "#e2e8f0" }} />
            <div className="space-y-6">
              {MILESTONES.map((m, i) => (
                <div key={m.year} className="flex items-center gap-6">
                  <div
                    className="w-14 text-right flex-shrink-0 text-sm font-bold"
                    style={{ color: "#036c5f", fontFamily: "var(--font-mono)" }}
                  >
                    {m.year}
                  </div>
                  <div
                    className="w-4 h-4 rounded-full flex-shrink-0 z-10"
                    style={{
                      backgroundColor: i === MILESTONES.length - 1 ? "#036c5f" : "white",
                      border: "2px solid #036c5f",
                    }}
                  />
                  <p className="text-sm text-slate-600">{m.event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 px-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">The team</p>
          <h2 className="text-2xl font-bold text-slate-900 mb-8" style={{ fontFamily: "var(--font-display)" }}>
            Built by people who care deeply
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {TEAM.map((member) => (
              <div
                key={member.name}
                className="rounded-2xl p-5 flex items-center gap-4"
                style={{ backgroundColor: "white", border: "1px solid #e2e8f0" }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: member.color }}
                >
                  {member.initials}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{member.name}</p>
                  <p className="text-xs text-slate-500 truncate">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-14 px-8 text-center"
        style={{ background: "linear-gradient(135deg, #036c5f 0%, #024d44 100%)" }}
      >
        <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-display)" }}>
          Ready to transform how your team works?
        </h2>
        <p className="text-white/70 mb-8 max-w-md mx-auto">
          Join 250,000+ users who&apos;ve made Dhriti OS their central workspace.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <button
            onClick={() => router.push("get-started")}
            className="px-8 py-3.5 rounded-xl text-sm font-bold text-[#036c5f] bg-white transition-all shadow-lg"
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#f0fdf4";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "white";
            }}
          >
            Get started free
          </button>
          <button
            onClick={() => router.push("contact-us")}
            className="px-8 py-3.5 rounded-xl text-sm font-bold text-white transition-all"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.2)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.15)";
            }}
          >
            Talk to sales
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="border-t px-8 py-4 flex items-center justify-between"
        style={{ borderColor: "#e2e8f0", backgroundColor: "white" }}
      >
        <p className="text-xs text-slate-400">© 2026 Dhriti OS, Inc.</p>
        <div className="flex gap-4">
          {(["terms-and-conditions", "privacy-policy", "contact-us"] as string[]).map((p) => (
            <button
              key={p}
              onClick={() => router.push(p)}
              className="text-xs text-slate-400 hover:text-slate-600 capitalize transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </footer>
    </div>
  );
}
