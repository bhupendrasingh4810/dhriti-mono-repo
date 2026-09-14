import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/auth/verify-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}));
      return NextResponse.json({ error: error.message || "Unable to verify your email." }, { status: backendResponse.status });
    }

    const tokens = await backendResponse.json();
    const response = NextResponse.json(tokens);
    response.cookies.set("refresh_token", tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.refreshTokenExpiresIn,
      path: "/",
    });
    response.cookies.set("access_token", tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.accessTokenExpiresIn,
      path: "/",
    });
    response.cookies.set("user", JSON.stringify(tokens.user), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: tokens.refreshTokenExpiresIn,
      path: "/",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}