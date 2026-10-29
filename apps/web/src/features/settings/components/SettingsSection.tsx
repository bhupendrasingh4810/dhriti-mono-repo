import type { ReactNode } from "react";

export const settingsInputClass =
  "w-full rounded-md border border-border-strong bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-text-secondary";

export const settingsButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50";

export function SettingsSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const headingId = `settings-section-${id}`;
  return (
    <section aria-labelledby={headingId} className="rounded-xl border border-border bg-surface">
      <header className="border-b border-border px-5 py-4 sm:px-6">
        <h2 id={headingId} className="text-base font-semibold text-text-primary">
          {title}
        </h2>
        {description ? <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p> : null}
      </header>
      <div className="divide-y divide-border">{children}</div>
    </section>
  );
}

/** One labelled setting: text on the left, its control on the right (stacked on small screens). */
export function SettingsRow({
  label,
  description,
  htmlFor,
  error,
  children,
  stacked = false,
}: {
  label: string;
  description?: string;
  htmlFor?: string;
  error?: string | null;
  children: ReactNode;
  stacked?: boolean;
}) {
  return (
    <div
      className={`flex gap-3 px-5 py-4 sm:px-6 ${stacked ? "flex-col" : "flex-col sm:flex-row sm:items-center sm:justify-between sm:gap-6"}`}
    >
      <div className="min-w-0 sm:max-w-md">
        {htmlFor ? (
          <label htmlFor={htmlFor} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        ) : (
          <p className="text-sm font-medium text-text-primary">{label}</p>
        )}
        {description ? <p className="mt-1 text-xs leading-relaxed text-text-secondary">{description}</p> : null}
        {error ? (
          <p role="alert" className="mt-1 text-xs text-error">
            {error}
          </p>
        ) : null}
      </div>
      <div className={`min-w-0 ${stacked ? "w-full" : "shrink-0 sm:w-72 sm:max-w-full"}`}>{children}</div>
    </div>
  );
}
