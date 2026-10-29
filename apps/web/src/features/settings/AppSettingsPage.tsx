"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Dialog } from "@dhriti/ui";
import { useAuth } from "@/hooks/use-auth";
import {
  appSettingsPatch,
  appSettingsService,
  type AppSettingsKey,
  type AppSettingsMap,
} from "@/services/app-settings.service";
import { connectService } from "@/services/connect.service";
import { SettingsField } from "./components/SettingsField";
import { SettingsLoadError, SettingsPageShell, SettingsSaveBar, SettingsStatus } from "./components/SettingsPageShell";
import { SettingsSection } from "./components/SettingsSection";
import { SettingsSkeleton } from "./components/SettingsSkeleton";
import {
  APP_SETTINGS_CONFIG,
  validateSettingsDraft,
  validateSettingsField,
  type SettingsFieldConfig,
  type SettingsOption,
} from "./settings-schema";
import { primeAppSettings, useSettingsAccess } from "./use-app-settings";
import { requiresRetentionConfirmation } from "./app-settings-policies";
import { useSettingsForm } from "./use-settings-form";

/** Organization-wide settings page for one app, rendered from its config. */
export default function AppSettingsPage({ app }: { app: AppSettingsKey }) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const access = useSettingsAccess();
  const canManage = access.canManage === true;
  const [confirmRetention, setConfirmRetention] = useState(false);
  const config = APP_SETTINGS_CONFIG[app];
  const form = useSettingsForm<AppSettingsMap[AppSettingsKey]>({
    enabled: Boolean(organizationId),
    identity: organizationId ? `${organizationId}:${app}` : null,
    load: () => appSettingsService.get(organizationId as string, app),
    save: async (changes) => {
      const next = await appSettingsService.update(organizationId as string, app, appSettingsPatch(app, changes));
      primeAppSettings(organizationId as string, app, next);
      return next;
    },
    successMessage: `${config.title} saved.`,
  });
  const draft = form.draft as Record<string, unknown> | null;
  const saved = form.saved as Record<string, unknown> | null;
  const channelOptionsState = useConnectChannelOptions(app === "connect" && canManage ? organizationId : undefined);
  const fields = config.sections.flatMap((section) => section.fields as SettingsFieldConfig[]);
  const fieldInvalid = draft ? fields.some((field) => validateSettingsField(field, draft[field.key]) !== null) : false;
  const draftError = draft ? validateSettingsDraft(app, draft) : null;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (fieldInvalid || draftError) return;
    if (
      app === "connect" &&
      saved &&
      draft &&
      requiresRetentionConfirmation(
        saved as Pick<AppSettingsMap["connect"], "messageRetentionDays" | "recordingRetentionDays">,
        draft as Pick<AppSettingsMap["connect"], "messageRetentionDays" | "recordingRetentionDays">,
      )
    ) {
      setConfirmRetention(true);
      return;
    }
    void form.submit();
  }

  async function saveAfterRetentionConfirmation() {
    await form.submit();
    setConfirmRetention(false);
  }

  return (
    <SettingsPageShell
      scope="Organization settings"
      title={config.title}
      description={config.description}
      readOnly={access.canManage === false && !form.loading}
    >
      {access.loading ? (
        <p role="status" className="rounded-md border border-border bg-surface-raised p-3 text-sm text-text-secondary">
          Checking settings access…
        </p>
      ) : null}
      {access.error ? (
        <SettingsLoadError message="Unable to verify settings permissions." onRetry={access.retry} />
      ) : null}
      {channelOptionsState.error ? (
        <SettingsLoadError
          message="Unable to load public channels for the default-channel setting."
          onRetry={channelOptionsState.retry}
        />
      ) : null}
      {form.loading ? (
        <SettingsSkeleton sections={config.sections.map((section) => section.fields.length)} />
      ) : form.loadError ? (
        <SettingsLoadError message={form.loadError} onRetry={form.retry} />
      ) : draft ? (
        <form onSubmit={onSubmit} className="space-y-6" aria-busy={form.saving}>
          <SettingsStatus success={form.success} error={form.error || draftError || undefined} />
          {config.sections.map((section) => (
            <SettingsSection key={section.id} id={section.id} title={section.title} description={section.description}>
              {(section.fields as SettingsFieldConfig[]).map((field) => (
                <SettingsField
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  disabled={
                    !canManage ||
                    form.saving ||
                    (field.kind === "multiselect" &&
                      (channelOptionsState.loading || Boolean(channelOptionsState.error))) ||
                    (field.dependsOn ? !draft[field.dependsOn] : false)
                  }
                  dynamicOptions={field.kind === "multiselect" ? channelOptionsState.options : undefined}
                  onChange={(value) => form.update(field.key as never, value)}
                />
              ))}
            </SettingsSection>
          ))}
          {canManage ? (
            <SettingsSaveBar
              dirty={form.dirty}
              saving={form.saving}
              invalid={fieldInvalid || Boolean(draftError)}
              onDiscard={form.discard}
            />
          ) : null}
        </form>
      ) : null}
      <Dialog
        open={confirmRetention}
        onClose={() => setConfirmRetention(false)}
        title="Confirm retention change"
        primaryActionLabel="Confirm and save"
        onPrimaryAction={saveAfterRetentionConfirmation}
        primaryButtonColor="error"
        isSubmitting={form.saving}
      >
        <p className="text-sm text-text-secondary">
          Shortening or enabling message or recording retention may permanently delete older data. Changes have a
          24-hour grace period before they take effect.
        </p>
        <p className="text-sm text-text-secondary">
          Retention cleanup runs only when the server-side retention feature flag is enabled. Confirm only if this
          change is intended.
        </p>
      </Dialog>
    </SettingsPageShell>
  );
}

function useConnectChannelOptions(organizationId: string | undefined) {
  const [state, setState] = useState<{
    organizationId: string | undefined;
    options: SettingsOption[];
    loading: boolean;
    error: string | null;
  }>({ organizationId: undefined, options: [], loading: false, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!organizationId) return;
    let active = true;
    connectService
      .listChannels(organizationId)
      .then((channels) => {
        if (!active) return;
        setState({
          organizationId,
          loading: false,
          error: null,
          options: channels
            .filter((channel) => channel.type === "CHANNEL" && channel.visibility === "PUBLIC" && !channel.isArchived)
            .map((channel) => ({ value: channel.id, label: `#${channel.name}` })),
        });
      })
      .catch((cause: unknown) => {
        if (active) {
          setState({
            organizationId,
            options: [],
            loading: false,
            error: cause instanceof Error ? cause.message : "Unable to load channels.",
          });
        }
      });
    return () => {
      active = false;
    };
  }, [organizationId, attempt]);
  const current = state.organizationId === organizationId;
  return {
    options: current ? state.options : [],
    loading: Boolean(organizationId) && (!current || state.loading),
    error: current ? state.error : null,
    retry: () => setAttempt((value) => value + 1),
  };
}
