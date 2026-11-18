import assert from "node:assert/strict";
import { createSign, generateKeyPairSync } from "node:crypto";
import { createRequire } from "node:module";
import { afterEach, beforeEach, test } from "node:test";

// Run after `pnpm build`; native imports exercise the actual ESM OIDC verifier, not a mocked token validator.
const require = createRequire(import.meta.url);
const { OidcProviderService } = require("../dist/modules/auth/services/oidc-provider.service.js");
const issuer = "https://idp.example.test";
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: "jwk" }), kid: "integration-key", use: "sig", alg: "RS256" };
let originalFetch;
let tokenClaims;
let tokenRequests;
let tamperSignature;
let tokenEndpoint;
const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
function idToken() {
  const input = `${encode({ alg: "RS256", kid: jwk.kid })}.${encode(tokenClaims)}`;
  const signature = createSign("RSA-SHA256").update(input).sign(privateKey).toString("base64url");
  return `${input}.${tamperSignature ? `${signature[0] === "a" ? "b" : "a"}${signature.slice(1)}` : signature}`;
}
beforeEach(() => {
  originalFetch = globalThis.fetch;
  tokenRequests = 0;
  tamperSignature = false;
  tokenEndpoint = `${issuer}/token`;
  tokenClaims = {
    iss: issuer,
    aud: "integration-client",
    sub: "member-subject",
    email: "member@example.test",
    email_verified: true,
    nonce: "expected-nonce",
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 60,
  };
  globalThis.fetch = async (input, options) => {
    const url = new URL(input);
    assert.equal(url.origin, issuer);
    assert.equal(options.redirect, "error");
    const json = (body) => new Response(JSON.stringify(body), { headers: { "content-type": "application/json" } });
    if (url.pathname === "/.well-known/openid-configuration")
      return json({
        issuer,
        authorization_endpoint: `${issuer}/authorize`,
        token_endpoint: tokenEndpoint,
        jwks_uri: `${issuer}/jwks`,
        response_types_supported: ["code"],
        subject_types_supported: ["public"],
        id_token_signing_alg_values_supported: ["RS256"],
        token_endpoint_auth_methods_supported: ["client_secret_post"],
        code_challenge_methods_supported: ["S256"],
      });
    if (url.pathname === "/jwks") return json({ keys: [jwk] });
    assert.equal(url.pathname, "/token");
    tokenRequests++;
    const body = new URLSearchParams(options.body);
    assert.equal(body.get("code_verifier"), "integration-verifier");
    return json({
      access_token: "integration-access-token",
      token_type: "Bearer",
      expires_in: 60,
      id_token: idToken(),
    });
  };
});
afterEach(() => {
  globalThis.fetch = originalFetch;
});

async function exchange() {
  const provider = new OidcProviderService({ oidcAllowedIssuers: [issuer] });
  const { oidc, configuration } = await provider.discover(issuer, "integration-client", "integration-secret");
  return oidc.authorizationCodeGrant(
    configuration,
    new URL("https://app.example.test/api/auth/sso/callback?code=integration-code&state=expected-state"),
    {
      expectedState: "expected-state",
      expectedNonce: "expected-nonce",
      pkceCodeVerifier: "integration-verifier",
      idTokenExpected: true,
    },
  );
}
test("validates a real RSA-signed OIDC ID token and sends the PKCE verifier", async () => {
  const tokens = await exchange();
  assert.equal(tokens.claims().sub, "member-subject");
  assert.equal(tokenRequests, 1);
});
for (const field of ["nonce", "aud", "iss"]) {
  test(`rejects an otherwise signed ID token with an invalid ${field}`, async () => {
    tokenClaims[field] = "incorrect";
    await assert.rejects(exchange);
  });
}
test("rejects expired ID tokens", async () => {
  tokenClaims.exp = Math.floor(Date.now() / 1000) - 120;
  await assert.rejects(exchange);
});
test("rejects a tampered RSA signature", async () => {
  tamperSignature = true;
  await assert.rejects(exchange);
});
test("rejects discovered token endpoints outside approved origins", async () => {
  tokenEndpoint = "https://unapproved.example.test/token";
  await assert.rejects(exchange);
  assert.equal(tokenRequests, 0);
});
test("does not fetch an issuer outside the operator allowlist", async () => {
  const provider = new OidcProviderService({ oidcAllowedIssuers: [issuer] });
  await assert.rejects(() => provider.discover("https://unapproved.example.test", "client", "secret"));
  assert.equal(tokenRequests, 0);
});
