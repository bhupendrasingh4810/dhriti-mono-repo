import { NextRequest, NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder } from "agora-access-token";
import { authService } from "@/services/auth.server";

export const runtime = "nodejs";

const TOKEN_TTL_SECONDS = 60 * 60;
const CHANNEL_NAME_PATTERN = /^[A-Za-z0-9 !#$%&()+\-:;<=>?@\[\]^_{|}~,.]{1,64}$/;

type AuthenticatedUser = {
  id: string;
};

type TokenRequest = {
  channel?: unknown;
};

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const authResponse = await authService.me(accessToken);
  if (!authResponse.ok) {
    return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as TokenRequest | null;
  const channel = typeof body?.channel === "string" ? body.channel.trim() : "";

  if (!CHANNEL_NAME_PATTERN.test(channel)) {
    return NextResponse.json({ message: "Invalid call channel." }, { status: 400 });
  }

  const appId = process.env.AGORA_APP_ID ?? process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCertificate = process.env.AGORA_APP_CERTIFICATE;

  if (!appId || !appCertificate) {
    return NextResponse.json({ message: "Call service is not configured." }, { status: 503 });
  }

  const user = (await authResponse.json()) as AuthenticatedUser;
  const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCertificate,
    channel,
    user.id,
    RtcRole.PUBLISHER,
    expiresAt,
  );

  return NextResponse.json({ appId, token, uid: user.id, expiresAt });
}