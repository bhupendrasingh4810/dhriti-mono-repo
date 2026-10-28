import type { ReactNode } from "react";

export const profileButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";
export const profileInputClass =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-raised disabled:text-text-secondary";

export function ProfileSection({
  id,
  icon,
  title,
  description,
  children,
}: {
  id: string;
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-border bg-surface p-5 sm:p-6" aria-labelledby={id}>
      <div className="flex items-start gap-3">
        <span
          className="grid size-9 shrink-0 place-items-center rounded-md bg-brand-muted text-brand"
          aria-hidden="true"
        >
          {icon}
        </span>
        <div>
          <h2 id={id} className="text-base font-semibold">
            {title}
          </h2>
          {description ? <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

export function ProfileDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-text-secondary">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
