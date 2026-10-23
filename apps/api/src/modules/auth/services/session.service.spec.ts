import { SessionService } from "./session.service";

function makeService() {
  const prisma = {
    userSession: {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
  };
  const redis = {
    raw: {
      smembers: jest.fn().mockResolvedValue(["session-1", "session-2"]),
      srem: jest.fn().mockResolvedValue(2),
      publish: jest.fn().mockResolvedValue(1),
    },
    delete: jest.fn().mockResolvedValue(2),
    deleteByPattern: jest.fn(),
  };
  const service = new SessionService(prisma as never, redis as never, {} as never, { refreshTokenTtlDays: 7 } as never);

  return { service, prisma, redis };
}

describe("SessionService.revokeAllUserSessions", () => {
  it("evicts only the target user's cached sessions", async () => {
    const { service, prisma, redis } = makeService();

    const count = await service.revokeAllUserSessions("user-1");

    expect(count).toBe(2);
    expect(prisma.userSession.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
    expect(redis.raw.smembers).toHaveBeenCalledWith("auth:user-sessions:user-1");
    expect(redis.delete).toHaveBeenCalledWith("auth:session:session-1", "auth:session:session-2");
    expect(redis.raw.srem).toHaveBeenCalledWith("auth:user-sessions:user-1", "session-1", "session-2");
    expect(redis.raw.publish).toHaveBeenCalledWith("auth:session-revoked", "session-1");
    expect(redis.raw.publish).toHaveBeenCalledWith("auth:session-revoked", "session-2");
    expect(redis.deleteByPattern).not.toHaveBeenCalled();
  });

  it("retains an excluded session in the cache and tracking set", async () => {
    const { service, redis } = makeService();

    await service.revokeAllUserSessions("user-1", "session-2");

    expect(redis.delete).toHaveBeenCalledWith("auth:session:session-1");
    expect(redis.raw.srem).toHaveBeenCalledWith("auth:user-sessions:user-1", "session-1");
    expect(redis.raw.publish).toHaveBeenCalledWith("auth:session-revoked", "session-1");
  });
});

describe("SessionService.rotateSession", () => {
  const now = new Date("2026-10-23T00:00:00.000Z");
  const previousSession = {
    id: "session-1",
    userId: "user-1",
    organizationId: "organization-1",
    refreshTokenHash: "hash-current",
    ipAddress: "127.0.0.1",
    userAgent: "previous-agent",
    expiresAt: new Date("2026-10-30T00:00:00.000Z"),
    rotatedAt: null,
    revokedAt: null,
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
  };

  function makeRotationService(transitionCount = 1) {
    const transaction = {
      userSession: {
        updateMany: jest.fn().mockResolvedValue({ count: transitionCount }),
        create: jest.fn().mockResolvedValue({
          ...previousSession,
          id: "session-2",
          refreshTokenHash: "hash-next",
          ipAddress: "127.0.0.2",
          userAgent: "next-agent",
        }),
      },
    };
    const prisma = {
      userSession: {
        findUnique: jest.fn().mockResolvedValue(previousSession),
        updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      },
      $transaction: jest.fn(async (callback: (client: typeof transaction) => Promise<unknown>) => callback(transaction)),
    };
    const pipeline = {
      sadd: jest.fn().mockReturnThis(),
      expire: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([]),
    };
    const redis = {
      raw: {
        multi: jest.fn().mockReturnValue(pipeline),
        smembers: jest.fn().mockResolvedValue(["session-1", "session-2"]),
        srem: jest.fn().mockResolvedValue(2),
        publish: jest.fn().mockResolvedValue(1),
      },
      delete: jest.fn().mockResolvedValue(1),
      setJson: jest.fn().mockResolvedValue(undefined),
      deleteByPattern: jest.fn(),
    };
    const tokens = {
      hashToken: jest.fn((token: string) => `hash-${token}`),
      generateOpaqueToken: jest.fn().mockReturnValue("next"),
    };
    const service = new SessionService(prisma as never, redis as never, tokens as never, { refreshTokenTtlDays: 7 } as never);

    return { service, prisma, transaction, redis, tokens };
  }

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(now);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("atomically revokes the previous session and creates a successor session", async () => {
    const { service, prisma, transaction, redis, tokens } = makeRotationService();

    await expect(service.rotateSession("current", { ipAddress: "127.0.0.2", userAgent: "next-agent" })).resolves.toEqual({
      sessionId: "session-2",
      refreshToken: "next",
      expiresAt: previousSession.expiresAt,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(transaction.userSession.updateMany).toHaveBeenCalledWith({
      where: {
        id: "session-1",
        refreshTokenHash: "hash-current",
        rotatedAt: null,
        revokedAt: null,
        expiresAt: { gt: now },
      },
      data: { rotatedAt: now, revokedAt: now },
    });
    expect(transaction.userSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        organizationId: "organization-1",
        refreshTokenHash: "hash-next",
      }),
    });
    expect(redis.delete).toHaveBeenCalledWith("auth:session:session-1");
    expect(redis.raw.publish).toHaveBeenCalledWith("auth:session-revoked", "session-1");
    expect(tokens.generateOpaqueToken).toHaveBeenCalledTimes(1);
  });

  it("treats a failed atomic transition as refresh-token reuse", async () => {
    const { service, redis } = makeRotationService(0);

    await expect(service.rotateSession("current")).rejects.toMatchObject({
      code: "REFRESH_TOKEN_REUSED",
    });
    expect(redis.raw.smembers).toHaveBeenCalledWith("auth:user-sessions:user-1");
  });
});
