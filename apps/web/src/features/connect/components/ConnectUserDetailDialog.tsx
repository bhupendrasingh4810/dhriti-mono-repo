"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { BadgeCheck, Building2, ChevronRight, Clock3, MessageSquare, Phone, Video, X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import type { ConnectUser } from "@/mocks/connect/types";
import ConnectUserDetailsCard, { ConnectUserAvatar } from "@/features/connect/components/ConnectUserDetailsCard";

type ConnectUserDetailDialogProps = {
  user: ConnectUser | null;
  usersById: Record<string, ConnectUser>;
  reportsToByUserId: Record<string, string>;
  viewerTimezone?: string;
  onClose: () => void;
  onMessage: (userId: string) => void;
  onStartCall: (userId: string, type: "audio" | "video") => void;
  onSelectUser: (userId: string) => void;
};

export function ConnectUserDetailDialog({
  user,
  usersById,
  reportsToByUserId,
  viewerTimezone,
  onClose,
  onMessage,
  onStartCall,
  onSelectUser,
}: ConnectUserDetailDialogProps) {
  const [tab, setTab] = useState<"overview" | "organization">("overview");
  const manager = user ? usersById[reportsToByUserId[user.id]] : undefined;
  const hierarchy = useMemo(() => {
    if (!user) return { above: [] as ConnectUser[], below: [] as ConnectUser[], coworkers: [] as ConnectUser[] };
    const above: ConnectUser[] = [];
    const visited = new Set<string>([user.id]);
    let next = reportsToByUserId[user.id];
    while (next && !visited.has(next)) {
      visited.add(next);
      const person = usersById[next];
      if (!person) break;
      above.push(person);
      next = reportsToByUserId[person.id];
    }
    const below = Object.values(usersById).filter((person) => reportsToByUserId[person.id] === user.id);
    const hierarchyIds = new Set([...above, ...below, user].map((person) => person.id));
    const coworkers = Object.values(usersById).filter(
      (person) => !hierarchyIds.has(person.id) && person.department === user.department,
    );
    return { above, below, coworkers };
  }, [reportsToByUserId, user, usersById]);

  if (!user) return null;

  return (
    <Dialog open onClose={onClose} title={user.displayName} secondaryActionLabel="" maxWidth="md" hideHeader>
      <div className="relative min-h-[500px]">
        <button
          type="button"
          aria-label="Close user details"
          onClick={onClose}
          className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-surface-raised"
        >
          <X size={18} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-4 rounded-xl border border-brand/20 bg-brand/5 p-4 pr-12">
          <ConnectUserAvatar avatar={user.avatar} displayName={user.displayName} className="size-16" />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-bold text-text-primary">{user.displayName}</h2>
            <p className="truncate text-sm text-text-secondary">
              {user.jobTitle || "Organization member"}{user.department ? ` · ${user.department}` : ""}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <ProfileAction label="Message" icon={<MessageSquare size={16} />} onClick={() => onMessage(user.id)} />
              <ProfileAction label="Organization" icon={<Building2 size={16} />} onClick={() => setTab("organization")} />
              <ProfileAction label="Start video call" icon={<Video size={16} />} onClick={() => onStartCall(user.id, "video")} />
              <ProfileAction label="Start audio call" icon={<Phone size={16} />} onClick={() => onStartCall(user.id, "audio")} />
            </div>
          </div>
        </div>
        <div className="my-5 inline-flex rounded-lg bg-surface-raised p-1">
          <Tab active={tab === "overview"} onClick={() => setTab("overview")}>Overview</Tab>
          <Tab active={tab === "organization"} onClick={() => setTab("organization")}>Organization</Tab>
        </div>
        {tab === "overview" ? (
          <div className="space-y-4">
            <section className="rounded-lg border border-brand/20 bg-brand/5 p-4">
              <div className="grid gap-3 sm:grid-cols-3">
              <OverviewDetail label="Department" value={user.department || "Not assigned"} />
              <OverviewDetail label="Location" value={user.location || "Not available"} />
              <OverviewDetail
                label="Timezone"
                value={user.timezone ? getTimezoneLabel(user.timezone, viewerTimezone) : "Not available"}
              />
              </div>
              <div className="mt-4 space-y-2 border-t border-brand/15 pt-3">
                <div className="flex items-center gap-2 text-brand">
                  <BadgeCheck size={16} aria-hidden="true" />
                  <p className="text-xs font-semibold">Status: {formatAvailability(user.status)}</p>
                </div>
                <div className="flex items-center gap-2 text-brand">
                  <Clock3 size={16} aria-hidden="true" />
                  <p className="text-xs">{user.timezone ? getTimezoneLabel(user.timezone, viewerTimezone) : "Timezone not available"}</p>
                </div>
              </div>
            </section>
            <div className="-mx-6">
            <ConnectUserDetailsCard
              avatar={user.avatar}
              displayName={user.displayName}
              jobTitle={user.jobTitle}
              email={user.email}
              phone={user.phone}
              location={user.location}
              timezone={user.timezone}
              viewerTimezone={viewerTimezone}
              reportsTo={manager ? { displayName: manager.displayName, jobTitle: manager.jobTitle } : undefined}
              onMessage={() => onMessage(user.id)}
              onStartCall={(type) => onStartCall(user.id, type)}
              onOpenDetails={() => setTab("organization")}
              showProfileHeader={false}
              fullWidth
              showMoreAction={false}
            />
            </div>
          </div>
        ) : (
          <div className="space-y-7">
            <section>
              <div className="mx-auto flex max-w-xs flex-col gap-2">
                {hierarchy.above.slice().reverse().map((person) => (
                  <OrganizationNode key={person.id} user={person} onClick={() => onSelectUser(person.id)} />
                ))}
                <OrganizationNode user={user} current />
                {hierarchy.below.map((person) => (
                  <OrganizationNode key={person.id} user={person} onClick={() => onSelectUser(person.id)} />
                ))}
              </div>
            </section>
            <OrganizationSection title={`${user.displayName} works with`}>
              {hierarchy.coworkers.length ? hierarchy.coworkers.map((person) => <CoworkerCard key={person.id} user={person} onClick={() => onSelectUser(person.id)} />) : <EmptyState label="No coworkers in this department." />}
            </OrganizationSection>
          </div>
        )}
      </div>
    </Dialog>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" onClick={onClick} className={`cursor-pointer rounded-md px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-surface text-brand shadow-sm" : "text-text-secondary hover:text-text-primary"}`}>{children}</button>;
}

function ProfileAction({ label, icon, onClick }: { label: string; icon: ReactNode; onClick: () => void }) {
  return <button type="button" aria-label={label} title={label} onClick={onClick} className="grid size-7 cursor-pointer place-items-center rounded text-text-secondary hover:bg-surface-raised hover:text-brand">{icon}</button>;
}

function OrganizationSection({ title, children }: { title: string; children: ReactNode }) {
  return <section><h3 className="mb-3 text-sm font-semibold text-text-primary">{title}</h3><div className="grid gap-x-6 gap-y-3 sm:grid-cols-3">{children}</div></section>;
}

function OrganizationNode({ user, current = false, onClick }: { user: ConnectUser; current?: boolean; onClick?: () => void }) {
  return <button type="button" onClick={onClick} disabled={!onClick} className={`flex cursor-pointer items-center gap-3 rounded-md border p-2.5 text-left ${current ? "border-brand/30 bg-brand/5" : "border-border hover:bg-surface-raised"} disabled:cursor-default`}><ConnectUserAvatar avatar={user.avatar} displayName={user.displayName} className="size-9" /><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-text-primary">{user.displayName}</span><span className="block truncate text-xs text-text-secondary">{user.jobTitle || "Organization member"}</span>{user.department ? <span className="block truncate text-xs text-text-secondary">{user.department}</span> : null}</span>{current ? <ChevronRight size={16} className="text-text-secondary" aria-hidden="true" /> : null}</button>;
}

function CoworkerCard({ user, onClick }: { user: ConnectUser; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="flex cursor-pointer items-center gap-2 text-left hover:text-brand"><ConnectUserAvatar avatar={user.avatar} displayName={user.displayName} className="size-9" /><span className="min-w-0"><span className="block truncate text-sm font-semibold text-text-primary">{user.displayName}</span><span className="block truncate text-xs text-text-secondary">{user.jobTitle || "Organization member"}</span></span></button>;
}

function OverviewDetail({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide text-brand">{label}</p><p className="mt-1 text-sm font-medium text-brand">{value}</p></div>;
}

function formatAvailability(status: ConnectUser["status"]) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function getTimezoneLabel(timezone: string, viewerTimezone?: string) {
  if (!viewerTimezone || viewerTimezone === timezone) return timezone;
  const now = new Date();
  const viewerTime = new Date(now.toLocaleString("en-US", { timeZone: viewerTimezone }));
  const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
  const difference = Math.round((userTime.getTime() - viewerTime.getTime()) / 60000);
  if (!difference) return `${timezone} · Same time as you`;
  const hours = Math.floor(Math.abs(difference) / 60);
  const minutes = Math.abs(difference) % 60;
  return `${timezone} · ${hours}h ${minutes}m ${difference > 0 ? "ahead" : "behind"}`;
}

function EmptyState({ label }: { label: string }) {
  return <p className="text-sm text-text-secondary">{label}</p>;
}
