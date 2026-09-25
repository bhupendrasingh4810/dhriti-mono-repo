type PlanId = "free" | "standard" | "premium" | "enterprise";

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

interface PlanCardProps {
  id: PlanId;
  recommended: boolean;
  title: string;
  subtitle: string;
  priceNode: React.ReactNode;
  totalNode?: React.ReactNode;
  bullets: string[];
  cta: string;
  ctaAction: () => void;
  annualOnly?: boolean;
}

export default function PlanCard({
  recommended,
  title,
  subtitle,
  priceNode,
  totalNode,
  bullets,
  cta,
  ctaAction,
  annualOnly,
}: PlanCardProps) {
  return (
    <div
      className="rounded-3xl flex flex-col overflow-hidden transition-all duration-200 hover:shadow-lg"
      style={{
        backgroundColor: "white",
        border: `2px solid ${recommended ? "#475569" : "#e2e8f0"}`,
        boxShadow: recommended ? `0 0 0 1px ${"#475569"}20, 0 8px 32px ${"#475569"}15` : undefined,
      }}
    >
      {/* Recommended ribbon */}
      {recommended ? (
        <div
          className="flex h-7 items-center justify-center text-center text-xs font-bold uppercase tracking-widest"
          style={{ backgroundColor: "#475569", color: "white" }}
        >
          ★ Recommended for you
        </div>
      ) : (
        <div className="h-7" />
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Header */}
        <div className="mb-5 min-h-[4.5rem] text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-lg font-bold mb-3"
            style={{ backgroundColor: "#e2e8f0", color: "#475569" }}
          >
            {title}
          </div>
          <p className="text-xs text-slate-500 leading-snug">{subtitle}</p>
        </div>

        {/* Price */}
        <div className="mb-4 min-h-24">{priceNode}</div>

        {/* Total estimate */}
        {totalNode && (
          <div
            className="rounded-xl px-3.5 py-3 mb-5"
            style={{
              backgroundColor: recommended ? "#e6f4f2" : "#f8fafc",
              border: `1px solid ${recommended ? "#036c5f" : "#e2e8f0"}20`,
            }}
          >
            {totalNode}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={ctaAction}
          className="w-full py-3 rounded-xl text-sm font-semibold mb-6 transition-all"
          style={{ backgroundColor: recommended ? "#036c5f" : "#475569", color: "white" }}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = "#024d44";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.backgroundColor = recommended ? "#036c5f" : "#475569";
          }}
        >
          {cta}
        </button>

        {/* Divider */}
        <div className="border-t mb-5" style={{ borderColor: "#f1f5f9" }} />

        {/* Feature bullets */}
        <ul className="space-y-2.5 flex-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              {i === 0 && b.includes("Everything") ? (
                <span className="text-xs font-semibold text-slate-400 leading-relaxed mt-0.5">{b}</span>
              ) : (
                <>
                  <span className="mt-0.5 flex-shrink-0">
                    <Check color={recommended ? "#036c5f" : "#e2e8f0"} />
                  </span>
                  <span className="text-xs text-slate-600 leading-relaxed">{b}</span>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
