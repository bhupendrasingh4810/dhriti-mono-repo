# Dhriti

Dhriti is a pnpm/Turborepo monorepo containing a Next.js web application, a NestJS API, shared packages, Prisma database definitions, and Docker and Terraform infrastructure assets.

## Start here

- [Documentation portal](docs/README.md)
- [Local development](docs/onboarding/local-development.md)
- [Repository structure](docs/onboarding/repository-structure.md)
- [Environment variables](docs/onboarding/environment-variables.md)
- [System overview](docs/architecture/system-overview.md)
- [API overview](docs/api/overview.md)
- [Database schema overview](docs/database/schema-overview.md)
- [Deployment runbook](docs/operations/deployment-runbook.md)

## Repository layout

- `apps/web`: Next.js application.
- `apps/api`: NestJS API service, including REST, WebSocket, health, and metrics endpoints.
- `packages/*`: shared UI, auth, validation, API client, types, configuration, icons, utilities, and emoji picker packages.
- `prisma/parts`: authored Prisma schema fragments. `prisma/schema.prisma` is generated.
- `infrastructure/docker`: local API stack and container images.
- `infrastructure/terraform`: managed Redis Terraform module.
- `docs`: engineering and operational documentation.

## Common commands

From the repository root:

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

The workspace uses pnpm 11 and Turbo. API-specific commands, including database generation and migrations, are listed in [apps/api/package.json](apps/api/package.json). For the documented local API stack, see [docs/onboarding.md](docs/onboarding.md).

## Verification boundary

This repository includes API and web applications plus infrastructure assets. A production deployment workflow, production web hosting configuration, and the intended worker runtime are not fully defined by the checked-in files. TODO Confirm with team before treating those areas as operational commitments.
