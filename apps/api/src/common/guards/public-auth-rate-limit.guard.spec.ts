import { HttpStatus } from "@nestjs/common";

import { PublicAuthRateLimitGuard } from "./public-auth-rate-limit.guard";

function context() {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ route: { path: "/auth/login" }, path: "/auth/login", ip: "203.0.113.10" }),
    }),
  };
}

describe("PublicAuthRateLimitGuard", () => {
  it("rejects requests beyond the configured limit", async () => {
    const redis = { raw: { incr: jest.fn().mockResolvedValue(3), expire: jest.fn() } };
    const guard = new PublicAuthRateLimitGuard(redis as never, { publicAuthRateLimit: { windowSeconds: 60, maxRequests: 2 } } as never);

    await expect(guard.canActivate(context() as never)).rejects.toMatchObject({ status: HttpStatus.TOO_MANY_REQUESTS });
  });

  it("fails closed when Redis is unavailable", async () => {
    const redis = { raw: { incr: jest.fn().mockRejectedValue(new Error("unavailable")), expire: jest.fn() } };
    const guard = new PublicAuthRateLimitGuard(redis as never, { publicAuthRateLimit: { windowSeconds: 60, maxRequests: 2 } } as never);

    await expect(guard.canActivate(context() as never)).rejects.toMatchObject({ status: HttpStatus.SERVICE_UNAVAILABLE });
  });
});