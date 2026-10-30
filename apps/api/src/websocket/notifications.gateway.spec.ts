import { Logger } from "@nestjs/common";
import { NotificationsGateway } from "./notifications.gateway";
import { NOTIFICATION_UPDATES_CHANNEL } from "../modules/notification/notification-worker.service";

describe("Notification realtime routing", () => {
  const principal = { organizationId: "tenant", userId: "member", sessionId: "session" };
  const auth = { authenticate: jest.fn() };
  const prisma = { organizationMember: { findFirst: jest.fn() } };
  const subscriber = {
    connect: jest.fn().mockResolvedValue(undefined),
    subscribe: jest.fn().mockResolvedValue(undefined),
    on: jest.fn(),
    quit: jest.fn().mockResolvedValue(undefined),
  };
  const redis = { raw: { duplicate: jest.fn().mockReturnValue(subscriber) } };
  const emit = jest.fn();
  const namespace = { local: { to: jest.fn().mockReturnValue({ emit }) }, sockets: new Map() };
  const socket = { id: "socket", join: jest.fn().mockResolvedValue(undefined), disconnect: jest.fn() };
  let gateway: NotificationsGateway;
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    auth.authenticate.mockResolvedValue(principal);
    prisma.organizationMember.findFirst.mockResolvedValue({ id: "membership" });
    gateway = new NotificationsGateway(auth as never, prisma as never, redis as never);
    Reflect.set(gateway, "server", namespace);
    namespace.sockets.set(socket.id, socket);
    await gateway.onModuleInit();
  });
  afterEach(async () => {
    await gateway.onModuleDestroy();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });
  it("joins only the authenticated tenant/user room", async () => {
    await gateway.handleConnection(socket as never);
    expect(socket.join).toHaveBeenCalledWith("tenant:member");
    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith({
      where: { organizationId: "tenant", userId: "member", status: "ACTIVE", deletedAt: null },
      select: { id: true },
    });
  });
  it("disconnects sockets with invalid sessions or inactive membership", async () => {
    auth.authenticate.mockRejectedValueOnce(new Error("Revoked session"));
    await gateway.handleConnection(socket as never);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
    prisma.organizationMember.findFirst.mockResolvedValueOnce(null);
    await gateway.handleConnection(socket as never);
    expect(socket.join).not.toHaveBeenCalled();
  });
  it("fans out invalidations locally without exposing notification payloads", () => {
    expect(subscriber.subscribe).toHaveBeenCalledWith(NOTIFICATION_UPDATES_CHANNEL);
    const handler = subscriber.on.mock.calls[0][1] as (channel: string, message: string) => void;
    handler(NOTIFICATION_UPDATES_CHANNEL, JSON.stringify({ ...principal, title: "Not emitted" }));
    expect(namespace.local.to).toHaveBeenCalledWith("tenant:member");
    expect(emit).toHaveBeenCalledWith("notifications:changed", {});
    emit.mockClear();
    handler(NOTIFICATION_UPDATES_CHANNEL, "malformed");
    expect(emit).not.toHaveBeenCalled();
  });
  it("rechecks session and membership validity on existing connections", async () => {
    await gateway.handleConnection(socket as never);
    auth.authenticate.mockRejectedValueOnce(new Error("Expired token"));
    await jest.advanceTimersByTimeAsync(60000);
    expect(auth.authenticate).toHaveBeenCalledTimes(2);
    expect(socket.disconnect).toHaveBeenCalledWith(true);
  });
});
