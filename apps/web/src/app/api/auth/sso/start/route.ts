import { NextRequest, NextResponse } from "next/server";
import { apiServiceRequest } from "@/services/api.service";

export async function GET(request: NextRequest) {
  try {
    const result = await apiServiceRequest("/auth/sso/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationSlug: request.nextUrl.searchParams.get("organization") }),
    });
    if (!result.ok) return NextResponse.redirect(new URL("/login?ssoError=unavailable", request.url));
    const data: { authorizationUrl: string; binding: string } = await result.json();
    const response = NextResponse.redirect(data.authorizationUrl);
    response.cookies.set("oidc_binding", data.binding, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth/sso",
      maxAge: 600,
    });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  } catch (error) {
    console.error("Unable to start SSO", error instanceof Error ? error.message : "API unavailable");
    return NextResponse.redirect(new URL("/login?ssoError=unavailable", request.url));
  }
}
