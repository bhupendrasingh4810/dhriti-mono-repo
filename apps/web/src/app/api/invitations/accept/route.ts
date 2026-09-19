import { NextRequest, NextResponse } from "next/server";

import { apiServiceRequest } from "@/services/api.service";

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: { message: "Authentication is required." } },
        { status: 401 },
      );
    }

    const body = await request.json();
    const backendResponse = await apiServiceRequest("/invitations/accept", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    if (backendResponse.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { error: { message: "Internal server error" } },
      { status: 500 },
    );
  }
}