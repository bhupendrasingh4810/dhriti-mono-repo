"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ConnectReactionUser, DetailIconName } from "@/types/connect.types";

type ConnectUserDetailsCardProps = {
  avatar: string;
  displayName: string;
  jobTitle: string;
  email?: string;
  phone?: string;
  location?: string;
  timezone?: string;
  viewerTimezone?: string;
  reportsTo?: { displayName: string; jobTitle: string };
  reactionContext?: { emoji: string; users: ConnectReactionUser[] };
};

function getTimezoneOffsetInMinutes(timezone: string, date: Date) {
  const localizedDate = new Date(date.toLocaleString("en-US", { timeZone: timezone }));
  return Math.round((localizedDate.getTime() - date.getTime()) / 60000);
}

function formatDuration(totalMinutes: number) {
  const absolute = Math.abs(totalMinutes);
  return `${String(Math.floor(absolute / 60)).padStart(2, "0")}:${String(absolute % 60).padStart(2, "0")}`;
}

function DetailIcon({ name, className = "" }: { name: DetailIconName; className?: string }) {
  const paths: Record<DetailIconName, ReactNode> = {
    chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    organization: <><rect x="4" y="3" width="16" height="6" rx="1" /><rect x="4" y="15" width="16" height="6" rx="1" /><path d="M12 9v6M8 12h8" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .8 2.9a2 2 0 0 1-.4 2.1L8.2 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.4 1.9.7 2.9.8a2 2 0 0 1 1.5 1.8Z" />,
    available: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    time: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    location: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2" /></>,
    chevronUp: <path d="m18 15-6-6-6 6" />,
    chevronDown: <path d="m6 9 6 6 6-6" />,
  };

  return <svg aria-hidden="true" className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default function ConnectUserDetailsCard({ avatar, displayName, jobTitle, email, phone, location, timezone, viewerTimezone, reportsTo, reactionContext }: ConnectUserDetailsCardProps) {
  const [showMore, setShowMore] = useState(false);
  const timezoneStatus = useMemo(() => {
    if (!timezone || !viewerTimezone) return "your time zone is 00:00 ahead";

    const now = new Date();
    const difference = getTimezoneOffsetInMinutes(viewerTimezone, now) - getTimezoneOffsetInMinutes(timezone, now);
    return difference === 0 ? "your time zone is 00:00 ahead" : `your time zone is ${formatDuration(difference)} ${difference > 0 ? "ahead" : "behind"}`;
  }, [timezone, viewerTimezone]);

  return (
    <div className="w-[390px] p-8">
      <div className="space-y-3.5">
        <div className="flex items-center gap-[18px]">
          <img src={avatar} alt="" className="h-[45px] w-[45px] rounded-full object-cover" />
          <div>
            <p className="text-sm font-extrabold text-gray-900">{displayName}</p>
            <p className="text-xs font-semibold text-gray-500">{jobTitle}</p>
          </div>
        </div>

        <div className="flex gap-[15px] py-3">
          {(["chat", "organization", "video", "phone"] as DetailIconName[]).map((name) => <button key={name} type="button" aria-label={name} className="rounded-md p-1.5 text-gray-600 hover:bg-slate-100"><DetailIcon name={name} className="h-6 w-6" /></button>)}
        </div>

        <div className="rounded-lg border border-green-100 bg-green-50 p-2.5">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><DetailIcon name="available" className="text-green-600" /><p className="text-xs font-bold leading-5 text-green-800">Available Freen untill 28-08 Work hours: 09:00 - 18:00</p></div>
            <div className="flex items-center gap-2"><DetailIcon name="time" className="text-gray-600" /><p className="text-xs leading-5 text-gray-600">{timezoneStatus}</p></div>
          </div>
        </div>

        <div>
          <p className="mb-1.5 mt-3 text-[10px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Contacts</p>
          <div className="space-y-1.5"><ContactRow icon="mail" value={email ?? "Not available"} /><ContactRow icon="phone" value={phone ?? "Not available"} /><ContactRow icon="location" value={location ?? "Not available"} /></div>
        </div>

        <button type="button" onClick={() => setShowMore((previous) => !previous)} className="flex items-center gap-0.5 pt-0.5 text-xs font-bold text-blue-600 cursor-pointer">
          Show more
        </button>

        {reactionContext && reactionContext.users.length > 0 ? <div className="border-t border-gray-100 pt-2.5">
          <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Reacted with {reactionContext.emoji}</p>
          <div className="space-y-1.5">{reactionContext.users.slice(0, 6).map((user) => <div key={user.id} className="flex items-center gap-2"><img src={user.avatar} alt="" className="h-[22px] w-[22px] rounded-full object-cover" /><div className="min-w-0"><p className="truncate text-xs font-bold text-gray-900">{user.displayName}</p><p className="truncate text-[11px] text-gray-500">{user.jobTitle}</p></div></div>)}</div>
        </div> : null}

        <div className="border-t border-gray-100 pt-2.5"><p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-gray-400">Reports To</p><p className="text-xs font-bold leading-5 text-gray-900">{reportsTo?.displayName ?? "Not assigned"}</p>{reportsTo?.jobTitle ? <p className="text-[11px] leading-5 text-gray-500">{reportsTo.jobTitle}</p> : null}</div>
      </div>
    </div>
  );
}

function ContactRow({ icon, value }: { icon: DetailIconName; value: string }) {
  return <div className="flex items-center gap-2 py-1.5"><DetailIcon name={icon} className="h-3.5 w-3.5 text-gray-500" /><p className="text-xs leading-[1.45] text-gray-700">{value}</p></div>;
}