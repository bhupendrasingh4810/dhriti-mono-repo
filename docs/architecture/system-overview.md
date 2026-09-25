# System Overview

The checked-in runtime consists of a Next.js web application, a NestJS API, PostgreSQL, Redis, and optional external integrations. [Architecture Overview](overview.md) records the surrounding boundaries and unknown production topology.

```mermaid
flowchart LR
  Browser --> Web[apps/web: Next.js]
  Browser --> API[apps/api: NestJS /v1]
  Browser --> Connect[Socket.IO /connect]
  Web --> API
  API --> Postgres[(PostgreSQL)]
  API --> Redis[(Redis)]
  Connect --> Redis
  API --> Storage[S3-compatible storage]
```

PostgreSQL is authoritative for persistent business data; Redis is cache and coordination infrastructure. TODO Confirm with team: production ingress, compute, hosting, and external-provider ownership.
