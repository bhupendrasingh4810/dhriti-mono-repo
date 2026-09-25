import { NextRequest, NextResponse } from "next/server";

import { apiServiceRequest } from "@/services/api.service";

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
  }

  const { userId } = await params;
  const backendResponse = await apiServiceRequest(`/users/${encodeURIComponent(userId)}/onboarding`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const responseBody = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(responseBody, { status: backendResponse.status });
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  const accessToken = request.cookies.get("access_token")?.value;

  if (!accessToken) {
    return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
  }

  const { userId } = await params;
  const backendResponse = await apiServiceRequest(`/users/${encodeURIComponent(userId)}/onboarding`, {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(await request.json()),
    cache: "no-store",
  });

  const responseBody = await backendResponse.json().catch(() => ({}));
  return NextResponse.json(responseBody, { status: backendResponse.status });
}
