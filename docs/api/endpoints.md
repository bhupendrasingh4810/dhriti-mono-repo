# API Endpoints

This is a route-family index; use local Swagger for exact DTOs, validation constraints, and response schemas.

| Route family under `/v1`                                                      | Implemented scope                                             |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `/health`, `/metrics`                                                         | Liveness, dependency readiness, Prometheus metrics            |
| `/auth`, `/auth/mfa`                                                          | Registration, login, refresh, password flows, OAuth, and MFA  |
| `/onboarding`, `/users`                                                       | Onboarding profile and user management                        |
| `/organizations/:organizationId`, `/organization`                             | Access, members, subscriptions, teams, and workspace products |
| `/organization/connect`                                                       | Channels, messages, reactions, and real-time collaboration    |
| `/organization/flow`, `/atlas`, `/pulse`, `/cadence`, `/nexus`                | Workspace product resources                                   |
| `/organization/files`, `/notifications`, `/search`, `/webhooks`, `/analytics` | Supporting workspace services                                 |
| `/organization/hrms/*`                                                        | HRMS records                                                  |
| `/control/organization`, `/control/platform`, `/content/*`                    | Organization, platform, and content management                |
| `/billing/webhooks/:provider`                                                 | Billing-provider webhook ingress                              |

The Connect Socket.IO namespace is `/connect`. Its documented events are in [Real-time Connect](realtime.md).

TODO Confirm with team: which endpoint families are supported for third-party integrations.

## App settings

Each workspace app has its own organization settings model, stored one row per
organization and created with defaults on first read.

| Method  | Route                                    | Access                                       |
| ------- | ---------------------------------------- | -------------------------------------------- |
| `GET`   | `/organization/settings/apps/:app`       | Any organization member                      |
| `PATCH` | `/organization/settings/apps/:app`       | `organization.settings.manage`               |
| `GET`   | `/organization/settings/apps/connect/me` | Current user (personal Connect prefs)        |
| `PATCH` | `/organization/settings/apps/connect/me` | Current user                                 |
| `GET`   | `/organization/settings/apps/access`     | Current member's effective manage capability |

`:app` is one of `connect`, `flow`, `atlas`, `nexus`, `cadence`, `pulse`, `notes`, `hrms`.
PATCH bodies are partial; unknown keys are rejected. Every organization-settings
change is written to the audit log, including old and new values in the same
database transaction. Partial updates acquire a per-organization/app transaction
lock before validating the merged row. Pulse working hours/days also have database
constraints. Server policy reads are uncached, so different API instances enforce
the current persisted policy immediately.

Settings are enforced server-side in each app's service, for example Connect
message length, edit/delete windows, DMs/group chats, pin policy, allowed
reactions, image type/size, polls, calls and recording; Pulse working hours,
event duration and meeting attendees; Notes length and sharing; HRMS leave,
payroll currency and training limits. Connect `messageRetentionDays` and
`recordingRetentionDays` purge older data only when the default-off deployment
flag `CONNECT_RETENTION_ENABLED=true` is set. Changing an active retention limit
sets a new 24-hour grace period (`retentionEnabledAt`, server-managed). Existing
policies without an activation timestamp remain inactive until explicitly changed.
The settings UI requires confirmation when enabling or shortening a retention
limit. The job purges tenant-scoped batches of at most 1,000 records, including
already soft-deleted posts, formatted message text, comments and associated polls.
It preserves existing deletion timestamps. Each batch rechecks the policy under
the same transaction lock used by settings saves, so disabling or changing
retention takes effect between batches. Recording batches process one item at a
time and delete managed, tenant-prefixed storage objects before clearing pointers.
Unknown/external recording URLs are preserved and logged for operator action:
there is currently no recording upload/storage writer in this repository.
Redis lease renewal and release verify ownership.
Personal Connect quiet hours suppress email notifications only. Expired
manual presence preferences are refreshed for connected users by a bounded
background scan every five seconds.

Captions, transcription, custom background upload and client ring timeout are
client presentation preferences/controls, not server-enforced media restrictions.
There is no server captions/transcription/background media pipeline to enforce
them against. Calls, video calls, recording permission and message pinning remain
server-authorized. Hiding a client control must not be interpreted as a compliance
or media-content guarantee.

