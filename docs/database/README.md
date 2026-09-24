# Database Guide

## Source of truth

Dhriti uses PostgreSQL through Prisma. Edit schema fragments in `prisma/parts`, not `prisma/schema.prisma`; `scripts/build-prisma-schema.sh` concatenates fragments in a defined order before Prisma commands run.

The API package provides these database commands:

```bash
pnpm --dir apps/api run db:generate
pnpm --dir apps/api run db:migrate
pnpm --dir apps/api run db:migrate:deploy
pnpm --dir apps/api run db:seed
pnpm --dir apps/api run db:studio
pnpm --dir apps/api run db:reset
```

`db:migrate:deploy` is the migration command used by the local Docker `api-migrate` service. `db:reset` is destructive and is appropriate only for disposable development databases.

## Schema domains

| Fragment                           | Implemented domain                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `organization.prisma`              | Organizations, users, memberships, teams, and related access data              |
| `platform.prisma`                  | Platform roles, subscriptions, products, entitlements, audit, and support data |
| `connect.prisma`                   | Channels, messages, membership, mentions, and reactions                        |
| `work-os.prisma`                   | Flow, Pulse, Atlas, Cadence, and associated work-management models             |
| `hrms.prisma`                      | Employees and HRMS records                                                     |
| `nexus.prisma`                     | Nexus task data                                                                |
| `notification.prisma`              | Notification records                                                           |
| `webhook.prisma`                   | Webhook endpoints, deliveries, and related data                                |
| `content.prisma` and `blog.prisma` | Managed content, legal documents, FAQ, careers, and blog data                  |
| `enums.prisma`                     | Shared enumerations                                                            |

## Migration practice

1. Change the relevant fragment in `prisma/parts`.
2. Run `db:generate` to rebuild the generated schema and Prisma client.
3. Create and review a Prisma migration with `db:migrate` against a development database.
4. Commit the migration under `prisma/migrations` with the fragment change.
5. Apply committed migrations with `db:migrate:deploy` in deployment environments.

The existing authorization and subscription transition is additive and documented in [ADR 2026-09-21](../decisions/2026-09-21-authorization-subscription-migration.md). It retains legacy data during backfill and defers destructive removal.

TODO Confirm with team: production backup retention, restore testing, migration approval requirements, data residency, and retention/deletion policies are not established by this repository.
