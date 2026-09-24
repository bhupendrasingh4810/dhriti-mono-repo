# Operations Guide

## Local containers

The checked-in Compose stack starts PostgreSQL 16, Redis 7 with append-only persistence, a migration job, and the API. Use:

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
docker compose -f infrastructure/docker/docker-compose.yml down
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

The final command removes local PostgreSQL and Redis volumes. Seed data is an opt-in Compose profile; see [Onboarding](../onboarding.md).

## Health and metrics

| Endpoint           | Access | Meaning                                                                   |
| ------------------ | ------ | ------------------------------------------------------------------------- |
| `/v1/health/live`  | Public | Process liveness                                                          |
| `/v1/health/ready` | Public | PostgreSQL and Redis reachability; returns 503 when either is unavailable |
| `/v1/metrics`      | Public | Prometheus text exposition format                                         |

The Docker API health check calls the readiness endpoint. The API also initializes OpenTelemetry tracing before instrumented libraries are loaded, based on `apps/api/src/main.ts` importing `./tracing` first.

## Redis

The Terraform module provisions an encrypted, TLS-enabled, two-node multi-AZ ElastiCache Redis replication group with seven-day snapshots, CloudWatch engine and slow logs, and an eviction alarm. The documented production connection format is `rediss://application:<url-encoded-password>@<endpoint>:6379`.

Redis should be treated as cache and coordination infrastructure, not the source of truth. Follow [Redis Cache Policy](../architecture/redis-cache-policy.md) for key scoping, explicit TTLs, invalidation ownership, and PostgreSQL fallback.

## Deployment evidence and gaps

The repository contains Dockerfiles for the API and web application, but only the API Compose stack and Redis Terraform module define an executable deployment surface. TODO Confirm with team: CI/CD pipeline, production compute target, image registry, environment promotion, database hosting, secret manager, alert routing, incident runbooks, and rollback ownership.
