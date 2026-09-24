# Local Development

Follow the checked-in [Onboarding](../onboarding.md) guide for installation, Docker Compose, direct application startup, database commands, and validation.

```bash
pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up --build
pnpm dev:web
pnpm dev:api
```

The local Compose API is served at `http://localhost:3001/v1`; readiness is available at `/health/ready`. The API validates its environment at startup.

TODO Confirm with team: the source of the required `ONBOARDING_URL` when using the checked-in Compose definition.