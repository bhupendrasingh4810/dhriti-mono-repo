import { NextRequest, NextResponse } from "next/server";
import { onboardingBackend } from "@/services/onboarding.server";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
    }

    const backendResponse = await onboardingBackend.get(accessToken);
    const responseBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
    }

    const body = await request.json();
    const backendResponse = await onboardingBackend.create(accessToken, body);

    const responseBody = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return NextResponse.json(responseBody, { status: backendResponse.status });
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}