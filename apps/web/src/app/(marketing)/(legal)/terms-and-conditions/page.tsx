import type { ReactNode } from "react";

const SECTIONS = [
  { id: "acceptance", title: "Acceptance of Terms" },
  { id: "services", title: "Description of Services" },
  { id: "accounts", title: "User Accounts" },
  { id: "conduct", title: "Acceptable Use" },
  { id: "data", title: "Data & Privacy" },
  { id: "ip", title: "Intellectual Property" },
  { id: "billing", title: "Billing & Payments" },
  { id: "termination", title: "Termination" },
  { id: "liability", title: "Limitation of Liability" },
  { id: "disputes", title: "Dispute Resolution" },
  { id: "changes", title: "Changes to Terms" },
  { id: "contact", title: "Contact Us" },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      {/* Header */}
      {/* <header
        className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 border-b"
        style={{ backgroundColor: "white", borderColor: "#e2e8f0" }}
      >
        <a href="/login" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>Dhriti OS</span>
        </a>
        <div className="flex items-center gap-4">
          <a href="/privacy-policy" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">Privacy Policy</a>
          <a
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg text-white transition-all"
            style={{ backgroundColor: "#036c5f" }}
          >
            Sign in
          </a>
        </div>
      </header> */}

      {/* Hero */}
      <div
        className="px-8 py-12 border-b"
        style={{
          background: "linear-gradient(135deg, #036c5f 0%, #024d44 100%)",
          borderColor: "#024d44",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-4"
            style={{ backgroundColor: "rgba(255,255,255,0.15)", color: "white" }}
          >
            Legal document · Last updated September 14, 2026
          </div>
          <h1 className="text-4xl font-bold text-white mb-3" style={{ fontFamily: "var(--font-display)" }}>
            Terms of Service
          </h1>
          <p className="text-white/70 text-base max-w-xl">
            Please read these terms carefully before using Dhriti OS. By accessing the platform you agree to be bound by
            these terms.
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 max-w-6xl mx-auto w-full">
        {/* Sticky TOC */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 border-r" style={{ borderColor: "#e2e8f0" }}>
          <div className="sticky top-[73px] p-6 max-h-[calc(100vh-73px)] overflow-y-auto">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">On this page</p>
            <nav className="space-y-0.5">
              {SECTIONS.map((s, i) => (
                <a
                  key={s.id}
                  href={`#term-${s.id}`}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2.5"
                  style={{
                    color: "#64748b",
                  }}
                >
                  <span
                    className="text-xs flex-shrink-0 w-5 h-5 rounded flex items-center justify-center"
                    style={{
                      backgroundColor: "#f1f5f9",
                      color: "#94a3b8",
                    }}
                  >
                    {i + 1}
                  </span>
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto px-8 py-10" style={{ maxHeight: "calc(100vh - 73px)" }}>
          <div className="max-w-2xl space-y-12 pb-20">
            {SECTIONS.map((s, i) => (
              <section key={s.id} id={`term-${s.id}`} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: "#036c5f" }}
                  >
                    {i + 1}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900" style={{ fontFamily: "var(--font-display)" }}>
                    {s.title}
                  </h2>
                </div>
                <div className="text-slate-600 text-sm leading-relaxed space-y-3 pl-10">{TERM_CONTENT[s.id]}</div>
              </section>
            ))}
          </div>
        </main>
      </div>

      {/* Footer */}
      {/* <footer className="border-t px-8 py-4 flex items-center justify-between" style={{ borderColor: "#e2e8f0", backgroundColor: "white" }}>
        <p className="text-xs text-slate-400">© 2026 Dhriti OS, Inc. All rights reserved.</p>
        <div className="flex gap-4">
          <a href="/privacy-policy" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Privacy</a>
          <a href="/contact-us" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">Contact</a>
        </div>
      </footer> */}
    </div>
  );
}

const TERM_CONTENT: Record<string, ReactNode> = {
  acceptance: (
    <>
      <p>
        By creating an account, accessing, or using Dhriti OS (&quot;the Service&quot;), you acknowledge that you have
        read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.
      </p>
      <p>
        If you are entering into this agreement on behalf of a company or other legal entity, you represent that you
        have the authority to bind such entity to these terms. If you do not agree, do not use the Service.
      </p>
    </>
  ),
  services: (
    <>
      <p>
        Dhriti OS provides a unified enterprise workspace platform including team messaging, project management,
        document collaboration, calendar integration, and AI-powered workflow tools.
      </p>
      <p>
        We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time with reasonable
        notice to active subscribers.
      </p>
    </>
  ),
  accounts: (
    <>
      <p>
        You must provide accurate, complete, and current registration information. You are responsible for maintaining
        the confidentiality of your credentials and for all activities under your account.
      </p>
      <p>
        Notify us immediately at <span className="font-medium text-slate-800">security@dhritios.app</span> if you
        suspect any unauthorized use of your account.
      </p>
    </>
  ),
  conduct: (
    <>
      <p>
        You agree not to use the Service to: transmit unlawful, harmful, or abusive content; impersonate others;
        distribute malware or spam; attempt unauthorized access to other accounts or systems; or violate any applicable
        law.
      </p>
      <p>Dhriti OS reserves the right to investigate violations and suspend or terminate accounts at its discretion.</p>
    </>
  ),
  data: (
    <>
      <p>
        Your use of the Service is also governed by our Privacy Policy. You retain all rights to the content you submit,
        and grant Dhriti OS a limited license to host, process, and display it solely to provide the Service.
      </p>
      <p>
        We implement industry-standard security measures including encryption at rest and in transit, SOC 2 Type II
        compliance, and regular third-party audits.
      </p>
    </>
  ),
  ip: (
    <>
      <p>
        The Service, including its software, design, and brand, is owned by Dhriti OS, Inc. and protected by applicable
        intellectual property laws. These terms do not grant you any rights to use our trademarks or logos.
      </p>
    </>
  ),
  billing: (
    <>
      <p>
        Paid plans are billed in advance on a monthly or annual basis. All fees are non-refundable except as required by
        law or as explicitly stated in our refund policy.
      </p>
      <p>We may change pricing with 30 days&apos; notice. Continued use after a price change constitutes acceptance.</p>
    </>
  ),
  termination: (
    <>
      <p>
        Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease
        and we will delete your data within 90 days per our data retention policy.
      </p>
      <p>Sections on intellectual property, limitation of liability, and dispute resolution survive termination.</p>
    </>
  ),
  liability: (
    <>
      <p>
        To the maximum extent permitted by law, Dhriti OS shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages. Our total liability shall not exceed the fees paid by you in the 12 months
        preceding the claim.
      </p>
    </>
  ),
  disputes: (
    <>
      <p>
        These terms are governed by the laws of the State of Delaware. Any disputes shall be resolved through binding
        arbitration under the AAA Commercial Arbitration Rules, except for injunctive relief in cases of IP
        infringement.
      </p>
    </>
  ),
  changes: (
    <>
      <p>
        We may modify these terms at any time. We will provide at least 30 days&apos; notice via email for material
        changes. Your continued use after the effective date constitutes acceptance of the updated terms.
      </p>
    </>
  ),
  contact: (
    <>
      <p>
        For questions about these terms, contact us at{" "}
        <span className="font-medium text-slate-800">legal@dhritios.app</span> or write to:
      </p>
      <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
        <p className="font-medium text-slate-700">Dhriti OS, Inc.</p>
        <p>Legal Department</p>
        <p>1234 Enterprise Blvd, Suite 500</p>
        <p>San Francisco, CA 94105</p>
      </div>
    </>
  ),
};
