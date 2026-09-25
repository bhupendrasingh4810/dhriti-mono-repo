import { NextRequest, NextResponse } from "next/server";

import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  try {
    const response = await authService.resendVerification(await request.json());
    if (response.ok) {
      return new NextResponse(null, { status: response.status });
    }

    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: { message: "Unable to resend the verification email." } }, { status: 500 });
  }
}
