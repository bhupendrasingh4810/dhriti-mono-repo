import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

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