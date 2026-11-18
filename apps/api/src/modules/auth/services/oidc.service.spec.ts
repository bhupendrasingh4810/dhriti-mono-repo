import { createHash } from "node:crypto";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { OidcService } from "./oidc.service";

function setup() {
  const record = {
    organizationId: "org",
    issuer: "https://idp.example.test",
    clientId: "client",
    clientSecretEncrypted: "encrypted",
    enabled: true,
    version: 1,
  };
  const prisma = {
    organization: { findFirst: jest.fn().mockResolvedValue({ id: "org" }) },
    organizationOidc: {
      findFirst: jest.fn().mockResolvedValue(record),
      findUnique: jest.fn().mockResolvedValue(record),
      upsert: jest.fn().mockResolvedValue(record),
      updateMany: jest.fn(),
    },
    organizationMember: { findFirst: jest.fn().mockResolvedValue({ userId: "user" }) },
    organizationOidcIdentity: {
      findUnique: jest.fn().mockResolvedValue(null),
      upsert: jest.fn(),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ subject: "subject" }),
    },
    auditLog: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) => fn(prisma));
  const claims = { sub: "subject", email: "member@example.test", email_verified: true, amr: ["mfa"] };
  const oidc = {
    randomPKCECodeVerifier: jest.fn().mockReturnValue("verifier"),
    calculatePKCECodeChallenge: jest.fn().mockResolvedValue("challenge"),
    buildAuthorizationUrl: jest.fn().mockReturnValue(new URL("https://idp.example.test/authorize")),
    authorizationCodeGrant: jest.fn().mockResolvedValue({ claims: () => claims }),
  };
  const provider = { discover: jest.fn().mockResolvedValue({ oidc, configuration: { name: "oidc" } }) };
  const redis = { setJson: jest.fn(), raw: { getdel: jest.fn() } };
  const secrets = { encrypt: jest.fn().mockReturnValue("encrypted"), decrypt: jest.fn().mockReturnValue("secret") };
  const config = { webAppUrl: "https://app.example.test", oidcAllowedIssuers: [record.issuer] };
  const auth = { loginWithSso: jest.fn().mockResolvedValue({ accessToken: "access" }) };
  const service = new OidcService(
    prisma as never,
    redis as never,
    secrets as never,
    config as never,
    provider as never,
    auth as never,
  );
  const binding = "b".repeat(43),
    state = "s".repeat(43);
  redis.raw.getdel.mockResolvedValue(
    JSON.stringify({
      organizationId: "org",
      version: 1,
      verifier: "verifier",
      nonce: "nonce",
      bindingHash: createHash("sha256").update(binding).digest("hex"),
    }),
  );
  const dto = {
    binding,
    callbackUrl: `https://app.example.test/api/auth/sso/callback?state=${state}&code=authorization-code`,
  };
  return { service, prisma, provider, oidc, redis, auth, record, claims, dto, secrets };
}
describe("organization OIDC sign-in", () => {
  it("creates expiring, browser-bound PKCE/state/nonce without issuing a session", async () => {
    const { service, redis, oidc, auth } = setup();
    const result = await service.start("acme");
    expect(result.binding).toHaveLength(43);
    expect(oidc.buildAuthorizationUrl).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        scope: "openid email",
        code_challenge_method: "S256",
        redirect_uri: "https://app.example.test/api/auth/sso/callback",
        state: expect.any(String),
        nonce: expect.any(String),
      }),
    );
    expect(redis.setJson).toHaveBeenCalledWith(
      expect.stringMatching(/^auth:oidc:/),
      expect.objectContaining({ verifier: "verifier", bindingHash: expect.any(String) }),
      600,
    );
    expect(auth.loginWithSso).not.toHaveBeenCalled();
  });

  it("exchanges code with all checks and signs into only the matched existing tenant member", async () => {
    const { service, oidc, prisma, dto, auth } = setup();
    expect(await service.finish(dto, {})).toEqual({ accessToken: "access" });
    expect(oidc.authorizationCodeGrant).toHaveBeenCalledWith(expect.anything(), new URL(dto.callbackUrl), {
      pkceCodeVerifier: "verifier",
      expectedState: "s".repeat(43),
      expectedNonce: "nonce",
      idTokenExpected: true,
    });
    expect(prisma.organizationMember.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org", status: "ACTIVE", deletedAt: null }),
      }),
    );
    expect(auth.loginWithSso).toHaveBeenCalledWith("user", "org", true, {}, 1);
  });

  it.each(["wrong-browser", "replay", "disabled", "non-member", "unverified", "subject-change", "invalid-token"])(
    "rejects %s without creating a session",
    async (scenario) => {
      const { service, redis, prisma, dto, auth, claims, oidc } = setup();
      if (scenario === "wrong-browser") {
        dto.binding = "x".repeat(43);
      }
      if (scenario === "replay") {
        redis.raw.getdel.mockResolvedValue(null);
      }
      if (scenario === "disabled") {
        prisma.organizationOidc.findFirst.mockResolvedValue(null);
      }
      if (scenario === "non-member") {
        prisma.organizationMember.findFirst.mockResolvedValue(null);
      }
      if (scenario === "unverified") {
        claims.email_verified = false;
      }
      if (scenario === "subject-change") {
        prisma.organizationOidcIdentity.findUniqueOrThrow.mockResolvedValue({ subject: "another" });
      }
      if (scenario === "invalid-token") {
        oidc.authorizationCodeGrant.mockRejectedValue(new Error("JWT signature invalid"));
      }
      await expect(service.finish(dto, {})).rejects.toThrow();
      expect(auth.loginWithSso).not.toHaveBeenCalled();
    },
  );

  it("rejects arbitrary callback origins before consuming state", async () => {
    const { service, redis, dto } = setup();
    dto.callbackUrl = dto.callbackUrl.replace("app.example.test", "attacker.example.test");
    await expect(service.finish(dto, {})).rejects.toBeInstanceOf(BadRequestException);
    expect(redis.raw.getdel).not.toHaveBeenCalled();
  });

  it("does not overwrite a member's previously linked subject", async () => {
    const { service, prisma, dto } = setup();
    prisma.organizationOidcIdentity.findUnique.mockResolvedValue({ userId: "someone-else" });
    await expect(service.finish(dto, {})).rejects.toBeInstanceOf(UnauthorizedException);
    expect(prisma.organizationOidcIdentity.upsert).not.toHaveBeenCalled();
  });

  it("never returns or audits the client secret", async () => {
    const { service, prisma, record } = setup();
    const input = { issuer: record.issuer, clientId: "client", clientSecret: "private-secret", enabled: true };
    await service.configure("org", input, "admin");
    expect(prisma.organizationOidc.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        select: {
          organizationId: true,
          issuer: true,
          clientId: true,
          enabled: true,
          lastVerifiedAt: true,
          updatedAt: true,
        },
      }),
    );
    expect(JSON.stringify(prisma.auditLog.create.mock.calls)).not.toContain("private-secret");
  });
});
