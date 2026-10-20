# Deployment Runbook

The repository contains API and web Dockerfiles, a local API Compose stack, and Terraform for managed Redis. The Compose stack runs PostgreSQL, Redis, an API migration job, and the API; its migration job uses `db:migrate:deploy`.

No executable production CI/CD or application hosting workflow is checked in. Treat the following as a verification checklist rather than a production procedure:

1. Build the application image using the relevant Dockerfile.
2. Apply committed Prisma migrations with `db:migrate:deploy`.
3. Verify `/v1/health/ready` can reach PostgreSQL and Redis.
4. Verify `/v1/metrics` is reachable by the configured metrics collector.

## Connect Security Checks

1. Confirm `CORS_ORIGINS` and `CONNECT_SOCKET_ALLOWED_ORIGINS` contain only approved HTTPS web origins.
2. Confirm the deployment secret manager supplies `AGORA_APP_CERTIFICATE`; it must not be present in browser bundles or client environment variables.
3. Confirm Redis is available before deployment. It distributes Connect socket presence and forces active sockets to disconnect after a session is revoked.
4. Apply and verify the Connect call migration before enabling calls. The API persists call state in `connect_calls` and `connect_call_participants`.
5. Verify recording remains disabled unless an approved consent, storage, retention, and deletion workflow has been deployed.

TODO Confirm with team: production deployment target, image registry, promotion workflow, rollback, approvals, and owners.
