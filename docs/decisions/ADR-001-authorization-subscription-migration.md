# ADR-001: Authorization and Subscription Migration

**Status:** Implemented migration guidance

This ADR is the requested stable entry point for [the dated authorization and subscription migration record](2026-09-21-authorization-subscription-migration.md).

The transition is additive: legacy roles, plans, entitlements, and feature flags remain while idempotent seeding and backfills create the newer records. Controllers move to `RequireAccess`; destructive removal is deferred until backfill and staging validation are complete.

TODO Confirm with team: the criteria, owner, and date for ending legacy fallback.
