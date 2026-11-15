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

## HRMS dashboard metrics

`GET /organization/hrms/leave/dashboard/monthly` requires `hrms.leave.read`.
It returns six UTC calendar months of approved leave days through today, using
stored daily allocations. Legacy full-calendar ranges and single-month totals
can also be counted exactly; ambiguous legacy requests are omitted and reported
in `excludedLegacyRequests`.

`GET /organization/hrms/payroll/dashboard/monthly` requires
`hrms.payroll.read`. It returns six UTC calendar months of approved and paid net
payroll grouped by pay-date month and currency, including approved future pay
dates in the current month. Each currency is separate and is not converted.
Both routes require the HRMS entitlement and an active tenant session.

## App settings

Each workspace app has its own organization settings model, stored one row per
organization and created with defaults on first read.

| Method  | Route                                    | Access                                       |
| ------- | ---------------------------------------- | -------------------------------------------- |
| `GET`   | `/organization/settings/apps/:app`       | Any organization member                      |
| `PATCH` | `/organization/settings/apps/:app`       | `organization.settings.manage`               |
| `GET`   | `/organization/settings/apps/connect/me` | Current user (personal Connect prefs)        |
| `PATCH` | `/organization/settings/apps/connect/me` | Current user                                 |

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
app. Every accepted event creates durable inbox history, **including when
`inApp` is false**. `inApp` controls live alerts only. Email is independent;
Connect quiet hours, Do Not Disturb and muted conversations take precedence.
Absent a saved preference, email defaults on except missed calls. Push remains
stored but is not delivered.

### Notification storage, transport and delivery

Business mutations call `enqueueNotification(tx, event)` inside their database
transaction. The versioned intent records tenant, actor, source resource and
deduplicated recipients; actors do not receive their own activity alerts.
The outbox and business change either both commit or both roll back.
Connect message retries use the persisted message ID for notification deduplication.

The API's notification worker polls every two seconds, claiming outbox rows with
`FOR UPDATE SKIP LOCKED`. Inbox materialization and per-channel delivery intents
commit together. The transport-independent `materializeEvent(tx, envelope)`
consumer can also be called by a future broker adapter: preserve the envelope ID
to retain inbox idempotency. Kafka is not required or configured in this release.

Inbox rows retain `recipient_id`, `actor_id`, `source_type`, `source_id`,
`is_read`, `is_seen`, JSONB `payload` and UTC `created_at`; existing API field
names remain camelCase for compatibility. History belongs to PostgreSQL, not
Redis. There is no automatic history pruning in this release.

Delivery is at-least-once, with independent REALTIME/EMAIL statuses, a two-minute
claim lease, exponential retry delays and terminal `FAILED` after eight attempts.
Queue times and comparisons use UTC explicitly, regardless of PostgreSQL session
timezone. Logs and `lastError` expose failures. Failed outbox rows can be replayed
by an operator by setting `status='PENDING'`, `attempts=0`, `availableAt` to UTC
now; failed delivery rows can be retried similarly after clearing their lease.
Do not reset SENT deliveries unless intentional redelivery is desired.
External email can duplicate if a process crashes after provider acceptance but
before recording success; this is not an exactly-once email guarantee.
Outbox, realtime and email loops run independently so a slow email provider does
not block inbox creation or online alerts.

Deploy both notification migrations before the matching API/web release. They
rename legacy notification columns, so coordinate the rollout rather than
running old and new API versions against the renamed schema simultaneously.

Active tenant membership and current channel preferences are checked again at
delivery. Notes/Connect/Flow/Pulse eligibility is also rechecked. Notes, HRMS and
anonymous Cadence alerts use generic previews, never note bodies, leave reasons,
salary values or anonymous feedback. Resource HTTP endpoints remain authoritative.

REALTIME publishes an invalidation to Redis; each API instance relays only to its
local authenticated `/notifications` sockets in tenant/user rooms. Clients never
choose another recipient's room. Token/session and membership validity are
rechecked every minute. A SENT realtime intent means dispatched, not read.
The bell refreshes on connection, on tab visibility and every 30 seconds; Redis
loss therefore does not lose history. Email requires configured Brevo credentials
and includes a destination based on `WEB_APP_URL`; missing configuration fails
and retries rather than being acknowledged as sent. No browser/mobile push yet.

### Inbox API

- `GET /organization/notifications`: cursor page, `unreadCount`, `unseenCount`.
  Ordering is `createdAt DESC, id DESC`; cursors are tenant/recipient scoped.
- `PATCH /organization/notifications/seen`: `{ ids: string[] }`, maximum 200.
  Only loaded IDs are marked seen; concurrently arriving events are not swallowed.
- `PATCH /organization/notifications/:id/read`: marks both read and seen.
- `PATCH /organization/notifications/read-all`: marks all current inbox rows read.
- `POST /organization/notifications`: queues `{ eventId }`, not a synchronous
  notification row. HTTP callers may target only themselves; cross-user events
  must originate in an authorized business operation. Arbitrary `linkUrl` input
  is rejected; app producers supply organization-relative destinations.

### Automatic producers

| App | Implemented triggers and recipients |
| --- | --- |
| Connect | Direct/group messages and mentions to eligible members; missed calls to other participants |
| Notes | Newly shared access; edit/co-owner requests to owners; decisions to requesters |
| Pulse | Event/meeting creation and added attendees; updates and cancellation to attendees |
| Flow | Issue creation/reassignment to the new assignee |
| Atlas | Page comments to the page author |
| Cadence | Team session creation to team members; completed sessions to card participants |
| HRMS | New leave requests to organization owners; decisions and payroll approvals to the employee |
| Control | Added membership to the member; role changes to the member; organization/app settings changes to other owners |

