import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";
import { setAuthCookies } from "@/lib/auth/cookie-helpers";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    const loginResponse = await authService.login({ email, password });
    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      return NextResponse.json(error, { status: loginResponse.status });
    }

    const tokens = await loginResponse.json();
    const { user } = tokens;
    const response = NextResponse.json({ user });
    setAuthCookies(response, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      accessTokenMaxAge: tokens.accessTokenExpiresIn,
      refreshTokenMaxAge: tokens.refreshTokenExpiresIn,
    });
    return response;
  } catch {
    return NextResponse.json({ error: { message: "Unable to sign in." } }, { status: 500 });
  }
}
