# Authentication and Tenancy

## HTTP authentication

`AppModule` registers `AuthGuard` globally. Individual controllers expose authentication-related routes under `/v1/auth`, including registration, login, MFA verification and recovery, refresh, password recovery, profile, and Google and GitHub OAuth routes. Swagger marks protected controllers with bearer authentication.

The API configuration validates distinct access and MFA JWT secrets and configurable TTLs. The configured defaults are 900 seconds for access tokens and 300 seconds for MFA tokens. Refresh-token lifetime defaults to seven days.

Public access is controlled by decorators and guards. Authentication callbacks and the security integration ingestion endpoint have their own authentication contracts; consult Swagger and the relevant controller before relying on a route from an external integration.

## Organization context

Organization-scoped access uses tenant and access guards plus current-user and current-organization decorators. `OrganizationAccessController` is mounted at `/v1/organizations/:organizationId` and applies `TenantGuard`, `OrganizationContextGuard`, and `AccessGuard`.

Its implemented permissions distinguish read and manage actions, for example `organization.members.read`, `organization.permissions.manage`, `billing.subscription.read`, and `billing.subscription.manage`. Product modules use `RequireAccess` with an entitlement and permission where applicable.

## Security controls evidenced in code

- Helmet is enabled for the Nest application.
- CORS is credentialed and configured from `CORS_ORIGINS`.
- Public authentication rate-limit settings are validated in environment configuration.
- Password hashing cost defaults to 12 bcrypt rounds.
- Production requires a base64-encoded 32-byte `SECRETS_ENCRYPTION_KEY`.
- Subscription mutations use an idempotency service and `Idempotency-Key` header.

TODO Confirm with team: token transport policy for browser clients, refresh-token rotation and revocation expectations, session expiry policy, and external OAuth production callback URLs.

## Platform Security Center

The existing Security Center retains its four metric cards, six event columns, Resolve/Block IP actions, MFA summary and Unblock list. It now reads persisted data, not example threats. Platform administrators and security staff can use:

| Method | Path (under `/v1/control/platform/security`) | Purpose |
|---|---|---|
| GET | `/overview` | Unresolved events, active blocks, active-user MFA adoption, configured/enabled SSO organizations |
| GET | `/events?page=1&limit=20` | Newest-first events; optional severity, status, IP and UTC date filters |
| GET | `/events/:id` | Event details and the most recent 100 related audit actions in chronological order; `hasMoreTimeline` indicates truncation |
| POST | `/events/:id/resolve` | Idempotent resolution; records operator and timestamp |
| GET | `/blocked-ips?page=1&limit=20` | Active IP blocks, reasons, optional expirations and total pagination |
| POST | `/blocked-ips` | Block `{ "ipAddress": "...", "reason": "...", "expiresAt": "..." }`; reason required; expiry optional and must be future; rejects caller's own canonical IP |
| DELETE | `/blocked-ips/:ip` | Remove a block; encode IPv6 addresses as path segments |
| GET / PUT | `/organizations/:id/oidc` | Read/configure an organization's OIDC provider (never returns secrets) |
| GET | `/sessions?page=1&limit=20&search=...` | Active sessions with user, tenant, IP, device, creation/expiry and current-session marker; search email/IP; no refresh-token hashes |
| POST | `/sessions/:id/revoke` | Revoke with `{ "reason": "..." }`, evict Redis auth cache and publish socket disconnection |
| GET | `/compliance?page=1&limit=20` | Organization SSO verification and local MFA membership counts/gaps |
| GET | `/integrations` | Configuration booleans only for email, outbound webhook and inbound event ingestion |
| GET | `/deliveries?page=1&limit=20` | Persisted delivery attempts, errors, retry time and delivery state |
| POST | `/deliveries/:id/retry` | Audit and requeue a failed, unleased delivery after correcting configuration |

Pages contain `{ items, pagination: { page, limit, total, totalPages } }`; limits are 1–100. Mutations are audited. IP blocks apply to **HTTP API requests**, including public login, not WebSocket traffic or an upstream CDN. Resolving an event does not unblock an IP; blocking does not resolve an event.

Event query filters: `severity=critical|high|medium|low`, `status=open|resolved`, `ipAddress=<single IP>`, `from=<ISO timestamp>` and `to=<ISO timestamp>`, inclusive at both boundaries. Invalid/reversed date ranges are rejected. The UI takes explicit UTC calendar dates and applies whole-day boundaries only when **Apply filters** is selected. Clearing filters resets pagination.

Block expiration is checked on every HTTP request and excluded from metrics/list queries, so no cleanup worker is required for correctness. Updating an existing block replaces its reason and expiration and records another audit entry. Omit `expiresAt` for a permanent block. The UI offers one hour, 24 hours, seven days, or manual unblock. CIDR ranges are not accepted. Existing blocks retain their permanent behavior and receive the reason `Legacy block`.

Five rejected password logins from the same canonical IP in a fixed ten-minute window produce one high-severity Brute Force event. Advanced geographic, token-leak and privilege-escalation findings can be imported from upstream providers through the ingestion contract below; local detectors for these signals are not implemented and no synthetic events are inserted.

The per-organization compliance report distinguishes `not_configured`, `disabled`, `configured` (enabled but no completed sign-in since the last update), and `verified`. Verification is historical, not a continuous provider health check. `mfaGap` counts ACTIVE, non-deleted members with ACTIVE, non-deleted users who do not have local MFA enabled. IdP MFA claims are verified during SSO authentication, not inferred as local MFA enrollment.

