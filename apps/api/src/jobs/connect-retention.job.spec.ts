import { Logger } from "@nestjs/common";

import { ConnectRetentionJob } from "./connect-retention.job";

const now = new Date("2026-10-29T00:00:00.000Z");
const organizationId = "11111111-1111-4111-8111-111111111111";

function makeDependencies() {
  const prisma = {
    connectOrganizationSettings: {
      findMany: jest.fn(),
      findUnique: jest.fn().mockResolvedValue({
        organizationId,
        messageRetentionDays: 30,
        recordingRetentionDays: null,
        retentionEnabledAt: new Date("2026-10-28T00:00:00.000Z"),
      }),
    },
    message: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    post: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    postComment: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    poll: { deleteMany: jest.fn() },
    connectCallRecording: { findMany: jest.fn().mockResolvedValue([]), updateMany: jest.fn() },
    $executeRaw: jest.fn().mockResolvedValue(undefined),
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation((operation: (transaction: typeof prisma) => Promise<unknown>) =>
    operation(prisma),
  );
  const redis = {
    raw: {
      set: jest.fn().mockResolvedValue("OK"),
      eval: jest.fn().mockResolvedValue(1),
    },
  };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const storage = { delete: jest.fn().mockResolvedValue(undefined) };
  const config = { connectRetentionEnabled: true };
  const job = new ConnectRetentionJob(
    prisma as never,
    redis as never,
    audit as never,
    storage as never,
    config as never,
  );
  return { job, prisma, redis, audit, storage, config };
}

describe("ConnectRetentionJob", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is disabled by default through the config flag", async () => {
    const { job, redis, config } = makeDependencies();
    config.connectRetentionEnabled = false;

    await job.run(now);

    expect(redis.raw.set).not.toHaveBeenCalled();
  });

  it("uses only grace-eligible tenant policies and scrubs text from already deleted messages and posts", async () => {
    const { job, prisma, audit } = makeDependencies();
    prisma.connectOrganizationSettings.findMany
      .mockResolvedValueOnce([{ organizationId, messageRetentionDays: 30, recordingRetentionDays: null }])
      .mockResolvedValueOnce([]);
    prisma.message.findMany
      .mockResolvedValueOnce([{ id: "message-1", deletedAt: new Date("2026-10-01T00:00:00.000Z") }])
      .mockResolvedValueOnce([]);
    prisma.post.findMany
      .mockResolvedValueOnce([{ id: "post-1", deletedAt: new Date("2026-10-02T00:00:00.000Z") }])
      .mockResolvedValueOnce([]);
    prisma.postComment.findMany.mockResolvedValueOnce([{ id: "comment-1", deletedAt: null }]).mockResolvedValueOnce([]);
    prisma.poll.deleteMany.mockResolvedValue({ count: 1 });
    prisma.message.updateMany.mockResolvedValue({ count: 1 });
    prisma.post.updateMany.mockResolvedValue({ count: 1 });
    prisma.postComment.updateMany.mockResolvedValue({ count: 1 });

    await job.run(now);

    expect(prisma.connectOrganizationSettings.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ retentionEnabledAt: { lte: now } }),
        take: 1000,
      }),
    );
    expect(prisma.message.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ organizationId }),
    );
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: { organizationId, id: { in: ["message-1"] }, deletedAt: { not: null } },
      data: { content: "", contentHtml: null, isDeleted: true },
    });

    expect(prisma.poll.deleteMany).toHaveBeenNthCalledWith(1, { where: { messageId: { in: ["message-1"] } } });
    expect(prisma.post.updateMany).toHaveBeenCalledWith({
      where: { organizationId, id: { in: ["post-1"] }, deletedAt: { not: null } },
      data: {
        title: null,
        content: "",
        contentHtml: null,
        imageUrl: null,
        backgroundImageUrl: null,
        backgroundColor: null,
      },
    });
    expect(prisma.post.updateMany).toHaveBeenCalledTimes(1);
    expect(prisma.poll.deleteMany).toHaveBeenNthCalledWith(2, { where: { postId: { in: ["post-1"] } } });
    expect(prisma.postComment.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ organizationId, post: expect.objectContaining({ organizationId }) }),
    );
    expect(prisma.postComment.updateMany).toHaveBeenCalledWith({
      where: { organizationId, id: { in: ["comment-1"] }, deletedAt: null },
      data: { content: "", deletedAt: now },
    });
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId, metadata: { messages: 1, posts: 1, recordings: 0 } }),
    );
  });

  it("rechecks the current policy and shared settings lock before destructive message batches", async () => {
    const { job, prisma } = makeDependencies();
    prisma.connectOrganizationSettings.findMany.mockResolvedValue([
      { organizationId, messageRetentionDays: 30, recordingRetentionDays: null },
    ]);
    prisma.connectOrganizationSettings.findUnique.mockResolvedValue({
      organizationId,
      messageRetentionDays: 30,
      recordingRetentionDays: null,
      retentionEnabledAt: new Date("2026-10-30T00:00:00.000Z"),
    });

    await job.run(now);

    expect(prisma.$executeRaw).toHaveBeenCalledWith(
      expect.anything(),
      `${organizationId}:connect`,
    );
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it("uses the current retention days rather than the stale listing snapshot", async () => {
    const { job, prisma } = makeDependencies();
    prisma.connectOrganizationSettings.findMany.mockResolvedValue([
      { organizationId, messageRetentionDays: 30, recordingRetentionDays: null },
    ]);
    prisma.connectOrganizationSettings.findUnique.mockResolvedValue({
      organizationId,
      messageRetentionDays: 90,
      recordingRetentionDays: null,
      retentionEnabledAt: new Date("2026-10-28T00:00:00.000Z"),
    });
    prisma.message.findMany.mockResolvedValue([]);

    await job.run(now);

    expect(prisma.message.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          createdAt: { lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) },
        }),
      }),
    );
  });

  it("stops later batches when the settings grace period is reset during processing", async () => {
    const { job, prisma } = makeDependencies();
    prisma.connectOrganizationSettings.findMany.mockResolvedValue([
      { organizationId, messageRetentionDays: 30, recordingRetentionDays: null },
    ]);
    prisma.connectOrganizationSettings.findUnique
      .mockResolvedValueOnce({
        organizationId,
        messageRetentionDays: 30,
        recordingRetentionDays: null,
        retentionEnabledAt: new Date("2026-10-28T00:00:00.000Z"),
      })
      .mockResolvedValue({
        organizationId,
        messageRetentionDays: 30,
        recordingRetentionDays: null,
        retentionEnabledAt: new Date("2026-10-30T00:00:00.000Z"),
      });
    prisma.message.findMany.mockResolvedValue(
      Array.from({ length: 1000 }, (_, index) => ({ id: `message-${index}`, deletedAt: null })),
    );

    await job.run(now);

    expect(prisma.message.findMany).toHaveBeenCalledTimes(1);
    expect(prisma.message.updateMany).toHaveBeenCalledTimes(1);
  });

  it("deletes a managed recording object before clearing its pointer and is idempotent", async () => {
    const { job, prisma, storage } = makeDependencies();
    const storageUrl = `${organizationId}/recording-id/call.webm`;
    prisma.connectOrganizationSettings.findUnique.mockResolvedValue({
      organizationId,
      messageRetentionDays: null,
      recordingRetentionDays: 30,
      retentionEnabledAt: new Date("2026-10-28T00:00:00.000Z"),
    });
    prisma.connectOrganizationSettings.findMany.mockResolvedValue([
      { organizationId, messageRetentionDays: null, recordingRetentionDays: 30 },
    ]);
    let recordingDeleted = false;
    prisma.connectCallRecording.findMany.mockImplementation(() =>
      Promise.resolve(recordingDeleted ? [] : [{ id: "recording-1", storageUrl }]),
    );
    prisma.connectCallRecording.updateMany.mockImplementation(async () => {
      recordingDeleted = true;
      return { count: 1 };
    });

    await job.run(now);
    await job.run(now);

    expect(storage.delete).toHaveBeenCalledTimes(1);
    expect(storage.delete).toHaveBeenCalledWith(storageUrl);
    expect(prisma.connectCallRecording.updateMany).toHaveBeenCalledWith({
      where: { id: "recording-1", organizationId, storageUrl },
      data: { status: "DELETED", storageUrl: null },
    });
    expect(prisma.connectCallRecording.findMany.mock.calls[0][0].where).toEqual(
      expect.objectContaining({ organizationId }),
    );
  });

  it("keeps the recording pointer when object deletion fails", async () => {
    const { job, prisma, storage } = makeDependencies();
    prisma.connectOrganizationSettings.findUnique.mockResolvedValue({
      organizationId,
      messageRetentionDays: null,
      recordingRetentionDays: 30,
      retentionEnabledAt: new Date("2026-10-28T00:00:00.000Z"),
    });
    prisma.connectOrganizationSettings.findMany
      .mockResolvedValueOnce([{ organizationId, messageRetentionDays: null, recordingRetentionDays: 30 }])
      .mockResolvedValueOnce([]);
    prisma.connectCallRecording.findMany.mockResolvedValueOnce([
      { id: "recording-1", storageUrl: `${organizationId}/recording-id/call.webm` },
    ]);
    storage.delete.mockRejectedValueOnce(new Error("storage unavailable"));
    const logError = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    await job.run(now);

    expect(prisma.connectCallRecording.updateMany).not.toHaveBeenCalled();
    expect(logError).toHaveBeenCalled();
  });

  it("does not clear external recording URLs it cannot delete", async () => {
    const { job, prisma, storage } = makeDependencies();
    prisma.connectOrganizationSettings.findMany
      .mockResolvedValueOnce([{ organizationId, messageRetentionDays: null, recordingRetentionDays: 30 }])
      .mockResolvedValueOnce([]);
    prisma.connectOrganizationSettings.findUnique.mockResolvedValue({
      organizationId,
      messageRetentionDays: null,
      recordingRetentionDays: 30,
      retentionEnabledAt: new Date("2026-10-28T00:00:00.000Z"),
    });
    prisma.connectCallRecording.findMany.mockImplementation((query) =>
      Promise.resolve(
        [
          { id: "recording-1", storageUrl: "https://recording.example/call.webm" },
          { id: "recording-2", storageUrl: `${organizationId}/managed.webm` },
        ]
          .filter(({ id }) => !query.where.id?.gt || id > query.where.id.gt)
          .slice(0, 1),
      ),
    );
    prisma.connectCallRecording.updateMany.mockResolvedValue({ count: 1 });

    await job.run(now);

    expect(prisma.connectCallRecording.findMany).toHaveBeenCalledTimes(3);
    expect(storage.delete).toHaveBeenCalledWith(`${organizationId}/managed.webm`);
    expect(prisma.connectCallRecording.updateMany).toHaveBeenCalledTimes(1);
  });
});
