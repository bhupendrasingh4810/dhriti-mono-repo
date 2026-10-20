import { HttpStatus } from "@nestjs/common";
import type { Socket } from "socket.io";

import { MetricsService } from "../common/metrics/metrics.service";
import { AppError } from "../common/errors/app-error";
import { ErrorCode } from "../common/errors/error-codes";
import { ConnectAdapterLifecycleService } from "./connect/connect-adapter-lifecycle.service";
import { ConnectPresenceService } from "./connect/connect-presence.service";
import { ConnectPublisherService } from "./connect/connect-publisher.service";
import { ConnectRateLimitService } from "./connect/connect-rate-limit.service";
import { ConnectGateway } from "./connect.gateway";
import { SessionRevocationSocketService } from "./session-revocation.service";
import { WsAuthService } from "./ws-auth";
import { ConnectService } from "../modules/connect/connect.service";

describe("ConnectGateway", () => {
  const principal = {
    userId: "5c168e08-9bbc-4e2f-9911-696d315abbe5",
    sessionId: "session-id",
    organizationId: "b133000b-57b0-4ca3-9063-13a1e25cf2d1",
    email: "member@example.test",
  };
  const channelId = "79365cb2-b0b1-48f9-aa54-e5c5685d80ec";

  let connect: {
    getChannelForMember: jest.Mock;
    getChannelMemberIds: jest.Mock;
    getUserDisplayName: jest.Mock;
    createCallRecord: jest.Mock;
    updateCallRecord: jest.Mock;
    leaveSharedCall: jest.Mock;
    recordCallActivity: jest.Mock;
  };
  let publisher: { callStatus: jest.Mock; callInvitation: jest.Mock; callAvailable: jest.Mock };
  let socket: Socket;
  let gateway: ConnectGateway;

  beforeEach(() => {
    connect = {
      getChannelForMember: jest.fn().mockResolvedValue({ id: channelId, type: "DIRECT" }),
      getChannelMemberIds: jest.fn().mockResolvedValue([principal.userId, "recipient-id"]),
      getUserDisplayName: jest.fn().mockResolvedValue("Database caller name"),
      createCallRecord: jest.fn().mockResolvedValue(undefined),
      updateCallRecord: jest.fn().mockResolvedValue(undefined),
      leaveSharedCall: jest.fn().mockResolvedValue({ ended: false }),
      recordCallActivity: jest.fn().mockResolvedValue(undefined),
    };
    publisher = { callStatus: jest.fn(), callInvitation: jest.fn(), callAvailable: jest.fn() };
    socket = {
      id: "socket-id",
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      emit: jest.fn(),
    } as unknown as Socket;
    gateway = new ConnectGateway(
      { getPrincipal: jest.fn().mockReturnValue(principal) } as unknown as WsAuthService,
      connect as unknown as ConnectService,
      {} as ConnectAdapterLifecycleService,
      {} as ConnectPresenceService,
      publisher as unknown as ConnectPublisherService,
      { assertAllowed: jest.fn().mockResolvedValue(undefined) } as unknown as ConnectRateLimitService,
      { wsConnected: jest.fn(), wsDisconnected: jest.fn(), wsMessage: jest.fn() } as unknown as MetricsService,
      { bind: jest.fn() } as unknown as SessionRevocationSocketService,
    );
  });

  it("authorizes before joining an organization-scoped channel room", async () => {
    const result = await gateway.joinChannel(socket, { channelId });

    expect(connect.getChannelForMember).toHaveBeenCalledWith(principal.organizationId, channelId, principal.userId, true);
    expect(socket.join).toHaveBeenCalledWith(`connect:org:${principal.organizationId}:channel:${channelId}`);
    expect(result).toEqual({ ok: true });
  });

  it("authorizes before leaving and acknowledges domain errors safely", async () => {
    connect.getChannelForMember.mockRejectedValue(
      new AppError(ErrorCode.FORBIDDEN, "Not a channel member", HttpStatus.FORBIDDEN),
    );

    const result = await gateway.leaveChannel(socket, { channelId });

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith("connect:error", {
      code: ErrorCode.FORBIDDEN,
      message: "Not a channel member",
      status: HttpStatus.FORBIDDEN,
    });
    expect(result).toEqual({
      ok: false,
      error: { code: ErrorCode.FORBIDDEN, message: "Not a channel member", status: HttpStatus.FORBIDDEN },
    });
  });

  it("records a timed-out call as missed instead of declined", async () => {
    const result = await gateway.respondToCall(socket, {
      channelId,
      callId: "missed-call-id",
      action: "miss",
    });

    expect(publisher.callStatus).toHaveBeenCalledWith(
      principal.organizationId,
      [principal.userId, "recipient-id"],
      "call:cancelled",
      { channelId, callId: "missed-call-id", action: "miss", userId: principal.userId },
    );
    expect(connect.recordCallActivity).toHaveBeenCalledWith(
      principal.organizationId,
      channelId,
      principal.userId,
      { callId: "missed-call-id", action: "missed", durationSeconds: undefined },
    );
    expect(connect.updateCallRecord).toHaveBeenCalledWith(
      principal.organizationId,
      channelId,
      principal.userId,
      { callId: "missed-call-id", action: "miss", durationSeconds: undefined },
    );
    expect(result).toEqual({ ok: true });
  });

  it("publishes a shared-call departure without ending the call while participants remain", async () => {
    const result = await gateway.respondToCall(socket, {
      channelId,
      callId: "shared-call-id",
      action: "leave",
    });

    expect(connect.leaveSharedCall).toHaveBeenCalledWith(
      principal.organizationId,
      channelId,
      principal.userId,
      "shared-call-id",
    );
    expect(publisher.callStatus).toHaveBeenCalledWith(
      principal.organizationId,
      [principal.userId, "recipient-id"],
      "call:left",
      { channelId, callId: "shared-call-id", action: "leave", userId: principal.userId },
    );
    expect(connect.updateCallRecord).not.toHaveBeenCalled();
    expect(result).toEqual({ ok: true });
  });

  it("ends a shared call when the final participant leaves", async () => {
    connect.leaveSharedCall.mockResolvedValue({ ended: true });

    await gateway.respondToCall(socket, {
      channelId,
      callId: "final-shared-call-id",
      action: "leave",
    });

    expect(publisher.callStatus).toHaveBeenCalledWith(
      principal.organizationId,
      [principal.userId, "recipient-id"],
      "call:ended",
      { channelId, callId: "final-shared-call-id", action: "leave", userId: principal.userId },
    );
  });

  it("publishes the initiating caller name for a direct call with a blank conversation name", async () => {
    const result = await gateway.inviteCall(socket, {
      channelId,
      callId: "call-id",
      type: "audio",
      conversationName: "",
      receiverName: "Recipient name",
      callerName: "Initiating caller",
    });

    expect(publisher.callInvitation).toHaveBeenCalledWith(
      principal.organizationId,
      ["recipient-id"],
      expect.objectContaining({
        callerId: principal.userId,
        callerName: "Initiating caller",
        conversationName: "",
        participantIds: [principal.userId, "recipient-id"],
      }),
    );
    expect(connect.createCallRecord).toHaveBeenCalledWith(
      principal.organizationId,
      channelId,
      principal.userId,
      {
        callId: "call-id",
        scope: "one-to-one",
        type: "audio",
        participantIds: [principal.userId, "recipient-id"],
      },
    );
    expect(result).toEqual({ ok: true });
  });
});
