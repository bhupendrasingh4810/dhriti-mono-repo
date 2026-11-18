/** Inline placeholders retain the existing cards, ten service rows and resource-panel dimensions. */
export function SystemHealthSkeletonValue({ wide = false }: { wide?: boolean }) {
  return (
    <span
      aria-hidden="true"
      data-testid="system-health-skeleton"
      className={`inline-block h-4 rounded bg-surface-raised align-middle motion-safe:animate-pulse ${wide ? "w-24" : "w-12"}`}
    />
  );
}
