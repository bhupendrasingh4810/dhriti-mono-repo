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
