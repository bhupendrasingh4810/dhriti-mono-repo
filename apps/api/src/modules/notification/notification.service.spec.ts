import { NotificationType } from "@prisma/client";
import { validate } from "class-validator";
import type { NotificationType as SharedNotificationType } from "@dhriti/types";
import { CreateNotificationDto, UpsertPreferenceDto } from "./dto/notification.dto";
import { NotificationService } from "./notification.service";

const types: SharedNotificationType[] = Object.values(NotificationType);
const assertEnumParity: Record<SharedNotificationType, NotificationType> = NotificationType;

describe("Notification event preferences", () => {
  function setup() {
    const prisma = {
      notificationPreference: {
        upsert: jest.fn().mockResolvedValue({}),
      },
      notificationOutbox: { create: jest.fn().mockResolvedValue({ id: "event" }) },
      user: { findUnique: jest.fn().mockResolvedValue({ email: "member@example.test", name: "Member" }) },
    };
    const email = { send: jest.fn().mockResolvedValue(undefined) };
    const service = new NotificationService(prisma as never, email as never);
    return { prisma, email, service };
  }

  it("keeps database and shared notification contracts aligned", () => {
    expect(Object.keys(assertEnumParity).sort()).toEqual([...types].sort());
  });

  it.each(types)("accepts %s in notification and preference DTOs", async (type) => {
    expect(
      await validate(
        Object.assign(new CreateNotificationDto(), {
          userId: "00000000-0000-4000-8000-000000000001",
          title: "Test notification",
          type,
        }),
      ),
    ).toHaveLength(0);
    expect(await validate(Object.assign(new UpsertPreferenceDto(), { type, inApp: false, email: false }))).toHaveLength(
      0,
    );
  });

  it("rejects unknown notification event types", async () => {
    expect(await validate(Object.assign(new UpsertPreferenceDto(), { type: "UNKNOWN_EVENT" }))).not.toHaveLength(0);
  });

  it.each(types)("queues %s durably without synchronous channel delivery", async (type) => {
    const { service, prisma, email } = setup();
    expect(await service.create("org", { userId: "member", type, title: "Activity" })).toEqual({ eventId: "event" });
    expect(prisma.notificationOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        organizationId: "org",
        recipientId: "member",
        type,
        payload: expect.objectContaining({ title: "Activity", version: 1 }),
      }),
    });
    expect(email.send).not.toHaveBeenCalled();
  });

  it("persists explicit delivery defaults and quiet-hours decisions for the worker", async () => {
    const { service, prisma } = setup();
    await service.create(
      "org",
      { userId: "member", type: "MENTION", title: "Activity" },
      { emailByDefault: false, suppressEmail: true },
    );
    expect(prisma.notificationOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        payload: expect.objectContaining({ emailByDefault: false, suppressEmail: true }),
      }),
    });
  });

  it("uses the same missed-call default when creating a preference and preserves omitted fields on update", async () => {
    const { service, prisma } = setup();
    await service.upsertPreference("org", "member", { type: "CALL", inApp: false });
    expect(prisma.notificationPreference.upsert).toHaveBeenCalledWith({
      where: { userId_organizationId_type: { userId: "member", organizationId: "org", type: "CALL" } },
      create: { organizationId: "org", userId: "member", type: "CALL", inApp: false, email: false, push: false },
      update: { inApp: false },
    });
  });
});
