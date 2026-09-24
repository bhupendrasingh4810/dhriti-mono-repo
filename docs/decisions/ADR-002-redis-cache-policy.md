# ADR-002: Redis Cache Policy

**Status:** Active repository policy

This ADR records the checked-in [Redis Cache Policy](../architecture/redis-cache-policy.md): PostgreSQL remains the source of truth, caches require evidence of an expensive repeated read, and every cached value needs scoped keys, an explicit TTL, invalidation ownership, stale-data behavior, and a database fallback.

Organization and user data keys must carry their respective IDs. `RedisService.setJson` requires an explicit TTL.

TODO Confirm with team: cache-review owner and production cache observability thresholds.