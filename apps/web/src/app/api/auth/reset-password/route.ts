import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendResponse = await authService.resetPassword(body);

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(error, { status: backendResponse.status });
    }

    return new NextResponse(null, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}