# Data Flow

The principal request path is browser to Next.js and/or NestJS, then to PostgreSQL and Redis. The API applies authentication, tenant context, and authorization controls before protected domain operations.

```mermaid
sequenceDiagram
  participant B as Browser
  participant W as Next.js web
  participant A as NestJS API
  participant G as Guards and validation
  participant P as PostgreSQL
  participant R as Redis
  B->>W: UI request
  W->>A: HTTP request
  A->>G: Validate, authenticate, authorize
  G->>P: Domain read or write
  G->>R: Cache or coordination when implemented
  A-->>W: Response
  W-->>B: Rendered UI
```

Connect also accepts authenticated Socket.IO connections at `/connect` and uses Redis adapters for cross-replica room communication when available. TODO Confirm with team: event-delivery guarantees and production topology.