Run settings persistence/concurrency tests against a migrated local database:
`cd apps/api && SETTINGS_DATABASE_TESTS=true node --env-file=.env node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/modules/settings/app-settings.persistence.spec.ts`.

## Per-app notification preferences

`GET /organization/notifications/preferences` and
`POST /organization/notifications/preferences` read and upsert the current user's
organization-scoped event preferences. POST accepts
`{ type, inApp?, email?, push? }`; omitted fields preserve existing values.
New rows default to in-app on, push off and email on, except `CALL` defaults
email off. Existing saved values are unchanged.

The notification enum now supports independent event preferences for:

| App     | Notification types                                                     |
| ------- | ---------------------------------------------------------------------- |
| Connect | `DIRECT_MESSAGE`, `MENTION`, `CALL`, `MESSAGE`                         |
| Notes   | `NOTES_SHARED`, `NOTES_ACCESS_REQUEST`, `NOTES_ACCESS_DECISION`        |
| Pulse   | `PULSE_INVITATION`, `PULSE_EVENT_UPDATE`, `MEETING_REMINDER`           |
| Flow    | `FLOW_ASSIGNMENT`, `FLOW_COMMENT`, `FLOW_DUE_DATE`                     |
| Atlas   | `ATLAS_SHARED`, `ATLAS_COMMENT`, `ATLAS_MENTION`                       |
| Cadence | `CADENCE_INVITATION`, `CADENCE_REMINDER`, `CADENCE_RESULTS`            |
| HRMS    | `HRMS_LEAVE_REQUEST`, `HRMS_LEAVE_DECISION`, `HRMS_PAYROLL`            |
| Control | `CONTROL_MEMBERSHIP`, `CONTROL_ROLE_CHANGE`, `CONTROL_SETTINGS_CHANGE` |

Legacy generic `COMMENT`, `ASSIGNMENT`, `DUE_DATE` and `SYSTEM` preferences
remain independent under Other activity; they are not silently reassigned to an
app. NotificationService checks the exact recipient/organization/event preference
before persisting an in-app notification or sending email. Both channels are
independent, including email-only delivery. Email suppression supplied by
Connect quiet hours takes precedence. Push remains stored but is not delivered.

**Delivery scope:** only Connect `DIRECT_MESSAGE`, `MENTION` and `CALL` currently
have automatic event producers using this service. The settings page explicitly
labels other events as not yet automatic. Saving these preferences configures
future/API-submitted delivery; it does not add Notes/HRMS/etc. event producers,
Pulse reminder scheduling, or new emails triggered directly by other services.

Run API delivery and persistence regressions:
`cd apps/api && NOTIFICATION_DATABASE_TESTS=true node --env-file=.env node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/modules/notification/notification.service.spec.ts src/modules/notification/notification.persistence.spec.ts`.

## Notes discovery and sharing

`GET /organization/notes` lists all notes in the current organization that the
caller owns, has an explicit sharing permission for, or that are public, including notes in the
owner's folders. An optional `folderId` filters the same accessible set; it does
not grant access to other notes in that folder. Omitting `folderId` no longer
limits the result to notes without a folder.

`GET /organization/notes/tree` returns owned `folders`, owned `homeNotes`, and
`sharedNotes` from every folder. Shared-note entries include their owner and the
caller's permission. Sharing does not transfer ownership or change the note's
folder.

Note permission responses include each recipient's `user` identity (`id`, `name`,
`avatarUrl`). The original owner and co-owners can replace `permissions` through
the note PATCH endpoint. Each entry has independent `canEdit` and `canDelete`
flags, plus `isOwner` for co-ownership. Co-owners have full read, edit, share,
visibility-management, request-review and delete access even without separate
Edit/Delete flags. An empty array revokes all recipients and co-owners without
removing the original owner's full access; the original owner cannot be revoked.

Note POST/PATCH accepts `isPublic` (default `false` on creation). Public means
viewable by authenticated members of the same organization, not anonymous or
cross-organization access. Public visibility alone grants no edit/delete rights.
Only owners can change visibility. Turning a note private rejects its pending
requests; existing explicit sharing permissions remain. Organization
`sharingEnabled` policy gates publishing and permission grants, and approval
also respects `maxSharedUsersPerNote`.

