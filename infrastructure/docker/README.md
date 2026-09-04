# API Docker setup

This setup builds [apps/api](../../apps/api) from the monorepo root and runs it with PostgreSQL and Redis.

## Start the API stack

```bash
docker compose -f infrastructure/docker/docker-compose.yml up --build
```

Services:

- API: http://localhost:3001/v1
- Readiness: http://localhost:3001/v1/health/ready
- PostgreSQL: localhost:5432
- Redis: localhost:6379

The `api-migrate` service runs `prisma migrate deploy` before the API starts.

## Seed the database

```bash
docker compose -f infrastructure/docker/docker-compose.yml --profile seed run --rm api-seed
```

## Stop and reset

```bash
docker compose -f infrastructure/docker/docker-compose.yml down
```

To remove PostgreSQL and Redis data too:

```bash
docker compose -f infrastructure/docker/docker-compose.yml down -v
```

## Build the production image only

```bash
docker build -f infrastructure/docker/Dockerfile.api --target production -t dhriti-api:local .
```

The final image expects environment variables from [apps/api/.env.example](../../apps/api/.env.example), with `DATABASE_URL` and `REDIS_URL` pointing to reachable services.
