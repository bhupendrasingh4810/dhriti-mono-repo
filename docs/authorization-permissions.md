# Authorization, Entitlements, and Permissions

This document is the reference for the authorization values currently used by the API and surfaced by the web Control experience.

## Sources of Truth

| Concern | Source | Used by |
|---|---|---|
| Permission and plan-entitlement catalog | `prisma/seed.ts` | API database seed |
| Effective organization entitlement | `EntitlementService` | API authorization and limits |
| User permission evaluation | `PermissionService` | API authorization |
| Route enforcement | `@RequireAccess` and `AccessGuard` | Protected API controllers |
| Plan and entitlement administration | Control API and Control web pages | Platform administrators |
| Human-readable catalog mirror | `permission.json` | Documentation and configuration reference |

`permission.json` is not loaded by the application at runtime. Add or remove active catalog values in `prisma/seed.ts`, then keep this document and `permission.json` synchronized.

## Enforcement Model

Every protected app action can require:

1. A **feature entitlement** for the organization, for example `hrms.enabled`.
2. A **permission** held by the current user through an active organization permission group, for example `hrms.asset.manage`.
3. A **limit** checked by the responsible domain service before it creates a resource, for example `max_users`.

The API is authoritative. The web app may use effective entitlements and user permissions to hide unavailable navigation, disable actions, and show upgrade guidance, but it must not be the only enforcement point.

## Entitlements

### Feature entitlements

| Key | Product |
|---|---|
| `atlas.enabled` | Atlas |
| `cadence.enabled` | Cadence |
| `connect.enabled` | Connect |
| `flow.enabled` | Flow |
| `hrms.enabled` | HRMS |
| `nexus.enabled` | Nexus |
| `pulse.enabled` | Pulse |

Feature entitlements are enforced by controller metadata such as:

```ts
@RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.asset.manage" })
```

### Limit entitlements

| Key | Purpose | Current API enforcement |
|---|---|---|
| `max_users` | Active organization members | Enforced when adding members and accepting invitations |
| `max_teams` | Connect teams per organization | Enforced when creating a Connect team |
| `max_projects` | Flow projects per organization | Seeded; no domain-service check currently exists |

Do not treat a null or missing limit as unlimited. `EntitlementService` intentionally rejects it.

### Platform organization overrides

In Control → Platform → Organizations, open an organization's details and select **Entitlements**.
The list includes every catalog definition, even when it is disabled or absent from the organization's plan.
Platform administrators can enable or disable features and set non-negative integer limits (including zero).
Saving creates a non-expiring organization override, replacing any expiry on that override, without modifying
the subscription plan or other organizations. Enabled limits require a value.
Use the single **Save** button in the Entitlements header to apply all edited cards. All edited limits are validated
before any writes. Changes are saved individually: if a request fails, its edits remain available for retry while
successful changes become the saved baseline and are not submitted again.

The platform-admin endpoints are `GET` and `PATCH /control/platform/organizations/:organizationId/entitlements`.
Updates are audited and use the shared entitlement writer to invalidate the organization's entitlement cache.
The desktop sidebar and mobile app picker hide plan-gated products unless their effective `<product>.enabled`
feature is enabled. Members read feature states through `GET /organizations/:organizationId/me/entitlements`
without needing billing permissions. Navigation refreshes on window focus, every minute, and after an entitlement
save in the current window; failed loads hide gated apps and display an error. Notes and Control require
`notes.enabled` and `control.enabled` respectively, including for platform staff. Only Home remains outside
this product-entitlement navigation gate.
Control navigation additionally requires an active organization owner or an active organization-scoped
assignment to the system Administrators group. Individual permission grants and global user roles do not
make a member an organization administrator. `GET /organizations/:organizationId/me/control-access`
provides this tenant-specific visibility decision; API action permissions remain independently enforced.

## Permissions

### Organization and platform