Access requests:

- `POST /organization/notes/:noteId/requests` accepts
  `{ requestedRole: "EDIT" | "OWNER" }`. Only public notes support requests.
  `OWNER` adds a co-owner; it does not transfer or remove the original owner.
  Already-satisfied roles and duplicate pending requests are rejected.
- `GET /organization/notes/requests` returns the caller's outgoing requests and
  incoming requests for notes they own or co-own. Other users' requests remain
  private. A requester can no longer see requests for notes they cannot read.
- `PATCH /organization/notes/requests/:requestId` accepts
  `{ status: "APPROVED" | "REJECTED", grantedRole?: "EDIT" | "OWNER" }`.
  Only current owners can review a pending request. Approval defaults to the
  requested role, but owners can override it. Edit grants do not remove existing
  delete/co-owner rights. Rejected requests may be resubmitted.

Note updates/deletes and request creation/review use a per-note transaction lock
and recheck authorization after locking. Approval grants permission and records
the decision atomically; simultaneous decisions cannot process a request twice.

`PATCH /organization/notes/order` accepts `{ noteIds: string[], folderId?: string }`
and saves the current user's personal order, separately per organization and
view. Omit `folderId` for All notes. IDs must be unique, accessible to the caller,
and in the requested folder when one is specified (maximum 10,000). The list
endpoint applies that order after filtering access; stale/deleted/revoked IDs
never make a note visible. Unlisted accessible notes follow in updated-date
order. An empty array restores the default order for that view.

Run the sharing/discovery persistence tests against a local migrated database:
`cd apps/api && NOTES_DATABASE_TESTS=true node --env-file=.env node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/modules/notes/notes.persistence.spec.ts src/modules/notes/notes-public.persistence.spec.ts`.

## Personal and employment profiles

`GET /auth/me` returns the authenticated user's personal/contact details and their
current organization's non-deleted HRMS employee record. All optional fields are
returned explicitly as `null` when not recorded. Employment status is distinct
from the user's authentication account status.

`PATCH /auth/me` accepts `name`, `avatarUrl`, `prefix`, `dateOfBirth`, `gender`,
`bloodGroup`, `nationality`, `workEmail`, `alternateEmail`, `isdCode`,
`mobileNumber`, `timezone`, and `locale`. Work email is independent of the
sign-in email. Optional personal/contact fields can be cleared with `null`.
The ISD code and national mobile number must be submitted together or both
cleared; the existing unique phone field stores their combined international
value (at most 15 digits). Changing the number clears its phone verification flag.
Date of birth uses `YYYY-MM-DD`, must be a real date,
and cannot be in the future. Changing the birthday clears its verification flag.
Updates across profile extensions are transactional.

The web app proxies profile reads/writes through `/api/auth/profile`.
Employment fields are rejected on the self-service profile endpoint.

HR uses the existing `/organization/hrms/employees` create and
`/organization/hrms/employees/:employeeId` update endpoints, protected by
`hrms.employee.manage` and the HRMS entitlement. Employee number maps to
`employeeCode`, `startDate` to `dateOfJoining`, `status` to `employmentStatus`,
and `resignationDate` to `dateOfResignation` on the personal profile response.
Both HR endpoints additionally accept `biometricId`, `retirementDate`, and
`resignationDate`; updates also accept `employeeNumber`. The new lifecycle dates
use `YYYY-MM-DD`, may be cleared with `null`, and cannot precede joining.
HR changes retain the existing organization scoping and audit records.

Schema additions are in `prisma/migrations/20261028000000_expand_employee_profile`;
regenerate the Prisma client and apply migrations before deploying the API.

Run focused API tests with:

```bash
pnpm --dir apps/api test --runInBand --runTestsByPath \
  src/modules/auth/dto/profile.dto.spec.ts \
  src/modules/auth/services/profile.service.spec.ts \
  src/modules/hrms/services/hrms-employee.service.spec.ts
```

The opt-in `profile.persistence.spec.ts` additionally verifies actual database
round-trips, transactional rollback, and clearing fields. Set `PROFILE_DATABASE_TESTS=true`
and provide `DATABASE_URL` when running it. It creates uniquely identified synthetic
users and an organization, then deletes only those fixtures.
