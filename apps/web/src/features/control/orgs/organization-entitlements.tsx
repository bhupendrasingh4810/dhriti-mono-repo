"use client";

import { useEffect, useId, useState } from "react";
import { Layers, LoaderCircle, SlidersHorizontal } from "lucide-react";
import { controlPlatformService, type PlatformOrganizationEntitlement } from "@/services/control.service";
import { APP_ENTITLEMENTS_CHANGED } from "@/hooks/use-app-entitlements";

type Draft = { enabled: boolean; value: string };

export function OrganizationEntitlements({ organizationId }: { organizationId: string }) {
  const [items, setItems] = useState<PlatformOrganizationEntitlement[] | null>(null);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function change(key: string, draft: Draft) {
    setDrafts((current) => ({ ...current, [key]: draft }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setSaveErrors((current) => ({ ...current, [key]: "" }));
    setSaved(false);
  }

  const changed = (items ?? []).filter((item) => {
    const draft = drafts[item.key];
    return (
      draft &&
      (draft.enabled !== item.enabled ||
        (item.kind === "LIMIT" && draft.enabled && draft.value !== (item.value?.toString() ?? "")))
    );
  });

  async function save() {
    if (saving || changed.length === 0) return;
    const errors: Record<string, string> = {};
    for (const item of changed) {
      const draft = drafts[item.key];
      const value = Number(draft.value);
      if (
        item.kind === "LIMIT" &&
        draft.enabled &&
        (!draft.value.trim() || !Number.isInteger(value) || value < 0 || value > 2147483647)
      ) {
        errors[item.key] = "Enter a whole number between 0 and 2147483647.";
      }
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    setSaving(true);
    setSaved(false);
    setSaveErrors({});
    // Keep successful writes as the new baseline; retry only failed edits after a partial save.
    const results = await Promise.allSettled(
      changed.map((item) => {
        const draft = drafts[item.key];
        return controlPlatformService.updateOrganizationEntitlement(organizationId, {
          key: item.key,
          enabled: draft.enabled,
          ...(item.kind === "LIMIT" && draft.enabled ? { value: Number(draft.value) } : {}),
        });
      }),
    );
    const updated = new Map<string, PlatformOrganizationEntitlement>();
    const failures: Record<string, string> = {};
    results.forEach((result, index) => {
      const key = changed[index].key;
      if (result.status === "fulfilled") updated.set(key, result.value);
      else failures[key] = result.reason instanceof Error ? result.reason.message : "Unable to update entitlement";
    });
    setItems((current) => current?.map((item) => updated.get(item.key) ?? item) ?? null);
    setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([key]) => !updated.has(key))));
    setSaveErrors(failures);
    setSaved(Object.keys(failures).length === 0);
    setSaving(false);
    if (updated.size) window.dispatchEvent(new Event(APP_ENTITLEMENTS_CHANGED));
  }

  useEffect(() => {
    let active = true;
    controlPlatformService.listOrganizationEntitlements(organizationId).then(
      (result) => {
        if (active) setItems(result);
      },
      (failure: unknown) => {
        if (active) setError(failure instanceof Error ? failure.message : "Unable to load entitlements");
      },
    );
    return () => {
      active = false;
    };
  }, [organizationId, reload]);

  if (error) {
    return (
      <div
        role="alert"
        className="flex items-center justify-between gap-3 rounded-lg border border-error/20 bg-error/5 p-4 text-sm text-error"
      >
        <p>{error}</p>
        <button
          type="button"
          className="cursor-pointer rounded-md px-3 py-2 font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          onClick={() => {
            setError("");
            setReload(reload + 1);
          }}
        >
          Retry
        </button>
      </div>
    );
  }
  if (!items)
    return (
      <div role="status" className="flex items-center gap-2 py-8 text-sm text-text-secondary">
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-brand" />
        Loading entitlements...
      </div>
    );

  return (
    <form
      noValidate
      aria-label="Organization entitlements"
      className="space-y-5 text-text-primary"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Entitlements</h2>
          <p className="mt-1 max-w-2xl text-sm text-text-secondary">
            Manage feature access and usage limits. Changes apply only to this organization, not its plan.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-brand-muted px-3 py-1 text-xs font-medium text-brand">
            {items.length} entitlements
          </span>
          <button
            type="submit"
            disabled={saving || changed.length === 0}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />}
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </header>
      {saved && (
        <p role="status" className="text-sm text-success">
          Entitlements updated.
        </p>
      )}
      {Object.values(saveErrors).some(Boolean) && (
        <p role="alert" className="text-sm text-error">
          Some changes could not be saved. Your remaining edits are preserved; save again to retry.
        </p>
      )}
      <p className="rounded-lg border border-border bg-surface-raised px-4 py-3 text-xs leading-relaxed text-text-secondary">
        All entitlements are shown, including disabled ones. Save applies all changed organization overrides.
      </p>
      {items.length === 0 ? (
        <p
          role="status"
          className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-text-secondary"
        >
          No entitlement definitions are available.
        </p>
      ) : (
        <div className="grid auto-rows-fr grid-cols-1 items-stretch gap-3 md:grid-cols-2 xl:grid-cols-4">
          {items.map((item) => (
            <OrganizationEntitlementCard
              key={item.key}
              item={item}
              draft={drafts[item.key] ?? { enabled: item.enabled, value: item.value?.toString() ?? "" }}
              saving={saving}
              valueError={fieldErrors[item.key] ?? ""}
              error={saveErrors[item.key] ?? ""}
              onChange={(draft) => change(item.key, draft)}
            />
          ))}
        </div>
      )}
    </form>
  );
}

