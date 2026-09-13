import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
    }

    const backendResponse = await fetch(`${process.env.BACKEND_URL}/auth/me/avatar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: await request.formData(),
    });
    const responseBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: { message: "Unable to upload profile photo." } }, { status: 500 });
  }
}