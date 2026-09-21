"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const NAV_ITEMS = ["Product", "Solutions", "Pricing", "Resources", "Company"];

export function Navbar() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(255,255,255,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? "1px solid #e2e8f0" : "1px solid transparent",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => router.push("/")} className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#036c5f" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-bold text-slate-900 text-lg" style={{ fontFamily: "var(--font-display)" }}>Dhriti OS</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              onClick={() => item === "Pricing" ? router.push("pricing") : undefined}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
            >
              {item}
            </button>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => router.push("login")}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2"
          >
            Sign in
          </button>
          <button
            onClick={() => router.push("get-started")}
            className="text-sm font-semibold px-5 py-2.5 rounded-xl text-white transition-all"
            style={{ backgroundColor: "#036c5f", boxShadow: "0 2px 8px rgba(3,108,95,0.3)" }}
            onMouseOver={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#024d44"; }}
            onMouseOut={(e) => { (e.currentTarget as HTMLElement).style.backgroundColor = "#036c5f"; }}
          >
            Get started free
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-all"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileMenuOpen
              ? <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>
              : <><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-6 pb-4 pt-2 border-t" style={{ backgroundColor: "white", borderColor: "#e2e8f0" }}>
          {NAV_ITEMS.map((item) => (
            <button key={item} className="w-full text-left py-3 text-sm font-medium text-slate-600 border-b border-slate-50 last:border-0">
              {item}
            </button>
          ))}
          <div className="flex gap-3 mt-4">
            <button onClick={() => router.push("login")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold border text-slate-700 hover:bg-slate-50 transition-all" style={{ borderColor: "#e2e8f0" }}>Sign in</button>
            <button onClick={() => router.push("get-started")} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ backgroundColor: "#036c5f" }}>Get started</button>
          </div>
        </div>
      )}
    </header>
  );
}