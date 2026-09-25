function Sk({
  w,
  h,
  rounded = "rounded-lg",
  className = "",
}: {
  w: string;
  h: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      className={`${w} ${h} ${rounded} ${className} flex-shrink-0`}
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0.06) 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
      }}
    />
  );
}

function SkLight({
  w,
  h,
  rounded = "rounded-lg",
  className = "",
}: {
  w: string;
  h: string;
  rounded?: string;
  className?: string;
}) {
  return (
    <div
      className={`${w} ${h} ${rounded} ${className} flex-shrink-0`}
      style={{
        background: "linear-gradient(90deg, #f1f5f9 0%, #e2e8f0 50%, #f1f5f9 100%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.6s infinite",
      }}
    />
  );
}

export default function OnboardingSkeleton() {
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#f8fafc" }}>
      {/* Left panel skeleton */}
      <div className="hidden lg:flex flex-col w-80 xl:w-96 min-h-screen" style={{ backgroundColor: "#036c5f" }}>
        {/* Logo area */}
        <div className="px-8 pt-8 pb-6">
          <div className="flex items-center gap-2.5">
            <Sk w="w-8" h="h-8" rounded="rounded-lg" />
            <Sk w="w-24" h="h-4" rounded="rounded-md" />
          </div>
        </div>

        {/* Steps */}
        <div className="px-8 flex-1">
          <Sk w="w-20" h="h-3" rounded="rounded-md" className="mb-6" />
          <div className="space-y-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <Sk w="w-7" h="h-7" rounded="rounded-full" />
                  {i < 5 && <div className="w-px h-6 mt-1 mb-1" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />}
                </div>
                <div className="pt-1 pb-7">
                  <Sk
                    w={i === 1 ? "w-32" : i === 2 ? "w-24" : i === 3 ? "w-20" : i === 4 ? "w-28" : "w-16"}
                    h="h-3"
                    rounded="rounded-md"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Preview card skeleton */}
        <div className="px-8 pb-8">
          <div
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)" }}
          >
            <div
              className="px-3 py-2 flex items-center gap-2"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}
            >
              <Sk w="w-4" h="h-4" rounded="rounded" />
              <Sk w="w-24" h="h-3" rounded="rounded-md" />
            </div>
            <div className="p-3 space-y-2">
              <Sk w="w-full" h="h-6" rounded="rounded" />
              <Sk w="w-4/5" h="h-6" rounded="rounded" />
              <Sk w="w-3/5" h="h-6" rounded="rounded" />
              <div className="h-px" style={{ backgroundColor: "rgba(255,255,255,0.1)" }} />
              <Sk w="w-2/3" h="h-6" rounded="rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Right content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <SkLight w="w-7" h="h-7" rounded="rounded-lg" />
            <SkLight w="w-20" h="h-4" rounded="rounded-md" />
          </div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkLight key={i} w={i === 1 ? "w-5" : "w-1.5"} h="h-1.5" rounded="rounded-full" />
            ))}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-lg space-y-8">
            {/* Badge */}
            <SkLight w="w-24" h="h-6" rounded="rounded-full" />

            {/* Title */}
            <div className="space-y-2">
              <SkLight w="w-3/4" h="h-8" rounded="rounded-lg" />
              <SkLight w="w-1/2" h="h-8" rounded="rounded-lg" />
              <div className="pt-1">
                <SkLight w="w-full" h="h-4" rounded="rounded" />
                <SkLight w="w-4/5" h="h-4" rounded="rounded" className="mt-1.5" />
              </div>
            </div>

            {/* Field label + input */}
            <div className="space-y-4">
              <div>
                <SkLight w="w-32" h="h-4" rounded="rounded" className="mb-2" />
                <SkLight w="w-full" h="h-12" rounded="rounded-xl" />
                <SkLight w="w-40" h="h-3" rounded="rounded" className="mt-2" />
              </div>

              {/* URL pill */}
              <SkLight w="w-full" h="h-14" rounded="rounded-xl" />

              {/* CTA button */}
              <SkLight w="w-full" h="h-12" rounded="rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
