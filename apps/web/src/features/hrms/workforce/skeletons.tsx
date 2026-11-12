/** Skeleton placeholders for the Workforce tabs; shapes mirror the loaded layouts to avoid layout shift. */

const bar = "rounded-md bg-surface-raised";

export function DirectoryTableSkeleton({ rows = 8, label = "Loading employees" }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} aria-busy="true">
      <div aria-hidden="true" className="divide-y divide-border motion-safe:animate-pulse">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center gap-4 px-4 py-3.5">
            <div className="h-9 w-9 shrink-0 rounded-full bg-surface-raised" />
            <div className="w-48 space-y-2">
              <div className={`h-3.5 w-36 ${bar}`} />
              <div className={`h-3 w-44 max-w-full ${bar}`} />
            </div>
            <div className={`hidden h-3.5 flex-1 md:block ${bar}`} />
            <div className={`hidden h-3.5 flex-1 lg:block ${bar}`} />
            <div className={`h-5 w-16 rounded-full bg-surface-raised`} />
            <div className={`h-6 w-14 ${bar}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DirectoryPageSkeleton() {
  return (
    <div role="status" aria-label="Loading directory" aria-busy="true">
      <div aria-hidden="true" className="space-y-5 motion-safe:animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3 rounded-xl border border-border bg-surface p-5">
              <div className={`h-3 w-24 ${bar}`} />
              <div className={`h-7 w-16 ${bar}`} />
              <div className={`h-3 w-32 ${bar}`} />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex gap-3 border-b border-border p-4">
            <div className={`h-9 w-72 max-w-full ${bar}`} />
            <div className={`h-9 w-32 ${bar}`} />
          </div>
          <DirectoryTableSkeleton />
        </div>
      </div>
    </div>
  );
}

export function OrganizationChartSkeleton() {
  return (
    <div role="status" aria-label="Loading organization chart" aria-busy="true">
      <div aria-hidden="true" className="flex flex-col items-center gap-8 p-10 motion-safe:animate-pulse">
        <div className="h-16 w-48 rounded-lg bg-surface-raised" />
        <div className="flex gap-8">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="h-16 w-48 rounded-lg bg-surface-raised" />
          ))}
        </div>
        <div className="flex gap-8">
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="h-16 w-40 rounded-lg bg-surface-raised" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function OffboardingSkeleton() {
  return (
    <div role="status" aria-label="Loading offboarding" aria-busy="true">
      <div aria-hidden="true" className="grid gap-5 motion-safe:animate-pulse lg:grid-cols-3">
        <div className="space-y-3 rounded-xl border border-border bg-surface p-5 lg:col-span-2">
          <div className={`h-5 w-64 ${bar}`} />
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className={`h-16 w-full rounded-md bg-surface-raised`} />
          ))}
        </div>
        <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
          <div className={`h-5 w-32 ${bar}`} />
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="space-y-2">
              <div className={`h-3 w-20 ${bar}`} />
              <div className={`h-4 w-40 ${bar}`} />
            </div>
          ))}
          <div className={`h-10 w-full ${bar}`} />
        </div>
      </div>
    </div>
  );
}
