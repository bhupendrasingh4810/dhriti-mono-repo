import type { AppSettingsKey, AppSettingsMap, AppSettingsUpdateMap, ConnectOrganizationSettings } from "@dhriti/types";

/** Require acknowledgement when turning on retention or shortening its current period. */
export function requiresRetentionConfirmation(
  saved: Pick<AppSettingsMap["connect"], "messageRetentionDays" | "recordingRetentionDays">,
  draft: Pick<AppSettingsMap["connect"], "messageRetentionDays" | "recordingRetentionDays">,
) {
  return (["messageRetentionDays", "recordingRetentionDays"] as const).some((key) => {
    const next = draft[key];
    const current = saved[key];
    return typeof next === "number" && (current === null || (typeof current === "number" && next < current));
  });
}

/** Prevent response-only data from ever becoming a client-editable patch field. */
export function appSettingsPatch<K extends AppSettingsKey>(
  app: K,
  changes: Partial<AppSettingsMap[K]>,
): Partial<AppSettingsUpdateMap[K]> {
  if (app !== "connect") return changes as Partial<AppSettingsUpdateMap[K]>;
  const patch = { ...changes } as Partial<ConnectOrganizationSettings>;
  delete patch.retentionEnabledAt;
  return patch as Partial<AppSettingsUpdateMap[K]>;
}
