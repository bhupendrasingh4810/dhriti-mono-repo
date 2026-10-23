import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  if (request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }
  const token = request.cookies.get("access_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
  const response = await authService.me(token);
  if (!response.ok) return NextResponse.json({ message: "Session expired" }, { status: 401 });
  if (!process.env.BACKEND_URL) {
    return NextResponse.json({ message: "BACKEND_URL is not configured" }, { status: 503 });
  }
  const url = new URL(process.env.BACKEND_URL);
  return NextResponse.json(
    { token, url: `${url.origin}/connect` },
    {
      headers: { "Cache-Control": "no-store" },
    },
  );
}
