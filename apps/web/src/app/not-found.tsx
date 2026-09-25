"use client";
import { useRouter } from "next/navigation";

export default function Page404() {
  const router = useRouter();
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: "#0d1b2a" }}
    >
      {/* Animated grid lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(3,108,95,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(3,108,95,0.07) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glow orb */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, rgba(3,108,95,0.18) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Giant 404 */}
        <div className="relative mb-4 select-none">
          <span
            className="font-black leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(120px, 20vw, 200px)",
              color: "transparent",
              WebkitTextStroke: "2px rgba(3,108,95,0.4)",
              letterSpacing: "-0.05em",
            }}
          >
            404
          </span>
          <span
            className="absolute inset-0 flex items-center justify-center font-black leading-none"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(120px, 20vw, 200px)",
              background: "linear-gradient(135deg, #036c5f 0%, #04b896 50%, #036c5f 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.25,
              letterSpacing: "-0.05em",
            }}
          >
            404
          </span>
        </div>

        {/* Icon */}
        <div
          className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
          style={{ backgroundColor: "rgba(3,108,95,0.15)", border: "1px solid rgba(3,108,95,0.3)" }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#036c5f"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="11" y1="8" x2="11" y2="14" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
        </div>

        <h1 className="text-3xl font-bold mb-3" style={{ fontFamily: "var(--font-display)", color: "#f1f5f9" }}>
          Page not found
        </h1>
        <p className="text-base mb-10 leading-relaxed" style={{ color: "#64748b" }}>
          The page you're looking for has been moved, deleted, or never existed. Let's get you back on track.
        </p>

        {/* Suggestions */}
        <div className="grid grid-cols-3 gap-3 mb-10 text-left">
          {[
            { label: "Dashboard", icon: "⊞", page: "dashboard" as string },
            { label: "Sign in", icon: "→", page: "login" as string },
            { label: "Sign up", icon: "+", page: "signup" as string },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(`/${item.page}`)}
              className="rounded-xl px-3 py-3 text-left transition-all group"
              style={{
                backgroundColor: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseOver={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(3,108,95,0.12)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(3,108,95,0.4)";
              }}
              onMouseOut={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(255,255,255,0.03)";
                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <span className="text-lg block mb-1" style={{ color: "#036c5f" }}>
                {item.icon}
              </span>
              <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>
                {item.label}
              </span>
            </button>
          ))}
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ backgroundColor: "#036c5f" }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#024d44";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#036c5f";
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to dashboard
        </button>
      </div>

      {/* Bottom wordmark */}
      <div className="absolute bottom-6 flex items-center gap-2" style={{ color: "#1e3a4f" }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Dhriti OS
        </span>
      </div>
    </div>
  );
}
