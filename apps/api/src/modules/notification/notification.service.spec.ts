import { NotificationType } from "@prisma/client";
import { validate } from "class-validator";
import type { NotificationType as SharedNotificationType } from "@dhriti/types";
import { CreateNotificationDto, UpsertPreferenceDto } from "./dto/notification.dto";
import { NotificationService } from "./notification.service";

const types: SharedNotificationType[] = Object.values(NotificationType);
const assertEnumParity: Record<SharedNotificationType, NotificationType> = NotificationType;

describe("Notification event preferences", () => {
  function setup(preference: { inApp: boolean; email: boolean } | null = null) {
    const prisma = {
      notificationPreference: {
        findUnique: jest.fn().mockResolvedValue(preference),
        upsert: jest.fn().mockResolvedValue({}),
      },
      notification: { create: jest.fn().mockResolvedValue({ id: "notification" }) },
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
          userId: "member",
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

  it.each(types)("enforces independent in-app and email preferences for %s", async (type) => {
    for (const inApp of [true, false]) {
      for (const emailEnabled of [true, false]) {
        const { service, prisma, email } = setup({ inApp, email: emailEnabled });
        await service.create("org", { userId: "member", type, title: "Activity" });
        expect(prisma.notificationPreference.findUnique).toHaveBeenCalledWith({
          where: { userId_organizationId_type: { userId: "member", organizationId: "org", type } },
        });
        expect(prisma.notification.create).toHaveBeenCalledTimes(inApp ? 1 : 0);
        expect(email.send).toHaveBeenCalledTimes(emailEnabled ? 1 : 0);
      }
    }
  });

  it("preserves quiet-hours suppression even when email is enabled", async () => {
    for (const inApp of [true, false]) {
      const { service, email } = setup({ inApp, email: true });
      await service.create("org", { userId: "member", type: "MENTION", title: "Activity" }, { suppressEmail: true });
      expect(email.send).not.toHaveBeenCalled();
    }
  });

  it("defaults missed-call email off and other event email on without saved preferences", async () => {
    for (const type of types) {
      const { service, email, prisma } = setup();
      await service.create("org", { userId: "member", type, title: "Activity" });
      expect(prisma.notification.create).toHaveBeenCalledTimes(1);
      expect(email.send).toHaveBeenCalledTimes(type === "CALL" ? 0 : 1);
    }
  });

  it("honors explicit delivery defaults only when no preference is saved", async () => {
    const defaults = setup();
    await defaults.service.create(
      "org",
      { userId: "member", type: "MENTION", title: "Activity" },
      { emailByDefault: false },
    );
    expect(defaults.email.send).not.toHaveBeenCalled();
    const saved = setup({ inApp: true, email: true });
    await saved.service.create(
      "org",
      { userId: "member", type: "MENTION", title: "Activity" },
      { emailByDefault: false },
    );
    expect(saved.email.send).toHaveBeenCalledTimes(1);
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
