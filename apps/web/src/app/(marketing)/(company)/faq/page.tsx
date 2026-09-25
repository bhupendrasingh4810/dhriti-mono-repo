"use client";
import { useState } from "react";

interface Props {
  navigate: (p: string) => void;
}

type FaqCategory = "general" | "billing" | "security" | "integrations" | "enterprise";

const CATEGORY_LABELS: Record<FaqCategory, { label: string }> = {
  general: { label: "General" },
  billing: { label: "Billing" },
  security: { label: "Security" },
  integrations: { label: "Integrations" },
  enterprise: { label: "Enterprise" },
};

const FAQS: Record<FaqCategory, { q: string; a: string }[]> = {
  general: [
    {
      q: "What is Dhriti OS?",
      a: "Dhriti OS is a unified enterprise workspace that combines team messaging, project management, document collaboration, calendar, and AI-powered workflows into a single platform. It eliminates the need to juggle multiple tools.",
    },
    {
      q: "How is Dhriti OS different from Slack or Microsoft Teams?",
      a: "Unlike messaging-only tools, Dhriti OS integrates project tracking (like Jira), documentation (like Confluence), meeting management, and AI workflows natively. You get a complete operational picture in one place, not just chat.",
    },
    {
      q: "Is there a free plan?",
      a: "Yes. Our free plan includes up to 10 team members, unlimited messages (last 90 days), 5GB storage, and access to core features. No credit card required.",
    },
    {
      q: "Can I migrate from another tool?",
      a: "We support one-click import from Slack, Microsoft Teams, Notion, and Jira. Our migration tool preserves channels, messages, files, and integrations. Enterprise customers get a dedicated migration specialist.",
    },
    {
      q: "Does Dhriti OS work offline?",
      a: "The desktop app caches recent messages and documents for offline reading. Sending messages requires connectivity, but you can draft them offline and they'll send automatically when you reconnect.",
    },
  ],
  billing: [
    {
      q: "What plans are available?",
      a: "We offer Free, Pro (₹499/user/month), Business (₹999/user/month), and Enterprise (custom pricing). Annual plans include a 20% discount. All paid plans have a 14-day free trial.",
    },
    {
      q: "Can I change plans at any time?",
      a: "Yes. Upgrades are prorated immediately. Downgrades take effect at the next billing cycle. You won't lose any data when downgrading.",
    },
    {
      q: "What payment methods do you accept?",
      a: "We accept all major credit and debit cards, UPI, net banking (India), and bank transfers for annual Enterprise contracts. All transactions are processed securely through Stripe.",
    },
    {
      q: "Do you offer refunds?",
      a: "We offer a 14-day money-back guarantee for new paid subscriptions. After that period, refunds are evaluated case-by-case. Contact billing@dhritios.app for assistance.",
    },
    {
      q: "Is there a discount for startups or nonprofits?",
      a: "Yes — eligible startups (under 2 years old, under $1M raised) get 50% off Pro for 12 months. Registered nonprofits get 30% off any plan. Apply via our website.",
    },
  ],
  security: [
    {
      q: "How is my data encrypted?",
      a: "All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Encryption keys are managed per-workspace using a BYOK (bring your own key) option for Enterprise customers.",
    },
    {
      q: "Is Dhriti OS SOC 2 compliant?",
      a: "Yes. Dhriti OS is SOC 2 Type II certified. We're also ISO 27001 and GDPR compliant. Enterprise customers can request our security pack including audit reports and penetration testing summaries.",
    },
    {
      q: "Can I enforce SSO for my organization?",
      a: "Yes. We support SAML 2.0 SSO with all major identity providers including Okta, Azure AD, Google Workspace, and OneLogin. SSO enforcement is available on Business and Enterprise plans.",
    },
    {
      q: "Where is my data stored?",
      a: "By default, data is stored in India (Mumbai, AWS ap-south-1). Enterprise customers can choose their region: US (us-east-1), EU (eu-west-1), Singapore (ap-southeast-1), or India.",
    },
    {
      q: "How do I report a security vulnerability?",
      a: "We have a responsible disclosure program. Email security@dhritios.app with details. We respond within 24 hours, and qualifying reports are eligible for our bug bounty program.",
    },
  ],
  integrations: [
    {
      q: "What tools does Dhriti OS integrate with?",
      a: "We have native integrations with 80+ tools including GitHub, GitLab, Jira, Confluence, Google Drive, Dropbox, Salesforce, HubSpot, Zapier, and more. An API and webhook system enables custom integrations.",
    },
    {
      q: "Is there an API?",
      a: "Yes. Our REST API and webhook system allow you to build custom integrations, automate workflows, and embed Dhriti OS data in your own tools. Full API documentation is available at docs.dhritios.app.",
    },
    {
      q: "Does Dhriti OS work with Google Calendar and Outlook?",
      a: "Yes. Our Calendar module syncs bidirectionally with Google Calendar and Outlook. Meeting links (Google Meet, Teams, Zoom) are automatically attached to calendar events.",
    },
    {
      q: "Can I build my own integration?",
      a: "Absolutely. Our developer platform includes a REST API, real-time webhooks, OAuth 2.0 authentication, and a sandbox environment. We also have a marketplace where you can publish integrations for the community.",
    },
  ],
  enterprise: [
    {
      q: "What is included in the Enterprise plan?",
      a: "Enterprise includes unlimited users, SSO/SAML, custom data residency, dedicated Slack channel with your CSM, SLA-backed support (4-hour response), audit logs, SCIM provisioning, and a security review.",
    },
    {
      q: "How does enterprise onboarding work?",
      a: "You get a dedicated implementation specialist who manages your workspace setup, data migration, SSO configuration, and team training. Most enterprises are fully live within 2 weeks.",
    },
    {
      q: "Can we do a proof of concept before committing?",
      a: "Yes. Enterprise customers can run a 30-day POC on a sandboxed environment with full features enabled. We provide a success plan, check-in calls, and ROI measurement at the end.",
    },
    {
      q: "Do you sign DPAs and BAAs?",
      a: "Yes. We sign Data Processing Agreements (DPA) per GDPR requirements and Business Associate Agreements (BAA) for customers in regulated industries. Contact sales for legal documents.",
    },
    {
      q: "Is there a minimum team size for Enterprise?",
      a: "There's no hard minimum, but Enterprise pricing is designed for teams of 50+ users where the compliance, SSO, and SLA features provide the most value.",
    },
  ],
};

