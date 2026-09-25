import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  if (accessToken) {
    await authService.logout(accessToken).catch(() => undefined);
  }

  const response = NextResponse.json({ success: true });
  response.cookies.delete("refresh_token");
  response.cookies.delete("access_token");
  response.cookies.delete("user");
  return response;
}
