import "server-only";

import { NextRequest, NextResponse } from "next/server";

function backendUrl(request: NextRequest, path: string[]): URL {
  const baseUrl = process.env.BACKEND_URL;
  if (!baseUrl) {
    throw new Error("BACKEND_URL is not configured.");
  }

  const url = new URL(`${baseUrl}/${path.map(encodeURIComponent).join("/")}`);
  url.search = request.nextUrl.search;
  return url;
}

export async function proxyBackendRequest(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    const headers = new Headers();
    const accessToken = request.cookies.get("access_token")?.value;
    const authorization = request.headers.get("authorization");
    const organizationId = request.headers.get("x-organization-id");
    const contentType = request.headers.get("content-type");
    const idempotencyKey = request.headers.get("idempotency-key");

    if (authorization) {
      headers.set("authorization", authorization);
    } else if (accessToken) {
      headers.set("authorization", `Bearer ${accessToken}`);
    }
    if (organizationId) headers.set("x-organization-id", organizationId);
    if (contentType) headers.set("content-type", contentType);
    if (idempotencyKey) headers.set("idempotency-key", idempotencyKey);

    const method = request.method;
    const response = await fetch(backendUrl(request, path), {
      method,
      headers,
      body: method === "GET" || method === "HEAD" ? undefined : await request.arrayBuffer(),
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get("content-type");
    if (responseContentType) responseHeaders.set("content-type", responseContentType);

    return new NextResponse(response.status === 204 ? null : await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({ error: { message: "Unable to reach the API service." } }, { status: 502 });
  }
}
