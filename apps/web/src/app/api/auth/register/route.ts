import { NextRequest, NextResponse } from "next/server";

import { authService } from "@/services/auth.server";

export async function POST(request: NextRequest) {
  try {
    const response = await authService.register(await request.json());
    const body = await response.json().catch(() => ({}));
    return NextResponse.json(body, { status: response.status });
  } catch {
    return NextResponse.json({ error: { message: "Unable to create your account." } }, { status: 500 });
  }
}
