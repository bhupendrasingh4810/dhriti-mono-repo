/** Preserve the role list, permission grid and assignee panel geometry during initial loading. */
export function RoleManagementSkeleton() {
  return (
    <div role="status" aria-label="Loading roles and permissions" aria-busy="true" className="h-full min-h-0">
      <div aria-hidden="true" className="flex h-full min-h-0 flex-col gap-4 motion-safe:animate-pulse">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-md bg-surface-raised" />
            <div className="h-4 w-80 max-w-full rounded-md bg-surface-raised" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 rounded-md bg-surface-raised" />
            <div className="h-10 w-32 rounded-md bg-surface-raised" />
          </div>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className="space-y-4 overflow-hidden rounded-lg border border-border bg-surface p-4">
            <div className="h-3 w-32 rounded bg-surface-raised" />
            <div className="h-10 rounded-md bg-surface-raised" />
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="space-y-2 py-2">
                <div className="h-4 w-32 rounded bg-surface-raised" />
                <div className="h-3 w-40 rounded bg-surface-raised" />
              </div>
            ))}
          </div>
          <div className="grid min-h-0 gap-4 2xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="flex min-h-0 flex-col rounded-lg border border-border bg-surface">
              <div className="flex flex-wrap justify-between gap-4 border-b border-border p-5">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-surface-raised" />
                  <div className="h-3 w-48 rounded bg-surface-raised" />
                </div>
                <div className="h-10 w-48 rounded-md bg-surface-raised" />
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-hidden p-3">
                {Array.from({ length: 3 }, (_, group) => (
                  <div key={group} className="space-y-2">
                    <div className="h-3 w-20 rounded bg-surface-raised" />
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                      {Array.from({ length: 8 }, (_, index) => (
                        <div key={index} className="h-14 rounded-md bg-surface-raised" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end border-t border-border p-4">
                <div className="h-10 w-36 rounded-md bg-surface-raised" />
              </div>
            </div>
            <div className="space-y-4 rounded-lg border border-border bg-surface p-5">
              <div className="h-4 w-32 rounded bg-surface-raised" />
              <div className="h-3 w-48 max-w-full rounded bg-surface-raised" />
              <div className="h-10 rounded-md bg-surface-raised" />
              <div className="h-12 rounded-md bg-surface-raised" />
              <div className="h-12 rounded-md bg-surface-raised" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
