import { createHash } from "node:crypto";

import { SubscriptionService } from "./subscription.service";

function makeRedis() {
  return {
    getJson: jest.fn(),
    setJson: jest.fn(),
    raw: { set: jest.fn(), eval: jest.fn() },
  };
}

describe("SubscriptionService idempotency", () => {
  it("replays a completed response without executing the mutation again", async () => {
    const redis = makeRedis();
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ scope: "subscription.create", input: { planKey: "pro" } }))
      .digest("hex");
    redis.getJson.mockResolvedValue({ fingerprint, state: "SUCCEEDED", response: { id: "subscription-1" } });
    const service = new SubscriptionService(
      {} as never,
      {} as never,
      {} as never,
      redis as never,
      { billing: { idempotencyLockTtlSeconds: 60, idempotencyResultTtlSeconds: 86400 } } as never,
    );
    const operation = jest.fn();

    await expect(
      service.executeIdempotent(
        "org-1",
        "user-1",
        "billing-key-1234",
        "subscription.create",
        { planKey: "pro" },
        operation,
      ),
    ).resolves.toEqual({ id: "subscription-1" });
    expect(operation).not.toHaveBeenCalled();
  });

  it("releases its own lock when the mutation fails so a client can retry", async () => {
    const redis = makeRedis();
    redis.getJson.mockResolvedValue(null);
    redis.raw.set.mockResolvedValue("OK");
    const service = new SubscriptionService(
      {} as never,
      {} as never,
      {} as never,
      redis as never,
      { billing: { idempotencyLockTtlSeconds: 60, idempotencyResultTtlSeconds: 86400 } } as never,
    );
    const failure = new Error("provider unavailable");

    await expect(
      service.executeIdempotent(
        "org-1",
        "user-1",
        "billing-key-1234",
        "subscription.create",
        { planKey: "pro" },
        async () => {
          throw failure;
        },
      ),
    ).rejects.toThrow(failure);
    expect(redis.raw.eval).toHaveBeenCalledWith(
      expect.stringContaining("redis.call('GET'"),
      1,
      expect.stringMatching(/^idempotency:billing:org-1:user-1:/),
      expect.any(String),
    );
  });
});
