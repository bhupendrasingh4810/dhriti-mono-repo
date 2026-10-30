export function NotificationsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading notifications">
      <span className="sr-only">Loading notifications...</span>
      <div aria-hidden="true" className="divide-y divide-border motion-safe:animate-pulse">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} data-skeleton-row="" className="flex gap-3 px-4 py-3">
            <div className="size-9 shrink-0 rounded-lg bg-surface-raised" />
            <div className="min-w-0 flex-1">
              <div className="h-3 w-1/4 rounded bg-surface-raised" />
              <div className="mt-2 h-4 w-2/3 rounded bg-surface-raised" />
              <div className="mt-2 h-3 w-full rounded bg-surface-raised" />
              <div className="mt-3 flex gap-2">
                <span className="h-6 w-14 rounded-md bg-surface-raised" />
                <span className="h-6 w-20 rounded-md bg-surface-raised" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
