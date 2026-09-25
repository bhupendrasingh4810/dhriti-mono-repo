import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";
import { setAuthCookies } from "@/lib/auth/cookie-helpers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendResponse = await authService.verifyEmail(body);

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: backendResponse.status });
    }

    const tokens = await backendResponse.json();
    const response = NextResponse.json({ user: tokens.user });
    setAuthCookies(response, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
