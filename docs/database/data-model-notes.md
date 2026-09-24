# Data Model Notes

- Prisma schema fragments are the editable source; the assembled schema is generated.
- Migrations are committed under `prisma/migrations` and should be reviewed with their corresponding fragment changes.
- The Connect domain includes organization-scoped channels and messages, channel membership, message mentions, reactions, and threaded message relationships.
- The authorization and subscription migration retains legacy data while additive backfills are observed; see [ADR-001](../decisions/ADR-001-authorization-subscription-migration.md).

Use `db:generate`, `db:migrate`, and `db:migrate:deploy` from the API package as described in the [Database Guide](README.md). `db:reset` is destructive and only suitable for disposable development data.

TODO Confirm with team: canonical data-retention and deletion policies.