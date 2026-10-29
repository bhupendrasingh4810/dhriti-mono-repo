import type { ConnectOrganizationSettings } from "@/services/app-settings.service";

function isWithinWindow(createdAt: string, windowMinutes: number | null) {
  if (windowMinutes === null) return true;
  const sentAt = new Date(createdAt).getTime();
  if (Number.isNaN(sentAt)) return false;
  return Date.now() - sentAt <= windowMinutes * 60_000;
}

export function canEditOwnMessage(policy: ConnectOrganizationSettings | null, createdAt: string) {
  if (!policy) return !Number.isNaN(Date.parse(createdAt));
  return policy.messageEditingEnabled && isWithinWindow(createdAt, policy.messageEditWindowMinutes);
}

export function canDeleteOwnMessage(policy: ConnectOrganizationSettings | null, createdAt: string) {
  if (!policy) return !Number.isNaN(Date.parse(createdAt));
  return policy.messageDeletionEnabled && isWithinWindow(createdAt, policy.messageDeleteWindowMinutes);
}

export function allowedQuickReactions<T extends { emoji: string }>(
  policy: ConnectOrganizationSettings | null,
  defaults: readonly T[],
  toChoice: (emoji: string) => T,
): T[] {
  const allowed = policy?.allowedReactions ?? [];
  if (allowed.length === 0) return [...defaults];
  return allowed.slice(0, 6).map((emoji) => defaults.find((item) => item.emoji === emoji) ?? toChoice(emoji));
}