Pulse reminders, Flow due dates/comments, Atlas sharing/mentions and Cadence
reminders are **not scheduled/emitted yet** and remain labelled accordingly in
settings. Their underlying scheduling/sharing/comment surfaces require separate
implementation; saving preferences does not enable them. HRMS alerts land on
Home because there is no HRMS records route yet. Notes alerts open the note or
Requests directly; other implemented apps use their existing landing routes.

Run API delivery and persistence regressions:
`cd apps/api && NOTIFICATION_DATABASE_TESTS=true node --env-file=.env node_modules/jest/bin/jest.js --runInBand --runTestsByPath src/modules/notification/notification.service.spec.ts src/modules/notification/notification.persistence.spec.ts`.
Notification and Notes persistence suites create and remove unique PostgreSQL
schemas so a running development worker cannot consume test fixtures.

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

## Recruitment foundation

After applying migrations `20261115130000_recruitment_foundation`,
`20261115140000_recruitment_candidates`, and
`20261115150000_recruitment_interview_feedback`,
`20261115210000_recruitment_job_fields`, and
`20261115220000_recruitment_rejection`, the
`/organization/hrms/recruitment` routes require an active tenant session and
the HRMS entitlement. Organization owners and administrators may grant or
revoke individual `MANAGER` or `INTERVIEWER` access through `grants`; `members`
provides a paginated active-member search for administrators. Recruitment
managers can list and create internal `openings` and change an opening's status
with its current revision. Grant and opening changes are audited.

Opening drafts may additionally record company name, minimum and maximum
experience in whole years, a CTC range (decimal strings, currency code, and
monthly or yearly period), a nondisclosure choice, posted date, openings count,
highlights and key skills. Existing drafts retain null values for unspecified
fields. CTC nondisclosure controls future public visibility and does not erase
an internal range; no public job publication is implemented. Posted date is a
date-only value and does not publish an opening. Applicant counts are derived
from candidate records rather than entered manually. Job descriptions are
currently plain text, including line breaks.

Managers can create candidates for open internal openings, assign a hiring person
and a separate interviewer, move candidates between stages, and record a joined
or offer-declined outcome from Hired. Managers may reject an active candidate in
any stage with a nonblank reason and the current revision. Closed candidates
leave the active board and remain available in history. Hired is the final stage.
Managers may assign an active, non-deleted HRMS employee whose user and tenant
membership are active as interviewer. The assigned member alone can
access `/interviews/:id` and submit passed/failed feedback through
`/interviews/:id/feedback`; a recruitment grant is not required for this
assignment. The assignment and revision are checked on feedback submission;
feedback does not automatically move the candidate. A previously granted
interviewer role no longer gives access to candidate lists or management APIs.
The unpaginated `board` endpoint defaults to active candidates;
`includeClosed=true` includes rejected, joined and offer-declined candidates.
The legacy paginated `candidates` endpoint defaults to active candidates and
`scope=closed` returns closed candidates only. Candidate lists return
the latest interview feedback; candidate details return the latest 100 comments
and feedback entries. Administrators may add, rename, and reorder pipeline
stages, and delete custom stages only when no active or historical candidates
reference them. All default stages are protected from deletion. Applied remains
first and Hired last; reordering requires the previously observed stage order and
rejects stale requests.

Opening KPI counts include all manually created candidates. Interviews counts
active candidates in the Interview stage, not scheduled appointments; Hired
includes active and joined candidates in Hired but excludes declined offers and
rejections. The unpaginated board may need virtualization or incremental loading
for very large organizations.

Openings are not published or accepting applications yet, including when their
internal status is `OPEN`. Interview scheduling, candidate emails and offer drafts
are not implemented. The existing platform
careers endpoints remain separate.

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
`hrms.workforce.manage` and the HRMS entitlement. Employee number maps to
`employeeCode`, `startDate` to `dateOfJoining`, `status` to `employmentStatus`,
and `resignationDate` to `dateOfResignation` on the personal profile response.
Both HR endpoints additionally accept `biometricId`, `retirementDate`, and
`resignationDate`; updates also accept `employeeNumber`. The new lifecycle dates
use `YYYY-MM-DD`, may be cleared with `null`, and cannot precede joining.
HR changes retain the existing organization scoping and audit records.

The Workforce page additionally uses, all under `/organization/hrms/employees` and
protected by `hrms.workforce.manage`: `GET options` (form data), `GET org-chart`,
`GET import/template?format=csv|xlsx`, `POST import/parse` (multipart `file`, csv/xlsx,
10 MB, 5,000 rows), `POST import/validate`, `POST import` (re-validates; invalid rows
are skipped and reported) and `POST export` (`scope`: `all|selected|filtered`,
`format`: `csv|xlsx`). Employees
have `departmentId`, `designationId` and `reportingManagerId` (cycles are rejected).

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


## Current user permissions

`GET /organizations/:organizationId/me/permissions` returns `{ permissions: string[] }`: every permission key the caller holds in the organization through all assigned permission groups (and platform roles). It requires no specific permission. The web app reads it once through `usePermissions()` (`can`, `canAny`, `canAll`) for UI visibility; the API still enforces each endpoint.
