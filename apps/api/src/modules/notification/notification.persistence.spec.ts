import { randomUUID } from "node:crypto";
import { NotificationType, PrismaClient } from "@prisma/client";
import { NotificationService } from "./notification.service";

const databaseTests = process.env.NOTIFICATION_DATABASE_TESTS === "true" ? describe : describe.skip;

databaseTests("Per-app notification preference persistence", () => {
  const prisma = new PrismaClient();
  const organizationId = randomUUID();
  const otherOrganizationId = randomUUID();
  const userId = randomUUID();
  const otherUserId = randomUUID();
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  const service = new NotificationService(prisma as never, email as never);
  const types = Object.values(NotificationType);

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.organization.createMany({
      data: [organizationId, otherOrganizationId].map((id) => ({
        id,
        name: "Notification preference fixture",
        slug: `notification-test-${id}`,
      })),
    });
    await prisma.user.createMany({
      data: [userId, otherUserId].map((id) => ({ id, name: "Test member", email: `${id}@example.test` })),
    });
  });

  afterAll(async () => {
    try {
      await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [userId, otherUserId] } } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it("saves all app event preferences and reads them back using a fresh service instance", async () => {
    for (const type of types) {
      await service.upsertPreference(organizationId, userId, { type, inApp: false, email: false, push: false });
    }
    const fresh = new NotificationService(prisma as never, email as never);
    const saved = await fresh.listPreferences(organizationId, userId);
    expect(saved.map(({ type }) => type).sort()).toEqual([...types].sort());
    expect(saved.every((row) => !row.inApp && !row.email && !row.push)).toBe(true);
    expect(await fresh.listPreferences(otherOrganizationId, userId)).toEqual([]);
    expect(await fresh.listPreferences(organizationId, otherUserId)).toEqual([]);
  });

  it("uses the saved event preference for delivery without changing other events", async () => {
    email.send.mockClear();
    for (const type of types) {
      await service.create(organizationId, { userId, type, title: "Suppressed test activity" });
    }
    expect(await prisma.notification.count({ where: { organizationId, userId } })).toBe(0);
    expect(email.send).not.toHaveBeenCalled();
    await service.upsertPreference(organizationId, userId, { type: "NOTES_ACCESS_REQUEST", inApp: true });
    await service.create(organizationId, { userId, type: "NOTES_ACCESS_REQUEST", title: "Note request" });
    await service.create(organizationId, { userId, type: "NOTES_SHARED", title: "Still suppressed" });
    expect(await prisma.notification.findMany({ where: { organizationId, userId } })).toEqual([
      expect.objectContaining({ type: "NOTES_ACCESS_REQUEST", title: "Note request" }),
    ]);
    expect(email.send).not.toHaveBeenCalled();
  });

  it("keeps channels, users and organizations independent", async () => {
    email.send.mockClear();
    await service.upsertPreference(organizationId, otherUserId, { type: "NOTES_SHARED", inApp: false, email: true });
    await service.upsertPreference(otherOrganizationId, userId, { type: "NOTES_SHARED", inApp: true, email: false });
    await service.create(organizationId, { userId: otherUserId, type: "NOTES_SHARED", title: "Email only" });
    await service.create(otherOrganizationId, { userId, type: "NOTES_SHARED", title: "In-app only" });
    expect(email.send).toHaveBeenCalledTimes(1);
    expect(await prisma.notification.count({ where: { organizationId, userId: otherUserId } })).toBe(0);
    expect(await prisma.notification.count({ where: { organizationId: otherOrganizationId, userId } })).toBe(1);
    expect(
      (await service.listPreferences(organizationId, userId)).find(({ type }) => type === "NOTES_SHARED"),
    ).toMatchObject({
      inApp: false,
      email: false,
    });
  });
});
