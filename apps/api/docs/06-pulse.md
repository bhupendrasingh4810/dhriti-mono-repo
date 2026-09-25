# Pulse — Calendars & Scheduling

## Entity diagram

```
Organization ── Calendar ── CalendarEvent ── EventAttendee ── User
```

`EventAttendee.status` ∈ `PENDING | ACCEPTED | DECLINED | TENTATIVE`; the creator
is the organizer (`isOrganizer`, auto-ACCEPTED). Events support a `recurrenceRule`
(RFC 5545 RRULE) and `meetingUrl`.

## REST (base `/v1/organization/pulse`)

### Calendars

- `GET /calendars`, `POST /calendars` `{ name, color?, isDefault? }`.
  - Setting `isDefault` clears other defaults in the org.
- `PATCH /calendars/:calendarId`, `DELETE /calendars/:calendarId` (owner only; cascades to events).

### Events

- `GET /events?from=&to=&calendarId=` — events overlapping a range (`to` must be after `from`).
- `POST /calendars/:calendarId/events` — title, times, description, location, meetingUrl, isAllDay, recurrenceRule, attendeeUserIds.
  - Attendees must be org members; creator becomes organizer.
- `GET /events/:eventId`, `PATCH /events/:eventId`, `DELETE /events/:eventId` (organizer only).

### RSVP & attendees

- `POST /events/:eventId/rsvp` `{ status }` — respond (must be an attendee).
- `POST /events/:eventId/attendees` `{ userId }` / `DELETE .../attendees/:userId` (organizer only).

### Scheduling

- `GET /events/conflicts?from=&to=&excludeEventId=` — events conflicting for the current user (accepted/tentative).

## WebSocket — namespace `/pulse`

- `schedule:check` `{ startsAt, endsAt, excludeEventId? }` → returns `{ conflicts }` for live conflict warnings.
- `event:rsvp-changed` `{ eventId, status }` — broadcasts so attendee counts update live.

## Error codes

`CALENDAR_NOT_FOUND`, `EVENT_NOT_FOUND`, `INVALID_RANGE`, `MEMBER_NOT_FOUND`,
`FORBIDDEN`.
