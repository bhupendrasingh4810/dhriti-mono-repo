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
}
export interface EventQuery {
  from: string;
  to: string;
  calendarId?: string;
}
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
    tenantRequest<ApiEntity>(organizationId, `${base}/events/${pathSegment(eventId)}`),
  updateEvent: (organizationId: string, eventId: string, input: EventInput) =>
    tenantJsonRequest<ApiEntity, EventInput>(organizationId, `${base}/events/${pathSegment(eventId)}`, "PATCH", input),
  deleteEvent: (organizationId: string, eventId: string) =>
    tenantRequest<void>(organizationId, `${base}/events/${pathSegment(eventId)}`, { method: "DELETE" }),
  rsvp: (organizationId: string, eventId: string, status: RsvpStatus) =>
    tenantJsonRequest<ApiEntity, { status: RsvpStatus }>(
      organizationId,
      `${base}/events/${pathSegment(eventId)}/rsvp`,
      "POST",
      { status },
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
