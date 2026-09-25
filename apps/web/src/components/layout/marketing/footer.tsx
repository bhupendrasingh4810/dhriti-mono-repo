"use client";

import { useRouter } from "next/navigation";

export const Footer = () => {
  const router = useRouter();
  return (
    <footer className="py-16 border-t" style={{ backgroundColor: "#0a0f1a", borderColor: "#1e293b" }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#036c5f" }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <span className="text-white font-bold" style={{ fontFamily: "var(--font-display)" }}>
                Dhriti OS
              </span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              The operating system for modern teams. Work smarter. Move faster.
            </p>
          </div>

          {/* Links */}
          {[
            { heading: "Product", items: ["Connect", "Flow", "Atlas", "Pulse", "Nexus AI"] },
            { heading: "Company", items: ["About", "Careers", "Blog", "Press", "Partners"] },
            { heading: "Resources", items: ["Documentation", "API Reference", "Status", "Changelog", "Integrations"] },
            { heading: "Legal", items: ["Privacy Policy", "Terms of Service", "Security", "GDPR", "Cookie Policy"] },
          ].map((col) => (
            <div key={col.heading}>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{col.heading}</p>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => {
                        if (item === "Privacy Policy") router.push("privacy-policy");
                        else if (item === "Terms of Service") router.push("terms-and-conditions");
                        else if (item === "About") router.push("about-us");
                        else if (item === "Careers") router.push("careers");
                      }}
                      className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="border-t pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderColor: "#1e293b" }}
        >
          <p className="text-xs text-slate-600">© 2026 Dhriti OS, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-lg"
              style={{ backgroundColor: "rgba(3,108,95,0.2)", color: "#4ade80" }}
            >
              ● All systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
