"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  appSettingsService,
  type ConnectUserSettings,
  type NotificationPreference,
  type NotificationType,
} from "@/services/app-settings.service";
import { notificationsService } from "@/services/notifications.service";
import { SettingsField } from "./components/SettingsField";
import { SettingsLoadError, SettingsPageShell, SettingsSaveBar, SettingsStatus } from "./components/SettingsPageShell";
import { SettingsSection } from "./components/SettingsSection";
import { SettingsSkeleton } from "./components/SettingsSkeleton";
import { SettingsToggle } from "./components/SettingsToggle";
import { QUIET_HOURS_SECTION } from "./personal-settings-schema";
import type { SettingsFieldConfig } from "./settings-schema";
import { primeConnectUserSettings } from "./use-app-settings";
import { useSettingsForm } from "./use-settings-form";
import { defaultNotificationPreference, NOTIFICATION_SETTINGS_GROUPS } from "./notification-settings-schema";

export default function NotificationSettingsPage() {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const userId = user?.id;
  const quietHours = useSettingsForm<ConnectUserSettings>({
    enabled: Boolean(organizationId && userId),
    identity: organizationId && userId ? `${organizationId}:${userId}` : null,
    load: () => appSettingsService.getConnectUser(organizationId as string),
    save: async (changes) => {
      const next = await appSettingsService.updateConnectUser(organizationId as string, changes);
      if (userId) primeConnectUserSettings(organizationId as string, next, userId);
      return next;
    },
    successMessage: "Quiet hours saved.",
  });
  const preferences = useNotificationPreferences(organizationId, userId);
  const draft = quietHours.draft;
  const daysMissing = Boolean(draft?.quietHoursEnabled && draft.quietHoursDays.length === 0);
  const sameTimes = Boolean(draft?.quietHoursEnabled && draft.quietHoursStart === draft.quietHoursEnd);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!daysMissing && !sameTimes) void quietHours.submit();
  }

  const loading = quietHours.loading || preferences.loading;
  const loadError = quietHours.loadError || preferences.loadError;

  return (
    <SettingsPageShell
      scope="Personal account"
      title="Notification settings"
      description="Choose what you're notified about and when email can reach you."
    >
      {loading ? (
        <SettingsSkeleton sections={[...NOTIFICATION_SETTINGS_GROUPS.map((group) => group.events.length), 4]} />
      ) : loadError ? (
        <SettingsLoadError
          message={loadError}
          onRetry={() => {
            quietHours.retry();
            preferences.retry();
          }}
        />
      ) : (
        <>
          <SettingsStatus error={preferences.error} />
          <p className="text-sm text-text-secondary">
            Changes save immediately. Preferences control delivery when an event is submitted to the notification
            service; they do not enable new notification triggers.
          </p>
          {NOTIFICATION_SETTINGS_GROUPS.map((group) => (
            <SettingsSection
              key={group.id}
              id={`notifications-${group.id}`}
              title={group.title}
              description={
                group.events.some((event) => event.automaticDelivery)
                  ? "Events marked as not yet automatic can be configured ahead of delivery support."
                  : "Preferences are saved, but this app does not yet send these notifications automatically."
              }
            >
              <div className="hidden grid-cols-[1fr_5rem_5rem] gap-4 px-5 py-2 text-xs font-medium text-text-secondary sm:grid sm:px-6">
                <span>Type</span>
                <span className="text-center">In app</span>
                <span className="text-center">Email</span>
              </div>
              {group.events.map((item) => {
                const preference = preferences.byType[item.type] ?? defaultNotificationPreference(item.type);
                const busy = preferences.saving.has(item.type);
                return (
                  <div
                    key={item.type}
                    className="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[1fr_5rem_5rem] sm:px-6"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-text-primary">{item.label}</p>
                      <p className="mt-1 text-xs text-text-secondary">{item.description}</p>
                      {!item.automaticDelivery && group.events.some((event) => event.automaticDelivery) ? (
                        <p className="mt-1 text-xs text-text-muted">Not yet sent automatically</p>
                      ) : null}
                    </div>
                    {(["inApp", "email"] as const).map((channel) => (
                      <div key={channel} className="flex flex-col items-center gap-1">
                        <span className="text-xs text-text-secondary sm:hidden">
                          {channel === "inApp" ? "In app" : "Email"}
                        </span>
                        <SettingsToggle
                          label={`${group.title} ${item.label}: ${channel === "inApp" ? "in-app" : "email"} notifications`}
                          checked={preference[channel]}
                          disabled={busy}
                          onChange={(checked) => void preferences.save({ ...preference, [channel]: checked })}
                        />
                      </div>
                    ))}
                  </div>
                );
              })}
            </SettingsSection>
          ))}
          {draft ? (
            <form onSubmit={onSubmit} className="space-y-6" aria-busy={quietHours.saving}>
              <SettingsStatus
                success={quietHours.success}
                error={
                  quietHours.error || (sameTimes ? "Quiet hours must start and end at different times." : undefined)
                }
              />
              <SettingsSection
                id={QUIET_HOURS_SECTION.id}
                title={QUIET_HOURS_SECTION.title}
                description={QUIET_HOURS_SECTION.description}
              >
                {(QUIET_HOURS_SECTION.fields as SettingsFieldConfig[]).map((field) => (
                  <SettingsField
                    key={field.key}
                    field={field}
                    value={draft[field.key as keyof ConnectUserSettings]}
                    disabled={quietHours.saving || (field.dependsOn ? !draft.quietHoursEnabled : false)}
                    onChange={(value) => quietHours.update(field.key as keyof ConnectUserSettings, value)}
                  />
                ))}
              </SettingsSection>
              <SettingsSaveBar
                dirty={quietHours.dirty}
                saving={quietHours.saving}
                invalid={daysMissing || sameTimes}
                onDiscard={quietHours.discard}
              />
            </form>
          ) : null}
        </>
      )}
    </SettingsPageShell>
  );
}

