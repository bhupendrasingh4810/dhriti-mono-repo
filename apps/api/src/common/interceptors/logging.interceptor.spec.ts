import { LoggingInterceptor } from "./logging.interceptor";

describe("LoggingInterceptor", () => {
  it("redacts token-bearing query keys regardless of casing or separators", () => {
    const interceptor = new LoggingInterceptor({ set: jest.fn() } as never);
    const logger = { log: jest.fn() };
    (interceptor as unknown as { logger: typeof logger }).logger = logger;
    const request = {
      method: "GET",
      originalUrl: "/auth/callback?access_token=secret",
      query: { access_token: "secret", refreshToken: "refresh", idToken: "id", normal: "visible" },
      headers: {},
      ip: "203.0.113.10",
    };

    (
      interceptor as unknown as {
        log: (request: unknown, response: unknown, correlationId: string, startedAt: bigint, error: unknown) => void;
      }
    ).log(request, { statusCode: 200 }, "correlation-id", process.hrtime.bigint(), null);

    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('"access_token":"[REDACTED]"'));
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('"refreshToken":"[REDACTED]"'));
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('"idToken":"[REDACTED]"'));
    expect(logger.log).toHaveBeenCalledWith(expect.stringContaining('"normal":"visible"'));
  });
});
