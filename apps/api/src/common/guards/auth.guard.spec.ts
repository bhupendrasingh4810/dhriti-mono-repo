import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

import { AuthGuard } from "./auth.guard";

function context(request: Record<string, unknown>) {
  return {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => request }),
  };
}

describe("AuthGuard cookie origin protection", () => {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(false) };
  const jwt = { verifyAsync: jest.fn() };
  const sessions = { isSessionActive: jest.fn() };
  const config = { corsOrigins: ["https://app.example.test"], jwtAccessSecret: "secret" };

  beforeEach(() => jest.clearAllMocks());

  it("rejects a cookie-authenticated mutation without a trusted origin", async () => {
    const guard = new AuthGuard(jwt as never, reflector as never, config as never, sessions as never);
    await expect(
      guard.canActivate(context({ method: "POST", headers: {}, cookies: { access_token: "token" } }) as never),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    expect(jwt.verifyAsync).not.toHaveBeenCalled();
  });

  it("allows bearer-authenticated mutations without an origin header", async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: "user-1", sid: "session-1", org: null, email: "user@example.test" });
    sessions.isSessionActive.mockResolvedValue(true);
    const request = { method: "POST", headers: { authorization: "Bearer test-access-token" }, cookies: {} };
    const guard = new AuthGuard(jwt as never, reflector as never, config as never, sessions as never);

    await expect(guard.canActivate(context(request) as never)).resolves.toBe(true);
  });

  it("allows a temporary-password session to change password but blocks other protected routes", async () => {
    jwt.verifyAsync.mockResolvedValue({
      sub: "user-1",
      sid: "session-1",
      org: null,
      email: "user@example.test",
      mustResetPassword: true,
    });
    sessions.isSessionActive.mockResolvedValue(true);
    const guard = new AuthGuard(jwt as never, reflector as never, config as never, sessions as never);

    await expect(
      guard.canActivate(
        context({
          method: "POST",
          path: "/api/auth/change-password",
          headers: { authorization: "Bearer test-access-token" },
          cookies: {},
        }) as never,
      ),
    ).resolves.toBe(true);
    await expect(
      guard.canActivate(
        context({
          method: "GET",
          path: "/api/organization",
          headers: { authorization: "Bearer test-access-token" },
          cookies: {},
        }) as never,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
