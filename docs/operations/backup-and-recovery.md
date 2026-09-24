# Backup and Recovery

The local Compose stack uses named PostgreSQL and Redis volumes; `docker compose ... down -v` removes them. Do not use that command when local data must be retained.

The Redis Terraform module specifies seven-day snapshots. PostgreSQL backup, retention, restore testing, recovery objectives, and ownership are not defined in checked-in infrastructure.

TODO Confirm with team: PostgreSQL backup mechanism, retention, restore validation cadence, RPO, RTO, and recovery owner.