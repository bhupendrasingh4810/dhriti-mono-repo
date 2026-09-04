import { HttpStatus, Injectable } from "@nestjs/common";
import type { Calendar, CalendarEvent, EventAttendee, RsvpStatus, User } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import type { CreateCalendarDto, UpdateCalendarDto } from "./dto/calendar.dto";
import type { CreateEventDto, ListEventsQueryDto, UpdateEventDto } from "./dto/event.dto";

export type EventWithAttendees = CalendarEvent & {
  attendees: Array<EventAttendee & { user: Pick<User, "id" | "name" | "email" | "avatarUrl"> }>;
};

export interface SchedulingConflict {
  eventId: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
}

@Injectable()
export class PulseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Calendars ----------------

  async listCalendars(organizationId: string): Promise<Calendar[]> {
    return this.prisma.calendar.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  async createCalendar(organizationId: string, userId: string, dto: CreateCalendarDto): Promise<Calendar> {
    if (dto.isDefault) {
      await this.prisma.calendar.updateMany({
        where: { organizationId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const calendar = await this.prisma.calendar.create({
      data: {
        organizationId,
        ownerId: userId,
        name: dto.name.trim(),
        color: dto.color ?? null,
        isDefault: dto.isDefault ?? false,
      },
    });

    await this.audit.record({
      action: "pulse.calendar.created",
      organizationId,
      actorUserId: userId,
      resourceType: "Calendar",
      resourceId: calendar.id,
    });
    return calendar;
  }

  async updateCalendar(
    organizationId: string,
    calendarId: string,
    userId: string,
    dto: UpdateCalendarDto,
  ): Promise<Calendar> {
    await this.getCalendar(organizationId, calendarId);
    if (dto.isDefault === true) {
      await this.prisma.calendar.updateMany({
        where: { organizationId, isDefault: true, id: { not: calendarId } },
        data: { isDefault: false },
      });
    }

    return this.prisma.calendar.update({
      where: { id: calendarId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.color !== undefined ? { color: dto.color } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
    });
  }

  async deleteCalendar(organizationId: string, calendarId: string, userId: string): Promise<void> {
    const calendar = await this.getCalendar(organizationId, calendarId);
    if (calendar.ownerId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the calendar owner can delete it", HttpStatus.FORBIDDEN);
    }

    await this.prisma.$transaction([
      this.prisma.calendarEvent.updateMany({ where: { calendarId }, data: { deletedAt: new Date() } }),
      this.prisma.calendar.update({ where: { id: calendarId }, data: { deletedAt: new Date() } }),
    ]);
  }

  // ---------------- Events ----------------

  async listEvents(organizationId: string, query: ListEventsQueryDto): Promise<EventWithAttendees[]> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from) {
      throw new AppError(ErrorCode.INVALID_RANGE, "`to` must be after `from`", HttpStatus.BAD_REQUEST);
    }

    return this.prisma.calendarEvent.findMany({
      where: {
        organizationId,
        deletedAt: null,
        startsAt: { lt: to },
        endsAt: { gt: from },
        ...(query.calendarId ? { calendarId: query.calendarId } : {}),
      },
      orderBy: { startsAt: "asc" },
      include: this.eventInclude,
    });
  }

  async createEvent(
    organizationId: string,
    calendarId: string,
    creatorUserId: string,
    dto: CreateEventDto,
  ): Promise<EventWithAttendees> {
    await this.getCalendar(organizationId, calendarId);
    this.assertValidRange(dto.startsAt, dto.endsAt);

    if (dto.attendeeUserIds?.length) {
      await this.assertOrgMembers(organizationId, dto.attendeeUserIds);
    }

    const event = await this.prisma.calendarEvent.create({
      data: {
        organizationId,
        calendarId,
        title: dto.title.trim(),
        description: dto.description ?? null,
        location: dto.location ?? null,
        meetingUrl: dto.meetingUrl ?? null,
        startsAt: new Date(dto.startsAt),
        endsAt: new Date(dto.endsAt),
        isAllDay: dto.isAllDay ?? false,
        recurrenceRule: dto.recurrenceRule ?? null,
        createdById: creatorUserId,
        attendees: {
          create: [
            { userId: creatorUserId, isOrganizer: true, status: "ACCEPTED" },
            ...(dto.attendeeUserIds ?? [])
              .filter((id) => id !== creatorUserId)
              .map((id) => ({ userId: id, status: "PENDING" as RsvpStatus })),
          ],
        },
      },
      include: this.eventInclude,
    });

    await this.audit.record({
      action: "pulse.event.created",
      organizationId,
      actorUserId: creatorUserId,
      resourceType: "CalendarEvent",
      resourceId: event.id,
      metadata: { calendarId, attendeeCount: dto.attendeeUserIds?.length ?? 0 },
    });
    return event;
  }

  async getEvent(organizationId: string, eventId: string): Promise<EventWithAttendees> {
    const event = await this.prisma.calendarEvent.findFirst({
      where: { id: eventId, organizationId, deletedAt: null },
      include: this.eventInclude,
    });
    if (!event) {
      throw new AppError(ErrorCode.EVENT_NOT_FOUND, "Event not found", HttpStatus.NOT_FOUND);
    }
    return event;
  }

  async updateEvent(
    organizationId: string,
    eventId: string,
    userId: string,
    dto: UpdateEventDto,
  ): Promise<EventWithAttendees> {
    const existing = await this.getEvent(organizationId, eventId);
    if (existing.createdById !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the organizer can edit this event", HttpStatus.FORBIDDEN);
    }

    const startsAt = dto.startsAt ? new Date(dto.startsAt) : existing.startsAt;
    const endsAt = dto.endsAt ? new Date(dto.endsAt) : existing.endsAt;
    if (endsAt <= startsAt) {
      throw new AppError(ErrorCode.INVALID_RANGE, "Event end must be after its start", HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.location !== undefined ? { location: dto.location } : {}),
        ...(dto.meetingUrl !== undefined ? { meetingUrl: dto.meetingUrl } : {}),
        ...(dto.isAllDay !== undefined ? { isAllDay: dto.isAllDay } : {}),
        startsAt,
        endsAt,
      },
      include: this.eventInclude,
    });

    await this.audit.record({
      action: "pulse.event.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "CalendarEvent",
      resourceId: eventId,
    });
    return updated;
  }

  async deleteEvent(organizationId: string, eventId: string, userId: string): Promise<void> {
    const existing = await this.getEvent(organizationId, eventId);
    if (existing.createdById !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the organizer can delete this event", HttpStatus.FORBIDDEN);
    }
    await this.prisma.calendarEvent.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      action: "pulse.event.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "CalendarEvent",
      resourceId: eventId,
    });
  }

  // ---------------- RSVP ----------------

  async rsvp(
    organizationId: string,
    eventId: string,
    userId: string,
    status: RsvpStatus,
  ): Promise<EventAttendee> {
    await this.getEvent(organizationId, eventId);
    const attendee = await this.prisma.eventAttendee.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    if (!attendee) {
      throw new AppError(ErrorCode.FORBIDDEN, "You are not an attendee of this event", HttpStatus.FORBIDDEN);
    }

    return this.prisma.eventAttendee.update({
      where: { eventId_userId: { eventId, userId } },
      data: { status },
    });
  }

  async addAttendee(
    organizationId: string,
    eventId: string,
    actorUserId: string,
    userId: string,
  ): Promise<void> {
    const event = await this.getEvent(organizationId, eventId);
    if (event.createdById !== actorUserId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the organizer can add attendees", HttpStatus.FORBIDDEN);
    }
    await this.assertOrgMembers(organizationId, [userId]);

    await this.prisma.eventAttendee.upsert({
      where: { eventId_userId: { eventId, userId } },
      create: { eventId, userId, status: "PENDING" },
      update: {},
    });
  }

  async removeAttendee(
    organizationId: string,
    eventId: string,
    actorUserId: string,
    userId: string,
  ): Promise<void> {
    const event = await this.getEvent(organizationId, eventId);
    if (event.createdById !== actorUserId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the organizer can remove attendees", HttpStatus.FORBIDDEN);
    }
    await this.prisma.eventAttendee.deleteMany({ where: { eventId, userId } });
  }

  // ---------------- Scheduling ----------------

  /** Returns conflicting events for a user in a time range (calendar conflict warnings). */
  async findConflicts(
    organizationId: string,
    userId: string,
    startsAt: string,
    endsAt: string,
    excludeEventId?: string,
  ): Promise<SchedulingConflict[]> {
    const start = new Date(startsAt);
    const end = new Date(endsAt);

    const conflicts = await this.prisma.calendarEvent.findMany({
      where: {
        organizationId,
        deletedAt: null,
        id: excludeEventId ? { not: excludeEventId } : undefined,
        startsAt: { lt: end },
        endsAt: { gt: start },
        attendees: { some: { userId, status: { in: ["ACCEPTED", "TENTATIVE"] } } },
      },
      select: { id: true, title: true, startsAt: true, endsAt: true },
    });

    return conflicts.map((event) => ({
      eventId: event.id,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
    }));
  }

  // ---------------- Internals ----------------

  private readonly eventInclude = {
    attendees: {
      include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    },
  } as const;

  private async getCalendar(organizationId: string, calendarId: string): Promise<Calendar> {
    const calendar = await this.prisma.calendar.findFirst({
      where: { id: calendarId, organizationId, deletedAt: null },
    });
    if (!calendar) {
      throw new AppError(ErrorCode.CALENDAR_NOT_FOUND, "Calendar not found", HttpStatus.NOT_FOUND);
    }
    return calendar;
  }

  private assertValidRange(startsAt: string, endsAt: string): void {
    if (new Date(endsAt) <= new Date(startsAt)) {
      throw new AppError(ErrorCode.INVALID_RANGE, "Event end must be after its start", HttpStatus.BAD_REQUEST);
    }
  }

  private async assertOrgMembers(organizationId: string, userIds: string[]): Promise<void> {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId, userId: { in: userIds } },
      select: { userId: true },
    });
    if (members.length !== new Set(userIds).size) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "All attendees must be members of the organization",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
