"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePermissions } from "@/hooks/use-permissions";
import {
  appSettingsService,
  type AppSettingsKey,
  type AppSettingsMap,
  type ConnectUserSettings,
} from "@/services/app-settings.service";
import {
  appSettingsCache,
  appSettingsKey,
  connectUserSettingsKey,
  type SettingsCacheSnapshot,
} from "./app-settings-cache";

function useCachedSettingsState<T>(
  key: string | null,
  load: () => Promise<T>,
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
} {
  const [snapshot, setSnapshot] = useState<{ key: string | null; state: SettingsCacheSnapshot }>({
    key: null,
    state: { value: undefined, error: null, loading: false },
  });
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!key) return;
    const unsubscribe = appSettingsCache.subscribe(key, load, (state) => setSnapshot({ key, state }));
    if (retryCount > 0) void appSettingsCache.refresh(key).catch(() => undefined);
    return unsubscribe;
    // Load functions are stable for a given key; retryCount explicitly requests a fresh read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, retryCount]);

  const current =
    snapshot.key === key
      ? snapshot.state
      : key
        ? appSettingsCache.getSnapshot(key)
        : ({ value: undefined, error: null, loading: false } satisfies SettingsCacheSnapshot);
  return {
    data: (current.value as T | undefined) ?? null,
    loading: current.loading,
    error: current.error,
    retry: () => {
      if (key) void appSettingsCache.refresh(key).catch(() => undefined);
      setRetryCount((count) => count + 1);
    },
  };
}

/** Organization settings for an app, shared across components. */
export function useAppSettingsState<K extends AppSettingsKey>(app: K) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  return useCachedSettingsState(organizationId ? appSettingsKey(organizationId, app) : null, () =>
    appSettingsService.get(organizationId as string, app),
  );
}

/** Backwards-compatible data-only accessor for feature policy checks. */
export function useAppSettings<K extends AppSettingsKey>(app: K): AppSettingsMap[K] | null {
  return useAppSettingsState(app).data;
}

/** The signed-in user's personal Connect preferences. */
export function useConnectUserSettingsState() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const userId = user?.id;
  return useCachedSettingsState(organizationId && userId ? connectUserSettingsKey(organizationId, userId) : null, () =>
    appSettingsService.getConnectUser(organizationId as string),
  );
}

/** Backwards-compatible data-only accessor for personal Connect preferences. */
export function useConnectUserSettings(): ConnectUserSettings | null {
  return useConnectUserSettingsState().data;
}

/** Push freshly saved settings to every mounted consumer without allowing stale requests to overwrite them. */
export function primeAppSettings<K extends AppSettingsKey>(organizationId: string, app: K, value: AppSettingsMap[K]) {
  appSettingsCache.prime(appSettingsKey(organizationId, app), value);
}

export function primeConnectUserSettings(organizationId: string, value: ConnectUserSettings, userId: string) {
  appSettingsCache.prime(connectUserSettingsKey(organizationId, userId), value);
}

/** Settings management capability, derived from the shared permission list (no dedicated API call). */
export function useSettingsAccess(): {
  canManage: boolean | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
} {
  const { loading, can, refresh } = usePermissions();
  return {
    canManage: loading ? null : can("organization.settings.manage"),
    loading,
    error: null,
    retry: () => void refresh().catch(() => undefined),
  };
}
