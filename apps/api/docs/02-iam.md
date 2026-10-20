# IAM — Organizations, Members, Teams, Groups, Invitations

## Entity diagram

```
Organization ──┬─ OrganizationMember ── User
               ├─ Team ── TeamMember ── User
               ├─ Group ── GroupMember ── User
               ├─ Invitation
               └─ OrganizationSettings
```

`OrganizationMember.role` ∈ `OWNER | ADMIN | MEMBER | GUEST`.
A `Group` may be **manual** or **dynamic** (a `rule` evaluated against members).

## Tenant guard chain

`AuthGuard` → `TenantGuard` → `OrgRolesGuard`.

- `TenantGuard` resolves the active org and enforces membership.
- `@OrgRoles("OWNER","ADMIN")` gates admin-only operations.
- `@CurrentOrganization()` injects `{ organizationId, memberId, role }`.

## Organizations

- `POST /v1/organizations` — create (creator becomes `OWNER`; slug must be unique).
- `GET /v1/organizations` — my organizations (with my role).
- `GET /v1/organization` — the active organization.
- `PATCH /v1/organization` — rename (OWNER/ADMIN).

## Members

- `GET /v1/organization/members`
- `POST /v1/organization/members` — add an existing user by email (OWNER/ADMIN).
- `PATCH /v1/organization/members/:memberId` — change role (OWNER/ADMIN).
- `DELETE /v1/organization/members/:memberId` — remove (OWNER/ADMIN).

> The last `OWNER` cannot be demoted or removed (`LAST_OWNER`).

## Teams

Connect owns team management. See the Connect API documentation for `/v1/organization/connect/teams`.

## Invitations

- `POST /v1/organization/invitations` `{ email, role }` → returns a one-time `token` (7-day expiry).
- `GET /v1/organization/invitations` — list; stale pending ones are auto-marked `EXPIRED` on read.
- `POST /v1/invitations/accept` `{ token }` — accepts (token must match the invitee's email); creates the membership in a transaction.
- `DELETE /v1/organization/invitations/:invitationId` — cancel (pending only).

Lifecycle: `PENDING → ACCEPTED | REJECTED | EXPIRED | CANCELLED`.

## Groups

- `GET /v1/organization/groups`, `POST /v1/organization/groups`, `PATCH/DELETE /v1/organization/groups/:groupId`
- `POST/DELETE /v1/organization/groups/:groupId/members/:userId`
- `POST /v1/organization/groups/:groupId/sync` — re-evaluate a **dynamic** group's rule and sync membership.

### Dynamic group rule

```json
{ "field": "role",  "op": "in", "value": ["OWNER", "ADMIN"] }
{ "field": "teamId", "op": "eq", "value": "<teamUuid>" }
```

`field` is `role` (org role) or `teamId`; `op` is `eq` or `in`.

## Error codes

`ORGANIZATION_REQUIRED`, `ORGANIZATION_FORBIDDEN`, `ORGANIZATION_NOT_FOUND`,
`ORGANIZATION_SLUG_TAKEN`, `MEMBER_NOT_FOUND`, `MEMBER_ALREADY_EXISTS`,
`TEAM_NOT_FOUND`, `TEAM_SLUG_TAKEN`, `LAST_OWNER`, `INVITATION_EXISTS`,
`INVITATION_INVALID`, `INVITATION_EXPIRED`, `INVITATION_NOT_FOUND`,
`GROUP_NOT_FOUND`, `GROUP_NAME_TAKEN`, `GROUP_NOT_DYNAMIC`, `GROUP_RULE_INVALID`.
