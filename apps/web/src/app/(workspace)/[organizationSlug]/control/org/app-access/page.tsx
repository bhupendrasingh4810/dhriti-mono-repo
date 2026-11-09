"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { organizationAccessService, type OrganizationEffectiveEntitlement } from "@/services/organization-management.service";

export default function AppAccess() {
  const { organizationSlug } = useParams<{ organizationSlug: string }>();
  const [entitlements, setEntitlements] = useState<OrganizationEffectiveEntitlement[]>([]);
  const [error, setError] = useState("");
  const [savingKey, setSavingKey] = useState("");
  const [limitDrafts, setLimitDrafts] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    try {
      setEntitlements(await organizationAccessService.listEntitlements(organizationSlug));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load organization access.");
    }
  }, [organizationSlug]);
  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const setFeature = async (entitlement: OrganizationEffectiveEntitlement, enabled: boolean) => {
    setSavingKey(entitlement.key); setError("");
    try {
      await organizationAccessService.setEntitlementOverride(organizationSlug, { key: entitlement.key, enabled });
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update feature access.");
    } finally { setSavingKey(""); }
  };
  const setLimit = async (entitlement: OrganizationEffectiveEntitlement, value: number) => {
    if (!Number.isSafeInteger(value) || value < 0) { setError("Limits must be whole numbers greater than or equal to zero."); return; }
    setSavingKey(entitlement.key); setError("");
    try {
      await organizationAccessService.setEntitlementOverride(organizationSlug, { key: entitlement.key, enabled: true, value });
      await load();
      setLimitDrafts((current) => {
        const { [entitlement.key]: _savedDraft, ...remainingDrafts } = current;
        return remainingDrafts;
      });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update plan limit.");
    } finally { setSavingKey(""); }
  };
  const features = entitlements.filter(({ kind }) => kind === "FEATURE");
  const limits = entitlements.filter(({ kind }) => kind === "LIMIT");
  const saveLimitDraft = (entitlement: OrganizationEffectiveEntitlement) => {
    const draft = limitDrafts[entitlement.key];
    if (draft === undefined) return;
    if (draft.trim() === "") {
      setError("Limits must be whole numbers greater than or equal to zero.");
      return;
    }
    const savedValue = String(entitlement.value ?? 0);
    if (draft === savedValue) {
      setLimitDrafts((current) => {
        const { [entitlement.key]: _unchangedDraft, ...remainingDrafts } = current;
        return remainingDrafts;
      });
      return;
    }
    void setLimit(entitlement, Number(draft));
  };
  return <div className="space-y-6">
    <header><h1 className="text-2xl font-bold text-text-primary">App access & plan limits</h1><p className="mt-1 text-sm text-text-secondary">Effective plan access with organization-specific overrides.</p></header>
    {error && <p role="alert" className="rounded-md border border-error p-3 text-sm text-error">{error}</p>}
    <section className="overflow-hidden rounded-lg border border-border bg-surface"><div className="border-b border-border p-5"><h2 className="font-semibold text-text-primary">Features</h2></div><div className="divide-y divide-border">{features.map((entitlement) => <div key={entitlement.key} className="flex items-center justify-between gap-4 p-5"><div><p className="font-mono text-sm font-semibold text-text-primary">{entitlement.key}</p><p className="mt-1 text-xs text-text-muted">Available through the organization’s effective plan policy.</p></div><button type="button" disabled={savingKey === entitlement.key} onClick={() => void setFeature(entitlement, !entitlement.enabled)} className={`cursor-pointer rounded-md px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${entitlement.enabled ? "bg-brand text-white" : "border border-border text-text-secondary"}`}>{entitlement.enabled ? "Enabled" : "Disabled"}</button></div>)}</div></section>
    <section className="overflow-hidden rounded-lg border border-border bg-surface"><div className="border-b border-border p-5"><h2 className="font-semibold text-text-primary">Limits</h2></div><div className="divide-y divide-border">{limits.map((entitlement) => <div key={entitlement.key} className="flex items-center justify-between gap-4 p-5"><p className="font-mono text-sm font-semibold text-text-primary">{entitlement.key}</p><input aria-label={`${entitlement.key} limit`} type="number" min="0" value={limitDrafts[entitlement.key] ?? String(entitlement.value ?? 0)} disabled={savingKey === entitlement.key} onChange={(event) => setLimitDrafts((current) => ({ ...current, [entitlement.key]: event.target.value }))} onBlur={() => saveLimitDraft(entitlement)} className="w-28 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none focus:border-brand disabled:cursor-not-allowed" /></div>)}</div></section>
  </div>;
}
