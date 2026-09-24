# Onboarding

## Prerequisites

- Node.js and pnpm 11.5.2 or a compatible pnpm 11 release. The root package manifest declares pnpm 11.5.2.
- Docker and Docker Compose for the supplied API, PostgreSQL, and Redis stack.
- PostgreSQL and Redis only when running the API outside Docker.

## Install and validate the workspace

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
```

The root commands delegate to Turbo. The web and API applications also expose package-local `dev`, `build`, `lint`, and `typecheck` commands.

## Run the local API stack

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

The compose definition starts PostgreSQL 16, Redis 7, an `api-migrate` job, and the API. It exposes the API on `http://localhost:3001/v1`, PostgreSQL on port 5432, and Redis on port 6379 by default. The API readiness endpoint is `http://localhost:3001/v1/health/ready`.

Seed data with:

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile seed run --rm api-seed
```

## Run applications directly

```bash
pnpm dev:web
pnpm dev:api
```

The API validates its environment at startup in `apps/api/src/config/env.validation.ts`. At minimum it requires URLs for the web and onboarding applications, allowed CORS origins, PostgreSQL and Redis connection strings, JWT access and MFA secrets of at least 32 characters, and an S3 bucket. Use the validation schema as the definitive variable list and defaults.

`ONBOARDING_URL` is required by the API validation schema but is not set in the checked-in Docker Compose API environment block. TODO Confirm with team whether it is supplied through a Compose environment file or whether the local Compose definition needs an explicit value.

## Database workflow

```bash
pnpm --dir apps/api run db:generate
pnpm --dir apps/api run db:migrate
pnpm --dir apps/api run db:seed
```

Schema fragments in `prisma/parts` are authored sources. The API scripts build `prisma/schema.prisma` before Prisma commands. Do not edit the generated schema directly.

## First contribution

1. Read [Architecture](architecture/overview.md) and the closest module or package to the change.
2. Use existing shared packages before adding reusable code.
3. Run the narrow package validation, then the relevant root Turbo command.
4. Update a documentation page or ADR when the checked-in operational or architectural contract changes.

TODO Confirm with team: branch protection, pull request review requirements, CI gates, secrets provisioning, and release ownership are not defined in the repository.
