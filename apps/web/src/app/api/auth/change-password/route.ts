import { NextRequest, NextResponse } from "next/server";

import { clearAuthCookies } from "@/lib/auth/cookie-helpers";
import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (!accessToken) {
    return NextResponse.json({ error: { message: "Please sign in again." } }, { status: 401 });
  }

  try {
    const backendResponse = await authService.changePassword(accessToken, await request.json());
    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: backendResponse.status });
    }

    const response = new NextResponse(null, { status: backendResponse.status });
    clearAuthCookies(response);
    return response;
  } catch {
    return NextResponse.json({ error: { message: "Unable to reset your temporary password." } }, { status: 500 });
  }
}
