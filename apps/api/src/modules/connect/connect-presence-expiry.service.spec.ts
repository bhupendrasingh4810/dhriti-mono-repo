import { Logger } from "@nestjs/common";
import { ConnectPresenceExpiryService } from "./connect-presence-expiry.service";
import { ConnectService } from "./connect.service";
import { AppSettingsService } from "../settings/app-settings.service";

function setup() {
  const deadline = new Date("2026-10-29T10:00:00Z");
  const expired = { id: "prefs-1", organizationId: "org-1", userId: "user-1", manualStatusExpiresAt: deadline };
  const prisma = {
    connectUserSettings: {
      findMany: jest.fn().mockResolvedValue([expired]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const connect = { applyPresencePreference: jest.fn().mockResolvedValue(undefined) };
  const service = new ConnectPresenceExpiryService(prisma as never, connect as never);
  return { service, prisma, connect, expired, deadline };
}

describe("ConnectPresenceExpiryService", () => {
  it.each(["dnd", "away", "offline"])("restores and publishes automatic presence after %s expires", async (status) => {
    const presence = {
      isConnected: jest.fn().mockResolvedValue(true),
      getStatus: jest.fn().mockResolvedValue(status),
      setStatus: jest.fn().mockResolvedValue(undefined),
    };
    const publisher = { presenceChanged: jest.fn() };
    const preferences = {
      manualStatus: status,
      manualStatusExpiresAt: new Date("2000-01-01T00:00:00Z"),
    };
    const policyService = new AppSettingsService({} as never);
    const settings = {
      getConnectUser: jest.fn().mockResolvedValue(preferences),
      effectiveManualStatus: policyService.effectiveManualStatus.bind(policyService),
    };
    const connect = new ConnectService(
      {} as never,
      {} as never,
      publisher as never,
      {} as never,
      presence as never,
      settings as never,
    );
    await connect.applyPresencePreference("org-1", "user-1");
    expect(presence.setStatus).toHaveBeenCalledWith("org-1", "user-1", "online");
    expect(publisher.presenceChanged).toHaveBeenCalledWith("org-1", "user-1", "online");
  });

  it("refreshes live presence without reconnecting and conditionally clears expired preferences", async () => {
    const { service, prisma, connect, expired, deadline } = setup();
    await service.run(deadline);
    expect(prisma.connectUserSettings.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { manualStatusExpiresAt: { lte: deadline } }, take: 100 }),
    );
    expect(connect.applyPresencePreference).toHaveBeenCalledWith(expired.organizationId, expired.userId);
    expect(prisma.connectUserSettings.updateMany).toHaveBeenCalledWith({
      where: { id: expired.id, manualStatusExpiresAt: deadline },
      data: { manualStatus: null, manualStatusExpiresAt: null },
    });
  });

  it("leaves failed refreshes eligible for retry instead of losing the expiry", async () => {
    const { service, prisma, connect, deadline } = setup();
    const log = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    try {
      connect.applyPresencePreference.mockRejectedValueOnce(new Error("Redis unavailable"));
      await service.run(deadline);
      expect(prisma.connectUserSettings.updateMany).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalled();
      await service.run(deadline);
      expect(prisma.connectUserSettings.updateMany).toHaveBeenCalledTimes(1);
    } finally {
      log.mockRestore();
    }
  });

  it("cancels the recurring scan when the module stops", () => {
    jest.useFakeTimers();
    try {
      const { service, prisma } = setup();
      prisma.connectUserSettings.findMany.mockResolvedValue([]);
      service.onModuleInit();
      service.onModuleDestroy();
      expect(jest.getTimerCount()).toBe(0);
    } finally {
      jest.useRealTimers();
    }
  });
});
