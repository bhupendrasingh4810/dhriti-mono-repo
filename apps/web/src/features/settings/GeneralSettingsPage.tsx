"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import { appSettingsService, type ConnectUserSettings } from "@/services/app-settings.service";
import { SettingsField } from "./components/SettingsField";
import { SettingsLoadError, SettingsPageShell, SettingsSaveBar, SettingsStatus } from "./components/SettingsPageShell";
import { SettingsRow, SettingsSection, settingsInputClass } from "./components/SettingsSection";
import { SettingsSkeleton } from "./components/SettingsSkeleton";
import { GENERAL_SETTINGS_SECTIONS, STATUS_EXPIRY_OPTIONS, statusExpiryFromPreset } from "./personal-settings-schema";
import type { SettingsFieldConfig, SettingsOption } from "./settings-schema";
import { primeConnectUserSettings } from "./use-app-settings";
import { useSettingsForm } from "./use-settings-form";

const STATUS_FIELD: SettingsFieldConfig = {
  key: "manualStatus",
  kind: "select",
  label: "Status",
  description: "Automatic shows you as online while Connect is open.",
  nullLabel: "Automatic",
  options: [
    { value: "online", label: "Online" },
    { value: "away", label: "Away" },
    { value: "dnd", label: "Do not disturb" },
    { value: "offline", label: "Appear offline" },
  ],
};

const DEVICE_KINDS: Record<string, MediaDeviceKind> = {
  preferredMicrophoneId: "audioinput",
  preferredSpeakerId: "audiooutput",
  preferredCameraId: "videoinput",
};

/** Personal preferences for the signed-in user (status, composer, alerts, call devices). */
export default function GeneralSettingsPage() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const userId = user?.id;
  const form = useSettingsForm<ConnectUserSettings>({
    enabled: Boolean(organizationId && userId),
    identity: organizationId && userId ? `${organizationId}:${userId}` : null,
    load: () => appSettingsService.getConnectUser(organizationId as string),
    save: async (changes) => {
      const next = await appSettingsService.updateConnectUser(organizationId as string, changes);
      if (userId) primeConnectUserSettings(organizationId as string, next, userId);
      return next;
    },
    successMessage: "Your preferences have been saved.",
  });
  const devices = useMediaDevices();
  const draft = form.draft;

  function deviceOptions(key: string): SettingsOption[] {
    const kind = DEVICE_KINDS[key];
    const options = devices
      .filter((device) => device.kind === kind && device.deviceId && device.deviceId !== "default")
      .map((device, index) => ({ value: device.deviceId, label: device.label || `Device ${index + 1}` }));
    const saved = draft?.[key as keyof ConnectUserSettings];
    if (typeof saved === "string" && saved && !options.some((option) => option.value === saved)) {
      options.push({ value: saved, label: "Saved device (not connected)" });
    }
    return options;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void form.submit();
  }

  const expiry = draft?.manualStatusExpiresAt ? new Date(draft.manualStatusExpiresAt) : null;

  return (
    <SettingsPageShell
      scope="Personal account"
      title="General settings"
      description="Your own preferences for status, messaging, alerts, and calls."
    >
      {form.loading ? (
        <SettingsSkeleton sections={[2, 1, 3, 4]} />
      ) : form.loadError ? (
        <SettingsLoadError message={form.loadError} onRetry={form.retry} />
      ) : draft ? (
        <form onSubmit={onSubmit} className="space-y-6" aria-busy={form.saving}>
          <SettingsStatus success={form.success} error={form.error} />
          <SettingsSection id="status" title="Status" description="Let people know whether you're available.">
            <SettingsField
              field={STATUS_FIELD}
              value={draft.manualStatus}
              disabled={form.saving}
              onChange={(value) => {
                form.update("manualStatus", value);
                if (value === null) form.update("manualStatusExpiresAt", null);
              }}
            />
            <SettingsRow label="Clear status after" htmlFor="setting-status-expiry">
              <select
                id="setting-status-expiry"
                value={expiry ? "current" : ""}
                disabled={form.saving || !draft.manualStatus}
                onChange={(event) =>
                  event.target.value !== "current" &&
                  form.update("manualStatusExpiresAt", statusExpiryFromPreset(event.target.value))
                }
                className={settingsInputClass}
              >
                {expiry ? (
                  <option value="current">
                    {expiry.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </option>
                ) : null}
                {STATUS_EXPIRY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </SettingsRow>
          </SettingsSection>
          {GENERAL_SETTINGS_SECTIONS.map((section) => (
            <SettingsSection key={section.id} id={section.id} title={section.title} description={section.description}>
              {(section.fields as SettingsFieldConfig[]).map((field) => (
                <SettingsField
                  key={field.key}
                  field={field}
                  value={draft[field.key as keyof ConnectUserSettings]}
                  disabled={form.saving}
                  dynamicOptions={field.key in DEVICE_KINDS ? deviceOptions(field.key) : undefined}
                  onChange={(value) => form.update(field.key as keyof ConnectUserSettings, value)}
                />
              ))}
            </SettingsSection>
          ))}
          <SettingsSaveBar dirty={form.dirty} saving={form.saving} onDiscard={form.discard} />
        </form>
      ) : null}
    </SettingsPageShell>
  );
}

function useMediaDevices() {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  useEffect(() => {
    const mediaDevices = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    if (!mediaDevices?.enumerateDevices) return;
    let active = true;
    const refresh = () =>
      mediaDevices
        .enumerateDevices()
        .then((list) => active && setDevices(list))
        .catch(() => undefined);
    void refresh();
    mediaDevices.addEventListener?.("devicechange", refresh);
    return () => {
      active = false;
      mediaDevices.removeEventListener?.("devicechange", refresh);
    };
  }, []);
  return devices;
}
