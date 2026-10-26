import {
  getDateKey,
} from "./pulse-calendar.data";
import { useState, type MouseEvent } from "react";
import { Check, ChevronDown, MessageCircle, PhoneCall, X } from "lucide-react";
import { ConnectCascadingMenu } from "@/components/shared/CascadingMenu";
import { useAuth } from "@/hooks/use-auth";
import { pulseService, type PulseEventDetail, type PulseSchedule, type PulseScheduleEvent } from "@/services/pulse.service";
import type { ConnectCascadingMenuItem } from "@/types/menu.types";
import { PulseSchedulingDialog } from "./PulseSchedulingDialog";

type PulseScheduleGridProps = {
  nowLinePosition: number;
  workingWeek: Date[];
  currentDayIndex: number;
  timeSlots: string[];
  workingDayStartHour: number;
  showCalendarEvents: boolean;
  showBirthdays: boolean;
  showHolidays: boolean;
  schedule: PulseSchedule | null;
  onScheduleChanged: () => void;
};

export function PulseScheduleGrid({
  nowLinePosition,
  workingWeek,
  currentDayIndex,
  timeSlots,
  workingDayStartHour,
  showCalendarEvents,
  showBirthdays,
  showHolidays,
  schedule,
  onScheduleChanged,
}: PulseScheduleGridProps) {
  const { user } = useAuth();
  const scheduleEvents = schedule?.events ?? [];
  const calendarEvents = showCalendarEvents ? scheduleEvents : [];
  const timedEvents = getTimedEventLayout(calendarEvents, workingWeek);
  const [detailAnchor, setDetailAnchor] = useState<HTMLElement | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<PulseEventDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [eventToEdit, setEventToEdit] = useState<PulseEventDetail | null>(null);

  async function openEventDetails(event: PulseScheduleEvent, anchor: HTMLElement) {
    const organizationId = user?.organization?.id;
    if (!organizationId) {
      setDetailError("Your organization is unavailable.");
      return;
    }

    setDetailAnchor(anchor);
    setDetailError("");
    try {
      setSelectedEvent(await pulseService.getEvent(organizationId, event.id));
    } catch (reason) {
      setSelectedEvent(null);
      setDetailError(reason instanceof Error ? reason.message : "Unable to load event details.");
    }
  }

  function closeEventDetails() {
    setDetailAnchor(null);
    setSelectedEvent(null);
    setDetailError("");
  }

  const detailMenuItems: ConnectCascadingMenuItem[] = [{
    id: "event-details",
    label: "Event details",
    content: selectedEvent
      ? <EventDetails event={selectedEvent} currentUserId={user?.id ?? ""} onChange={setSelectedEvent} onEdit={() => { setEventToEdit(selectedEvent); closeEventDetails(); }} onScheduleChanged={onScheduleChanged} />
      : <p role="alert" className="p-4 text-sm text-error">{detailError || "Loading event details..."}</p>,
  }];
  return (
    <div className="relative min-h-0 flex-1 overflow-auto">
      <div
        className="grid min-w-[980px] grid-rows-[56px_44px] auto-rows-[80px] bg-surface"
        style={{ gridTemplateColumns: `80px repeat(${workingWeek.length}, minmax(160px, 1fr))` }}
      >
        <div className="sticky top-0 z-3 grid place-items-center border-b border-r border-border bg-surface">
          <span className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-text-secondary">Time</span>
        </div>
        {workingWeek.map((date, index) => (
          <div
            key={date.toISOString()}
            className={`sticky top-0 z-3 grid place-items-center border-b border-border bg-surface ${
              index === currentDayIndex ? "text-brand" : "text-text-secondary"
            }`}
          >
            <span className="text-[13px] font-extrabold">
              {date.toLocaleDateString("default", { weekday: "short", day: "numeric" })}
            </span>
          </div>
        ))}

        <div className="grid place-items-center border-b border-r border-border">
          <span className="text-[11px] font-bold text-text-secondary">All Day</span>
        </div>
        {workingWeek.map((date, index) => {
          const dateKey = getDateKey(date);
          const holidays = showHolidays ? (schedule?.holidays ?? []).filter((holiday) => isOnDate(holiday.startDate, dateKey)) : [];
          const birthdayEntries = showBirthdays ? (schedule?.birthdays ?? []).filter((birthday) => isOnDate(birthday.date, dateKey)) : [];
          const leaves = (schedule?.leaves ?? []).filter((leave) => isOnDate(leave.startDate, dateKey));
          const allDayEvents = calendarEvents.filter((event) => event.isAllDay && isOnDate(event.startsAt, dateKey));

          return (
            <div key={`all-day-${date.toISOString()}`} className={`border-b border-border p-0.75 ${index < workingWeek.length - 1 ? "border-r" : ""}`}>
              {holidays.map((holiday) => (
                <p key={holiday.id} className="border border-warning bg-warning/10 px-1 py-0.65 text-[11px] font-bold text-warning">
                  {holiday.title}
                </p>
              ))}
              {birthdayEntries.map((birthday) => (
                <p key={birthday.id} className="border border-info bg-info/10 px-1 py-0.65 text-[11px] font-bold text-info">
                  {birthday.title}
                </p>
              ))}
              {leaves.map((leave) => (
                <p key={leave.id} className="border border-error bg-error/10 px-1 py-0.65 text-[11px] font-bold text-error">
                  {leave.user.name} - leave
                </p>
              ))}
              {allDayEvents.map((event) => (
                <ScheduleCard
                  key={event.id}
                  event={event}
                  onClick={(clickEvent) => void openEventDetails(event, clickEvent.currentTarget)}
                />
              ))}
            </div>
          );
        })}

        {timeSlots.map((slot) => (
          <div key={slot} className="contents">
            <div className="border-b border-r border-border p-1">
              <span className="text-[11px] font-bold text-text-secondary">{slot}</span>
            </div>
            {workingWeek.map((date, columnIndex) => (
              <div
                key={`${slot}-${date.toISOString()}`}
                className={`relative border-b border-border ${columnIndex < workingWeek.length - 1 ? "border-r" : ""}`}
              />
            ))}
          </div>
        ))}

        {timedEvents.map(({ event, day, startsAt, endsAt, column, columnCount }) => {
          const top = 56 + 44 + ((startsAt.getHours() + startsAt.getMinutes() / 60) - workingDayStartHour) * 80;
          const durationHours = (endsAt.valueOf() - startsAt.valueOf()) / 3_600_000;
          const columnOffset = day * columnCount + column;
          return (
            <button
              type="button"
              onClick={(clickEvent) => void openEventDetails(event, clickEvent.currentTarget)}
              key={event.id}
              className={`absolute z-2 cursor-pointer overflow-hidden rounded-md border-l-4 p-1 text-left ${eventToneClasses(event)}`}
              style={{
                top,
                left: `calc(80px + (${columnOffset} * (100% - 80px) / ${workingWeek.length} / ${columnCount}) + 4px)`,
                width: `calc((100% - 80px) / ${workingWeek.length} / ${columnCount} - 8px)`,
                height: Math.max(durationHours * 80 - 8, 48),
              }}
            >
              <p className="truncate text-[11px] font-extrabold leading-[1.25]">{event.title}</p>
              {event.cancelledAt ? <p className="mt-0.25 text-[10px] font-bold uppercase">Cancelled</p> : null}
              <p className="mt-0.25 text-[10px] text-text-secondary">{startsAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</p>
              <p className="mt-0.2 truncate text-[10px] text-text-muted">{event.location}</p>
            </button>
          );
        })}

        {currentDayIndex >= 0 ? <div
          className="absolute z-4 h-0.5 bg-error"
          style={{
            left: `calc(80px + (${currentDayIndex} * (100% - 80px) / ${workingWeek.length}))`,
            width: `calc((100% - 80px) / ${workingWeek.length})`,
            top: 56 + 44 + nowLinePosition,
          }}
        >
          <span className="absolute -left-1 -top-1 size-2 rounded-full bg-error" />
        </div> : null}
      </div>
      <ConnectCascadingMenu
        anchorEl={detailAnchor}
        open={Boolean(detailAnchor)}
        onClose={closeEventDetails}
        items={detailMenuItems}
        minWidth={380}
      />
      {eventToEdit ? (
        <PulseSchedulingDialog
          kind={eventToEdit.kind === "MEETING" ? "meeting" : "event"}
          initialDate={new Date(eventToEdit.startsAt)}
          eventToEdit={eventToEdit}
          onClose={() => setEventToEdit(null)}
          onCreated={() => {
            setEventToEdit(null);
            onScheduleChanged();
          }}
        />
      ) : null}
    </div>
  );
}

function isOnDate(value: string, dateKey: string) {
  return getDateKey(new Date(value)) === dateKey;
}

function eventToneClasses(event: PulseScheduleEvent) {
  if (event.cancelledAt) return "border-error bg-error/10 text-error opacity-70";
  if (event.kind === "MEETING" && event.recurrenceRule) return "border-success bg-success/10 text-success";
  if (event.kind === "MEETING") return "border-warning bg-warning/10 text-warning";
  return "border-info bg-info/10 text-info";
}

function ScheduleCard({ event, onClick }: { event: PulseScheduleEvent; onClick: (event: MouseEvent<HTMLButtonElement>) => void }) {
  return <button type="button" onClick={onClick} className={`mb-1 w-full cursor-pointer border px-1 py-0.65 text-left text-[11px] font-bold ${eventToneClasses(event)}`}>{event.title}{event.cancelledAt ? " (Cancelled)" : ""}</button>;
}

function EventDetails({
  event,
  currentUserId,
  onChange,
  onEdit,
  onScheduleChanged,
}: {
  event: PulseEventDetail;
  currentUserId: string;
  onChange: (event: PulseEventDetail) => void;
  onEdit: () => void;
  onScheduleChanged: () => void;
}) {
  const { user } = useAuth();
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [showResponseMenu, setShowResponseMenu] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [savingResponse, setSavingResponse] = useState(false);
  const [responseError, setResponseError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const organizer = event.attendees.find((attendee) => attendee.isOrganizer);
  const currentAttendee = event.attendees.find((attendee) => attendee.userId === currentUserId);
  const isOrganizer = event.createdById === currentUserId;
  const responseCounts = event.attendees.reduce(
    (counts, attendee) => {
      if (!attendee.isOrganizer) counts[attendee.status] += 1;
      return counts;
    },
    { ACCEPTED: 0, DECLINED: 0, PENDING: 0, TENTATIVE: 0 } as Record<string, number>,
  );
  const invitedNames = event.attendees.filter((attendee) => !attendee.isOrganizer).map((attendee) => attendee.user.name);
  const start = new Date(event.startsAt);
  const end = new Date(event.endsAt);

  async function respond(status: "ACCEPTED" | "DECLINED" | "PENDING", reason?: string) {
    const organizationId = user?.organization?.id;
    if (!organizationId) {
      setResponseError("Your organization is unavailable.");
      return;
    }

    setSavingResponse(true);
    setResponseError("");
    try {
      await pulseService.rsvp(organizationId, event.id, status, reason);
      onChange({
        ...event,
        attendees: event.attendees.map((attendee) =>
          attendee.userId === currentUserId
            ? { ...attendee, status, declineReason: status === "DECLINED" ? reason?.trim() || null : null }
            : attendee,
        ),
      });
      setShowDeclineForm(false);
      setShowResponseMenu(false);
      setDeclineReason("");
    } catch (reason) {
      setResponseError(reason instanceof Error ? reason.message : "Unable to update your response.");
    } finally {
      setSavingResponse(false);
    }
  }

  function openConversation() {
    if (!event.connectChannelId) return;
    const connectPath = window.location.pathname.replace(/\/pulse\/?$/, "/connect");
    window.location.assign(`${connectPath}?conversation=${encodeURIComponent(event.connectChannelId)}`);
  }

  async function cancelEvent() {
    const organizationId = user?.organization?.id;
    if (!organizationId) {
      setResponseError("Your organization is unavailable.");
      return;
    }

    setCancelling(true);
    setResponseError("");
    try {
      await pulseService.cancelEvent(organizationId, event.id);
      onChange({ ...event, cancelledAt: new Date().toISOString() });
      onScheduleChanged();
    } catch (reason) {
      setResponseError(reason instanceof Error ? reason.message : "Unable to cancel this event.");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <section className="max-h-[min(70vh,620px)] overflow-y-auto p-4 text-sm text-text-primary">
      <h3 className="pr-6 text-base font-bold">{event.title}</h3>
      {event.cancelledAt ? <p className="mt-1 font-semibold text-error">Cancelled</p> : null}
      {event.isOnlineMeeting || event.meetingUrl ? (
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => event.meetingUrl ? window.open(event.meetingUrl, "_blank", "noopener,noreferrer") : openConversation()} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-brand px-3 py-1.5 font-semibold text-text-inverse hover:bg-brand-dark">
            <PhoneCall size={15} aria-hidden="true" /> Join
          </button>
          {event.connectChannelId ? <button type="button" onClick={openConversation} className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-semibold hover:bg-surface-raised">
            <MessageCircle size={15} aria-hidden="true" /> Chat
          </button> : null}
        </div>
      ) : null}
      <dl className="mt-4 space-y-3">
        <DetailRow label="Date and time" value={`${start.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}, ${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} - ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`} />
        {event.location ? <DetailRow label="Location" value={event.location} /> : null}
      </dl>
      <div className="mt-4 border-t border-border pt-3">
        <p className="font-semibold">{isOrganizer ? organizerSummary(invitedNames) : `${organizer?.user.name ?? "The organizer"} invited you.`}</p>
        <p className="mt-1 text-xs text-text-secondary">
          {responseCounts.ACCEPTED} accepted · {responseCounts.DECLINED} declined · {responseCounts.PENDING + responseCounts.TENTATIVE} didn't respond
        </p>
      </div>
      {event.description ? <div className="mt-4 border-t border-border pt-3"><p className="font-semibold">Details</p><p className="mt-1 whitespace-pre-wrap text-text-secondary">{event.description}</p></div> : null}
      {isOrganizer && !event.cancelledAt ? <div className="mt-4 flex gap-2 border-t border-border pt-3"><button type="button" onClick={onEdit} className="cursor-pointer rounded-md border border-border px-3 py-1.5 font-semibold hover:bg-surface-raised">Edit {event.kind.toLowerCase()}</button><button type="button" disabled={cancelling} onClick={() => void cancelEvent()} className="cursor-pointer rounded-md border border-error px-3 py-1.5 font-semibold text-error hover:bg-error/10 disabled:opacity-60">{cancelling ? "Cancelling..." : `Cancel ${event.kind.toLowerCase()}`}</button></div> : null}
      {!isOrganizer && currentAttendee && !event.cancelledAt ? (
        <div className="mt-4 border-t border-border pt-3">
          {currentAttendee.status === "PENDING" || currentAttendee.status === "TENTATIVE" ? (
            <div className="flex gap-2">
              <button type="button" disabled={savingResponse} onClick={() => void respond("ACCEPTED")} className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-brand px-3 py-1.5 font-semibold text-text-inverse hover:bg-brand-dark disabled:opacity-60"><Check size={15} aria-hidden="true" /> Accept</button>
              <button type="button" disabled={savingResponse} onClick={() => setShowDeclineForm(true)} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-error px-3 py-1.5 font-semibold text-error hover:bg-error/10 disabled:opacity-60"><X size={15} aria-hidden="true" /> Decline</button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1 font-semibold">{currentAttendee.status === "ACCEPTED" ? <Check className="text-success" size={16} aria-hidden="true" /> : <X className="text-error" size={16} aria-hidden="true" />}{currentAttendee.status === "ACCEPTED" ? "Accepted" : "Declined"}</span>
              <button type="button" onClick={() => setShowResponseMenu((open) => !open)} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-border px-3 py-1.5 font-semibold hover:bg-surface-raised">Change <ChevronDown size={14} aria-hidden="true" /></button>
            </div>
          )}
          {showResponseMenu ? <div className="mt-3 flex gap-2 rounded-md border border-border p-3"><button type="button" disabled={savingResponse} onClick={() => void respond("ACCEPTED")} className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-brand px-3 py-1.5 font-semibold text-text-inverse disabled:opacity-60"><Check size={15} aria-hidden="true" /> Accept</button><button type="button" disabled={savingResponse} onClick={() => { setShowResponseMenu(false); setShowDeclineForm(true); }} className="inline-flex cursor-pointer items-center gap-1 rounded-md border border-error px-3 py-1.5 font-semibold text-error disabled:opacity-60"><X size={15} aria-hidden="true" /> Decline</button></div> : null}
          {showDeclineForm ? <div className="mt-3 space-y-2 rounded-md border border-border p-3"><label className="flex flex-col gap-1 font-medium">Reason to decline <span className="font-normal text-text-secondary">(optional)</span><textarea value={declineReason} onChange={(input) => setDeclineReason(input.target.value)} className="min-h-20 rounded-md border border-border bg-surface p-2 text-sm outline-none focus:border-brand" /></label><button type="button" disabled={savingResponse} onClick={() => void respond("DECLINED", declineReason)} className="cursor-pointer rounded-md bg-error px-3 py-1.5 font-semibold text-text-inverse disabled:opacity-60">Decline</button></div> : null}
          {responseError ? <p role="alert" className="mt-2 text-xs text-error">{responseError}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-text-secondary">{label}</dt><dd className="mt-0.5">{value}</dd></div>;
}

function organizerSummary(names: string[]) {
  if (names.length === 0) return "You did not invite anyone.";
  const displayedNames = names.slice(0, 2).join(", ");
  const remainingCount = names.length - 2;
  return `You invited ${displayedNames}${remainingCount > 0 ? ` and ${remainingCount} more` : ""}.`;
}

type PositionedEvent = {
  event: PulseScheduleEvent;
  day: number;
  startsAt: Date;
  endsAt: Date;
  column: number;
  columnCount: number;
};

function getTimedEventLayout(events: PulseScheduleEvent[], workingWeek: Date[]): PositionedEvent[] {
  const positionedEvents: PositionedEvent[] = [];

  workingWeek.forEach((date, day) => {
    const dayEvents = events
      .filter((event) => !event.isAllDay && isOnDate(event.startsAt, getDateKey(date)))
      .map((event) => ({ event, startsAt: new Date(event.startsAt), endsAt: new Date(event.endsAt) }))
      .sort((left, right) => left.startsAt.valueOf() - right.startsAt.valueOf() || left.endsAt.valueOf() - right.endsAt.valueOf());

    let group: Array<Omit<PositionedEvent, "columnCount">> = [];
    let groupEnd = Number.NEGATIVE_INFINITY;

    function finishGroup() {
      if (!group.length) return;
      const columnCount = Math.max(...group.map((item) => item.column)) + 1;
      positionedEvents.push(...group.map((item) => ({ ...item, columnCount })));
      group = [];
      groupEnd = Number.NEGATIVE_INFINITY;
    }

    dayEvents.forEach(({ event, startsAt, endsAt }) => {
      if (startsAt.valueOf() >= groupEnd) {
        finishGroup();
      }

      const occupiedColumns = new Set(
        group.filter((item) => item.endsAt.valueOf() > startsAt.valueOf()).map((item) => item.column),
      );
      let column = 0;
      while (occupiedColumns.has(column)) column += 1;

      group.push({ event, day, startsAt, endsAt, column });
      groupEnd = Math.max(groupEnd, endsAt.valueOf());
    });

    finishGroup();
  });

  return positionedEvents;
}
