export function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" aria-busy="true">
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="h-20 border-b border-brand/10 bg-brand-muted sm:h-24" />
          <div className="px-5 pb-6 sm:px-7">
            <div className="-mt-10 flex items-end justify-between gap-4">
              <div className="size-24 rounded-xl border-4 border-surface bg-surface-raised" />
              <div className="h-6 w-24 rounded-full bg-surface-raised" />
            </div>
            <div className="mt-5 space-y-3">
              <div className="h-6 w-40 max-w-full rounded-md bg-surface-raised" />
              <div className="h-4 w-56 max-w-full rounded-md bg-surface-raised" />
              <div className="h-3 w-80 max-w-full rounded-md bg-surface-raised" />
            </div>
          </div>
        </div>
        <div className="grid items-start gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {[6, 4, 7, 2].map((fields, index) => (
              <ProfileSkeletonCard key={index} fields={fields} />
            ))}
          </div>
          <div className="min-w-0 space-y-6">
            <ProfileSkeletonCard fields={3} compact />
            <ProfileSkeletonCard fields={4} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileSkeletonCard({ fields, compact = false }: { fields: number; compact?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="size-9 shrink-0 rounded-md bg-brand-muted" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-5 w-36 max-w-full rounded-md bg-surface-raised" />
          {!compact ? <div className="h-3 w-64 max-w-full rounded-md bg-surface-raised" /> : null}
        </div>
      </div>
      <div className={`mt-6 grid gap-5 ${compact ? "" : "sm:grid-cols-2"}`}>
        {Array.from({ length: fields }, (_, index) => (
          <div key={index} className="space-y-2">
            <div className="h-3 w-20 rounded-md bg-surface-raised" />
            <div className="h-5 w-32 max-w-full rounded-md bg-surface-raised" />
          </div>
        ))}
      </div>
    </div>
  );
}