function OrganizationEntitlementCard({
  item,
  draft,
  saving,
  valueError,
  error,
  onChange,
}: {
  item: PlatformOrganizationEntitlement;
  draft: Draft;
  saving: boolean;
  valueError: string;
  error: string;
  onChange: (draft: Draft) => void;
}) {
  const id = useId();
  const { enabled, value } = draft;

  return (
    <section
      role="group"
      aria-label={item.name}
      className="flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong"
    >
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex items-start gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-muted text-brand">
            {item.kind === "LIMIT" ? (
              <SlidersHorizontal aria-hidden="true" className="size-4" />
            ) : (
              <Layers aria-hidden="true" className="size-4" />
            )}
          </span>
          <div className="min-w-0">
            <h3 className="break-words text-sm font-semibold">{item.name}</h3>
            <p className="break-all text-xs text-text-secondary">{item.key}</p>
          </div>
        </div>
        {item.description && (
          <p className="break-words text-xs leading-relaxed text-text-secondary">{item.description}</p>
        )}
        <div className="flex items-center justify-between gap-3">
          <span className={`text-xs font-medium ${enabled ? "text-brand" : "text-text-secondary"}`}>
            {enabled ? "Enabled" : "Disabled"}
          </span>
          <label className="relative inline-flex shrink-0 cursor-pointer items-center">
            <input
              type="checkbox"
              aria-label={`Enable ${item.name}`}
              className="peer sr-only"
              checked={enabled}
              disabled={saving}
              onChange={(event) => {
                onChange({ ...draft, enabled: event.target.checked });
              }}
            />
            <span
              aria-hidden="true"
              className="h-6 w-11 rounded-full bg-border-strong transition-colors peer-checked:bg-brand peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
            />
            <span
              aria-hidden="true"
              className="absolute left-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform peer-checked:translate-x-5 peer-disabled:opacity-50"
            />
          </label>
        </div>
        {item.kind === "LIMIT" && (
          <div className="grid grid-cols-2 items-center gap-x-2 gap-y-1">
            <label htmlFor={`${id}-limit`} className="min-w-0 text-xs font-medium text-text-secondary">
              Limit{item.unit ? ` (${item.unit})` : ""}
              {enabled ? <span className="ml-1 text-error">*</span> : null}
            </label>
            <input
              id={`${id}-limit`}
              type="number"
              inputMode="numeric"
              min={0}
              max={2147483647}
              step={1}
              required={enabled}
              disabled={!enabled || saving}
              value={value}
              aria-invalid={Boolean(valueError)}
              aria-describedby={valueError ? `${id}-error` : undefined}
              className={`w-full rounded-md border bg-surface px-2 py-1.5 text-sm text-text-primary outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-text-muted ${valueError ? "border-error focus:border-error focus:ring-error/20" : "border-border-strong focus:border-brand focus:ring-brand/20"}`}
              onChange={(event) => {
                onChange({ ...draft, value: event.target.value });
              }}
            />
            {valueError && (
              <p id={`${id}-error`} role="alert" className="col-span-2 text-xs text-error">
                {valueError}
              </p>
            )}
          </div>
        )}
        {error && (
          <p role="alert" className="break-words text-xs text-error">
            {error}
          </p>
        )}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-surface-raised/50 px-3 py-2">
        <span className="text-xs text-text-secondary">{item.kind === "LIMIT" ? "Usage limit" : "Feature"}</span>
      </footer>
    </section>
  );
}
