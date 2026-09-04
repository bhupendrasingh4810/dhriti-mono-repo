# Control — Platform & Organization Admin

Control has two submodules under `src/modules/control/`:

```
control/
├── platform/      # internal staff (SUPER_ADMIN/SUPPORT/BILLING/SECURITY/ENGINEERING)
└── organization/  # org admin (OWNER/ADMIN)
```

## Entity diagram

```
Product ── ProductEntitlement ── Organization
Subscription ── Organization
FeatureFlag ── Organization
SupportTicket ── User (+ optional Organization)
OrganizationSettings ── Organization
User.platformRole ∈ SUPER_ADMIN | SUPPORT | BILLING | SECURITY | ENGINEERING
```

## Platform Admin — base `/v1/control/platform`
Guarded by `PlatformRolesGuard` + `@PlatformRoles(...)` (internal staff only).

- `GET /dashboard` — orgs (total/active/suspended), users (total/active/MFA), subscription status counts, product counts, support (open/escalated).
- `GET /organizations`, `POST /organizations/:id/suspend`, `POST /organizations/:id/reactivate`.
- `GET /users`, `POST /users/:id/suspend`, `POST /users/:id/reactivate`.
- `GET /products`, `POST /products`, `PATCH /products/:productId` — product catalog (name, price, active).
- `PUT /organizations/:organizationId/subscription` — upsert plan/seats/status (upgrade/downgrade/cancel).
- `GET /tickets?status=`, `POST /tickets`, `PATCH /tickets/:ticketId` — support center.
- `GET /audit-logs?limit=` — cross-org platform audit logs.
- `GET /health` — uptime, memory, Redis.

## Organization Admin — base `/v1/control/organization`
Guarded by `TenantGuard` + `@OrgRoles("OWNER","ADMIN")`.

- `GET /dashboard` — members (total/owners/admins), teams, enabled products, subscription, storage usage, message/issue/page counts.
- `GET /settings`, `PATCH /settings` — domain, branding logo, timezone, locale, **MFA enforcement**, password min length, session timeout, data retention days.
- `GET /entitlements`, `POST /entitlements` `{ productKey, isEnabled }` — enable/disable apps per org.
- `GET /feature-flags`, `POST /feature-flags` `{ key, isEnabled }` — per-org feature flags.
- `GET /subscription` — view plan/seats/status.
- `GET /audit-logs/export` — download org audit logs as CSV.

## Error codes
`PRODUCT_NOT_FOUND`, `PRODUCT_KEY_TAKEN`, `TICKET_NOT_FOUND`,
`ORGANIZATION_NOT_FOUND`, `FORBIDDEN`, plus the IAM codes.
