import type { NotificationType } from "@dhriti/types";
import {
  AtSign,
  Bell,
  CalendarDays,
  FileText,
  ListChecks,
  MessageCircle,
  NotebookPen,
  Phone,
  Shield,
  Star,
  UsersRound,
  type LucideIcon,
} from "lucide-react";

export type NotificationTone = "brand" | "info" | "success" | "warning" | "error";

export interface NotificationSource {
  app: string;
  icon: LucideIcon;
  tone: NotificationTone;
}

const SOURCES: Record<string, NotificationSource> = {
  NOTES: { app: "Notes", icon: NotebookPen, tone: "brand" },
  CONNECT: { app: "Connect", icon: MessageCircle, tone: "info" },
  PULSE: { app: "Pulse", icon: CalendarDays, tone: "warning" },
  FLOW: { app: "Flow", icon: ListChecks, tone: "success" },
  ATLAS: { app: "Atlas", icon: FileText, tone: "info" },
  CADENCE: { app: "Cadence", icon: Star, tone: "warning" },
  HRMS: { app: "HRMS", icon: UsersRound, tone: "success" },
  CONTROL: { app: "Control", icon: Shield, tone: "error" },
  SYSTEM: { app: "Dhriti", icon: Bell, tone: "brand" },
};

const TYPE_OVERRIDES: Partial<Record<NotificationType, NotificationSource>> = {
  MENTION: { app: "Connect", icon: AtSign, tone: "info" },
  CALL: { app: "Connect", icon: Phone, tone: "info" },
  ATLAS_MENTION: { app: "Atlas", icon: AtSign, tone: "info" },
};

const PREFIX_SOURCE: Record<string, keyof typeof SOURCES> = {
  NOTES: "NOTES",
  PULSE: "PULSE",
  FLOW: "FLOW",
  ATLAS: "ATLAS",
  CADENCE: "CADENCE",
  HRMS: "HRMS",
  CONTROL: "CONTROL",
};

const CONNECT_TYPES = new Set<NotificationType>(["MESSAGE", "DIRECT_MESSAGE", "COMMENT"]);
const PULSE_TYPES = new Set<NotificationType>(["MEETING_REMINDER"]);
const FLOW_TYPES = new Set<NotificationType>(["ASSIGNMENT", "DUE_DATE"]);

export function notificationSource(type: NotificationType): NotificationSource {
  const override = TYPE_OVERRIDES[type];
  if (override) return override;
  const prefix = PREFIX_SOURCE[type.split("_")[0] ?? ""];
  if (prefix) return SOURCES[prefix]!;
  if (CONNECT_TYPES.has(type)) return SOURCES.CONNECT!;
  if (PULSE_TYPES.has(type)) return SOURCES.PULSE!;
  if (FLOW_TYPES.has(type)) return SOURCES.FLOW!;
  return SOURCES.SYSTEM!;
}

// Full class strings so Tailwind can detect them at build time.
export const TONE_CLASSES: Record<NotificationTone, string> = {
  brand: "bg-brand/10 text-brand",
  info: "bg-info/10 text-info",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  error: "bg-error/10 text-error",
};

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function formatRelativeTime(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const diff = now.getTime() - date.getTime();
  if (diff < MINUTE) return "Just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}

export type NotificationGroupLabel = "Today" | "Yesterday" | "Earlier";

export function groupLabel(iso: string, now: Date = new Date()): NotificationGroupLabel {
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = new Date(iso).getTime();
  if (time >= startOfToday) return "Today";
  if (time >= startOfToday - DAY) return "Yesterday";
  return "Earlier";
}

export function groupNotifications<T extends { createdAt: string }>(
  items: T[],
  now: Date = new Date(),
): { label: NotificationGroupLabel; items: T[] }[] {
  const groups: { label: NotificationGroupLabel; items: T[] }[] = [];
  for (const item of items) {
    const label = groupLabel(item.createdAt, now);
    const last = groups.at(-1);
    if (last?.label === label) last.items.push(item);
    else groups.push({ label, items: [item] });
  }
  return groups;
}
