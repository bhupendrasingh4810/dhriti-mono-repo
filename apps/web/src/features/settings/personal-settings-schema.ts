import type { ConnectUserSettings } from "@/services/app-settings.service";
import { CALL_BACKGROUND_NAMES } from "@/features/connect/call-backgrounds";
import type { SettingsSectionConfig } from "./settings-schema";

export const STATUS_EXPIRY_OPTIONS = [
  { value: "", label: "Don't clear" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "240", label: "4 hours" },
  { value: "today", label: "End of today" },
  { value: "10080", label: "1 week" },
] as const;

/** Converts an expiry preset into an ISO timestamp, relative to `now`. */
export function statusExpiryFromPreset(preset: string, now = new Date()): string | null {
  if (!preset) return null;
  if (preset === "today") {
    const end = new Date(now);
    end.setHours(23, 59, 59, 0);
    return end.toISOString();
  }
  return new Date(now.getTime() + Number(preset) * 60_000).toISOString();
}

export const GENERAL_SETTINGS_SECTIONS: SettingsSectionConfig<ConnectUserSettings>[] = [
  {
    id: "messaging",
    title: "Messaging",
    description: "How the message composer behaves in Connect.",
    fields: [
      {
        key: "sendShortcut",
        kind: "select",
        label: "Send messages with",
        description: "The other combination inserts a new line.",
        options: [
          { value: "ENTER", label: "Enter" },
          { value: "MOD_ENTER", label: "Ctrl / ⌘ + Enter" },
        ],
      },
    ],
  },
  {
    id: "alerts",
    title: "Alerts and sounds",
    description: "Browser notifications and sounds on this account.",
    fields: [
      {
        key: "desktopNotificationsEnabled",
        kind: "toggle",
        label: "Desktop notifications",
        description: "Show a browser notification for new messages and calls.",
      },
      { key: "soundsEnabled", kind: "toggle", label: "Message sounds" },
      { key: "callRingtoneEnabled", kind: "toggle", label: "Ringtone for incoming calls" },
    ],
  },
  {
    id: "devices",
    title: "Calls",
    description: "Devices and effects to use when you join a call. You can still change them during a call.",
    fields: [
      { key: "preferredMicrophoneId", kind: "select", label: "Microphone", options: [], nullLabel: "System default" },
      { key: "preferredSpeakerId", kind: "select", label: "Speaker", options: [], nullLabel: "System default" },
      { key: "preferredCameraId", kind: "select", label: "Camera", options: [], nullLabel: "System default" },
      {
        key: "preferredBackground",
        kind: "select",
        label: "Background",
        options: CALL_BACKGROUND_NAMES.filter((name) => name !== "None").map((name) => ({ value: name, label: name })),
        nullLabel: "None",
      },
    ],
  },
];

export const QUIET_HOURS_SECTION: SettingsSectionConfig<ConnectUserSettings> = {
  id: "quiet-hours",
  title: "Quiet hours",
  description:
    "Pause Connect email notifications during these hours, in the time zone from your profile. Windows that cross midnight belong to the day they start.",
  fields: [
    { key: "quietHoursEnabled", kind: "toggle", label: "Enable quiet hours" },
    { key: "quietHoursStart", kind: "time", label: "From", dependsOn: "quietHoursEnabled" },
    { key: "quietHoursEnd", kind: "time", label: "Until", dependsOn: "quietHoursEnabled" },
    { key: "quietHoursDays", kind: "weekdays", label: "Days", dependsOn: "quietHoursEnabled" },
  ],
};
