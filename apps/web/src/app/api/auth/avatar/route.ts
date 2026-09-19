import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
    }

    const backendResponse = await authService.uploadAvatar(accessToken, await request.formData());
    const responseBody = backendResponse.status === 204
      ? undefined
      : await backendResponse.json().catch(() => ({}));
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: { message: "Unable to upload profile photo." } }, { status: 500 });
  }
}