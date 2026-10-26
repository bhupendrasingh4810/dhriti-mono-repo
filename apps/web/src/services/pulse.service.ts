import { pathSegment, tenantJsonRequest, tenantRequest } from "@/services/request.service";
import type { ApiEntity, RsvpStatus } from "@/services/service-types";

export interface CalendarInput {
  name?: string;
  description?: string;
  color?: string;
  isDefault?: boolean;
}
export interface EventInput {
  title?: string;
  startsAt?: string;
  endsAt?: string;
  description?: string;
  location?: string;
  meetingUrl?: string;
  isAllDay?: boolean;
  recurrenceRule?: string;
  attendeeUserIds?: string[];
  availability?: "FREE" | "BUSY";
  privacy?: "DEFAULT" | "PRIVATE";
  reminderMinutes?: number;
  isOnlineMeeting?: boolean;
}
export interface EventQuery {
  from: string;
  to: string;
  calendarId?: string;
}
export type PulseScheduleEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  kind: "EVENT" | "MEETING";
  recurrenceRule: string | null;
  cancelledAt: string | null;
  availability: "FREE" | "BUSY";
  location: string | null;
  attendees: Array<{ user: { id: string; name: string } }>;
};
export type PulseSchedule = {
  events: PulseScheduleEvent[];
  holidays: Array<{ id: string; title: string; startDate: string; endDate: string }>;
  birthdays: Array<{ id: string; title: string; date: string }>;
  leaves: Array<{ id: string; startDate: string; endDate: string; totalDays: number; user: { id: string; name: string } }>;
};
export type PulseEventDetail = Omit<PulseScheduleEvent, "attendees"> & {
  createdById: string;
  description: string | null;
  meetingUrl: string | null;
  isOnlineMeeting: boolean;
  connectChannelId: string | null;
  attendees: Array<{
    userId: string;
    status: RsvpStatus;
    isOrganizer: boolean;
    declineReason: string | null;
    user: { id: string; name: string; email: string; avatarUrl: string | null };
  }>;
};
const base = "/api/organization/pulse";
export const pulseService = {
  listCalendars: (organizationId: string) => tenantRequest<ApiEntity[]>(organizationId, `${base}/calendars`),
  createCalendar: (organizationId: string, input: CalendarInput) =>
    tenantJsonRequest<ApiEntity, CalendarInput>(organizationId, `${base}/calendars`, "POST", input),
  updateCalendar: (organizationId: string, calendarId: string, input: CalendarInput) =>
    tenantJsonRequest<ApiEntity, CalendarInput>(
      organizationId,
      `${base}/calendars/${pathSegment(calendarId)}`,
      "PATCH",
      input,
    ),
  deleteCalendar: (organizationId: string, calendarId: string) =>
    tenantRequest<void>(organizationId, `${base}/calendars/${pathSegment(calendarId)}`, { method: "DELETE" }),
  listEvents: (organizationId: string, query: EventQuery) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/events`, { query }),
  getSchedule: (organizationId: string, query: EventQuery) =>
    tenantRequest<PulseSchedule>(organizationId, `${base}/schedule`, { query }),
  createScheduledEvent: (
    organizationId: string,
    input: Required<Pick<EventInput, "title" | "startsAt" | "endsAt">> & EventInput & { calendarId: string },
  ) => tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${base}/events`, "POST", input),
  createMeeting: (
    organizationId: string,
    input: Required<Pick<EventInput, "title" | "startsAt" | "endsAt" | "attendeeUserIds">> & EventInput & { calendarId: string },
  ) => tenantJsonRequest<ApiEntity, typeof input>(organizationId, `${base}/meetings`, "POST", input),
  createEvent: (
    organizationId: string,
    calendarId: string,
    input: Required<Pick<EventInput, "title" | "startsAt" | "endsAt">> & EventInput,
  ) =>
    tenantJsonRequest<ApiEntity, EventInput>(
      organizationId,
      `${base}/calendars/${pathSegment(calendarId)}/events`,
      "POST",
      input,
    ),
  getEvent: (organizationId: string, eventId: string) =>
    tenantRequest<PulseEventDetail>(organizationId, `${base}/events/${pathSegment(eventId)}`),
  updateEvent: (organizationId: string, eventId: string, input: EventInput) =>
    tenantJsonRequest<ApiEntity, EventInput>(organizationId, `${base}/events/${pathSegment(eventId)}`, "PATCH", input),
  deleteEvent: (organizationId: string, eventId: string) =>
    tenantRequest<void>(organizationId, `${base}/events/${pathSegment(eventId)}`, { method: "DELETE" }),
  cancelEvent: (organizationId: string, eventId: string) =>
    tenantJsonRequest<ApiEntity, Record<string, never>>(
      organizationId,
      `${base}/events/${pathSegment(eventId)}/cancel`,
      "POST",
      {},
    ),
  rsvp: (organizationId: string, eventId: string, status: RsvpStatus, declineReason?: string) =>
    tenantJsonRequest<ApiEntity, { status: RsvpStatus; declineReason?: string }>(
      organizationId,
      `${base}/events/${pathSegment(eventId)}/rsvp`,
      "POST",
      { status, declineReason },
    ),
  addAttendee: (organizationId: string, eventId: string, userId: string) =>
    tenantJsonRequest<void, { userId: string }>(
      organizationId,
      `${base}/events/${pathSegment(eventId)}/attendees`,
      "POST",
      { userId },
    ),
  removeAttendee: (organizationId: string, eventId: string, userId: string) =>
    tenantRequest<void>(organizationId, `${base}/events/${pathSegment(eventId)}/attendees/${pathSegment(userId)}`, {
      method: "DELETE",
    }),
  findConflicts: (organizationId: string, query: { from: string; to: string; excludeEventId?: string }) =>
    tenantRequest<ApiEntity[]>(organizationId, `${base}/events/conflicts`, { query }),
};