export default function FaqPage({ navigate }: Props) {
  const [activeCategory, setActiveCategory] = useState<FaqCategory>("general");
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [search, setSearch] = useState("");

  const allFaqs = Object.entries(FAQS).flatMap(([cat, items]) =>
    items.map((item, i) => ({ ...item, cat: cat as FaqCategory, i })),
  );

  const searchResults = search.trim()
    ? allFaqs.filter(
        (f) => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      {/* Hero + search */}
      <section
        className="px-8 py-16 border-b text-center relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #036c5f 0%, #024d44 100%)", borderColor: "#024d44" }}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative max-w-2xl mx-auto">
          <h1
            className="text-4xl font-black text-white mb-3 leading-tight"
            style={{ fontFamily: "var(--font-display)", letterSpacing: "-0.02em" }}
          >
            Frequently asked questions
          </h1>
          <p className="text-white/70 text-base mb-8">
            Quick answers to the most common questions. Can't find yours?{" "}
            <button
              onClick={() => navigate("contact" as string)}
              className="text-white underline underline-offset-2 hover:no-underline"
            >
              Ask us directly.
            </button>
          </p>
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions…"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl text-sm text-slate-900 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-white/40"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-1 max-w-5xl mx-auto w-full px-8 py-12 gap-10">
        {/* Category sidebar */}
        {!searchResults && (
          <aside className="hidden md:block w-52 flex-shrink-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Categories</p>
            <nav className="space-y-1">
              {(Object.keys(CATEGORY_LABELS) as FaqCategory[]).map((cat) => {
                const { label } = CATEGORY_LABELS[cat];
                const count = FAQS[cat].length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className="w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center justify-between"
                    style={{
                      backgroundColor: activeCategory === cat ? "#e6f4f2" : "transparent",
                      color: activeCategory === cat ? "#036c5f" : "#64748b",
                      fontWeight: activeCategory === cat ? 600 : 400,
                    }}
                  >
                    <span className="flex items-center gap-2">{label}</span>
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: activeCategory === cat ? "rgba(3,108,95,0.15)" : "#f1f5f9",
                        color: activeCategory === cat ? "#036c5f" : "#94a3b8",
                      }}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Still need help */}
            <div className="mt-8 rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #036c5f, #024d44)" }}>
              <p className="text-sm font-bold text-white mb-1">Still need help?</p>
              <p className="text-xs text-white/70 mb-3 leading-relaxed">Our team is happy to help you find answers.</p>
              <button
                onClick={() => navigate("contact" as string)}
                className="text-xs font-semibold text-white underline underline-offset-2"
              >
                Contact support →
              </button>
            </div>
          </aside>
        )}

        {/* FAQ list */}
        <div className="flex-1 min-w-0">
          {searchResults ? (
            <>
              <p className="text-sm text-slate-500 mb-5">
                {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for "
                <strong className="text-slate-800">{search}</strong>"
              </p>
              {searchResults.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">🤔</div>
                  <p className="text-lg font-bold text-slate-900 mb-2" style={{ fontFamily: "var(--font-display)" }}>
                    No results found
                  </p>
                  <p className="text-slate-500 text-sm mb-5">Try different keywords or browse by category.</p>
                  <button
                    onClick={() => navigate("contact" as string)}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                    style={{ backgroundColor: "#036c5f" }}
                  >
                    Ask us directly
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((f, idx) => (
                    <FaqItem
                      key={idx}
                      q={f.q}
                      a={f.a}
                      isOpen={openFaq === idx + 1000}
                      onToggle={() => setOpenFaq(openFaq === idx + 1000 ? null : idx + 1000)}
                      tag={CATEGORY_LABELS[f.cat].label}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                  {CATEGORY_LABELS[activeCategory].label}
                </h2>
              </div>
              <div className="space-y-2">
                {FAQS[activeCategory].map((f, i) => (
                  <FaqItem
                    key={i}
                    q={f.q}
                    a={f.a}
                    isOpen={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FaqItem({
  q,
  a,
  isOpen,
  onToggle,
  tag,
}: {
  q: string;
  a: string;
  isOpen: boolean;
  onToggle: () => void;
  tag?: string;
}) {
  return (
    <div
      className="rounded-xl overflow-hidden transition-all"
      style={{
        border: `1px solid ${isOpen ? "#036c5f" : "#e2e8f0"}`,
        backgroundColor: "white",
      }}
    >
      <button onClick={onToggle} className="w-full text-left px-5 py-4 flex items-start gap-4">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{
            backgroundColor: isOpen ? "#036c5f" : "#f1f5f9",
            color: isOpen ? "white" : "#94a3b8",
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          {tag && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded mb-1.5 inline-block"
              style={{ backgroundColor: "#e6f4f2", color: "#036c5f" }}
            >
              {tag}
            </span>
          )}
          <p className="text-sm font-semibold text-slate-900">{q}</p>
        </div>
      </button>
      {isOpen && (
        <div className="px-5 pb-5 pt-0 pl-[60px]">
          <p className="text-sm text-slate-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}