function useNotificationPreferences(organizationId: string | undefined, userId: string | undefined) {
  const identity = organizationId && userId ? `${organizationId}:${userId}` : null;
  const [byType, setByType] = useState<Partial<Record<NotificationType, NotificationPreference>>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState<{ identity: string | null; types: Set<NotificationType> }>({
    identity: null,
    types: new Set(),
  });
  const [attempt, setAttempt] = useState(0);
  const [loadedIdentity, setLoadedIdentity] = useState<string | null>(null);
  const identityRef = useRef(identity);

  useEffect(() => {
    identityRef.current = identity;
    if (!organizationId || !userId || !identity) return;

    let active = true;
    notificationsService
      .listPreferences(organizationId)
      .then((rows) => {
        if (!active) return;
        const next: Partial<Record<NotificationType, NotificationPreference>> = {};
        for (const row of rows) next[row.type] = row;
        setByType(next);
        setLoadError("");
        setError("");
        setLoadedIdentity(identity);
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadedIdentity(identity);
          setLoadError(cause instanceof Error ? cause.message : "Unable to load notification settings.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [organizationId, userId, identity, attempt]);

  async function save(preference: NotificationPreference) {
    if (!organizationId || !identity) return;
    const submittedIdentity = identity;
    const previous = byType[preference.type];
    setError("");
    setByType((current) => ({ ...current, [preference.type]: preference }));
    setSaving((current) => {
      const types = current.identity === submittedIdentity ? new Set(current.types) : new Set<NotificationType>();
      types.add(preference.type);
      return { identity: submittedIdentity, types };
    });
    try {
      await notificationsService.upsertPreference(organizationId, {
        type: preference.type,
        inApp: preference.inApp,
        email: preference.email,
        push: preference.push,
      });
    } catch (cause) {
      if (identityRef.current === submittedIdentity) {
        setByType((current) => ({ ...current, [preference.type]: previous }));
        setError(cause instanceof Error ? cause.message : "Unable to save this notification setting.");
      }
    } finally {
      if (identityRef.current === submittedIdentity) {
        setSaving((current) => {
          if (current.identity !== submittedIdentity) return current;
          const types = new Set(current.types);
          types.delete(preference.type);
          return { identity: submittedIdentity, types };
        });
      }
    }
  }

  const isCurrentIdentity = loadedIdentity === identity;
  return {
    byType: isCurrentIdentity ? byType : {},
    loading: Boolean(identity) && (!isCurrentIdentity || loading),
    loadError: isCurrentIdentity ? loadError : "",
    error: isCurrentIdentity ? error : "",
    saving: isCurrentIdentity && saving.identity === identity ? saving.types : new Set<NotificationType>(),
    save,
    retry: () => {
      setLoadError("");
      setLoading(true);
      setAttempt((value) => value + 1);
    },
  };
}
