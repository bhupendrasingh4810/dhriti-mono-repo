import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
    }

    const backendResponse = await fetch(`${process.env.BACKEND_URL}/organizations`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const responseBody = await backendResponse.json().catch(() => ({}));
    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = request.cookies.get("access_token")?.value;
    if (!accessToken) {
      return NextResponse.json({ error: { message: "Authentication is required." } }, { status: 401 });
    }

    const body = await request.json();
    const backendResponse = await fetch(`${process.env.BACKEND_URL}/organizations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const responseBody = await backendResponse.json().catch(() => ({}));
    if (!backendResponse.ok) {
      return NextResponse.json(responseBody, { status: backendResponse.status });
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json({ error: { message: "Internal server error" } }, { status: 500 });
  }
}