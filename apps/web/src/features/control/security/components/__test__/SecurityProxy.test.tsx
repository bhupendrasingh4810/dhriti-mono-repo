import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { trustedClientIpHeaders } from "@/services/client-ip.server";
import { proxyBackendRequest } from "@/services/backend-proxy.server";
import { apiServiceRequest } from "@/services/api.service";
import { headers as incomingHeaders } from "next/headers";
vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Security Center proxy boundary", () => {
  it("forwards the trusted IP centrally for all server-side API calls, including MFA and refresh", async () => {
    vi.stubEnv("TRUST_INGRESS_CLIENT_IP", "true");
    vi.stubEnv("BACKEND_URL", "https://api.example.test/v1");
    vi.mocked(incomingHeaders).mockResolvedValue(new Headers({ "x-real-ip": "192.0.2.1" }) as never);
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    for (const path of ["/auth/login", "/auth/mfa/verify", "/auth/refresh", "/auth/sso/callback"]) {
      await apiServiceRequest(path, { method: "POST", headers: { "Content-Type": "application/json" } });
      const options = fetch.mock.lastCall?.[1] as RequestInit;
      expect(new Headers(options.headers).get("x-forwarded-for")).toBe("192.0.2.1");
      expect(new Headers(options.headers).get("content-type")).toBe("application/json");
    }
  });

  it("ignores arbitrary client IP headers unless trusted ingress is explicitly enabled", () => {
    vi.stubEnv("TRUST_INGRESS_CLIENT_IP", "false");
    expect(trustedClientIpHeaders(new Headers({ "x-real-ip": "192.0.2.1" }))).toEqual({});
    vi.stubEnv("TRUST_INGRESS_CLIENT_IP", "true");
    expect(trustedClientIpHeaders(new Headers({ "x-real-ip": "192.0.2.1" }))).toEqual({
      "x-forwarded-for": "192.0.2.1",
    });
    expect(() => trustedClientIpHeaders(new Headers({ "x-real-ip": "192.0.2.1, 192.0.2.2" }))).toThrow();
    expect(() => trustedClientIpHeaders(new Headers())).toThrow();
  });

  it("rejects cross-origin cookie-authenticated security mutations before contacting the backend", async () => {
    vi.stubEnv("TRUST_INGRESS_CLIENT_IP", "false");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const request = new NextRequest("https://app.example.test/api/control/platform/security/events/event/resolve", {
      method: "POST",
      headers: { cookie: "access_token=test-token", origin: "https://other.example.test" },
    });
    const response = await proxyBackendRequest(request, {
      params: Promise.resolve({ path: ["control", "platform", "security", "events", "event", "resolve"] }),
    });
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("preserves same-origin authenticated mutations", async () => {
    vi.stubEnv("TRUST_INGRESS_CLIENT_IP", "false");
    vi.stubEnv("BACKEND_URL", "https://api.example.test/v1");
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetch);
    const response = await proxyBackendRequest(
      new NextRequest("https://app.example.test/api/control/platform/security/events/event/resolve", {
        method: "POST",
        headers: { cookie: "access_token=test-token", origin: "https://app.example.test" },
      }),
      { params: Promise.resolve({ path: ["control", "platform", "security", "events", "event", "resolve"] }) },
    );
    expect(response.status).toBe(204);
    const options = fetch.mock.lastCall?.[1] as RequestInit;
    expect(new Headers(options.headers).get("authorization")).toBe("Bearer test-token");
  });
});
