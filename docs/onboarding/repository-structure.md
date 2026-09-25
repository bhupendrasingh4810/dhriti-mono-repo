# Repository Structure

Dhriti is a pnpm and Turborepo monorepo.

| Path                       | Purpose evidenced in the repository                                                        |
| -------------------------- | ------------------------------------------------------------------------------------------ |
| `apps/web`                 | Next.js web application and feature orchestration                                          |
| `apps/api`                 | NestJS API, WebSocket gateway, health, and metrics                                         |
| `packages/*`               | Shared UI, auth, validation, types, API client, config, icons, utilities, and emoji picker |
| `prisma/parts`             | Authored Prisma schema fragments                                                           |
| `prisma/schema.prisma`     | Generated Prisma schema; do not edit directly                                              |
| `prisma/migrations`        | Committed database migrations                                                              |
| `infrastructure/docker`    | Local API stack and application Dockerfiles                                                |
| `infrastructure/terraform` | Managed Redis infrastructure module                                                        |
| `docs`                     | Engineering, operational, and product documentation                                        |

`apps/worker` is referenced by a root script but is not present in the workspace. TODO Confirm with team whether it is planned, external, or intentionally removed.
