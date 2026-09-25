# Authorization and subscription migration

The new authorization and subscription models are additive. Legacy `User.role`,
`UserAuth.platformRole`, `Subscription.plan`, `ProductEntitlement`, and
`FeatureFlag` remain temporarily so existing traffic and historical records are
not broken during rollout.

## Deployment sequence

1. Deploy the additive migration generated from the Prisma changes.
2. Run the idempotent Prisma seed to create system permissions, explicit
   platform roles, all legacy-equivalent plans, and baseline entitlements.
3. The seed backfills legacy subscriptions with a missing `planId` and converts
   legacy `ProductEntitlement` records into `OrganizationEntitlement` overrides
   without overwriting an existing explicit override.
4. Run the idempotent legacy-administrator backfill in the Prisma seed. It
   creates an organization-scoped `Legacy administrators` system group and
   assigns active legacy `PLATFORM_ADMIN`, `ADMIN`, and `ORG_ADMIN` members the
   organization management permissions required by migrated endpoints.
5. Backfill remaining organization permission groups and assignments from
   legacy groups, preserving organization ownership and recording invalid
   cross-tenant rows.
6. The seed creates `HrmsEmployee` records for active legacy HRMS profiles that
   have active organization memberships, without replacing an existing explicit
   employee record. Tenant-owned attendance, leave, performance, payroll,
   training, assets, and benefit records remain additive until their legacy data
   is backfilled and observed in staging. The idempotent seed backfills each
   record only where profile-to-employee ownership can be established. Global
   assets with no assignment are intentionally retained as legacy records because
   their tenant cannot be inferred safely.
7. Switch domain controllers from role checks to `RequireAccess` and verify
   tenant-isolation integration tests in a staging database.
8. Stop legacy writes, verify production reads use the new tables, then remove
   legacy columns and tables in a separate destructive migration.

## Platform role transition

Explicit `PlatformRole`, `PlatformRolePermission`, and
`PlatformUserRoleAssignment` records are now managed through the Control API and
audited. `PlatformRolesGuard` first recognizes active explicit assignments, then
falls back to `UserAuth.platformRole` while the idempotent seed backfills legacy
staff assignments. Do not remove or stop writing the legacy enum until the
backfill has been deployed and legacy fallback telemetry confirms no use.

No destructive migration is included in this change. The application must
validate department, team, and Flow-project ownership in the same transaction
that creates a scoped permission assignment because Prisma cannot express the
required cross-table organization equality as a relation constraint.
