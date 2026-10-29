import { HttpStatus } from "@nestjs/common";
import type { Socket } from "socket.io";

import { AppError } from "../common/errors/app-error";
import { ErrorCode } from "../common/errors/error-codes";
import type { ConnectService } from "../modules/connect/connect.service";
import { WebRtcGateway } from "./webrtc.gateway";
import type { WsAuthService } from "./ws-auth";

describe("WebRtcGateway", () => {
  const organizationId = "b133000b-57b0-4ca3-9063-13a1e25cf2d1";
  const channelId = "79365cb2-b0b1-48f9-aa54-e5c5685d80ec";
  const principal = {
    userId: "5c168e08-9bbc-4e2f-9911-696d315abbe5",
    sessionId: "session-id",
    organizationId,
    email: "member@example.test",
  };
  const peerPrincipal = { ...principal, userId: "db276a4d-2e9a-4a35-91a0-57168fd415e5" };

  let connect: { getChannelForMember: jest.Mock };
  let wsAuth: { getPrincipal: jest.Mock };
  let server: { to: jest.Mock };
  let gateway: WebRtcGateway;

  const socket = (id: string): Socket =>
    ({
      id,
      join: jest.fn().mockResolvedValue(undefined),
      leave: jest.fn().mockResolvedValue(undefined),
      to: jest.fn().mockReturnValue({ emit: jest.fn() }),
    }) as unknown as Socket;

  beforeEach(() => {
    connect = { getChannelForMember: jest.fn().mockResolvedValue({ id: channelId }) };
    wsAuth = { getPrincipal: jest.fn() };
    server = { to: jest.fn().mockReturnValue({ emit: jest.fn() }) };
    gateway = new WebRtcGateway(wsAuth as unknown as WsAuthService, connect as unknown as ConnectService);
    Reflect.set(gateway, "server", server);
  });

  it("requires channel membership before joining a call", async () => {
    const caller = socket("caller-socket");
    wsAuth.getPrincipal.mockReturnValue(principal);
    connect.getChannelForMember.mockRejectedValue(
      new AppError(ErrorCode.FORBIDDEN, "Not a channel member", HttpStatus.FORBIDDEN),
    );

    await expect(gateway.joinCall(caller, { channelId })).rejects.toMatchObject({ code: ErrorCode.FORBIDDEN });
    expect(caller.join).not.toHaveBeenCalled();
  });

  it("relays signaling only between active participants in the same call", async () => {
    const caller = socket("caller-socket");
    const peer = socket("peer-socket");
    wsAuth.getPrincipal
      .mockReturnValueOnce(principal)
      .mockReturnValueOnce(peerPrincipal)
      .mockReturnValueOnce(principal)
      .mockReturnValueOnce(principal);

    await gateway.joinCall(caller, { channelId });
    await gateway.joinCall(peer, { channelId });
    await expect(gateway.signal(caller, { channelId, to: "unknown-socket", data: "offer" })).rejects.toMatchObject({
      code: ErrorCode.FORBIDDEN,
    });

    await expect(gateway.signal(caller, { channelId, to: "peer-socket", data: "offer" })).resolves.toEqual({
      ok: true,
    });
    expect(server.to).toHaveBeenCalledWith("peer-socket");
  });
});
