const placeholderEvents = [
  { start: 0.5, duration: 1 },
  { start: 2, duration: 1.5 },
  { start: 4.5, duration: 0.75 },
  { start: 1, duration: 2 },
  { start: 5, duration: 1 },
];

export function PulseAllDaySkeleton({ dayIndex }: { dayIndex: number }) {
  return (
    <span
      aria-hidden="true"
      className={`block h-5 rounded bg-surface-raised motion-safe:animate-pulse ${dayIndex % 2 === 0 ? "w-3/4" : "w-1/2"}`}
    />
  );
}

type PulseTimedEventsSkeletonProps = {
  dayCount: number;
  slotCount: number;
  headerOffset: number;
  hourHeight: number;
};

export function PulseTimedEventsSkeleton({
  dayCount,
  slotCount,
  headerOffset,
  hourHeight,
}: PulseTimedEventsSkeletonProps) {
  const blocks = Array.from({ length: dayCount }, (_, day) =>
    [placeholderEvents[day % placeholderEvents.length], placeholderEvents[(day + 2) % placeholderEvents.length]]
      .filter((block) => block.start + block.duration <= slotCount)
      .map((block) => ({ ...block, day })),
  ).flat();

  return (
    <>
      <span role="status" aria-busy="true" className="sr-only">
        Loading schedule
      </span>
      {blocks.map(({ day, start, duration }) => (
        <div
          key={`${day}-${start}`}
          aria-hidden="true"
          className="absolute z-2 flex flex-col gap-1.5 rounded-md border-l-4 border-border-strong bg-surface-raised p-2 motion-safe:animate-pulse"
          style={{
            top: headerOffset + start * hourHeight,
            left: `calc(80px + (${day} * (100% - 80px) / ${dayCount}) + 4px)`,
            width: `calc((100% - 80px) / ${dayCount} - 8px)`,
            height: Math.max(duration * hourHeight - 8, 48),
          }}
        >
          <span className="h-2.5 w-3/4 rounded bg-border" />
          <span className="h-2 w-1/3 rounded bg-border" />
        </div>
      ))}
    </>
  );
}

export function PulseEventDetailsSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Loading event details" className="w-full p-4">
      <div aria-hidden="true" className="space-y-3 motion-safe:animate-pulse">
        <span className="block h-5 w-2/3 rounded bg-surface-raised" />
        <span className="block h-3 w-1/2 rounded bg-surface-raised" />
        <span className="block h-3 w-2/5 rounded bg-surface-raised" />
        <div className="flex gap-2 pt-2">
          <span className="size-8 rounded-full bg-surface-raised" />
          <span className="size-8 rounded-full bg-surface-raised" />
          <span className="size-8 rounded-full bg-surface-raised" />
        </div>
        <div className="flex gap-2 pt-2">
          <span className="h-8 w-24 rounded-md bg-surface-raised" />
          <span className="h-8 w-24 rounded-md bg-surface-raised" />
        </div>
      </div>
    </div>
  );
}
