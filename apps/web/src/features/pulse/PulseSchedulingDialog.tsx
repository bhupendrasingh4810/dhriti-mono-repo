"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, CalendarDays, CircleDot, Clock3, LockKeyhole, MapPin, Repeat2, UsersRound, Video, X } from "lucide-react";
import { Dialog } from "@dhriti/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { connectService, type ConnectOrganizationUser } from "@/services/connect.service";
import { pulseService, type PulseEventDetail } from "@/services/pulse.service";

export type PulseSchedulingDialogKind = "meeting" | "event";

type PulseSchedulingDialogProps = {
  kind: PulseSchedulingDialogKind;
  initialDate: Date;
  onClose: () => void;
  onCreated: () => void;
  eventToEdit?: PulseEventDetail | null;
};

type AttendeeChip = Pick<ConnectOrganizationUser, "id" | "name" | "email" | "avatarUrl">;

export function PulseSchedulingDialog({ kind, initialDate, onClose, onCreated, eventToEdit = null }: PulseSchedulingDialogProps) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id;
  const [allDay, setAllDay] = useState(eventToEdit?.isAllDay ?? false);
  const [onlineMeeting, setOnlineMeeting] = useState(eventToEdit?.isOnlineMeeting ?? kind === "meeting");
  const [activeTab, setActiveTab] = useState<"details" | "scheduling">("details");
  const [eventTitle, setEventTitle] = useState(eventToEdit?.title ?? "");
  const [eventTitleError, setEventTitleError] = useState("");
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const initialStartsAt = eventToEdit ? new Date(eventToEdit.startsAt) : initialDate;
  const initialEndsAt = eventToEdit ? new Date(eventToEdit.endsAt) : initialDate;
  const [startDate, setStartDate] = useState(formatDateInput(initialStartsAt));
  const [startTime, setStartTime] = useState(formatTimeInput(initialStartsAt, "09:00"));
  const [endTime, setEndTime] = useState(formatTimeInput(initialEndsAt, "09:30"));
  const [location, setLocation] = useState(eventToEdit?.location ?? "");
  const [details, setDetails] = useState(eventToEdit?.description ?? "");
  const [recurrence, setRecurrence] = useState(eventToEdit?.recurrenceRule ? "weekly" : "none");
  const [availability, setAvailability] = useState<"FREE" | "BUSY">(eventToEdit?.availability ?? "BUSY");
  const [reminderMinutes, setReminderMinutes] = useState("");
  const [privacy, setPrivacy] = useState<"DEFAULT" | "PRIVATE">("DEFAULT");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const dateValue = formatDateInput(initialDate);
  const title = eventToEdit ? (kind === "meeting" ? "Edit meeting" : "Edit event") : (kind === "meeting" ? "New meeting" : "New event");
  const saveLabel = eventToEdit ? "Save changes" : (kind === "meeting" ? "Save meeting" : "Save event");

  async function saveSchedule() {
    if (!eventTitle.trim()) {
      setEventTitleError("Title is required.");
      return;
    }

    if (!eventToEdit && kind === "meeting" && attendeeIds.length === 0) {
      setSaveError("Invite at least one required attendee before saving the meeting.");
      return;
    }

    if (!organizationId) {
      setSaveError("Your organization is unavailable. Refresh the page and try again.");
      return;
    }

    const startsAt = new Date(`${startDate}T${startTime}`);
    const endsAt = new Date(`${startDate}T${endTime}`);
    if (Number.isNaN(startsAt.valueOf()) || Number.isNaN(endsAt.valueOf()) || endsAt <= startsAt) {
      setSaveError("The end time must be after the start time.");
      return;
    }

    setEventTitleError("");
    setSaveError("");
    setSaving(true);
    try {
      const eventInput = {
        title: eventTitle.trim(),
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        description: details.trim() || undefined,
        location: location.trim() || undefined,
        isAllDay: allDay,
        recurrenceRule: recurrence === "weekly" ? "FREQ=WEEKLY" : undefined,
        availability,
        privacy,
        reminderMinutes: reminderMinutes ? Number(reminderMinutes) : undefined,
        isOnlineMeeting: onlineMeeting,
      };
      if (eventToEdit) {
        await pulseService.updateEvent(organizationId, eventToEdit.id, eventInput);
      } else if (kind === "meeting") {
        const calendars = await pulseService.listCalendars(organizationId);
        const calendar = calendars.find((item) => item.isDefault) ?? calendars[0]
          ?? await pulseService.createCalendar(organizationId, { name: "Calendar", isDefault: true });
        await pulseService.createMeeting(organizationId, { ...eventInput, calendarId: calendar.id, attendeeUserIds: attendeeIds });
      } else {
        const calendars = await pulseService.listCalendars(organizationId);
        const calendar = calendars.find((item) => item.isDefault) ?? calendars[0]
          ?? await pulseService.createCalendar(organizationId, { name: "Calendar", isDefault: true });
        await pulseService.createScheduledEvent(organizationId, { ...eventInput, calendarId: calendar.id, attendeeUserIds: attendeeIds });
      }
      onCreated();
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save this schedule item.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} title={title} hideHeader secondaryActionLabel="" maxWidth="xl">
      <div className="flex max-h-[calc(100vh-8rem)] flex-col">
        <header className="flex shrink-0 items-center justify-between border-b border-border pb-4">
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
          <button type="button" onClick={onClose} aria-label="Close dialog" className="grid size-9 cursor-pointer place-items-center rounded-md text-text-secondary hover:bg-surface-raised">
            <X aria-hidden="true" size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto py-5 pr-2">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="space-y-4">
              {activeTab === "scheduling" && kind === "meeting" ? (
                <SchedulingAssistant dateValue={dateValue} />
              ) : (
                <>
              <label className="flex flex-col gap-1.5 text-sm font-medium text-text-primary">
                <span>
                  Title <span aria-hidden="true" className="text-error">*</span>
                </span>
                <input
                  aria-describedby={eventTitleError ? "schedule-title-error" : undefined}
                  aria-invalid={Boolean(eventTitleError)}
                  aria-label="Title"
                  value={eventTitle}
                  onChange={(event) => {
                    setEventTitle(event.target.value);
                    if (eventTitleError) setEventTitleError("");
                  }}
                  placeholder="Add title"
                  className={`w-full rounded-md border bg-surface px-3 py-2.5 text-base font-semibold text-text-primary outline-none placeholder:text-text-muted ${
                    eventTitleError ? "border-error focus:border-error" : "border-border focus:border-brand"
                  }`}
                />
                {eventTitleError ? <span id="schedule-title-error" className="text-xs font-normal text-error">{eventTitleError}</span> : null}
              </label>
              <ScheduleField icon={<UsersRound aria-hidden="true" size={18} />}>
                <AttendeeCombobox
                  initialAttendees={eventToEdit?.attendees.filter((attendee) => !attendee.isOrganizer).map((attendee) => attendee.user) ?? []}
                  onChange={setAttendeeIds}
                />
              </ScheduleField>
              <ScheduleField icon={<Clock3 aria-hidden="true" size={18} />}>
                <div className="grid flex-1 gap-2 sm:grid-cols-[1fr_auto_1fr]">
                  <input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
                  <input aria-label="Start time" type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
                  <input aria-label="End time" type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text-primary" />
                </div>
              </ScheduleField>
              <div className="ml-8 flex items-center gap-3 text-sm text-text-secondary">
                <label className="inline-flex cursor-pointer items-center gap-2">
                  <input checked={allDay} onChange={(event) => setAllDay(event.target.checked)} type="checkbox" className="accent-brand" />
                  All day
                </label>
                <span>30 minutes</span>
              </div>
              {kind === "event" ? <EventSchedulingFields recurrence={recurrence} onRecurrenceChange={setRecurrence} availability={availability} onAvailabilityChange={setAvailability} reminderMinutes={reminderMinutes} onReminderChange={setReminderMinutes} privacy={privacy} onPrivacyChange={setPrivacy} /> : <RecurringField recurrence={recurrence} onChange={setRecurrence} />}
              <ScheduleField icon={<MapPin aria-hidden="true" size={18} />}>
                <input aria-label="Location" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Add a room or location" className="w-full bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary" />
              </ScheduleField>
              <ScheduleField icon={<Video aria-hidden="true" size={18} />}>
                <label className="inline-flex cursor-pointer items-center gap-3 text-sm font-medium text-text-primary">
                  <input checked={onlineMeeting} onChange={(event) => setOnlineMeeting(event.target.checked)} type="checkbox" className="accent-brand" />
                  Online meeting
                </label>
              </ScheduleField>
              <textarea aria-label="Details" value={details} onChange={(event) => setDetails(event.target.value)} placeholder={kind === "meeting" ? "Type details for this new meeting" : "Add details for this event"} className="min-h-44 w-full rounded-md border border-border bg-surface p-3 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand" />
                  <input aria-label="Agenda" placeholder="Add an agenda" className="w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-secondary focus:border-brand" />
                </>
              )}
            </div>
            {kind === "meeting" ? <MeetingOptions /> : <EventSchedulePreview date={initialDate} />}
          </div>
        </div>
        <footer className="flex shrink-0 justify-end gap-2 border-t border-border pt-4">
          {saveError ? <p role="alert" className="mr-auto self-center text-sm text-error">{saveError}</p> : null}
          <button type="button" onClick={onClose} className="cursor-pointer rounded-md px-4 py-2 text-sm font-medium text-text-secondary hover:bg-surface-raised">
            Cancel
          </button>
          <button type="button" disabled={saving} onClick={saveSchedule} className="cursor-pointer rounded-md bg-brand px-4 py-2 text-sm font-semibold text-text-inverse hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60">
            {saving ? "Saving..." : saveLabel}
          </button>
        </footer>
      </div>
    </Dialog>
  );
}

function TabButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className={`cursor-pointer border-b-2 pb-1 text-sm font-semibold ${active ? "border-brand text-brand" : "border-transparent text-text-secondary hover:text-text-primary"}`}>{children}</button>;
}

function ScheduleField({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <div className="flex items-center gap-3 rounded-md border border-border bg-surface px-3 py-2.5 text-text-secondary focus-within:border-brand"><span>{icon}</span>{children}</div>;
}

function RecurringField({ recurrence, onChange }: { recurrence: string; onChange: (value: string) => void }) {
  return (
    <ScheduleField icon={<Repeat2 aria-hidden="true" size={18} />}>
      <span className="text-sm font-medium text-text-primary">Recurring</span>
      <select aria-label="Recurring" value={recurrence} onChange={(event) => onChange(event.target.value)} className="ml-auto bg-transparent text-sm text-text-primary outline-none">
        <option value="none">Does not repeat</option>
        <option value="daily">Daily</option>
        <option value="weekly">Weekly</option>
      </select>
    </ScheduleField>
  );
}

function EventSchedulingFields({
  recurrence,
  onRecurrenceChange,
  availability,
  onAvailabilityChange,
  reminderMinutes,
  onReminderChange,
  privacy,
  onPrivacyChange,
}: {
  recurrence: string;
  onRecurrenceChange: (value: string) => void;
  availability: "FREE" | "BUSY";
  onAvailabilityChange: (value: "FREE" | "BUSY") => void;
  reminderMinutes: string;
  onReminderChange: (value: string) => void;
  privacy: "DEFAULT" | "PRIVATE";
  onPrivacyChange: (value: "DEFAULT" | "PRIVATE") => void;
}) {
  return (
    <>
      <RecurringField recurrence={recurrence} onChange={onRecurrenceChange} />
      <ScheduleField icon={<CircleDot aria-hidden="true" size={18} />}>
        <span className="text-sm font-medium text-text-primary">Availability</span>
        <select aria-label="Availability" value={availability} onChange={(event) => onAvailabilityChange(event.target.value as "FREE" | "BUSY")} className="ml-auto bg-transparent text-sm text-text-primary outline-none">
          <option value="FREE">Free</option>
          <option value="BUSY">Busy</option>
        </select>
      </ScheduleField>
      <ScheduleField icon={<Bell aria-hidden="true" size={18} />}>
        <span className="text-sm font-medium text-text-primary">Reminder</span>
        <select aria-label="Reminder" value={reminderMinutes} onChange={(event) => onReminderChange(event.target.value)} className="ml-auto bg-transparent text-sm text-text-primary outline-none">
          <option value="">Don&apos;t remind me</option>
          <option value="0">At time of event</option>
          <option value="5">5 minutes before</option>
          <option value="15">15 minutes before</option>
          <option value="30">30 minutes before</option>
        </select>
      </ScheduleField>
      <ScheduleField icon={<LockKeyhole aria-hidden="true" size={18} />}>
        <span className="text-sm font-medium text-text-primary">Privacy</span>
        <select aria-label="Privacy" value={privacy} onChange={(event) => onPrivacyChange(event.target.value as "DEFAULT" | "PRIVATE")} className="ml-auto bg-transparent text-sm text-text-primary outline-none">
          <option value="DEFAULT">Not private</option>
          <option value="PRIVATE">Private</option>
        </select>
      </ScheduleField>
    </>
  );
}

function AttendeeCombobox({
  initialAttendees,
  onChange,
}: {
  initialAttendees: AttendeeChip[];
  onChange: (attendeeIds: string[]) => void;
}) {
  const { user } = useAuth();
  const organizationId = user?.organization?.id ?? "";
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ConnectOrganizationUser[]>([]);
  const [selectedAttendees, setSelectedAttendees] = useState<AttendeeChip[]>(initialAttendees);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    const searchTerm = query.trim();

    if (!searchTerm) {
      setResults([]);
      setLoading(false);
      setError("");
      return;
    }

    if (!organizationId) {
      setResults([]);
      setError("Organization members are unavailable.");
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setLoading(true);
      setError("");
      void connectService
        .searchUsers(organizationId, searchTerm)
        .then((users) => {
          if (!cancelled) {
            setResults(users.filter((member) => !selectedAttendees.some((attendee) => attendee.id === member.id)));
          }
        })
        .catch((reason: unknown) => {
          if (!cancelled) {
            setResults([]);
            setError(reason instanceof Error ? reason.message : "Unable to search organization members.");
          }
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [organizationId, query, selectedAttendees]);

  function selectAttendee(member: ConnectOrganizationUser) {
    const remainingMembers = results.filter((result) => result.id !== member.id);

    setSelectedAttendees((current) => [...current, member]);
    onChange([...selectedAttendees, member].map((attendee) => attendee.id));
    setResults(remainingMembers);
    setDropdownOpen(remainingMembers.length > 0);
  }

  return (
    <div ref={comboboxRef} className="relative min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-1.5">
        {selectedAttendees.map((attendee) => (
          <span key={attendee.id} className="inline-flex items-center gap-1 rounded-full bg-brand-muted px-2 py-1 text-xs font-medium text-brand">
            {attendee.name}
            <button
              type="button"
              onClick={() => setSelectedAttendees((current) => {
                const next = current.filter((member) => member.id !== attendee.id);
                onChange(next.map((member) => member.id));
                return next;
              })}
              aria-label={`Remove ${attendee.name}`}
              className="grid size-4 cursor-pointer place-items-center rounded-full hover:bg-brand/10"
            >
              <X aria-hidden="true" size={12} />
            </button>
          </span>
        ))}
        <div className="flex min-w-36 flex-1">
          <input
            aria-autocomplete="list"
            aria-controls="attendee-search-results"
            aria-expanded={dropdownOpen && Boolean(query.trim())}
            role="combobox"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setDropdownOpen(Boolean(event.target.value.trim()));
            }}
            placeholder={selectedAttendees.length ? "Add another attendee" : "Invite required attendees"}
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-secondary"
          />
        </div>
      </div>
      {dropdownOpen && query.trim() ? (
        <div id="attendee-search-results" role="listbox" className="absolute inset-x-0 z-10 mt-2 max-h-60 overflow-y-auto rounded-lg border border-border bg-surface p-2 shadow-lg">
          {loading ? <p className="px-2 py-3 text-sm text-text-secondary">Searching organization members...</p> : null}
          {!loading && error ? <p role="alert" className="px-2 py-3 text-sm text-error">{error}</p> : null}
          {!loading && !error && results.length === 0 ? <p className="px-2 py-3 text-sm text-text-secondary">No organization members found.</p> : null}
          {!loading && !error
            ? results.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  role="option"
                  aria-selected="false"
                  onClick={() => selectAttendee(member)}
                  className="flex w-full cursor-pointer items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-surface-raised"
                >
                  {member.avatarUrl ? (
                    <img src={member.avatarUrl} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    <span className="grid size-8 place-items-center rounded-full bg-brand-muted text-xs font-semibold text-brand">
                      {member.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-text-primary">{member.name}</span>
                    <span className="block truncate text-xs text-text-secondary">{member.email}</span>
                  </span>
                </button>
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
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

function formatTimeInput(date: Date, fallback: string): string {
  if (Number.isNaN(date.valueOf())) return fallback;
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}
