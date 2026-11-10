# ADR-001: Authorization and Subscription Migration

**Status:** Implemented migration guidance

This ADR is the requested stable entry point for [the dated authorization and subscription migration record](2026-09-21-authorization-subscription-migration.md).

The transition is additive: legacy roles, plans, entitlements, and feature flags remain while idempotent seeding and backfills create the newer records. Controllers move to `RequireAccess`; destructive removal is deferred until backfill and staging validation are complete.

Organization permission groups now have three metadata-backed system defaults:
`Administrators`, `Members`, and `Guests`. A partial unique index permits one
active group assignment per organization member. The migration consolidates
legacy per-product defaults with administrator, member, then guest precedence;
custom groups and a selected assignment's scope are retained. Product
permissions can only be attached while the corresponding `<product>.enabled`
entitlement is active. Organization and platform permissions have no product
entitlement requirement, and endpoint entitlement guards remain authoritative.

TODO Confirm with team: the criteria, owner, and date for ending legacy fallback.
