# Dhriti API — Overview

Dhriti is a multi-tenant work operating system. The API is a NestJS modular
monolith backed by PostgreSQL (Prisma) and Redis, with Socket.io for real-time.

## Applications

| App | Purpose | REST base | WebSocket |
| --- | --- | --- | --- |
| Connect | Chat, threads, audio/video calls | `/v1/organization/connect` | `/connect` |
| Flow | Projects, issues, sprints, kanban | `/v1/organization/flow` | `/flow` |
| Atlas | Knowledge base (spaces, pages) | `/v1/organization/atlas` | `/atlas` |
| Pulse | Calendars, events, scheduling | `/v1/organization/pulse` | `/pulse` |
| Nexus | AI summaries, task extraction, ask | `/v1/organization/nexus` | `/nexus` |
| Cadence | Retrospectives, estimation | `/v1/organization/cadence` | `/cadence` |
| Control | Platform + organization admin | `/v1/control/...` | — |

Plus platform services: Auth, IAM, Files, Notifications, Search, Analytics,
Webhooks, Audit.

## Conventions

### Authentication
Every request (except `@Public()` routes) needs a short-lived JWT:

```
Authorization: Bearer <accessToken>
```

The token payload is `{ sub: userId, sid: sessionId, org: organizationId, email }`.
Access tokens expire in 15 minutes; refresh tokens (opaque, 7 days) rotate on
each use. Reuse of a rotated refresh token revokes all sessions.

### Multi-tenancy
All tenant-scoped routes run through `TenantGuard`. The active organization is
resolved from the `x-organization-id` header, falling back to the JWT's `org`.
The guard verifies the caller is a member; `@CurrentOrganization()` injects
`{ organizationId, memberId, role }`.

### Roles
- **Organization roles** (`@OrgRoles`): `OWNER`, `ADMIN`, `MEMBER`, `GUEST` — checked within the active org.
- **Platform roles** (`@PlatformRoles`): `SUPER_ADMIN`, `SUPPORT`, `BILLING`, `SECURITY`, `ENGINEERING` — internal staff only (Control platform admin).

### Error shape
All errors use a consistent envelope:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect",
    "correlationId": "3f2c…",
    "timestamp": "2026-09-04T10:00:00.000Z",
    "path": "/v1/auth/login"
  }
}
```

`code` is a stable `ErrorCode` for client-side handling.

### Pagination
List endpoints use cursor pagination where data grows unbounded (messages,
notifications): pass `cursor` (last item id) + `limit`, read `nextCursor`.

### Observability
- Structured JSON logs with a `correlationId` (also returned as `x-correlation-id`).
- `GET /v1/health/live` and `GET /v1/health/ready` (DB + Redis).
- `GET /metrics` (Prometheus text format).
- OpenTelemetry tracing when `OTEL_EXPORTER_OTLP_ENDPOINT` is set.

## Documentation index

- [Auth](./01-auth.md)
- [IAM (Organizations, Teams, Groups, Invitations)](./02-iam.md)
- [Connect](./03-connect.md)
- [Flow](./04-flow.md)
- [Atlas](./05-atlas.md)
- [Pulse](./06-pulse.md)
- [Nexus AI](./07-nexus.md)
- [Cadence](./08-cadence.md)
- [Control (Platform + Org Admin)](./09-control.md)
- [Files, Notifications, Search, Analytics, Webhooks](./10-platform-services.md)
