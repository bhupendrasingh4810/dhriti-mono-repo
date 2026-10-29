import type { ReactNode } from "react";
import { AlertCircle, Check, ChevronRight, Lock, Settings } from "lucide-react";
import { settingsButtonClass } from "./SettingsSection";

export function SettingsPageShell({
  scope,
  title,
  description,
  readOnly,
  children,
}: {
  scope: string;
  title: string;
  description: string;
  readOnly?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-4 text-text-primary sm:p-6 lg:p-8">
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-secondary">
        <Settings className="size-4" aria-hidden="true" />
        <span>{scope}</span>
        <ChevronRight className="size-3" aria-hidden="true" />
        <span aria-current="page" className="text-text-primary">
          {title}
        </span>
      </nav>
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
      </div>
      {readOnly ? (
        <p className="flex items-center gap-2 rounded-md border border-border bg-surface-raised p-3 text-sm text-text-secondary">
          <Lock className="size-4 shrink-0" aria-hidden="true" />
          Only people with the organization settings-management permission can change these settings.
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function SettingsStatus({ success, error }: { success?: string; error?: string }) {
  return (
    <div aria-live="polite" aria-atomic="true">
      {success ? (
        <p
          role="status"
          className="flex items-center gap-2 rounded-md border border-brand/20 bg-brand-muted p-3 text-sm text-brand-dark"
        >
          <Check className="size-4 shrink-0" aria-hidden="true" />
          {success}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="flex items-center gap-2 rounded-md border border-error/20 bg-surface p-3 text-sm text-error"
        >
          <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SettingsLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="space-y-4 rounded-xl border border-border bg-surface p-6">
      <p className="flex items-center gap-2 text-sm text-error">
        <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
        {message}
      </p>
      <button
        type="button"
        onClick={onRetry}
        className={`${settingsButtonClass} bg-brand text-text-inverse hover:bg-brand-dark`}
      >
        Try again
      </button>
    </div>
  );
}

/** Sticky footer with save/discard actions for a settings form. */
export function SettingsSaveBar({
  dirty,
  saving,
  invalid,
  onDiscard,
}: {
  dirty: boolean;
  saving: boolean;
  invalid?: boolean;
  onDiscard: () => void;
}) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4 shadow-lg">
      <p className="text-xs text-text-secondary">
        {invalid ? "Fix the highlighted fields to save." : dirty ? "You have unsaved changes." : "All changes saved."}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={onDiscard}
          className={`${settingsButtonClass} border border-border-strong bg-surface text-text-primary hover:bg-surface-raised`}
        >
          Discard
        </button>
        <button
          type="submit"
          disabled={!dirty || saving || invalid}
          className={`${settingsButtonClass} bg-brand text-text-inverse hover:bg-brand-dark`}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
