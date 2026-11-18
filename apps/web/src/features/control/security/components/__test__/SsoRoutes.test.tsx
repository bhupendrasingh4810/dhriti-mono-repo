import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as start } from "@/app/api/auth/sso/start/route";
import { GET as finish } from "@/app/api/auth/sso/callback/route";
import { apiServiceRequest } from "@/services/api.service";
import { proxy } from "../../../../../../proxy";
vi.mock("@/services/api.service", () => ({ apiServiceRequest: vi.fn() }));
vi.mock("server-only", () => ({}));
beforeEach(() => {
  vi.stubEnv("TRUST_INGRESS_CLIENT_IP", "false");
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("browser-bound SSO routes", () => {
  it("allows temporary-password sessions into reset instead of redirecting them home", () => {
    const token = `header.${btoa(JSON.stringify({ sub: "member", exp: Math.floor(Date.now() / 1000) + 600, mustResetPassword: true }))}.signature`;
    const request = new NextRequest("https://app.example.test/reset-password?required=true");
    request.cookies.set("access_token", token);
    request.cookies.set("user", JSON.stringify({ organization: { id: "org", slug: "acme", name: "Acme" } }));
    expect(proxy(request).headers.get("location")).toBeNull();
    const home = new NextRequest("https://app.example.test/acme/home");
    home.cookies.set("access_token", token);
    home.cookies.set("user", JSON.stringify({ organization: { id: "org", slug: "acme", name: "Acme" } }));
    expect(proxy(home).headers.get("location")).toBe("https://app.example.test/reset-password?required=true");
  });

  it("sets an HttpOnly, short-lived browser cookie before redirecting to the provider", async () => {
    vi.mocked(apiServiceRequest).mockResolvedValueOnce(
      Response.json({ authorizationUrl: "https://idp.example.test/authorize", binding: "b".repeat(43) }),
    );
    const response = await start(new NextRequest("https://app.example.test/api/auth/sso/start?organization=acme"));
    expect(response.headers.get("location")).toBe("https://idp.example.test/authorize");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("SameSite=lax");
    expect(response.headers.get("set-cookie")).toContain("Max-Age=600");
    expect(response.headers.get("set-cookie")).toContain("Path=/api/auth/sso");
  });
  it("exchanges code server-side and puts tokens only into auth cookies", async () => {
    vi.mocked(apiServiceRequest).mockResolvedValueOnce(
      Response.json({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 3600,
        mustResetPassword: false,
        user: { organization: { slug: "acme" } },
      }),
    );
    const response = await finish(
      new NextRequest("https://app.example.test/api/auth/sso/callback?code=code&state=state", {
        headers: { cookie: `oidc_binding=${"b".repeat(43)}` },
      }),
    );
    expect(response.headers.get("location")).toBe("https://app.example.test/acme/home");
    expect(response.cookies.get("access_token")?.value).toBe("test-access");
    expect(response.cookies.get("oidc_binding")?.value).toBe("");
    expect(response.headers.get("location")).not.toContain("test-access");
  });
  it("keeps mandatory temporary-password resets in the SSO flow", async () => {
    vi.mocked(apiServiceRequest).mockResolvedValueOnce(
      Response.json({
        accessToken: "test-access",
        refreshToken: "test-refresh",
        accessTokenExpiresIn: 900,
        refreshTokenExpiresIn: 3600,
        mustResetPassword: true,
        user: { organization: { slug: "acme" } },
      }),
    );
    const response = await finish(
      new NextRequest("https://app.example.test/api/auth/sso/callback?code=code&state=state", {
        headers: { cookie: `oidc_binding=${"b".repeat(43)}` },
      }),
    );
    expect(response.headers.get("location")).toBe("https://app.example.test/reset-password?required=true");
  });
  it("rejects a callback without the browser cookie and issues no auth cookies", async () => {
    vi.mocked(apiServiceRequest).mockClear();
    const response = await finish(
      new NextRequest("https://app.example.test/api/auth/sso/callback?code=code&state=state"),
    );
    expect(response.headers.get("location")).toContain("/login?ssoError=failed");
    expect(response.cookies.has("access_token")).toBe(false);
    expect(apiServiceRequest).not.toHaveBeenCalled();
  });
});
