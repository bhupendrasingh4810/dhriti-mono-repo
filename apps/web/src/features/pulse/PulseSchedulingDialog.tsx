"use client";

import { useState } from "react";
import { CalendarDays, Clock3, MapPin, Repeat2, UsersRound, Video, X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";

export type PulseSchedulingDialogKind = "meeting" | "event";

type PulseSchedulingDialogProps = {
  kind: PulseSchedulingDialogKind;
  initialDate: Date;
  onClose: () => void;
};

export function PulseSchedulingDialog({ kind, initialDate, onClose }: PulseSchedulingDialogProps) {
  const [allDay, setAllDay] = useState(false);
  const [onlineMeeting, setOnlineMeeting] = useState(kind === "meeting");
  const [activeTab, setActiveTab] = useState<"details" | "scheduling">("details");
  const dateValue = formatDateInput(initialDate);
  const title = kind === "meeting" ? "New meeting" : "New event";
  const saveLabel = kind === "meeting" ? "Save meeting" : "Save event";

  return (
    <Dialog open onClose={onClose} title={title} hideHeader secondaryActionLabel="" maxWidth="xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-md bg-brand-muted text-brand">
            <CalendarDays aria-hidden="true" size={18} />
          </span>
          <div>
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {/* {kind === "meeting" ? (
              <div className="mt-2 flex gap-4">
                <TabButton active={activeTab === "details"} onClick={() => setActiveTab("details")}>Details</TabButton>
                <TabButton active={activeTab === "scheduling"} onClick={() => setActiveTab("scheduling")}>Scheduling Assistant</TabButton>
              </div>
            ) : null} */}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-9 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-surface-raised">
            <X aria-hidden="true" size={18} />
          </button>
          {/* <button type="button" onClick={onClose} className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark">
            Save
          </button> */}
        </div>
      </div>

      <div className="grid gap-6 pt-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="space-y-4">
          {activeTab === "scheduling" && kind === "meeting" ? (
            <SchedulingAssistant dateValue={dateValue} />
          ) : (
            <>
              <input aria-label="Title" placeholder="Add title" className="w-full border-b-2 border-brand bg-transparent px-1 py-2 text-xl font-semibold text-text-primary outline-none placeholder:text-text-muted focus:border-brand-dark" />
              <ScheduleField icon={<UsersRound aria-hidden="true" size={18} />}>
                <input aria-label="Required attendees" placeholder="Invite required attendees" className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary" />
              </ScheduleField>
              <ScheduleField icon={<Clock3 aria-hidden="true" size={18} />}>
                <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <input aria-label="Start date" type="date" defaultValue={dateValue} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
                  <input aria-label="Start time" type="time" defaultValue="09:00" className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
                  <input aria-label="End time" type="time" defaultValue="09:30" className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
                </div>
              </ScheduleField>
              <div className="ml-8 flex items-center gap-3 text-sm text-text-secondary">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input checked={allDay} onChange={(event) => setAllDay(event.target.checked)} type="checkbox" className="accent-brand" />
                  All day
                </label>
                <span>30 minutes</span>
              </div>
              <ScheduleField icon={<Repeat2 aria-hidden="true" size={18} />}>
                <select aria-label="Repeat" defaultValue="none" className="bg-transparent text-sm text-text-primary outline-none">
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                </select>
              </ScheduleField>
              <ScheduleField icon={<MapPin aria-hidden="true" size={18} />}>
                <input aria-label="Location" placeholder="Add a room or location" className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary" />
              </ScheduleField>
              <ScheduleField icon={<Video aria-hidden="true" size={18} />}>
                <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-text-primary">
                  <input checked={onlineMeeting} onChange={(event) => setOnlineMeeting(event.target.checked)} type="checkbox" className="accent-brand" />
                  Online meeting
                </label>
              </ScheduleField>
              <textarea aria-label="Details" placeholder={kind === "meeting" ? "Type details for this new meeting" : "Add details for this event"} className="min-h-44 w-full rounded-md border border-border bg-surface p-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand" />
              <input aria-label="Agenda" placeholder="Add an agenda" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand" />
            </>
          )}
        </div>
        {kind === "meeting" ? <MeetingOptions /> : <EventSchedulePreview date={initialDate} />}
      </div>
      <div className="mt-6 flex justify-end border-t border-border pt-4">
        <button type="button" onClick={onClose} className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark">
          {saveLabel}
        </button>
      </div>
    </Dialog>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`cursor-pointer border-b-2 pb-1 text-sm font-semibold ${active ? "border-brand text-brand" : "border-transparent text-text-secondary hover:text-text-primary"}`}>{children}</button>;
}

function ScheduleField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-3 border-b border-border px-1 pb-3 text-text-secondary"><span>{icon}</span>{children}</div>;
}

function MeetingOptions() {
  return (
    <aside className="space-y-4 border-l border-border pl-6">
      <h3 className="font-semibold text-text-primary">Options</h3>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-secondary">
        Who can bypass the lobby?
        <select defaultValue="organization" className="rounded-md border border-border bg-surface px-3 py-2 text-text-primary">
          <option value="organization">People in my org and guests</option>
          <option value="everyone">Everyone</option>
        </select>
      </label>
      <label className="flex flex-col gap-1.5 text-sm font-medium text-text-secondary">
        Record and transcribe automatically
        <select defaultValue="off" className="rounded-md border border-border bg-surface px-3 py-2 text-text-primary">
          <option value="off">Off</option>
          <option value="on">On</option>
        </select>
      </label>
      <button type="button" className="cursor-pointer text-sm font-semibold text-brand hover:text-brand-dark">More options</button>
    </aside>
  );
}

function SchedulingAssistant({ dateValue }: { dateValue: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="font-semibold text-text-primary">Scheduling Assistant</h3>
      <p className="mt-1 text-sm text-text-secondary">Find a time that works for all required attendees.</p>
      <input type="date" defaultValue={dateValue} className="mt-4 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary" />
    </div>
  );
}

function EventSchedulePreview({ date }: { date: Date }) {
  return (
    <aside className="rounded-lg border border-border bg-surface-raised p-4">
      <h3 className="font-semibold text-text-primary">{date.toLocaleDateString("default", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</h3>
      <div className="mt-4 space-y-3">
        {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"].map((time) => (
          <div key={time} className="flex gap-3 text-xs text-text-secondary">
            <span className="w-10">{time}</span>
            <span className="h-5 flex-1 border-t border-border" />
          </div>
        ))}
      </div>
    </aside>
  );
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
