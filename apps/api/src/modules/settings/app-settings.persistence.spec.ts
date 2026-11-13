import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { APP_SETTINGS_KEYS, AppSettingsService } from "./app-settings.service";
import { DEFAULT_APP_SETTINGS } from "./settings.defaults";

const databaseTests = process.env.SETTINGS_DATABASE_TESTS === "true" ? describe : describe.skip;

databaseTests("App settings database integrity", () => {
  const prisma = new PrismaClient();
  const orgId = randomUUID();
  const userId = randomUUID();
  const settings = new AppSettingsService(prisma as never);

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.organization.create({ data: { id: orgId, name: "Settings test", slug: `settings-test-${orgId}` } });
    await prisma.user.create({ data: { id: userId, name: "Settings test", email: `${userId}@example.test` } });
  });

  afterAll(async () => {
    try {
      await prisma.auditLog.deleteMany({ where: { organizationId: orgId } });
      await prisma.organization.deleteMany({ where: { id: orgId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    } finally {
      await prisma.$disconnect();
    }
  });

  it.each(APP_SETTINGS_KEYS)("keeps %s database defaults consistent with policy test fixtures", async (app) => {
    expect(await settings.get(app, orgId)).toEqual(expect.objectContaining(DEFAULT_APP_SETTINGS[app]));
  });

  it("reads saves from a second API instance immediately", async () => {
    const anotherInstance = new AppSettingsService(prisma as never);
    await anotherInstance.get("notes", orgId);
    await settings.update("notes", orgId, userId, { sharingEnabled: false });
    expect((await anotherInstance.get("notes", orgId)).sharingEnabled).toBe(false);
  });

  it("rolls a settings change back when its audit record cannot be persisted", async () => {
    const before = await settings.get("notes", orgId);
    await expect(
      settings.update("notes", orgId, "not-a-uuid", { sharingEnabled: !before.sharingEnabled }),
    ).rejects.toThrow();
    expect((await settings.get("notes", orgId)).sharingEnabled).toBe(before.sharingEnabled);
  });
});
