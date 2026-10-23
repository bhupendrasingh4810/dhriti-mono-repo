import { NextRequest, NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { apiServiceRequest } from "@/services/api.service";

export const runtime = "nodejs";

const TOKEN_TTL_SECONDS = 60 * 60;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TokenRequest = {
  callId?: unknown;
};

type CallTokenAccess = {
  channel: string;
  userId: string;
};

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TokenRequest | null;
  const callId = typeof body?.callId === "string" ? body.callId.trim() : "";

  if (!UUID_PATTERN.test(callId)) {
    return NextResponse.json({ message: "Invalid call." }, { status: 400 });
  }

  const accessResponse = await apiServiceRequest(`/organization/connect/calls/${callId}/token-access`, {
    method: "GET",
    headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
  });
  if (!accessResponse.ok) {
    const status = accessResponse.status === 401 ? 401 : accessResponse.status === 403 ? 403 : 502;
    return NextResponse.json(
      { message: status === 403 ? "Call access is not available." : "Unable to authorize the call." },
      { status },
    );
  }
  const access = (await accessResponse.json()) as CallTokenAccess;

  const appId = process.env.AGORA_APP_ID ?? process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json({ message: "Call service is not configured." }, { status: 503 });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    access.channel,
    access.userId,
    RtcRole.PUBLISHER,
    expiresAt,
  );

  return NextResponse.json({ appId, token, uid: access.userId, channel: access.channel, expiresAt });
}
