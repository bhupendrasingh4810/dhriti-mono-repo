import { randomUUID } from "node:crypto";
import { NotificationType, type Prisma } from "@prisma/client";
import { isolatedPrisma } from "../../database/isolated-prisma.test-helper";
import { NotificationService } from "./notification.service";
import { NotificationWorker } from "./notification-worker.service";
import { enqueueNotification } from "./notification-events";
import { AppSettingsService } from "../settings/app-settings.service";
import { ConnectService } from "../connect/connect.service";
import { FlowService } from "../flow/flow.service";
import { AtlasService } from "../atlas/atlas.service";
import { CadenceService } from "../cadence/cadence.service";
import { HrmsOperationsService } from "../hrms/services/hrms-operations.service";
import { OrganizationService } from "../organization/services/organization.service";
import { OrganizationAdminService } from "../control/organization/organization.service";

const databaseTests = process.env.NOTIFICATION_DATABASE_TESTS === "true" ? describe : describe.skip;

databaseTests("Durable notification platform", () => {
  const database = isolatedPrisma();
  const { prisma } = database;
  const organizationId = randomUUID();
  const otherOrganizationId = randomUUID();
  const userId = randomUUID();
  const actorId = randomUUID();
  const otherUserId = randomUUID();
  const newMemberId = randomUUID();
  const email = { send: jest.fn().mockResolvedValue(undefined) };
  const redis = { raw: { publish: jest.fn().mockResolvedValue(1) } };
  const settings = {
    effectiveManualStatus: jest.fn().mockReturnValue("available"),
    isWithinQuietHours: jest.fn().mockReturnValue(false),
  };
  const config = { webAppUrl: "https://app.example.test" };
  const service = new NotificationService(prisma as never, email as never);
  const worker = new NotificationWorker(
    prisma as never,
    email as never,
    redis as never,
    settings as never,
    config as never,
  );
  const types = Object.values(NotificationType);
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  const appSettings = new AppSettingsService(prisma as never);

  async function queue(type: NotificationType = "SYSTEM") {
    return service.create(organizationId, { userId, type, title: "Test activity" });
  }
  async function drainDeliveries() {
    while (await worker.deliverNext(organizationId)) {
      /* bounded by fixture rows */
    }
  }
  beforeAll(async () => {
    await database.setup();
    await prisma.organization.createMany({
      data: [organizationId, otherOrganizationId].map((id) => ({
        id,
        name: "Notification fixture",
        slug: `notification-test-${id}`,
      })),
    });
    await prisma.user.createMany({
      data: [userId, actorId, otherUserId, newMemberId].map((id) => ({
        id,
        name: "Test member",
        email: `${id}@example.test`,
      })),
    });
    await prisma.organizationMember.createMany({
      data: [
        { organizationId, userId },
        { organizationId, userId: actorId },
        { organizationId: otherOrganizationId, userId: otherUserId },
      ],
    });
  }, 60000);
  beforeEach(async () => {
    await prisma.notificationOutbox.deleteMany({ where: { organizationId } });
    await prisma.notification.deleteMany({ where: { organizationId } });
    await prisma.notificationPreference.deleteMany({ where: { organizationId } });
    await prisma.organizationMember.updateMany({ where: { organizationId, userId }, data: { status: "ACTIVE" } });
    email.send.mockReset().mockResolvedValue(undefined);
    redis.raw.publish.mockClear();
  });
  afterAll(async () => {
    try {
      await prisma.organization.deleteMany({ where: { id: { in: [organizationId, otherOrganizationId] } } });
      await prisma.user.deleteMany({ where: { id: { in: [userId, actorId, otherUserId, newMemberId] } } });
    } finally {
      await database.cleanup();
    }
  });

  it("persists preferences for every app and isolates tenant/user queries", async () => {
    for (const type of types) {
      await service.upsertPreference(organizationId, userId, { type, inApp: false, email: false });
    }
    const fresh = new NotificationService(prisma as never, email as never);
    expect((await fresh.listPreferences(organizationId, userId)).map(({ type }) => type).sort()).toEqual(
      [...types].sort(),
    );
    expect(await fresh.listPreferences(otherOrganizationId, userId)).toEqual([]);
    expect(await fresh.listPreferences(organizationId, otherUserId)).toEqual([]);
  });

  it.each([
    [true, true],
    [false, true],
    [true, false],
    [false, false],
  ])("always retains history with independent live=%s email=%s channels", async (inApp, emailEnabled) => {
    for (const type of types) {
      await service.upsertPreference(organizationId, userId, { type, inApp, email: emailEnabled });
      await queue(type);
      expect(await worker.processNextEvent(organizationId)).toBe(true);
    }
    expect(await prisma.notification.count({ where: { organizationId, userId } })).toBe(types.length);
    await drainDeliveries();
    expect(redis.raw.publish).toHaveBeenCalledTimes(inApp ? types.length : 0);
    expect(email.send).toHaveBeenCalledTimes(emailEnabled ? types.length : 0);
  });

  it("rolls back business mutations and outbox together", async () => {
    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user.update({ where: { id: userId }, data: { name: "Must roll back" } });
        await enqueueNotification(tx, {
          organizationId,
          actorId,
          type: "SYSTEM",
          sourceType: "system",
          recipientIds: [userId],
          title: "Rollback",
          path: "home",
        });

        throw new Error("Aborted mutation");
      }),
    ).rejects.toThrow("Aborted mutation");
    expect((await prisma.user.findUniqueOrThrow({ where: { id: userId } })).name).toBe("Test member");
    expect(await prisma.notificationOutbox.count({ where: { organizationId } })).toBe(0);
  });

  it("enqueues direct messages atomically and deduplicates retried message submissions", async () => {
    const channel = await prisma.channel.create({
      data: {
        organizationId,
        createdById: actorId,
        type: "DIRECT",
        name: "Fixture conversation",
        members: { create: [{ userId: actorId }, { userId }] },
      },
    });
    const connect = new ConnectService(
      prisma as never,
      audit as never,
      {
        messageCreated: jest.fn(),
        chatActivityChanged: jest.fn(),
      } as never,
      {} as never,
      {} as never,
      appSettings,
      service,
    );
    const dto = { content: "Fixture message", clientMessageId: randomUUID() };
    const message = await connect.createMessage(organizationId, channel.id, actorId, dto);
    await connect.createMessage(organizationId, channel.id, actorId, dto);
    expect(await prisma.message.count({ where: { id: message.id } })).toBe(1);
    expect(await prisma.notificationOutbox.findMany({ where: { organizationId } })).toEqual([
      expect.objectContaining({ type: "DIRECT_MESSAGE", actorId, recipientId: userId, sourceId: channel.id }),
    ]);
  });

  it("enqueues Flow assignment and Atlas comment notifications in their mutations", async () => {
    const project = await prisma.project.create({
      data: { organizationId, key: "TEST", name: "Fixture project" },
    });
    const flow = new FlowService(prisma as never, audit as never, {} as never, appSettings);
    const issue = await flow.createIssue(organizationId, project.id, actorId, {
      title: "Fixture issue",
      assigneeId: userId,
    });
    expect(await prisma.notificationOutbox.findFirst({ where: { organizationId, sourceId: issue.id } })).toMatchObject({
      type: "FLOW_ASSIGNMENT",
      recipientId: userId,
    });
    const space = await prisma.atlasSpace.create({
      data: { organizationId, key: "GUIDE", name: "Fixture space", createdById: actorId },
    });
    const page = await prisma.atlasPage.create({
      data: { organizationId, spaceId: space.id, title: "Fixture page", createdById: userId },
    });
    const atlas = new AtlasService(prisma as never, audit as never, appSettings);
    await atlas.addComment(organizationId, page.id, actorId, { content: "Fixture comment" });
    expect(await prisma.notificationOutbox.findFirst({ where: { organizationId, sourceId: page.id } })).toMatchObject({
      type: "ATLAS_COMMENT",
      recipientId: userId,
      payload: expect.not.objectContaining({ body: "Fixture comment" }),
    });
  });

  it("notifies Cadence team members and participants without exposing anonymous feedback", async () => {
    const team = await prisma.team.create({
      data: {
        organizationId,
        name: "Fixture team",
        slug: "fixture-team",
        members: { create: [{ userId }, { userId: actorId }] },
      },
    });
    const cadence = new CadenceService(prisma as never, audit as never, appSettings);
    const session = await cadence.createSession(organizationId, actorId, {
      title: "Fixture session",
      type: "RETROSPECTIVE",
      teamId: team.id,
    });
    await prisma.cadenceCard.create({
      data: { sessionId: session.id, authorId: userId, content: "Anonymous fixture", column: "good" },
    });
    await cadence.setPhase(organizationId, session.id, actorId, "DONE");
    const events = await prisma.notificationOutbox.findMany({ where: { organizationId, sourceId: session.id } });
    expect(events.map((event) => event.type).sort()).toEqual(["CADENCE_INVITATION", "CADENCE_RESULTS"]);
    expect(
      events.every(
        (event) => event.recipientId === userId && !JSON.stringify(event.payload).includes("Anonymous fixture"),
      ),
    ).toBe(true);
  });

  it("notifies HR reviewers, employees and Control role recipients using generic previews", async () => {
    await prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId: actorId } },
      data: { isOwner: true },
    });
    const employee = await prisma.hrmsEmployee.create({
      data: { organizationId, userId, employeeNumber: "FIXTURE", status: "ACTIVE" },
    });
    const hrms = new HrmsOperationsService(prisma as never, audit as never, appSettings);
    const leave = await hrms.createLeave(organizationId, userId, {
      employeeId: employee.id,
      leaveType: "VACATION",
      startDate: "2026-11-02",
      endDate: "2026-11-02",
      totalDays: 1,
      reason: "Private fixture reason",
    });
    await hrms.updateLeaveStatus(organizationId, leave.id, actorId, "APPROVED");
    const payroll = await prisma.hrmsPayrollRecord.create({
      data: {
        organizationId,
        employeeId: employee.id,
        period: "2026-11",
        periodStart: new Date("2026-11-01"),
        periodEnd: new Date("2026-11-30"),
        payDate: new Date("2026-11-30"),
        grossSalary: 12345,
        totalDeductions: 500,
        netPay: 11845,
      },
    });
    await hrms.approvePayroll(organizationId, payroll.id, actorId);
    const membership = await prisma.organizationMember.findUniqueOrThrow({
      where: { organizationId_userId: { organizationId, userId } },
    });
    const control = new OrganizationService(prisma as never, audit as never, {} as never);
    await control.updateMemberRole(organizationId, membership.id, actorId, "ADMIN");
    const events = await prisma.notificationOutbox.findMany({ where: { organizationId } });
    expect(events.map((event) => event.type).sort()).toEqual([
      "CONTROL_ROLE_CHANGE",
      "HRMS_LEAVE_DECISION",
      "HRMS_LEAVE_REQUEST",
      "HRMS_PAYROLL",
    ]);
    expect(events.find((event) => event.type === "HRMS_LEAVE_REQUEST")?.recipientId).toBe(actorId);
    expect(JSON.stringify(events.map((event) => event.payload))).not.toContain("Private fixture reason");
    expect(JSON.stringify(events.map((event) => event.payload))).not.toContain("12345");
  });
  it("enqueues Control membership and organization-settings events in their transactions", async () => {
    const control = new OrganizationService(
      prisma as never,
      audit as never,
      {
        assertWithinLimit: jest.fn().mockResolvedValue(undefined),
      } as never,
    );
    await control.addMember(organizationId, actorId, `${newMemberId}@example.test`, "ADMIN");
    expect(
      await prisma.notificationOutbox.findFirst({ where: { organizationId, type: "CONTROL_MEMBERSHIP" } }),
    ).toMatchObject({ recipientId: newMemberId, actorId });
    await prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId, userId } },
      data: { isOwner: true },
    });
    const admin = new OrganizationAdminService(prisma as never, audit as never);
    await admin.updateSettings(organizationId, actorId, { locale: "en-IN" });
    expect(
      await prisma.notificationOutbox.findFirst({ where: { organizationId, type: "CONTROL_SETTINGS_CHANGE" } }),
    ).toMatchObject({ recipientId: userId, payload: expect.objectContaining({ path: "control/org/settings" }) });
  });

  it("deduplicates recipients, excludes actors and remains idempotent on replay", async () => {
    const event = {
      organizationId,
      actorId,
      type: "SYSTEM" as const,
      sourceType: "system",
      recipientIds: [userId, userId, actorId],
      title: "Once",
      path: "home",
      dedupKey: randomUUID(),
    };
    await prisma.$transaction((tx) => enqueueNotification(tx, event));
    await prisma.$transaction((tx) => enqueueNotification(tx, event));
    expect(await prisma.notificationOutbox.count({ where: { organizationId } })).toBe(1);
    await worker.processNextEvent(organizationId);
    await prisma.notificationOutbox.updateMany({ where: { organizationId }, data: { status: "PENDING" } });
    await worker.processNextEvent(organizationId);
    expect(await prisma.notification.count({ where: { organizationId } })).toBe(1);
    expect(await prisma.notificationDelivery.count({ where: { notification: { organizationId } } })).toBe(2);
  });

  it("claims events concurrently without duplicate inbox records", async () => {
    await Promise.all([queue(), queue(), queue(), queue()]);
    await Promise.all(Array.from({ length: 4 }, () => worker.processNextEvent(organizationId)));
    expect(await prisma.notification.count({ where: { organizationId } })).toBe(4);
    expect(await worker.processNextEvent(organizationId)).toBe(false);
  });

  it("does not deliver to inactive or foreign-organization recipients", async () => {
    await prisma.organizationMember.updateMany({ where: { organizationId, userId }, data: { status: "SUSPENDED" } });
    await queue();
    await service.create(organizationId, { userId: otherUserId, type: "SYSTEM", title: "Wrong tenant" });
    await worker.processNextEvent(organizationId);
    await worker.processNextEvent(organizationId);
    expect(await prisma.notification.count({ where: { organizationId } })).toBe(0);
    expect(await prisma.notificationOutbox.count({ where: { organizationId, status: "SKIPPED" } })).toBe(2);
  });

  it("rechecks membership and preferences immediately before delivery", async () => {
    await queue();
    await worker.processNextEvent(organizationId);
    await service.upsertPreference(organizationId, userId, { type: "SYSTEM", inApp: false, email: false });
    await drainDeliveries();
    expect(redis.raw.publish).not.toHaveBeenCalled();
    expect(email.send).not.toHaveBeenCalled();
    expect(await prisma.notification.count({ where: { organizationId } })).toBe(1);
  });

  it("retries email failures independently, with bounded dead-letter status", async () => {
    const failure = new Error("Provider unavailable");
    email.send.mockRejectedValue(failure);
    await queue();
    await worker.processNextEvent(organizationId);
    await drainDeliveries();
    const delivery = await prisma.notificationDelivery.findFirstOrThrow({
      where: { channel: "EMAIL", notification: { organizationId } },
    });
    expect(delivery).toMatchObject({ status: "PENDING", attempts: 1, lastError: failure.message });
    expect(redis.raw.publish).toHaveBeenCalledTimes(1);
    await prisma.notificationDelivery.update({
      where: { id: delivery.id },
      data: { attempts: 7, availableAt: new Date(0) },
    });
    await worker.deliverNext(organizationId);
    expect(await prisma.notificationDelivery.findUnique({ where: { id: delivery.id } })).toMatchObject({
      status: "FAILED",
      attempts: 8,
    });
  });

  it("recovers expired leases and does not leave crashed attempts retrying forever", async () => {
    await queue();
    await worker.processNextEvent(organizationId);
    await prisma.notificationDelivery.updateMany({
      where: { notification: { organizationId } },
      data: { status: "PROCESSING", leaseUntil: new Date(0), leaseToken: randomUUID(), attempts: 8 },
    });
    await drainDeliveries();
    expect(
      await prisma.notificationDelivery.count({ where: { notification: { organizationId }, status: "FAILED" } }),
    ).toBe(2);
    expect(email.send).not.toHaveBeenCalled();
    expect(redis.raw.publish).not.toHaveBeenCalled();
  });

  it("records poison payload retries without losing the outbox event", async () => {
    await prisma.notificationOutbox.create({
      data: {
        organizationId,
        recipientId: userId,
        sourceType: "system",
        type: "SYSTEM",
        payload: {},
      },
    });
    await worker.processNextEvent(organizationId);
    expect(await prisma.notificationOutbox.findFirst({ where: { organizationId } })).toMatchObject({
      status: "PENDING",
      attempts: 1,
      lastError: "Invalid notification event payload",
    });
    await prisma.notificationOutbox.updateMany({
      where: { organizationId },
      data: { attempts: 7, availableAt: new Date(0) },
    });
    await worker.processNextEvent(organizationId);
    expect(await prisma.notificationOutbox.findFirst({ where: { organizationId } })).toMatchObject({
      status: "FAILED",
      attempts: 8,
    });
  });

  it("recovers SQL errors through a savepoint and persists retry diagnostics", async () => {
    await queue();
    const failingWorker = new NotificationWorker(
      {
        $transaction: (callback: (tx: Prisma.TransactionClient) => Promise<boolean>) =>
          prisma.$transaction(async (tx) => {
            const spy = jest.spyOn(tx.notification, "upsert").mockImplementationOnce(() => {
              throw Object.assign(new Error("SQL write failed"), { code: "P2002" });
            });
            try {
              return await callback(tx);
            } finally {
              spy.mockRestore();
            }
          }),
      } as never,
      email as never,
      redis as never,
      settings as never,
      config as never,
    );
    await failingWorker.processNextEvent(organizationId);
    expect(await prisma.notificationOutbox.findFirst({ where: { organizationId } })).toMatchObject({
      attempts: 1,
      lastError: "SQL write failed",
    });
  });

  it("separates seen from read, scopes updates and uses stable pagination", async () => {
    await queue();
    await queue();
    await queue();
    await worker.processNextEvent(organizationId);
    await worker.processNextEvent(organizationId);
    await worker.processNextEvent(organizationId);
    const first = await service.list(organizationId, userId, { limit: 2 });
    expect(first).toMatchObject({ unreadCount: 3, unseenCount: 3 });
    expect(first.notifications).toHaveLength(2);
    expect(first.nextCursor).not.toBeNull();
    const older = await service.list(organizationId, userId, { limit: 2, cursor: first.nextCursor ?? undefined });
    expect(older.notifications).toHaveLength(1);
    expect(older.notifications.some((item) => first.notifications.some((other) => other.id === item.id))).toBe(false);
    await service.markSeen(
      organizationId,
      otherUserId,
      first.notifications.map((item) => item.id),
    );
    expect((await service.list(organizationId, userId, {})).unseenCount).toBe(3);
    await service.markSeen(
      organizationId,
      userId,
      first.notifications.map((item) => item.id),
    );
    expect(await service.list(organizationId, userId, {})).toMatchObject({ unreadCount: 3, unseenCount: 1 });
    await service.markRead(organizationId, userId, older.notifications[0].id);
    expect(await service.list(organizationId, userId, {})).toMatchObject({ unreadCount: 2, unseenCount: 0 });
    expect(await service.markAllRead(organizationId, userId)).toBe(2);
    expect((await service.list(otherOrganizationId, userId, {})).notifications).toEqual([]);
  });
});
