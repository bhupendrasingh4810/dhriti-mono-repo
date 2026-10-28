interface NotesSkeletonProps {
  count?: number;
}

const folderLabelWidths = ["w-3/4", "w-1/2", "w-2/3", "w-3/5"];

export function NotesFolderListSkeleton({ count = 4 }: NotesSkeletonProps) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading folders" className="space-y-1">
      <div aria-hidden="true" className="space-y-1 motion-safe:animate-pulse">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-2 rounded-md px-3 py-2">
            <span className="size-4 shrink-0 rounded bg-brand-dark" />
            <span className={`h-3 rounded bg-brand-dark ${folderLabelWidths[index % folderLabelWidths.length]}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotesGridSkeleton({ count = 8 }: NotesSkeletonProps) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading notes"
      className="col-span-full grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex min-h-44 flex-col rounded-lg border border-border bg-background p-4 motion-safe:animate-pulse"
        >
          <span className="h-4 w-2/3 rounded bg-surface-raised" />
          <span className="mt-2 h-3 w-1/3 rounded bg-surface-raised" />
          <span className="mt-4 h-3 w-full rounded bg-surface-raised" />
          <span className="mt-2 h-3 w-11/12 rounded bg-surface-raised" />
          <span className="mt-2 h-3 w-3/4 rounded bg-surface-raised" />
          <span className="mt-auto h-3 w-20 rounded bg-surface-raised" />
        </div>
      ))}
    </div>
  );
}
