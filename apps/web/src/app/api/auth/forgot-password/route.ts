import { NextRequest, NextResponse } from "next/server";
import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendResponse = await authService.forgotPassword(body);

    if (!backendResponse.ok) {
      const error = await backendResponse.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.message || "Unable to request a password reset." },
        { status: backendResponse.status },
      );
    }

    return new NextResponse(null, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
