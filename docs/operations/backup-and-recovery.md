# Backup and Recovery

The local Compose stack uses named PostgreSQL and Redis volumes; `docker compose ... down -v` removes them. Do not use that command when local data must be retained.

The Redis Terraform module specifies seven-day snapshots. PostgreSQL backup, retention, restore testing, recovery objectives, and ownership are not defined in checked-in infrastructure.

## Required Production Decisions

- Enable encryption at rest for PostgreSQL, backups, and object storage containing files or recordings.
- Define retention and deletion periods for messages, files, recordings, audit logs, and backups with the data owner and legal/compliance stakeholders.
- Run and record a restore test at an agreed cadence. Include Connect messages and call audit data in the test scope.
- Limit backup and recording access to named operational roles and audit every export or download.

TODO Confirm with team: PostgreSQL backup mechanism, retention, restore validation cadence, RPO, RTO, and recovery owner.
