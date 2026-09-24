# Deployment Runbook

The repository contains API and web Dockerfiles, a local API Compose stack, and Terraform for managed Redis. The Compose stack runs PostgreSQL, Redis, an API migration job, and the API; its migration job uses `db:migrate:deploy`.

No executable production CI/CD or application hosting workflow is checked in. Treat the following as a verification checklist rather than a production procedure:

1. Build the application image using the relevant Dockerfile.
2. Apply committed Prisma migrations with `db:migrate:deploy`.
3. Verify `/v1/health/ready` can reach PostgreSQL and Redis.
4. Verify `/v1/metrics` is reachable by the configured metrics collector.

TODO Confirm with team: production deployment target, image registry, promotion workflow, rollback, approvals, and owners.