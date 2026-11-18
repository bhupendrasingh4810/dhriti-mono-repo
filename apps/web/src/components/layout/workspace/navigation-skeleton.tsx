/** Match app tiles without exposing links before tenant access is known. */
export function NavigationSkeleton({ grid = false }: { grid?: boolean }) {
  return (
    <div role="status" aria-label="Loading apps" aria-busy="true">
      <div
        aria-hidden="true"
        className={`motion-safe:animate-pulse ${grid ? "grid grid-cols-3 gap-2 sm:grid-cols-4" : "flex flex-col items-center gap-1"}`}
      >
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="flex w-14 flex-col items-center gap-1 rounded-xl py-2.5">
            <div className="size-6 rounded-md bg-surface-raised" />
            <div className="h-2 w-8 rounded bg-surface-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
