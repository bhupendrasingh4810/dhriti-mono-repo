import { createHmac } from "node:crypto";

import { BillingWebhookService } from "./billing-webhook.service";

const secret = "a".repeat(32);
const config = {
  stripeWebhookSecret: secret,
  billing: {
    webhookSignatureToleranceSeconds: 300,
    webhookMaxRetryAttempts: 8,
    webhookProcessingTimeoutSeconds: 600,
    webhookRetryBaseDelaySeconds: 60,
    webhookRetryMaxDelaySeconds: 3600,
    webhookRetryBatchSize: 100,
  },
};

function stripeRequest(event: Record<string, unknown>) {
  const rawBody = Buffer.from(JSON.stringify(event));
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHmac("sha256", secret).update(`${timestamp}.${rawBody.toString("utf8")}`).digest("hex");
  return { rawBody, signature: `t=${timestamp},v1=${signature}` };
}

function makePrisma() {
  const prisma = {
    billingWebhookEvent: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
    subscription: { findFirst: jest.fn(), update: jest.fn() },
    subscriptionHistory: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (callback: (transaction: typeof prisma) => Promise<void>) => callback(prisma));
  return prisma;
}

describe("BillingWebhookService", () => {
  const event = {
    id: "evt_123",
    type: "customer.subscription.updated",
    created: Math.floor(Date.now() / 1000),
    data: { object: { id: "sub_123", status: "active", current_period_start: 1_700_000_000, current_period_end: 1_700_100_000 } },
  };

  it("rejects a tampered Stripe signature before persistence", async () => {
    const prisma = makePrisma();
    const service = new BillingWebhookService(prisma as never, config as never, { invalidate: jest.fn() } as never, { billingWebhookDeadLettered: jest.fn() } as never);
    const request = stripeRequest(event);

    await expect(service.process("stripe", "t=1,v1=invalid", request.rawBody)).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(prisma.billingWebhookEvent.create).not.toHaveBeenCalled();
  });

  it("acknowledges an already successful provider event without reprocessing it", async () => {
    const prisma = makePrisma();
    prisma.billingWebhookEvent.findUnique.mockResolvedValue({ status: "SUCCEEDED" });
    const service = new BillingWebhookService(prisma as never, config as never, { invalidate: jest.fn() } as never, { billingWebhookDeadLettered: jest.fn() } as never);
    const request = stripeRequest(event);

    await expect(service.process("stripe", request.signature, request.rawBody)).resolves.toEqual({ duplicate: true });
    expect(prisma.subscription.update).not.toHaveBeenCalled();
  });

  it("marks a stale event processed without overwriting current subscription state", async () => {
    const prisma = makePrisma();
    prisma.billingWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.billingWebhookEvent.create.mockResolvedValue({ id: "ledger-1", attemptCount: 1 });
    prisma.subscription.findFirst.mockResolvedValue({ id: "subscription-1", organizationId: "org-1", planId: null, status: "ACTIVE" });
    prisma.billingWebhookEvent.findFirst.mockResolvedValue({ id: "newer-event" });
    const entitlements = { invalidate: jest.fn() };
    const service = new BillingWebhookService(prisma as never, config as never, entitlements as never, { billingWebhookDeadLettered: jest.fn() } as never);
    const request = stripeRequest(event);

    await expect(service.process("stripe", request.signature, request.rawBody)).resolves.toEqual({ duplicate: false, ignored: true });
    expect(prisma.subscription.update).not.toHaveBeenCalled();
    expect(entitlements.invalidate).not.toHaveBeenCalled();
  });

  it("retries failed events from their normalized ledger data", async () => {
    const prisma = makePrisma();
    prisma.billingWebhookEvent.updateMany.mockResolvedValue({ count: 1 });
    prisma.billingWebhookEvent.findMany.mockResolvedValue([{ provider: "stripe", payloadHash: "hash", eventData: event }]);
    prisma.billingWebhookEvent.findUnique
      .mockResolvedValueOnce({ id: "ledger-1", status: "FAILED" })
      .mockResolvedValueOnce({ id: "ledger-1", attemptCount: 2 });
    prisma.subscription.findFirst.mockResolvedValue({ id: "subscription-1", organizationId: "org-1", planId: null, status: "ACTIVE" });
    prisma.billingWebhookEvent.findFirst.mockResolvedValue(null);
    prisma.subscription.update.mockResolvedValue({ id: "subscription-1", organizationId: "org-1", planId: null, status: "ACTIVE" });
    const service = new BillingWebhookService(prisma as never, config as never, { invalidate: jest.fn() } as never, { billingWebhookDeadLettered: jest.fn() } as never);

    await expect(service.retryFailedEvents()).resolves.toEqual({ attempted: 1, succeeded: 1 });
    expect(prisma.subscription.update).toHaveBeenCalled();
  });

  it("rejects a concurrent claim for a failed event", async () => {
    const prisma = makePrisma();
    prisma.billingWebhookEvent.findUnique.mockResolvedValue({ id: "ledger-1", status: "FAILED" });
    prisma.billingWebhookEvent.updateMany.mockResolvedValue({ count: 0 });
    const service = new BillingWebhookService(prisma as never, config as never, { invalidate: jest.fn() } as never, { billingWebhookDeadLettered: jest.fn() } as never);
    const request = stripeRequest(event);

    await expect(service.process("stripe", request.signature, request.rawBody)).rejects.toMatchObject({ code: "INTERNAL_ERROR" });
  });

  it("moves an event to the dead-letter state after the final failed attempt", async () => {
    const prisma = makePrisma();
    prisma.billingWebhookEvent.findUnique.mockResolvedValue(null);
    prisma.billingWebhookEvent.create.mockResolvedValue({ id: "ledger-1", attemptCount: 1 });
    prisma.subscription.findFirst.mockRejectedValue(new Error("database unavailable"));
    const metrics = { billingWebhookDeadLettered: jest.fn() };
    const service = new BillingWebhookService(
      prisma as never,
      { ...config, billing: { ...config.billing, webhookMaxRetryAttempts: 1 } } as never,
      { invalidate: jest.fn() } as never,
      metrics as never,
    );
    const request = stripeRequest(event);

    await expect(service.process("stripe", request.signature, request.rawBody)).rejects.toThrow("database unavailable");
    expect(prisma.billingWebhookEvent.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "DEAD_LETTER", nextRetryAt: null, deadLetteredAt: expect.any(Date) }),
    }));
    expect(metrics.billingWebhookDeadLettered).toHaveBeenCalledTimes(1);
  });

  it("dead-letters a timed-out processing event that has exhausted retries", async () => {
    const prisma = makePrisma();
    prisma.billingWebhookEvent.updateMany
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 0 });
    prisma.billingWebhookEvent.findMany.mockResolvedValue([]);
    const metrics = { billingWebhookDeadLettered: jest.fn() };
    const service = new BillingWebhookService(prisma as never, config as never, { invalidate: jest.fn() } as never, metrics as never);

    await expect(service.retryFailedEvents()).resolves.toEqual({ attempted: 0, succeeded: 0 });
    expect(prisma.billingWebhookEvent.updateMany).toHaveBeenFirstCalledWith(expect.objectContaining({
      where: expect.objectContaining({ status: "PROCESSING", attemptCount: { gte: config.billing.webhookMaxRetryAttempts } }),
      data: expect.objectContaining({ status: "DEAD_LETTER", deadLetteredAt: expect.any(Date) }),
    }));
    expect(metrics.billingWebhookDeadLettered).toHaveBeenCalledWith(2);
  });
});