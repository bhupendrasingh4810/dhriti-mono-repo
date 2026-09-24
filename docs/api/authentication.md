# Authentication and Tenancy

## HTTP authentication

`AppModule` registers `AuthGuard` globally. Individual controllers expose authentication-related routes under `/v1/auth`, including registration, login, MFA verification and recovery, refresh, password recovery, profile, and Google and GitHub OAuth routes. Swagger marks protected controllers with bearer authentication.

The API configuration validates distinct access and MFA JWT secrets and configurable TTLs. The configured defaults are 900 seconds for access tokens and 300 seconds for MFA tokens. Refresh-token lifetime defaults to seven days.

Publicly marked endpoints are limited in the checked-in code to health and metrics controllers. Authentication route-level public access is controlled by decorators and guards in the auth module; consult Swagger and the relevant controller before relying on a route from an external integration.

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