| Area | Permission keys |
|---|---|
| Organization | `organization.members.read`, `organization.members.invite`, `organization.members.remove`, `organization.permissions.manage`, `organization.settings.manage` |
| Billing | `billing.subscription.read`, `billing.subscription.manage` |
| Platform utilities | `analytics.read`, `webhook.read`, `webhook.manage` |

### Connect

`connect.channel.read`, `connect.channel.create`, `connect.channel.update`, `connect.channel.delete`, `connect.message.create`, `connect.message.delete`

### Flow

`flow.project.read`, `flow.project.create`, `flow.project.update`, `flow.project.delete`, `flow.issue.read`, `flow.issue.create`, `flow.issue.update`, `flow.issue.delete`, `flow.issue.transition`

### Atlas

`atlas.space.read`, `atlas.space.create`, `atlas.page.read`, `atlas.page.create`, `atlas.page.update`

### Pulse

`pulse.calendar.read`, `pulse.calendar.create`, `pulse.calendar.update`

### Cadence

`cadence.session.read`, `cadence.session.create`, `cadence.session.update`, `cadence.card.create`, `cadence.card.update`, `cadence.card.delete`, `cadence.vote.create`, `cadence.vote.delete`

### Nexus

`nexus.conversation.read`, `nexus.conversation.create`, `nexus.task.read`, `nexus.task.create`

### HRMS

| Area | Permission keys |
|---|---|
| Employees and workforce directory (list, create, import/export, org chart) | `hrms.employee.read`, `hrms.employee.manage` |
| Attendance | `hrms.attendance.read`, `hrms.attendance.manage` |
| Leave | `hrms.leave.read`, `hrms.leave.manage`, `hrms.leave.approve` |
| Performance | `hrms.performance.read`, `hrms.performance.manage` |
| Payroll | `hrms.payroll.read`, `hrms.payroll.manage`, `hrms.payroll.approve` |
| Training | `hrms.training.read`, `hrms.training.manage` |
| Assets | `hrms.asset.read`, `hrms.asset.manage` |
| Benefits | `hrms.benefit.read`, `hrms.benefit.manage` |
| Holidays | `hrms.holiday.read`, `hrms.holiday.manage` |

## Permission Groups

Organization creation generates `admins`, `users`, and `guest` system groups for Connect, Flow, HRMS, Pulse, Atlas, and Cadence. A group receives authority only after its permissions are assigned and the group is assigned to a member.

Use the following baseline policy when populating group permissions:

| Group type | Policy |
|---|---|
| `admins` | All permissions for that product plus organization configuration permissions needed for administration |
| `users` | Product read/create/update permissions required for normal daily work; exclude destructive and approval permissions by default |
| `guest` | Read-only permissions deliberately safe for external users; no default write or administration permissions |

The creator is assigned to each app's `admins` group. New members are assigned to active `*_users` groups by the organization membership workflow.

## Platform Organization Members

Platform organization details use the existing `GET /control/organization/members` endpoint with the selected
organization's `x-organization-id` header. Optional `search` filters names and emails case-insensitively;
deleted memberships and users are excluded. TenantGuard authorizes cross-organization reads for platform
administrators, and the endpoint retains its `organization.members.read` permission requirement.
The members table applies status, owner/non-owner, and team filters plus column sorting to the complete API
search result before client-side pagination. Filter, sort, search, and rows-per-page changes reset to page one.

## Adding a New Protected Capability

1. Add the permission key to `systemPermissions` in `prisma/seed.ts`.
2. Add a feature or limit entitlement to `planEntitlements` when plan control is required.
3. Add the permission to the appropriate system permission groups.
4. Protect the endpoint with `@RequireAccess`.
5. For quantities, call `EntitlementService.assertWithinLimit` in the domain service before creating the resource.
6. Update `permission.json` and this document.
7. Update the web app to reflect the effective entitlement and current user permissions, while retaining API enforcement.
