"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { settingsChanges } from "./settings-schema";

/** Load/draft/save state shared by every settings form. */
export function useSettingsForm<T extends object>({
  enabled,
  identity,
  load,
  save,
  successMessage = "Settings saved.",
}: {
  enabled: boolean;
  identity: string | null;
  load: () => Promise<T>;
  save: (changes: Partial<T>) => Promise<T>;
  successMessage?: string;
}) {
  const [saved, setSaved] = useState<T | null>(null);
  const [draft, setDraft] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [loadedIdentity, setLoadedIdentity] = useState<string | null>(null);
  const identityRef = useRef(identity);

  useEffect(() => {
    identityRef.current = identity;
    if (!enabled || !identity) return;

    let active = true;
    load()
      .then((value) => {
        if (!active) return;
        setSaved(value);
        setDraft(value);
        setLoadError("");
        setError("");
        setSuccess("");
        setSaving(false);
        setLoadedIdentity(identity);
      })
      .catch((cause: unknown) => {
        if (active) {
          setSaving(false);
          setLoadedIdentity(identity);
          setLoadError(cause instanceof Error ? cause.message : "Unable to load settings.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // `load` is recreated each render; reload only when the tenant or retry changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, identity, attempt]);

  const currentIdentity = Boolean(enabled && identity && loadedIdentity === identity);
  const changes = useMemo(
    () => (currentIdentity && saved && draft ? settingsChanges(saved, draft) : {}),
    [currentIdentity, saved, draft],
  );
  const dirty = currentIdentity && Object.keys(changes).length > 0;

  const update = useCallback((key: keyof T, value: unknown) => {
    setSuccess("");
    setError("");
    setDraft((current) => (current ? { ...current, [key]: value } : current));
  }, []);

  async function submit() {
    if (!dirty || saving || !identity) return;
    const submittedIdentity = identity;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const next = await save(changes);
      if (identityRef.current !== submittedIdentity) return;
      setSaved(next);
      setDraft(next);
      setSuccess(successMessage);
    } catch (cause) {
      if (identityRef.current === submittedIdentity) {
        setError(cause instanceof Error ? cause.message : "Unable to save settings.");
      }
    } finally {
      if (identityRef.current === submittedIdentity) setSaving(false);
    }
  }

  return {
    saved: currentIdentity ? saved : null,
    draft: currentIdentity ? draft : null,
    loading: Boolean(enabled && identity && (loading || !currentIdentity)),
    loadError: currentIdentity ? loadError : "",
    saving: currentIdentity && saving,
    error: currentIdentity ? error : "",
    success: currentIdentity ? success : "",
    dirty,
    update,
    submit,
    discard: () => {
      setDraft(saved);
      setError("");
      setSuccess("");
    },
    retry: () => {
      setLoadError("");
      setLoading(true);
      setAttempt((value) => value + 1);
    },
  };
}
