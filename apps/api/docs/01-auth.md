# Auth

Identity, sessions, MFA, OAuth, and password flows.

## Entity diagram

```
User ──┬─ UserIdentity (OAuth providers)
       ├─ UserSession (refresh-token sessions)
       ├─ VerificationToken (email verify / password reset)
       ├─ MfaRecoveryCode
       └─ OrganizationMember ── Organization
```

`User` is the platform-wide identity (email, name, passwordHash, mfaSecret,
status, platformRole). An `OrganizationMember` ties a user to an org with a role.

## Flows

### Register + verify
1. `POST /v1/auth/register` `{ email, name, password }` → creates user (`PENDING_VERIFICATION`), emails a verification token.
2. `POST /v1/auth/verify-email` `{ token }` → marks `ACTIVE` + `emailVerifiedAt`.
3. `POST /v1/auth/resend-verification` `{ email }` — always succeeds (no enumeration).

### Login
- `POST /v1/auth/login` `{ email, password }` → `AuthTokensResponse` **or** an MFA challenge.
- Bad password → `failedLoginAttempts++`; at 10 attempts the account locks for 15 minutes and the user is emailed.
- If `mfaEnabled`, login returns `{ mfaRequired: true, mfaToken }`. Complete with:
  - `POST /v1/auth/mfa/verify` `{ mfaToken, code }` (TOTP), or
  - `POST /v1/auth/mfa/recovery` `{ mfaToken, recoveryCode }`.

### Tokens
- Access token: JWT, 15 min, carries `userId/sessionId/org`.
- `POST /v1/auth/refresh` `{ refreshToken }` → rotates the refresh token and issues a new access token. **Reuse of an old refresh token revokes all sessions** (theft detection).

### Logout
- `POST /v1/auth/logout` — revoke current session.
- `POST /v1/auth/logout-all` — revoke every session for the user.

### Password
- `POST /v1/auth/forgot-password` `{ email }` — emails a reset link (always succeeds).
- `POST /v1/auth/reset-password` `{ token, newPassword }` — resets and revokes all sessions.
- `POST /v1/auth/change-password` `{ currentPassword, newPassword }` — revokes all **other** sessions.

### Profile
- `GET /v1/auth/me` — current profile.
- `PATCH /v1/auth/me` — update `name`, `avatarUrl`, `timezone`, `locale`.

### MFA management
- `POST /v1/auth/mfa/setup` → `{ secret, otpauthUrl, qrCodeDataUrl }` (pending in Redis, 10 min).
- `POST /v1/auth/mfa/confirm` `{ code }` → enables MFA and returns one-time recovery codes.
- `POST /v1/auth/mfa/disable` `{ password, code }`.

### OAuth
`GET /v1/auth/oauth/{google|github}` → redirect to provider; callback at
`.../callback` creates/links the account (verified emails auto-activate) and
redirects to the web app with tokens in the query string.

## Error codes
`INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `ACCOUNT_SUSPENDED`, `EMAIL_NOT_VERIFIED`,
`EMAIL_ALREADY_REGISTERED`, `MFA_REQUIRED`, `MFA_CODE_INVALID`, `RECOVERY_CODE_INVALID`,
`TOKEN_EXPIRED`, `TOKEN_INVALID`, `TOKEN_ALREADY_USED`, `REFRESH_TOKEN_REUSED`,
`SESSION_REVOKED`, `PASSWORD_INCORRECT`, `OAUTH_ACCOUNT_EXISTS`.
