# Redis Cache Policy

Redis is not the source of truth. PostgreSQL remains authoritative for persistent business data.

Add a cache only when profiling identifies a repeated expensive read. Every cache proposal must document the key scope, TTL, invalidation owner, stale-data behavior, expected hit rate, and database fallback before implementation.

All cache writes must use `RedisService.setJson`, which requires an explicit TTL. Persistent Redis metadata requires a named coordination use case and an expiry unless the owner documents why persistence is necessary.

Keys containing organization data must include the organization ID. Keys containing user-specific data must include the user or session ID. Global keys are permitted only for endpoint-level abuse protection or singleton job coordination.