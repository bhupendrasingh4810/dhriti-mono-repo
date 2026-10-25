"use client";

import { MonitorUp, X } from "lucide-react";

type Presence = "online" | "away" | "busy" | "dnd" | "do_not_disturb" | "in-meeting" | "sharing" | "offline";

const details: Record<Presence, { label: string; className: string }> = {
  online: { label: "Online", className: "bg-success" },
  away: { label: "Away", className: "bg-presence-away" },
  busy: { label: "Busy", className: "bg-error" },
  dnd: { label: "Busy", className: "bg-error" },
  do_not_disturb: { label: "Busy", className: "bg-error" },
  "in-meeting": { label: "In meeting", className: "bg-error" },
  sharing: { label: "Sharing", className: "bg-error" },
  offline: { label: "Offline", className: "bg-surface-raised" },
};

export function ConnectPresenceIndicator({ presence = "offline" }: { presence?: Presence }) {
  const detail = details[presence];
  return (
    <span title={detail.label} className={`absolute -bottom-0.5 -right-0.5 grid h-2.5 w-2.5 place-items-center rounded-full ${detail.className}`}>
      {presence === "offline" ? <X size={8} aria-hidden="true" /> : presence === "sharing" ? <MonitorUp size={8} aria-hidden="true" /> : null}
    </span>
  );
}
