"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { permissionsService } from "@/services/permissions.service";

// One in-flight/cached request per organization, shared by every component using the hook.
const cache = new Map<string, Promise<string[]>>();

function load(organizationId: string, force = false) {
  if (force || !cache.has(organizationId)) {
    const request = permissionsService.mine(organizationId).catch((reason) => {
      cache.delete(organizationId);
      throw reason;
    });
    cache.set(organizationId, request);
  }
  return cache.get(organizationId)!;
}

/**
 * Single source of truth for UI visibility checks. `can` / `canAny` / `canAll` are false until the
 * permission list has loaded or if it failed, so restricted UI never flashes. This is a UX gate only;
 * the API enforces every permission independently.
 */
export function usePermissions() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [state, setState] = useState<{ organizationId?: string; permissions: ReadonlySet<string> }>({
    permissions: new Set(),
  });

  useEffect(() => {
    if (!organizationId) return;
    let cancelled = false;
    load(organizationId)
      .then((keys) => !cancelled && setState({ organizationId, permissions: new Set(keys) }))
      .catch(() => !cancelled && setState({ organizationId, permissions: new Set() }));
    return () => {
      cancelled = true;
    };
  }, [organizationId]);

  const ready = !!organizationId && state.organizationId === organizationId;
  const held = useMemo<ReadonlySet<string>>(() => (ready ? state.permissions : new Set<string>()), [ready, state.permissions]);
  const can = useCallback((key: string) => held.has(key), [held]);
  const canAny = useCallback((keys: readonly string[]) => keys.some((key) => held.has(key)), [held]);
  const canAll = useCallback((keys: readonly string[]) => keys.every((key) => held.has(key)), [held]);

  return {
    loading: !ready,
    permissions: held,
    can,
    canAny,
    canAll,
    refresh: async () => {
      if (!organizationId) return;
      setState({ organizationId, permissions: new Set(await load(organizationId, true)) });
    },
  };
}
