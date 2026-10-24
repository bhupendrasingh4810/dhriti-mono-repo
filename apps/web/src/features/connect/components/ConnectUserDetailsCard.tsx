"use client";

import { useMemo } from "react";
import type { ReactNode } from "react";
import { Building2, Copy, Mail, MapPin, MessageSquare, Phone, Video } from "lucide-react";
import type { ConnectReactionUser } from "@/types/connect.types";

export type ConnectUserDetailsCardProps = {
  avatar?: string;
  displayName: string;
  jobTitle?: string;
  email?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  viewerTimezone?: string;
  reportsTo?: { displayName: string; jobTitle?: string };
  reactionContext?: { emoji: string; users: ConnectReactionUser[] };
  onMessage?: () => void;
  onStartCall?: (type: "audio" | "video") => void;
  onOpenDetails?: () => void;
  showProfileHeader?: boolean;
  fullWidth?: boolean;
  showMoreAction?: boolean;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function ConnectUserAvatar({
  avatar,
  displayName,
  className = "size-11",
}: Pick<ConnectUserDetailsCardProps, "avatar" | "displayName"> & { className?: string }) {
  if (avatar) return <img src={avatar} alt="" className={`${className} shrink-0 rounded-full object-cover`} />;
  return (
    <span className={`${className} grid shrink-0 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand`}>
      {initials(displayName)}
    </span>
  );
}

function getTimezoneOffsetInMinutes(timezone: string, date: Date) {
  const localizedDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return Math.round((localizedDate.getTime() - date.getTime()) / 60000);
}

function timezoneStatus(timezone?: string, viewerTimezone?: string) {
  if (!timezone || !viewerTimezone) return null;
  const difference = getTimezoneOffsetInMinutes(viewerTimezone, new Date()) - getTimezoneOffsetInMinutes(timezone, new Date());
  if (!difference) return "Same time zone as you";
  const minutes = Math.abs(difference);
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m ${difference > 0 ? "ahead" : "behind"}`;
}

export default function ConnectUserDetailsCard({
  avatar,
  displayName,
  jobTitle,
  email,
  phone,
  location,
  timezone,
  viewerTimezone,
  reportsTo,
  reactionContext,
  onMessage,
  onStartCall,
  onOpenDetails,
  showProfileHeader = true,
  fullWidth = false,
  showMoreAction = true,
}: ConnectUserDetailsCardProps) {
  const localTime = useMemo(() => timezoneStatus(timezone, viewerTimezone), [timezone, viewerTimezone]);

  return (
    <div className={`${fullWidth ? "w-full" : "w-[390px] max-w-[calc(100vw-2rem)]"} p-4`}>
      <div className="space-y-4">
        {showProfileHeader ? (
          <section className="rounded-xl border border-brand/20 bg-brand/5 p-4">
            <div className="flex items-center gap-3">
              <ConnectUserAvatar avatar={avatar} displayName={displayName} className="size-14 border-2 border-surface" />
              <div className="min-w-0">
                <p className="truncate text-base font-bold text-text-primary">{displayName}</p>
                {jobTitle ? <p className="truncate text-sm text-text-secondary">{jobTitle}</p> : null}
              </div>
            </div>
            <div className="mt-4 grid grid-cols-4 gap-2">
              <ActionButton label="Message" icon={<MessageSquare size={18} />} onClick={onMessage} />
              <ActionButton label="Organization" icon={<Building2 size={18} />} onClick={onOpenDetails} />
              <ActionButton label="Video" icon={<Video size={18} />} onClick={() => onStartCall?.("video")} />
              <ActionButton label="Audio" icon={<Phone size={18} />} onClick={() => onStartCall?.("audio")} />
            </div>
          </section>
        ) : null}

        {localTime ? (
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface-raised px-3 py-2 text-xs text-text-secondary">
            <MapPin size={15} className="shrink-0 text-brand" aria-hidden="true" />
            {localTime}
          </div>
        ) : null}

        <section className="rounded-xl border border-border p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">Contact</p>
          <div className="space-y-2">
            <ContactRow icon={<Mail size={16} />} value={email} label="Email" copyable />
            <ContactRow icon={<Phone size={16} />} value={phone} label="Phone" copyable />
            <ContactRow icon={<MapPin size={16} />} value={location} label="Location" />
          </div>
          {showMoreAction ? (
            <button type="button" onClick={onOpenDetails} className="mt-3 cursor-pointer text-sm font-semibold text-brand hover:text-brand-dark">
              Show more
            </button>
          ) : null}
        </section>

        {reactionContext?.users.length ? (
          <section className="rounded-xl border border-border p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
              Reacted with {reactionContext.emoji}
            </p>
            <div className="space-y-2">
              {reactionContext.users.slice(0, 6).map((user) => (
                <div key={user.id} className="flex items-center gap-2">
                  <ConnectUserAvatar avatar={user.avatar} displayName={user.displayName} className="size-6" />
                  <p className="truncate text-xs font-medium text-text-primary">{user.displayName}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-xl border border-border p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">Reports to</p>
          <p className="mt-1 text-sm font-medium text-text-primary">{reportsTo?.displayName ?? "Not assigned"}</p>
          {reportsTo?.jobTitle ? <p className="text-xs text-text-secondary">{reportsTo.jobTitle}</p> : null}
        </section>

      </div>
    </div>
  );
}

function ActionButton({ label, icon, onClick }: { label: string; icon: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={!onClick}
      onClick={onClick}
      className="grid size-10 cursor-pointer place-items-center rounded-lg border border-border bg-surface text-text-secondary hover:border-brand/30 hover:bg-surface-raised hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
    >
      {icon}
    </button>
  );
}

function ContactRow({
  icon,
  value,
  label,
  copyable = false,
}: {
  icon: ReactNode;
  value?: string;
  label: string;
  copyable?: boolean;
}) {
  const available = value?.trim();
  return (
    <div className="flex items-center gap-2 rounded-md px-1 py-1 text-sm text-text-secondary hover:bg-surface-raised">
      <span aria-hidden="true">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{available ?? "Not available"}</span>
      {copyable && available ? (
        <button
          type="button"
          aria-label={`Copy ${label}`}
          title={`Copy ${label}`}
          onClick={() => void navigator.clipboard.writeText(available)}
          className="grid size-7 cursor-pointer place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-text-primary"
        >
          <Copy size={14} />
        </button>
      ) : null}
    </div>
  );
}
