# @dhriti/api

Enterprise multi-app SaaS API for Dhriti — NestJS 11, Prisma/PostgreSQL, Redis, Socket.io.

## What's inside

| Area          | Path                       | Notes                                                                                                                                  |
| ------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Auth          | `src/modules/auth`         | Register/login, JWT (15m) + refresh rotation (7d), OAuth (Google/GitHub), MFA (TOTP + recovery codes), password reset, account lockout |
| IAM           | `src/modules/organization` | Orgs, members, teams, invitations lifecycle, groups (manual + dynamic rules)                                                           |
| Audit         | `src/modules/audit`        | Global audit logging (fail-safe)                                                                                                       |
| Files         | `src/modules/file`         | S3-compatible upload, presigned download, quota/type validation                                                                        |
| Connect       | `src/modules/connect`      | Channels, messages, threads, mentions, reactions                                                                                       |
| Flow          | `src/modules/flow`         | Projects, issues, sprints, kanban board + columns                                                                                      |
| Atlas         | `src/modules/atlas`        | Spaces, page tree (versioned), comments                                                                                                |
| Pulse         | `src/modules/pulse`        | Calendars, events, RSVP, scheduling conflicts                                                                                          |
| Nexus         | `src/modules/nexus`        | AI summarization, task extraction, ask (LLM or local fallback)                                                                         |
| Cadence       | `src/modules/cadence`      | Retrospectives, anonymous cards, dot voting, phases                                                                                    |
| Control       | `src/modules/control`      | `platform/` (staff admin) + `organization/` (org admin)                                                                                |
| Notifications | `src/modules/notification` | In-app center, preferences, email                                                                                                      |
| Search        | `src/modules/search`       | Cross-app full-text search (tsvector)                                                                                                  |
| Analytics     | `src/modules/analytics`    | Usage events, DAU/WAU/MAU, team velocity                                                                                               |
| Webhooks      | `src/modules/webhook`      | HMAC-signed event delivery with retries                                                                                                |
| WebSocket     | `src/websocket`            | Connect, Flow, Atlas, Pulse, Nexus, Cadence, WebRTC signaling (Redis adapter)                                                          |
| Observability | `src/common`               | Structured JSON logs (correlation IDs, PII masking), Prometheus `/metrics`, health `/health/*`, OTel tracing (`src/tracing.ts`)        |

## Prerequisites

- Node.js 22+, pnpm 11
- PostgreSQL 15+ and Redis 7+ (see `infrastructure/docker/docker-compose.yml`)

## Setup

```bash
# from repo root
pnpm install

# create env for the API
cp apps/api/.env.example apps/api/.env
# edit apps/api/.env (DATABASE_URL, REDIS_URL, JWT secrets, etc.)

# generate the Prisma client
pnpm --filter @dhriti/api exec prisma generate --schema ../../prisma/schema.prisma

# run migrations (creates all tables + search tsvector)
pnpm --filter @dhriti/api exec prisma migrate dev --schema ../../prisma/schema.prisma

# seed demo data (Acme org, users, sample content)
pnpm --filter @dhriti/api db:seed
```

## Run

```bash
# from repo root
pnpm dev:api          # nest start --watch (port 3001)

# or from apps/api
pnpm dev
```

- REST + Swagger UI: `http://localhost:3001/v1/docs`
- Health: `GET /v1/health/live` and `GET /v1/health/ready`
- Metrics: `GET /metrics` (Prometheus text)

### Demo logins (from seed)

| Email            | Password     | Role                 |
| ---------------- | ------------ | -------------------- |
| alice@acme.com   | Sup3rSecure! | OWNER                |
| bob@acme.com     | Sup3rSecure! | ADMIN                |
| priya@acme.com   | Sup3rSecure! | EMPLOYEE             |
| admin@dhriti.dev | Sup3rSecure! | platform SUPER_ADMIN |

Org slug: `acme`. Tenant-scoped endpoints take `x-organization-id: <orgId>` or use the org in the JWT.

## WebSockets

Connect with a Socket.io client to a namespace and pass the access token:

```ts
io("http://localhost:3001/connect", { auth: { token: accessToken } });
```

Namespaces: `/connect` (chat + calls), `/flow`, `/atlas`, `/pulse`, `/nexus`, `/cadence`.

## Testing

```bash
pnpm --filter @dhriti/api test        # unit tests (auth)
pnpm --filter @dhriti/api typecheck   # tsc --noEmit
pnpm --filter @dhriti/api build       # nest build
```

## Environment

See [`.env.example`](./.env.example). Tracing is enabled by setting
`OTEL_EXPORTER_OTLP_ENDPOINT` (e.g. Jaeger/Tempo); unset = tracing disabled.
AI features use OpenAI when `OPENAI_API_KEY` is set, otherwise a deterministic
local fallback. File storage uses S3 (or MinIO via `S3_ENDPOINT` +
`S3_FORCE_PATH_STYLE=true`).

## Notes

- Multi-tenancy: every tenant table carries `organization_id`; `TenantGuard`
  enforces membership and PostgreSQL RLS is the intended safety net.
- All endpoints validate with class-validator DTOs and return a consistent
  error shape (`{ error: { code, message, correlationId, ... } }`).