Session revocation first audits intent, uses the shared authentication revocation service, then audits completion. If the selected session has already been replaced by refresh-token rotation, revocation returns 409 instead of claiming the replacement was revoked; refresh the session list and select the active session. If cache invalidation fails, the request fails explicitly; retrying an unrotated row still evicts its cache. Current-session revocation requires confirmation, clears browser cookies through the existing logout endpoint, and returns to login. Revocation is not an account suspension: a user can authenticate again.

### Email alerts and generic SIEM/WAF integrations

All integration destinations/credentials are configured by the operator, not accepted as arbitrary outbound URLs from callers. Defaults are disabled and shown as **Not configured** in Security Center.

- `SECURITY_ALERT_EMAILS`: comma-separated recipients. Uses the existing Brevo mail service and requires valid Brevo configuration at startup. High/critical events enqueue email alerts.
- `SECURITY_WEBHOOK_URL` and `SECURITY_WEBHOOK_SECRET` (at least 32 characters): optional HTTPS collector; all new events enqueue signed outbound deliveries. Both values are required together. Configure a trusted collector/adapter, never a user-controlled endpoint; redirects are rejected and each request has a ten-second timeout. Slack-specific payload conversion belongs in the adapter.
- `SECURITY_INGEST_TOKEN` (at least 32 characters): separate bearer credential for `POST /v1/integrations/security/events`. This endpoint does not accept a normal user session in place of the integration token. Disabled ingestion returns 503; incorrect credentials return 401; authenticated sources are limited to 120 requests per canonical IP per minute.

Inbound JSON contract:

```json
{
  "source": "waf",
  "externalId": "provider-finding-123",
  "severity": "high",
  "type": "Suspicious request",
  "description": "Provider-normalized finding without tokens or credentials",
  "ipAddress": "192.0.2.10"
}
```

`source` is a 1–64 character alphanumeric/dot/underscore/hyphen identifier (`dhriti` is reserved). `externalId` is required (max 200); `(source, externalId)` is unique, so retried imports return the existing event ID without duplicate alerts or changing/resurrecting resolved events. IP is optional. Severity is validated; type/description are bounded to 100/2000 characters. Timestamp reflects platform receipt time. Provider adapters must remove tokens, credentials and unnecessary personal data before ingestion. Connect actual SIEM/WAF/IdP findings rather than treating this transport as an additional local detector.

Outbound JSON contains `{ version: 1, deliveryId, event: { id, source, externalId, severity, type, description, ipAddress, createdAt } }`. Verify `X-Dhriti-Signature` as hex HMAC-SHA256 of `${X-Dhriti-Timestamp}.${rawBody}` using the shared signing secret; compare timing-safely, reject timestamps more than five minutes old, and deduplicate `X-Dhriti-Delivery-Id` (also present in JSON). The outbound payload is not the inbound DTO; do not loop it back without an intentional adapter.

Event insertion and delivery intents are atomic. Workers claim token-based five-minute leases, send outside transactions, and finalize only their own lease. Delivery is **at least once** (a process can fail after sending but before finalization). Up to eight attempts use exponential backoff from one minute, capped at one hour. No historical backfill occurs when enabling a destination. Removed destinations fail explicitly rather than sending to a new URL/recipient. Security Center shows failures and supports audited manual retry; correcting/removing a destination may require restoring the original destination before retrying its queued jobs. Secrets and provider response bodies are never exposed in delivery errors.

MFA adoption counts enabled MFA among non-deleted ACTIVE users. The organization summary is mutually exclusive: **Enforced** uses `OrganizationSettings.mfaEnforced`; **Optional** means not enforced with at least one active, non-deleted member using MFA; **No MFA** is the remaining organizations, including those without settings/members. The Enforced category reports stored policy, not proof that every authentication mechanism already enforces that policy.

## Organization OIDC SSO

1. Supply a base64-encoded 32-byte `SECRETS_ENCRYPTION_KEY` and exact comma-separated HTTPS `OIDC_ALLOWED_ISSUERS` in API configuration. The operator allowlist, not a user-entered URL, controls outbound provider access. Discovery, token and JWKS requests must remain on approved issuer origins; redirects are rejected.
2. Register the callback shown by **Load configuration**: `${WEB_APP_URL}/api/auth/sso/callback`. Use a confidential OIDC client supporting authorization code + S256 PKCE and a verified `email` claim. No implicit grants or just-in-time accounts are supported.
3. Use the additive **Organization SSO configuration (OIDC)** panel, or PUT `{ issuer, clientId, clientSecret, enabled }` to the organization's configuration endpoint. Secrets are encrypted; re-enter a secret to save configuration. Disabling increments the configuration version and invalidates pending sign-ins. Changing issuer requires an explicit identity migration and is rejected.
4. On the existing login screen, enter the workspace slug and choose **Sign in with SSO**. Password, registration, Google and GitHub flows remain available.

The Next server starts `/v1/auth/sso/start`, stores a ten-minute HttpOnly/SameSite=Lax browser-binding cookie, and redirects to the provider. The callback posts the code to `/v1/auth/sso/callback`; state is consumed atomically using Redis GETDEL (Redis 6.2+). `openid-client` validates PKCE, nonce, issuer, audience and ID-token signature. Tokens are written using existing auth-cookie helpers, never placed in redirect URLs. Temporary-password users still reach mandatory password reset.

Only existing ACTIVE members of an active organization can sign in. The first verified email match links the provider subject; later sign-ins must retain that subject. A locally MFA-enabled user or MFA-enforced organization requires `amr` containing `mfa` from the IdP, otherwise sign-in fails rather than bypassing MFA. Provider setups that do not emit verified email / MFA claims need provider-side claim mapping before use. `SSO Orgs` counts configured/enabled organizations; `lastVerifiedAt` separately records a completed sign-in, not merely discovery.

No live identity provider was supplied with this implementation; verify a real login, claim mapping, logout/expiry expectations and callback reachability before enabling SSO for production members.
