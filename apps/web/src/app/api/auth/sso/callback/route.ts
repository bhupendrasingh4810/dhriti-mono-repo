import { NextRequest, NextResponse } from "next/server";
import { apiServiceRequest } from "@/services/api.service";
import { setAuthCookies } from "@/lib/auth/cookie-helpers";

export async function GET(request: NextRequest) {
  let response: NextResponse;
  try {
    const binding = request.cookies.get("oidc_binding")?.value;
    if (!binding) throw new Error("Missing SSO browser binding");
    const result = await apiServiceRequest("/auth/sso/callback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callbackUrl: request.url, binding }),
    });
    if (!result.ok) throw new Error(`SSO callback rejected (${result.status})`);
    const tokens: {
      accessToken: string;
      refreshToken: string;
      accessTokenExpiresIn: number;
      refreshTokenExpiresIn: number;
      mustResetPassword: boolean;
      user: { organization: { slug: string } | null };
    } = await result.json();
    const slug = tokens.user.organization?.slug;
    if (!slug) throw new Error("SSO response is missing its organization");
    const destination = tokens.mustResetPassword
      ? "/reset-password?required=true"
      : `/${encodeURIComponent(slug)}/home`;
    response = NextResponse.redirect(new URL(destination, request.url));
    setAuthCookies(response, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: tokens.user,
      accessTokenMaxAge: tokens.accessTokenExpiresIn,
      refreshTokenMaxAge: tokens.refreshTokenExpiresIn,
    });
  } catch (error) {
    console.error("Unable to complete SSO", error instanceof Error ? error.message : "API unavailable");
    response = NextResponse.redirect(new URL("/login?ssoError=failed", request.url));
  }
  response.cookies.set("oidc_binding", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/api/auth/sso",
    maxAge: 0,
  });
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}
