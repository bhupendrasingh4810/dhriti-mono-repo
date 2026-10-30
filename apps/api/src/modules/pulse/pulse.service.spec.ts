import type { PrismaService } from "../../database/prisma.service";
import type { AuditService } from "../audit/audit.service";
import type { ConnectService } from "../connect/connect.service";
import { PulseService } from "./pulse.service";
import { DEFAULT_APP_SETTINGS } from "../settings/settings.defaults";

describe("PulseService meetings and schedule metadata", () => {
  const organizationId = "organization-id";
  const organizerId = "organizer-id";
  const attendeeId = "attendee-id";
  const calendarId = "calendar-id";
  let prisma: {
    calendar: { findFirst: jest.Mock };
    organizationMember: { findMany: jest.Mock };
    calendarEvent: { create: jest.Mock; update: jest.Mock };
    notificationOutbox: { createMany: jest.Mock };
    $transaction: jest.Mock;
  };
  let connect: { createMeetingConversation: jest.Mock };
  let audit: { record: jest.Mock };
  let service: PulseService;

  beforeEach(() => {
    prisma = {
      calendar: { findFirst: jest.fn().mockResolvedValue({ id: calendarId, organizationId }) },
      organizationMember: { findMany: jest.fn().mockResolvedValue([{ userId: attendeeId }]) },
      calendarEvent: {
        create: jest.fn().mockResolvedValue({ id: "event-id", attendees: [] }),
        update: jest.fn().mockResolvedValue({ id: "event-id", attendees: [], connectChannelId: "channel-id" }),
      },
      notificationOutbox: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
      $transaction: jest.fn(),
    };
    prisma.$transaction.mockImplementation((callback: (tx: typeof prisma) => unknown) => callback(prisma));
    connect = { createMeetingConversation: jest.fn().mockResolvedValue({ id: "channel-id" }) };
    audit = { record: jest.fn().mockResolvedValue(undefined) };
    service = new PulseService(
      prisma as unknown as PrismaService,
      audit as unknown as AuditService,
      connect as unknown as ConnectService,
      { get: jest.fn().mockResolvedValue(DEFAULT_APP_SETTINGS.pulse) } as never,
    );
  });

  it("creates a Connect conversation for an organizer and one attendee, then persists its relation", async () => {
    await service.createMeeting(organizationId, calendarId, organizerId, {
      title: "One-on-one",
      startsAt: "2026-10-26T09:00:00.000Z",
      endsAt: "2026-10-26T09:30:00.000Z",
      attendeeUserIds: [attendeeId],
    });

    expect(connect.createMeetingConversation).toHaveBeenCalledWith(organizationId, organizerId, [attendeeId]);
    expect(prisma.calendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "event-id" },
        data: { connectChannelId: "channel-id" },
      }),
    );
    expect(prisma.notificationOutbox.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          organizationId,
          recipientId: attendeeId,
          type: "PULSE_INVITATION",
          actorId: organizerId,
        }),
      ],
      skipDuplicates: true,
    });
  });

  it("accepts only weekly recurrence rules", async () => {
    await expect(
      service.createEvent(organizationId, calendarId, organizerId, {
        title: "Daily stand-up",
        startsAt: "2026-10-26T09:00:00.000Z",
        endsAt: "2026-10-26T09:30:00.000Z",
        recurrenceRule: "FREQ=DAILY",
      }),
    ).rejects.toThrow("Only weekly recurrence is supported");
  });

  it("parses common holiday formats and skips malformed entries", () => {
    const parseHolidays = service as unknown as {
      parseHolidays: (
        value: unknown,
        calendarId: string,
        calendarName: string,
        from: Date,
        to: Date,
      ) => Array<{ title: string }>;
    };
    const holidays = parseHolidays.parseHolidays(
      [
        { date: "2026-12-25", name: "Christmas" },
        { startDate: "2026-12-31", endDate: "2027-01-01", title: "New Year" },
        { date: "not-a-date", name: "Broken" },
        { date: "2026-12-26" },
      ],
      "holiday-calendar",
      "Company calendar",
      new Date("2026-12-01T00:00:00.000Z"),
      new Date("2027-01-02T00:00:00.000Z"),
    );

    expect(holidays.map((holiday) => holiday.title)).toEqual(["Christmas", "New Year"]);
  });
});
