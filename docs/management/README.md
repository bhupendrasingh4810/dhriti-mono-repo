# Management Guide

Management operations are implemented through authenticated control and organization-access APIs. Their exact DTOs and response shapes are available in non-production Swagger.

## Organization administration

`/v1/organizations/:organizationId` is guarded by tenant, organization-context, and access guards. Implemented management resources include:

- Permission groups, permission assignments, and effective user permissions.
- Departments and department membership.
- Teams and team membership.
- Subscriptions, entitlement lookup, and subscription lifecycle actions.

Read access uses permissions such as `organization.members.read`; write access uses `organization.permissions.manage`. Subscription operations use `billing.subscription.read` and `billing.subscription.manage` and support the `Idempotency-Key` header for mutation requests.

## Organization control

`/v1/control/organization` provides an organization control dashboard, settings, entitlement, and feature-flag operations. The exact authorization model for each route is encoded in its controller and guards.

## Platform control

`/v1/control/platform` is protected by `PlatformRolesGuard` and permits the checked-in legacy platform role set: `SUPER_ADMIN`, `SUPPORT`, `BILLING`, `SECURITY`, and `ENGINEERING`. Its controller provides platform-role assignment, dashboards, organization and user suspension/reactivation, product and subscription management, support tickets, audit logs, and a platform health view.

The authorization/subscription model is in a migration period. Read [ADR 2026-09-21](../decisions/2026-09-21-authorization-subscription-migration.md) before changing authorization behavior or removing legacy fields.

TODO Confirm with team: which team owns platform access, the approval process for suspension and subscription changes, audit-log retention, and support-ticket service-level expectations.
