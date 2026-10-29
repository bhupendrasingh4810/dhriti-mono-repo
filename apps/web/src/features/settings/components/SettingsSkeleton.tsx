export function SettingsSkeleton({ sections = [4, 3, 5] }: { sections?: number[] }) {
  return (
    <div role="status" aria-label="Loading settings" aria-busy="true">
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        {sections.map((rows, sectionIndex) => (
          <div key={sectionIndex} className="rounded-xl border border-border bg-surface">
            <div className="space-y-2 border-b border-border px-5 py-4 sm:px-6">
              <div className="h-4 w-32 rounded-md bg-surface-raised" />
              <div className="h-3 w-64 max-w-full rounded-md bg-surface-raised" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: rows }, (_, rowIndex) => (
                <div
                  key={rowIndex}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                >
                  <div className="space-y-2">
                    <div className="h-3.5 w-40 rounded-md bg-surface-raised" />
                    <div className="h-3 w-56 max-w-full rounded-md bg-surface-raised" />
                  </div>
                  <div
                    className={`rounded-md bg-surface-raised ${rowIndex % 2 === 0 ? "h-6 w-11 rounded-full" : "h-9 w-full sm:w-72"}`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
