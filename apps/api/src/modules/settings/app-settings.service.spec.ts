import { AppSettingsService } from "./app-settings.service";
import { DEFAULT_APP_SETTINGS } from "./settings.defaults";

const ORG = "org-1";

function setup() {
  let pulseRow = { id: "pulse-1", organizationId: ORG, ...DEFAULT_APP_SETTINGS.pulse };
  let connectRow = { id: "connect-1", organizationId: ORG, ...DEFAULT_APP_SETTINGS.connect };
  const audit = { create: jest.fn(async () => undefined) };
  const prisma = {
    pulseOrganizationSettings: {
      upsert: jest.fn(async (args: { update: object }) => (pulseRow = { ...pulseRow, ...args.update })),
      findUnique: jest.fn(async () => pulseRow),
    },
    connectOrganizationSettings: {
      upsert: jest.fn(async (args: { update: object }) => (connectRow = { ...connectRow, ...args.update })),
      findUnique: jest.fn(async () => connectRow),
    },
    channel: { count: jest.fn(async () => 0) },
    connectUserSettings: { upsert: jest.fn(async (args: { create: object }) => args.create) },
    auditLog: audit,
    $executeRaw: jest.fn(async () => 1),
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (run: (tx: typeof prisma) => unknown) => run(prisma));
  const service = new AppSettingsService(prisma as never);
  return { service, prisma, audit };
}

const quiet = {
  quietHoursEnabled: true,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  quietHoursDays: [1, 2, 3, 4, 5],
};

describe("AppSettingsService", () => {
  it("reads fresh settings on every request rather than retaining stale per-instance rules", async () => {
    const { service, prisma } = setup();
    await service.get("pulse", ORG);
    await service.get("pulse", ORG);
    expect(prisma.pulseOrganizationSettings.upsert).toHaveBeenCalledTimes(2);
  });

  it("falls back to findUnique when a concurrent create wins", async () => {
    const { service, prisma } = setup();
    prisma.pulseOrganizationSettings.upsert.mockRejectedValueOnce({ code: "P2002" });
    await expect(service.get("pulse", ORG)).resolves.toMatchObject({ id: "pulse-1" });
    expect(prisma.pulseOrganizationSettings.findUnique).toHaveBeenCalled();
  });

  it("rejects null for non-nullable fields but allows it for nullable limits", async () => {
    const { service } = setup();
    await expect(service.update("pulse", ORG, "user-1", { workingDays: null })).rejects.toThrow(
      "workingDays cannot be empty",
    );
    await expect(service.update("pulse", ORG, "user-1", { maxEventDurationMinutes: null })).resolves.toMatchObject({
      maxEventDurationMinutes: null,
    });
  });

  it("validates pulse working hours and days", async () => {
    const { service } = setup();
    await expect(
      service.update("pulse", ORG, "user-1", { workingHoursStart: "18:00", workingHoursEnd: "09:00" }),
    ).rejects.toThrow("Working hours must end after they start");
    await expect(service.update("pulse", ORG, "user-1", { workingDays: [] })).rejects.toThrow(
      "Select at least one working day",
    );
  });

  it("requires default channels to be existing public channels", async () => {
    const { service } = setup();
    await expect(service.update("connect", ORG, "user-1", { defaultChannelIds: ["missing"] })).rejects.toThrow(
      "Default channels must be existing public channels",
    );
  });

  it("audits changed fields on update", async () => {
    const { service, audit } = setup();
    await service.update("pulse", ORG, "user-1", { defaultReminderMinutes: 15 });
    expect(audit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: "settings.pulse.updated",
          metadata: {
            changedFields: ["defaultReminderMinutes"],
            changes: { defaultReminderMinutes: { before: null, after: 15 } },
          },
        }),
      }),
    );
  });

  it("locks updates before reading and validating the combined policy", async () => {
    const { service, prisma } = setup();
    await service.update("pulse", ORG, "user-1", { workingHoursStart: 17 });
    await expect(service.update("pulse", ORG, "user-2", { workingHoursEnd: 16 })).rejects.toThrow(
      "Working hours must end after they start",
    );
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
    expect(prisma.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.pulseOrganizationSettings.upsert.mock.invocationCallOrder[0],
    );
  });

  it("defers changed retention for 24 hours and clears the deadline when disabled", async () => {
    const { service } = setup();
    const before = Date.now();
    const saved = await service.update("connect", ORG, "user-1", { messageRetentionDays: 30 });
    expect(saved.retentionEnabledAt?.getTime()).toBeGreaterThanOrEqual(before + 86_400_000);
    const disabled = await service.update("connect", ORG, "user-1", { messageRetentionDays: null });
    expect(disabled.retentionEnabledAt).toBeNull();
  });

  it("rejects a status expiry in the past and clears expiry with the status", async () => {
    const { service, prisma } = setup();
    await expect(
      service.updateConnectUser(ORG, "user-1", { manualStatusExpiresAt: "2000-01-01T00:00:00.000Z" }),
    ).rejects.toThrow("Status expiry must be in the future");

    await service.updateConnectUser(ORG, "user-1", { manualStatus: null });
    expect(prisma.connectUserSettings.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { manualStatus: null, manualStatusExpiresAt: null } }),
    );
  });

  it("ignores expired manual statuses", () => {
    const { service } = setup();
    const now = new Date("2026-01-01T12:00:00Z");
    expect(
      service.effectiveManualStatus(
        { manualStatus: "dnd", manualStatusExpiresAt: new Date("2026-01-01T11:00:00Z") },
        now,
      ),
    ).toBeNull();
    expect(service.effectiveManualStatus({ manualStatus: "dnd", manualStatusExpiresAt: null }, now)).toBe("dnd");
  });

  describe("isWithinQuietHours", () => {
    const { service } = setup();

    it("is false when disabled", () => {
      expect(
        service.isWithinQuietHours({ ...quiet, quietHoursEnabled: false }, "UTC", new Date("2026-01-05T23:00:00Z")),
      ).toBe(false);
    });

    it("counts overnight windows for the day they start", () => {
      // 2026-01-09 is a Friday; the window continues into Saturday morning.
      expect(service.isWithinQuietHours(quiet, "UTC", new Date("2026-01-09T23:00:00Z"))).toBe(true);
      expect(service.isWithinQuietHours(quiet, "UTC", new Date("2026-01-10T06:00:00Z"))).toBe(true);
      // Sunday night is not a quiet day, so Monday early morning is not quiet.
      expect(service.isWithinQuietHours(quiet, "UTC", new Date("2026-01-12T06:00:00Z"))).toBe(false);
      expect(service.isWithinQuietHours(quiet, "UTC", new Date("2026-01-09T12:00:00Z"))).toBe(false);
    });

    it("evaluates the window in the user's time zone", () => {
      // 17:00 UTC on a Monday is 22:30 in Asia/Kolkata.
      expect(service.isWithinQuietHours(quiet, "Asia/Kolkata", new Date("2026-01-05T17:00:00Z"))).toBe(true);
      expect(service.isWithinQuietHours(quiet, "UTC", new Date("2026-01-05T17:00:00Z"))).toBe(false);
    });

    it("falls back to UTC for invalid time zones", () => {
      expect(service.isWithinQuietHours(quiet, "Not/AZone", new Date("2026-01-05T23:00:00Z"))).toBe(true);
    });
  });
});
