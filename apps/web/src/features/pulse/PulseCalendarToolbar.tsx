"use client";

import { useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, PhoneCall, Plus } from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";

type PulseCalendarToolbarProps = {
  workingWeek: Date[];
  onToday: () => void;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
};

export function PulseCalendarToolbar({ workingWeek, onToday, onPreviousWeek, onNextWeek }: PulseCalendarToolbarProps) {
  const [connectMenuAnchor, setConnectMenuAnchor] = useState<HTMLButtonElement | null>(null);
  const firstDay = workingWeek[0];
  const lastDay = workingWeek.at(-1);
  const dateRange = firstDay && lastDay ? formatDateRange(firstDay, lastDay) : "";
  const connectMenuItems: ConnectCascadingMenuItem[] = [
    {
      id: "start-new-meeting",
      label: "Start new meeting",
      icon: <PhoneCall aria-hidden="true" size={16} strokeWidth={1.75} />,
      children: [
        {
          id: "start-new-meeting-form",
          label: "Start new meeting form",
          content: <StartMeetingForm />,
        },
      ],
    },
    {
      id: "join-with-id",
      label: "Join with an ID",
      icon: <PhoneCall aria-hidden="true" size={16} strokeWidth={1.75} />,
      children: [
        {
          id: "join-with-id-form",
          label: "Join with an ID form",
          content: <JoinMeetingForm />,
        },
      ],
    },
  ];

  return (
    <div className="flex items-center justify-between gap-1.5 border-b border-border bg-surface p-5">
      <div className="flex items-center gap-1.5">
        <button type="button" onClick={onToday} className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-primary">Today</button>
        <button type="button" onClick={onPreviousWeek} aria-label="Previous week" className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-raised">
          <ChevronLeft aria-hidden="true" />
        </button>
        <button type="button" onClick={onNextWeek} aria-label="Next week" className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-raised">
          <ChevronRight aria-hidden="true" />
        </button>
        <h2 className="text-lg font-extrabold text-text-primary">{dateRange}</h2>
      </div>
      <div className="flex items-center gap-1">
        {/* <button type="button" aria-label="Filter" className="cursor-pointer rounded-md border border-border p-1.5 text-text-secondary hover:bg-surface-raised">
          <Filter aria-hidden="true" />
        </button> */}
        <button
          type="button"
          onClick={(event) => setConnectMenuAnchor((current) => current ? null : event.currentTarget)}
          aria-expanded={Boolean(connectMenuAnchor)}
          aria-haspopup="menu"
          className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-brand bg-surface px-3 py-1.5 text-sm font-semibold text-brand hover:bg-brand-muted"
        >
          <PhoneCall aria-hidden="true" size={16} strokeWidth={1.75} />
          Connect now
          <ChevronDown aria-hidden="true" size={16} strokeWidth={1.75} />
        </button>
        <button type="button" className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-dark">
          <Plus aria-hidden="true" />
          New
        </button>
        {/* <button type="button" aria-label="More actions" className="cursor-pointer rounded-md p-1.5 text-text-secondary hover:bg-surface-raised">
          <MoreVertical aria-hidden="true" />
        </button> */}
      </div>
      <ConnectCascadingMenu
        anchorEl={connectMenuAnchor}
        open={Boolean(connectMenuAnchor)}
        onClose={() => setConnectMenuAnchor(null)}
        items={connectMenuItems}
        minWidth={280}
      />
    </div>
  );
}

function StartMeetingForm() {
  return (
    <form className="space-y-3 p-3" onSubmit={(event) => event.preventDefault()}>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
        Meeting name
        <input
          name="meetingName"
          type="text"
          className="rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </label>
      <button type="submit" className="w-full cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
        Start meeting
      </button>
    </form>
  );
}

function JoinMeetingForm() {
  return (
    <form className="space-y-3 p-3" onSubmit={(event) => event.preventDefault()}>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
        Meeting ID
        <input
          name="meetingId"
          required
          type="text"
          className="rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
        Meeting Password <span className="font-normal text-text-secondary">(optional)</span>
        <input
          name="meetingPassword"
          type="password"
          className="rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-text-primary outline-none focus:border-brand"
        />
      </label>
      <button type="submit" className="w-full cursor-pointer rounded-md bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
        Join meeting
      </button>
    </form>
  );
}

function formatDateRange(firstDay: Date, lastDay: Date): string {
  const firstMonth = firstDay.toLocaleDateString("default", { month: "long" });
  const lastMonth = lastDay.toLocaleDateString("default", { month: "long" });

  if (firstDay.getFullYear() === lastDay.getFullYear() && firstDay.getMonth() === lastDay.getMonth()) {
    return `${firstDay.getDate()} - ${lastDay.getDate()} ${lastMonth}, ${lastDay.getFullYear()}`;
  }

  if (firstDay.getFullYear() === lastDay.getFullYear()) {
    return `${firstDay.getDate()} ${firstMonth} - ${lastDay.getDate()} ${lastMonth}, ${lastDay.getFullYear()}`;
  }

  return `${firstDay.getDate()} ${firstMonth}, ${firstDay.getFullYear()} - ${lastDay.getDate()} ${lastMonth}, ${lastDay.getFullYear()}`;
}
