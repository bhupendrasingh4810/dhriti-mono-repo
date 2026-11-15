# HRMS workflows

## Purpose

HRMS workflows coordinate organization-scoped approvals, tasks, and automation for employee operations. A workflow definition is reusable configuration; a workflow instance is a runtime execution of a published definition.

The runtime persists tenant-scoped instances, assignments, and immutable events. It resolves the supported declarative assignee rules (`INITIATOR` and `USER_IDS`) and never evaluates user-provided code.

## Assets: register, custody and operations

The Assets workspace contains **Inventory**, **Categories**, **Asset clearance**
and **Operations**. Its sidebar link and management page require
`hrms.asset.manage`. Employees see **My assets** and their request queue on the
dashboard in one compact list card without pagination or a "View all" link.
Each assigned asset shows a clickable **Replacement requested** status while a
request is pending/approved; its dialog contains reason, status and decision notes.
Actionable manager reviews and approved HR/Admin **Send new asset** actions appear
inside the same card. Requests remain visible after original-equipment return
until fulfilment. Replacement requests can be created only from that card.
Inventory readers can search/filter/page the register, read
metadata and history, and export every matching row, not just the loaded page.
Managers can register/edit/archive equipment, manage category names/activation,
issue available equipment and verify its return. The employee selector searches
tenant-local names/numbers remotely with pagination; asset permissions do not
grant access to private employee profiles.

Asset tags are required and organization-unique. Serial numbers are optional and
unique when populated; blank serials become null. Purchase costs use exact decimal
strings (up to three fractional places) and require a three-letter uppercase
currency code. Dates use strict UTC calendar dates; warranty cannot precede
purchase. Categories and custodians must belong to the same organization;
new category assignments require an active category. Existing inactive category
assignments may be retained.

Issue requires an available asset, an active tenant employee, condition, handover
notes and the current revision. An optional expected-return date cannot be in the
past (UTC). Employee acknowledgement confirms receipt and the recorded issue
condition; only the authenticated current holder may acknowledge it. Managers
verify returns, record condition/notes and choose Available, Maintenance or Unfit.
Returns clear the current holder, due date and acknowledgement, while preserving
the original issue and acknowledgement events. Departed employees can still have
their assets returned. Metadata edits cannot change custody or an assigned
asset's condition; use the explicit issue/return actions instead.

Writes, immutable events and audit records commit together under serializable
isolation. Revision checks reject stale editors and concurrent custody changes;
conflicts require reloading rather than silently retrying an employee decision.
`DELETE` now **archives** unassigned equipment rather than removing its evidence.
Archived records remain readable in the archived inventory and history, and
cannot be changed. Category deactivation does not rewrite existing assets.

```text
GET    /organization/hrms/assets
POST   /organization/hrms/assets
PATCH  /organization/hrms/assets/:assetId          full register fields + revision
DELETE /organization/hrms/assets/:assetId          JSON { revision }; archive, 204
GET    /organization/hrms/assets/categories
POST   /organization/hrms/assets/categories
PATCH  /organization/hrms/assets/categories/:categoryId
GET    /organization/hrms/assets/employees          query, page, pageSize, includeInactive
GET    /organization/hrms/assets/:assetId/history   page; 20 events per page
POST   /organization/hrms/assets/:assetId/issue     revision, employeeId, condition, notes, expectedReturnDate?
POST   /organization/hrms/assets/:assetId/return    revision, condition, notes, status?
GET    /organization/hrms/assets/mine               page, pageSize
POST   /organization/hrms/assets/:assetId/acknowledge  JSON { revision }; 204
GET    /organization/hrms/assets/clearance/:employeeId
GET    /organization/hrms/assets/export
```

The former `PATCH /assets/:assetId/assignment` endpoint is replaced by the explicit
issue/return commands. Updated clients must send a tag on create, a revision on
edit/archive/custody/acknowledgement, and handle nullable serials. Initial register
creation still supports a consistent Assigned status/employee pair and records an
actual issue; the UI registers inventory first and uses the separate issue dialog.

Register reads require `hrms.asset.read`, mutations `hrms.asset.manage`, and all
routes require `hrms.enabled` plus tenant membership. Self-service mine and
acknowledgement do not require register permissions; they enforce holder identity
and never expose purchase cost, private inventory notes or custodian data. Reads
are `no-store`. CSV export uses the same inventory filters, a repeatable-read
snapshot and an explicit 10,000-row limit (narrow filters for larger exports).
CSV fields are quoted and spreadsheet formula prefixes neutralized.

### Clearance and offboarding

Clearance is a live **ASSETS_ONLY** check of outstanding assignments. Outstanding
equipment blocks the offboarding clearance step, successful offboarding completion
and employee deactivation/archive. It never automatically deducts salary, revokes
organization access or approves a final settlement. An organization administrator
or holder of `hrms.workforce.manage` may record a mandatory-reason override. The
override is bound to the current equipment/revision fingerprint; custody,
accessory or metadata changes invalidate it conservatively.

Offboarding templates and clones retain an immutable `assetClearanceRequired`
policy, copied into each instance snapshot, even after graph edits/renaming.
Offboarding instances require tenant-local `context.employeeId`. Legacy stage IDs
and explicit `context.workflowType = "EMPLOYEE_OFFBOARDING"` remain recognized.
Entirely custom workflows without that policy/context are not implicitly classified
by their display name. Migration backfills identifiable existing offboarding graphs;
previously renamed, unidentifiable custom graphs require explicit classification.

### Connected operational workflows

- **Replacement:** only the authenticated active holder can request replacement.
  The reporting manager is snapshotted at submission; only that manager may decide.
  Managerless requests require explicit asset-manager review; self-approval is
  prohibited. After approval, an asset manager verifies the original return and
  issues a distinct available replacement atomically. Receipt still requires the
  employee's acknowledgement. Manager review and employee decisions use the outbox;
  managerless review currently relies on the asset-manager queue.
  The dashboard uses `GET requests?scope=dashboard` (paged internally without UI
  pagination) to fetch current-holder request status, open own requests and
  actionable manager/asset-manager reviews rather than all organization history.
  Responses include server-derived ownership and tenant-scoped employee display
  names/numbers; fulfilment still requires `hrms.asset.manage`, reporting-manager
  approval (or explicit managerless review), and verified original/accessory return.
- **Bundles:** accessories have quantities, outstanding counts, condition and
  revisions. They issue with the parent asset; partial returns are audited.
  Parent return is blocked until every accessory has been returned.
- **Maintenance:** unassigned equipment can enter a fault/vendor ticket. Closing
  records cost, currency, resolution and condition, returning equipment to
  Available or Unfit. Open tickets prevent status/archive bypasses.
- **Evidence:** private PDF/PNG/JPEG/WebP files up to 10 MB, with signature checks,
  tenant-authorized metadata/download, signed URLs and archive retention. Generic
  organization file routes cannot expose the private asset-document scope.
- **Import:** download the template; preview 1–1,000 data rows (10 MB maximum).
  Unknown/duplicate headers, invalid register fields and duplicate tags/serials
  (including archived inventory) are shown per row. Applying imports only valid
  rows and explicitly reports skipped invalid rows for correction/re-upload.
  The server-owned preview belongs to the submitting actor/tenant, expires for
  application after one hour, and applies once in a serializable transaction.
  A new database conflict rolls back all selected valid rows instead of partially saving.
  Import registers inventory, not assignments; it does not skip invalid rows.
- **Stock:** snapshot up to 10,000 active assets, observe found/missing/misplaced/
  holder-mismatch results and document investigation resolutions. Completion
  requires every item checked and every discrepancy resolved. Resolution does
  not silently rewrite custody/location. The selector lists the latest 100 sessions.
- **Finance:** procurement requests require a separate approver with
  `hrms.payroll.manage`; approvals do not automatically buy or register equipment.
  Depreciation starts disabled. Finance can configure organization-wide straight
  line, useful months and residual percentage with an audited reason. Exact-decimal
  calculations use completed UTC calendar months, cap at useful life and round
  half-up to three decimals. Accounting exports (10,000-row maximum) show cost,
  depreciation and net book value, flag missing purchase data and neutralize CSV
  formulas. They are not external ledger posting or configurable account mappings.

All operational routes share `/organization/hrms/asset-operations`:

```text
POST replacement                     GET requests
POST requests/:id/decision
GET/POST maintenance                 POST maintenance/:id/close
GET/POST assets/:id/accessories       POST accessories/:id/return
POST clearance/:id/skip
GET/POST stock                       GET stock/:id
POST stock/items/:id/observe          POST stock/items/:id/resolve
POST stock/:id/complete
GET/POST procurement                 POST procurement/:id/decision
GET/POST depreciation                GET accounting?asOf=YYYY-MM-DD
GET/POST assets/:id/attachments       GET attachments/:id/download
POST attachments/:id/archive
GET import/template                  POST import/preview
POST import/:id/apply
```

Management endpoints require `hrms.asset.manage`; replacement/request/decision
endpoints allow entitled tenant members with service-level holder/manager checks.
Skip authorization is independently enforced for HR/Admin. Finance decisions and
configuration additionally require `hrms.payroll.manage`. Reads are `no-store`.

Workforce navigation and protected workforce/document mutations now use
`hrms.workforce.manage`. The operations migration adds the key if needed and
copies existing `hrms.employee.manage` group/platform-role grants; the legacy key
remains catalogued but no longer controls these workforce routes.

Generic first-equipment requests, reservations, lost/stolen reports, reminders,
QR labels, bulk actions, operational analytics, configurable account mappings and
MDM/provider integrations remain backlog items.

Apply additive migration `20261115100000_hrms_asset_custody` and regenerate Prisma.
Existing tags become `LEGACY-<asset UUID>`. Existing assignments/timestamps remain
unchanged, with no fabricated earlier custody events or acknowledgements. Existing
serial uniqueness remains intact.

Also apply `20261115110000_hrms_asset_operations` and
`20261115120000_hrms_offboarding_clearance_policy`, then regenerate Prisma.

Focused validation:

```sh
HRMS_ASSET_DB_INTEGRATION=true pnpm --dir apps/api test --runInBand --runTestsByPath \
  src/modules/hrms/services/hrms-asset.service.spec.ts \
  src/modules/hrms/services/hrms-asset.integration.spec.ts \
  src/modules/hrms/services/hrms-asset-operations.integration.spec.ts
pnpm --dir apps/web test:components \
  src/features/hrms/components/__test__/Assets.test.tsx \
  src/features/hrms/components/__test__/AssetOperations.test.tsx
```

The opt-in database tests use rollback-only synthetic fixtures, including an
injected audit failure, without leaving inventory or employee records behind.
The connected tests also exercise replacement decisions, partial accessory
returns, offboarding rollback/override, maintenance, stock, import and finance.
Storage is mocked: these tests do not certify external object storage,
production signed downloads or browser acceptance.

## Employee foundations: lifecycle tracking and setup readiness

The employee profile's **Lifecycle** tab provides an advisory setup checklist and
HR-controlled probation, contract and notice tracking. It requires `hrms.enabled`
and `hrms.employee.manage`, like the employee directory. No probation length,
notice period, salary band or statutory policy is invented or seeded.

Configure optional probation end, contract start/end and employee-specific notice
days. Contract end requires a start. An existing probation end can only be extended
through **Extend probation**; an existing contract can only be extended through
**Renew contract**. **Confirm probation** is an explicit HR decision, not an
automatic consequence of reaching the end date. Extension/renewal dates must be
later than the existing end and cannot be in the past; confirmation cannot be
future-dated. These initial commands do not implement a correction/reversal flow.

When a resignation date and notice days are recorded, the proposed last working
date is that resignation date plus the configured number of **calendar days**,
excluding the resignation day from elapsed days. Explicit zero means same-day;
null means unconfigured. HR may approve a different date, with a reason, but it
cannot precede resignation or joining. Approved last working dates remain tracking
data: they **do not** change employment status/end date, revoke access, approve
offboarding, or create/finalize payroll. Those downstream workflows remain pending.
Changing joining/resignation dates must not invalidate saved lifecycle dates.

All commands require a reason and lifecycle version. Writes and before/after audit
snapshots commit atomically under serializable isolation; stale editors get a
conflict, not a last-writer-wins overwrite. Lifecycle field changes also appear in
the career timeline. The tab shows the latest 50 lifecycle decisions; the audit
log retains full history. Reloading tracking confirms before discarding drafts.

The readiness endpoint checks manager, location, shift, department, designation,
joining date, effective dated work-week selection and required active profile
fields. Optional/archived fields are not treated as missing. A managerless root
employee or an employee using legacy working days may be intentional; warnings
are **not** compliance failures or payroll approval. This is a per-employee setup
view, not yet an organization-wide payroll/onboarding readiness gate.

```text
GET   /organization/hrms/employees/:employeeId/readiness
GET   /organization/hrms/employees/:employeeId/lifecycle
PATCH /organization/hrms/employees/:employeeId/lifecycle
```

Reads are tenant-scoped and `no-store`. The lifecycle response includes tracking,
derived status, proposed last working date and recent decisions; private profile
values are not returned by readiness. Normal employee create/update now validate
reporting references inside the serializable write transaction, preventing
concurrent manager edits from silently introducing cycles. Imports retain their
existing batch self/cycle validation.

Apply additive migration `20261115090000_hrms_employee_lifecycle` and regenerate
Prisma. It adds JSON lifecycle tracking and its version counter without changing
existing employees' employment or payroll state.

Rollback-only database validation is opt-in:
`HRMS_EMPLOYEE_FOUNDATION_DB_INTEGRATION=true pnpm --dir apps/api test --runInBand
--runTestsByPath src/modules/hrms/services/hrms-employee-foundation.integration.spec.ts`.

Still pending in this programme: organization notice defaults, due-soon worklists
and reminders, employee-number sequencing, multi-level approval routing,
onboarding/offboarding execution and settlement. The full 18-feature programme,
including catalogs, documents and downstream integrations, is tracked in TODO.

## Work-week rules

**HRMS Settings > Work Week** manages organization-scoped named rules using shared
theme components. Create from Saturday/Sunday off, Sunday off, even/odd Saturday
off, Saturday half-day or custom templates; edit the 5-by-7 matrix, duplicate,
set a dated default and assign employees through a searchable multi-select with
removable chips, or **Assign all employees**, without a 100-employee limit.
All means every non-archived employee in the organization at save time, independent
of search results; future joiners are not automatically assigned. Bulk writes are
transactional and batched without changing earlier or later dated assignments.
Templates are starting
points, not automatically assigned policies. Delete is allowed only for rules
never referenced by default or employee assignment history.

Columns are Monday–Sunday. Rows 1–5 mean the **nth occurrence of that weekday
within a calendar month**, not rolling five-week rotations or calendar-grid rows.
For example, the fifth Saturday uses row 5; odd/even Saturdays reset monthly.
Cells represent working (1), half-day (0.5) and weekly off (0). Shift start/end
times and clock-in restrictions do not change; working on an off day is not blocked.

Rule edits, defaults and assignments require an **Applies from (UTC)** calendar
date of today or later. Earlier date versions cannot be overwritten. Changes for
today or an already-scheduled future date replace that date's entry; later
scheduled entries remain in effect. Names/descriptions are current labels, not
historical label snapshots. Rule edits use a revision check and all management
writes are serializable, with transactional actor-attributed audit records.
For previewing old/future patterns, select a pattern version in the detail panel.

Resolution is: latest employee assignment on/before the date, then the latest
organization default if no explicit rule is assigned, then that rule's latest
applicable pattern. A null rule assignment resumes following defaults until the
next assignment. Invalid/missing referenced versions fail explicitly, not via a
weekday fallback. Creating the first rule snapshots the legacy `workingDays`
setting into an **Original work week** baseline and default, preserving earlier
schedules. Until then, legacy working days continue to apply. The generic app
working-days setting still serves organization calendar consumers (including
Pulse); after initialization it no longer changes HRMS employee schedules.

Attendance logs resolve the signed-in employee's dated schedule and label half-day
schedules. New leave requests (self-service, on-behalf and legacy admin creation)
must match the server-resolved scheduled units, excluding weekly-off days. A
single full working day may be reduced to 0.5 only when half-day leave is allowed;
covering an entire scheduled half-day costs 0.5 even when discretionary half-day
leave is disabled. Schedule previews fail visibly and block submission if missing.
Schedule ranges are limited to 366 inclusive days. Holiday exclusion is unchanged:
this feature defines work weeks, not a new holiday/leave overlap policy.

New leave stores exact per-date units and rule/version references in
`dayAllocation`. Submitted leave is never recalculated when schedules change.
Calendar payroll consumes saved allocations rather than guessing which days a
multi-day unpaid leave covers; legacy allocations and saved payroll snapshots are
preserved. Gross salary continues using the existing calendar-day proration basis,
not a newly introduced working-day denominator.

Apply `20261115070000_hrms_work_weeks` and regenerate Prisma before deploying.
It adds four schedule-history tables and nullable leave allocation metadata;
existing leave/payroll data is not backfilled or recalculated.

All routes require organization context and `hrms.enabled`:

```text
GET    /organization/hrms/work-weeks
POST   /organization/hrms/work-weeks
PATCH  /organization/hrms/work-weeks/:id
DELETE /organization/hrms/work-weeks/:id
POST   /organization/hrms/work-weeks/:id/default
POST   /organization/hrms/work-weeks/assignments
GET    /organization/hrms/work-weeks/assignments/:employeeId
GET    /organization/hrms/work-weeks/me/schedule?from=YYYY-MM-DD&to=YYYY-MM-DD
GET    /organization/hrms/work-weeks/employee-schedule?employeeId=UUID&from=YYYY-MM-DD&to=YYYY-MM-DD
```

Management/list/history routes additionally require `organization.settings.manage`.
Employee schedule preview requires `hrms.leave.manage`; self-service schedule
access resolves only the signed-in user's employee. Employee picking uses the
existing directory permissions. Assignment/default foreign IDs are rejected.
Schedule/configuration responses use `Cache-Control: no-store`.

Run `HRMS_WORK_WEEK_DB_INTEGRATION=true pnpm --dir apps/api test --runInBand
--runTestsByPath src/modules/hrms/services/hrms-work-week.integration.spec.ts`
for rollback-only persistence, history, assignment, leave and tenant checks.

## Punch-time GPS attendance

Apply `20261115040000_hrms_gps_attendance` and regenerate Prisma before deploying.
Existing records have no capture evidence; no coordinates are backfilled.
Under organization app settings, **HRMS > Clock-in rules**, GPS enforcement
defaults to **off**. Maximum accepted accuracy defaults to **100 meters** and is
configurable from 1–1000 meters. Configure circular fences in **HRMS > Locations**
(latitude -90–90, longitude -180–180, integer radius 1–100000 meters), assign
employees to their work locations, communicate the policy, then enable enforcement.
All three fence fields must be supplied together, or cleared together.

The responsive web Home clock offers **Office**, **Remote** and **Field** modes:

- Office: when enforcement is enabled, both punches require the employee's
  active, same-organization assigned fence. Great-circle distance **plus the
  reported accuracy radius** must be within its radius, including the boundary.
- Remote/field: both require accurate GPS when enabled, without an office fence.
  These modes are employee-declared, not independently verified or restricted by
  employee eligibility policies. They do not change attendance status or late rules.
- A recorded clock-in mode is fixed for that session's clock-out. Legacy open
  sessions without capture evidence select their mode at clock-out.
- Breaks do not collect location. When enforcement is off the web clock sends
  mode/source/device metadata but never requests GPS.

The browser requests one high-accuracy reading on each punch, with no cached
location, a 15-second timeout and no background watcher. HTTPS (or browser-trusted
localhost) and location permission are required. The server rejects missing GPS,
non-finite/out-of-range coordinates, negative accuracy, accuracy worse than the
configured threshold, readings older than 60 seconds or over 10 seconds in the
future, and failed office fences. Errors are explicit; no fallback punch is sent.
Policy is refreshed immediately before browser capture and enforced again on the
server. Coordinate validation is not GPS-spoof prevention or native attestation.

### Native-ready request contract

Existing authentication, organization context and `hrms.enabled` checks apply.
An active employee can punch/read only their own attendance. HR attendance read
permission and regularization-management permission also expose capture evidence
through their existing scoped APIs. Responses containing evidence are not cacheable.

`GET /organization/hrms/attendance/me/today?date=YYYY-MM-DD` includes
`capturePolicy: { enabled, maxAccuracyMeters, workLocation: { name, configured } | null }`.
Clock-in accepts the date plus capture; clock-out accepts capture without a date:

```json
{
  "date": "2026-11-15",
  "capture": {
    "mode": "OFFICE",
    "source": "MOBILE_WEB",
    "device": "PHONE",
    "position": {
      "latitude": 0,
      "longitude": 0,
      "accuracy": 25,
      "capturedAt": "2026-11-15T09:00:00.000Z"
    }
  }
}
```

Send to `POST /organization/hrms/attendance/me/clock-in` or
`POST /organization/hrms/attendance/me/clock-out`. `source` supports `WEB`,
`MOBILE_WEB`, `NATIVE`; `device` supports `DESKTOP`, `PHONE`, `TABLET`, `OTHER`.
Device/source labels are client-reported hints, not trusted device identity; raw
user-agent strings and continuous location are not stored. Omit `position` when
GPS enforcement is disabled; legacy clients may omit capture only while disabled.
A future native app must obtain its OS location permission and submit the same
contract; **no native iOS/Android application is delivered in this milestone**.

Accepted evidence is saved atomically with each punch in `checkInCapture` /
`checkOutCapture`: mode, source/device, original coordinates and device timestamp,
server timestamp, accuracy threshold, validation outcome and an office-fence
snapshot including distance. Validation outcomes are `NOT_REQUIRED`,
`GPS_ACCEPTED`, `GEOFENCE_ACCEPTED`. Serializable transactions reject competing
punches with a reload conflict rather than overwriting evidence.
Coordinates are retained for the attendance record's lifetime; there is no
automatic coordinate expiry. Historical regularization/admin time corrections
preserve original punch evidence, which must not be interpreted as proof of the
corrected time. The Home clock, attendance log and manager regularization details
show capture summaries; existing records explicitly show no capture evidence.

Run `HRMS_GPS_DB_INTEGRATION=true pnpm --dir apps/api test --runInBand
--runTestsByPath src/modules/hrms/services/hrms-attendance-gps.integration.spec.ts`
for a rollback-only database check. Browser/device permission and physical GPS
accuracy still require acceptance on target mobile devices.

## Employee career timeline

The employee profile drawer's **Timeline** tab reads
`GET /organization/hrms/employees/:employeeId/timeline?page=1&pageSize=20`
(page size 1–100). It requires `hrms.enabled` and `hrms.employee.manage`,
is tenant-scoped, and sends `Cache-Control: no-store`.

Creation, per-employee bulk-import events and subsequent job edits use the
existing audit store. New job edits snapshot before/after values and master-data
labels alongside the actor and recording timestamp. Employee writes and their
history commit in the same transaction; history failures abort the write.
Concurrent job edits are rejected with a reload conflict. Removing a manager
also records reporting-manager removal for their non-deleted reports.

Tracked fields are employee number, employment status/type, department,
designation, location, shift, reporting manager and joining/end/retirement/
resignation dates. Personal profile values, skills and biometric IDs are excluded
from these history snapshots. The API returns only curated timeline details,
not arbitrary audit metadata.

This is recorded edit history, **not** effective-dated scheduling, approval of
job changes, prior-employer career history, or a guaranteed complete career
journey. Legacy audit events lack field snapshots; older bulk imports may lack
per-employee events. The UI explicitly identifies missing details rather than
reconstructing them. Availability follows the existing audit store's retention.
No new database migration is needed.

## Employee document library

The employee profile **Documents** tab supports HR-managed upload, download and
archive. The HRMS Documents route is now a live organization-wide employee
document library, replacing its mock requests/policies/compliance screens.
Uploading starts from an employee profile; generic organization files cannot
be attached as private employee documents.

All routes require `hrms.enabled` and `hrms.employee.manage`:

```text
GET  /organization/hrms/documents?page=1&pageSize=20
GET  /organization/hrms/employees/:employeeId/documents?page=1&pageSize=20
POST /organization/hrms/employees/:employeeId/documents
GET  /organization/hrms/employees/:employeeId/documents/:documentId/download
POST /organization/hrms/employees/:employeeId/documents/:documentId/archive
```

Upload is multipart with `title`, `category` and one `file`. Categories are
`PERSONAL`, `EMPLOYMENT`, `EDUCATION`, `COMPLIANCE` and `OTHER`; title is required
and limited to 160 characters. Only non-empty PDF/PNG/JPEG files up to 10 MiB are
accepted, subject also to the configured shared-file maximum. MIME signatures
are checked but **no antivirus, authenticity or statutory verification is
claimed**. List/download responses are not cacheable. Lists use stable newest-
first pagination with page size 1–100.

`StoredFile.accessScope` defaults to `ORGANIZATION`, preserving ordinary file
behavior. Employee documents use `HRMS_EMPLOYEE_DOCUMENT` and are excluded from
generic file lists/downloads/deletes and leave attachments. Their owning
employee-document service authorizes employee/document/tenant membership
before requesting a short-lived attachment URL. Storage identifiers are not
included in document responses. S3/MinIO must use a private bucket; presigned
URLs remain usable until their configured TTL, even after archive.

Document association and its audit event commit together. Failed association
attempts clean up the newly uploaded private file; cleanup failures are logged
for operations follow-up. Archive records its actor/time and audit event
transactionally, hides the document and stops issuance of new download URLs.
It is **not physical deletion**. Removed employees are excluded from the
library; files remain private for retention. No automatic purge policy is
introduced.

Apply `20261115002500_hrms_employee_documents` before deploying this code and
regenerate Prisma after rebuilding the modular schema. The migration keeps
all existing files organization-scoped; it does not reclassify legacy uploads.
Employee self-service visibility, policy distribution/acknowledgement,
document requests, letter generation, e-signatures and verification workflows
remain separate pending milestones.

Run `HRMS_DOCUMENT_DB_INTEGRATION=true pnpm --dir apps/api test --runInBand
--runTestsByPath src/modules/hrms/services/hrms-employee-document.integration.spec.ts`
after migration for the opt-in persistence test. It uses mocked object storage,
real document/file/audit constraints, and rolls back every synthetic record;
it does not test live S3 uploads.

Discarding unsaved employee edits and archiving documents use the shared
in-app confirmation dialog, not browser-native prompts. Storage upload and
download-link failures are logged by the API and return
`FILE_STORAGE_UNAVAILABLE` (503) rather than a generic unexpected-error message.
Successful mocked-storage tests do not establish live bucket readiness.

## Definition lifecycle

```text
Template
  -> clone
Draft definition
  -> edit
Active definition version
  -> replace with a new draft version
Archived definition
```

- Templates are immutable defaults supplied by Dhriti.
- Selecting a template always creates an organization-owned draft copy.
- Publishing validates the draft, marks it active, and creates an append-only `HrmsWorkflowDefinitionVersion` snapshot.
- Active definitions cannot be edited; archive them or clone them into a new draft.
- Every runtime instance records `definitionId`, `definitionVersion`, the version-record id, and a complete definition snapshot.
- Archiving prevents future use without deleting the definition or its audit history.

## Workflow model

Each definition contains:

- A name, optional description, and template key for defaults.
- A lifecycle status: `DRAFT`, `ACTIVE`, or `ARCHIVED`.
- A version number that increments whenever an active workflow is replaced.
- Ordered stages.
- Conditional transitions between stages.

### Stage model

Stages use structured data rather than executable code:

```json
{
  "id": "manager-approval",
  "key": "manager-approval",
  "name": "Manager approval",
  "type": "APPROVAL",
  "assigneeRule": { "kind": "USER_IDS", "userIds": ["<user-id>"] },
  "requiredApprovals": 1,
  "slaHours": 72
}
```

Supported stage types:

- `APPROVAL`
- `TASK`
- `AUTOMATION`
- `CONDITION`
- `PARALLEL_GATE`

### Transition model

Transitions describe the configured stage sequence:

```json
{
  "from": "manager-approval",
  "to": "hr-approval",
  "action": "APPROVE",
  "condition": { "field": "request.amount", "operator": "EQUALS", "value": 5000 }
}
```

`id`, `key`, `name`, and `type` are required. `isTerminal` may be set only on stages without outgoing transitions. Approval stages require an assignee rule. The graph must have one start stage, at least one terminal stage, valid references, no unreachable stages, and a terminal path from every stage. Conditions are limited to the declarative `EQUALS`, `NOT_EQUALS`, and `EXISTS` operators against the supplied instance context; scripts, expressions, and callbacks are rejected.

## Default templates

| Template        | Trigger           | Typical stages                                                                              |
| --------------- | ----------------- | ------------------------------------------------------------------------------------------- |
| Leave Request   | `LEAVE_REQUEST`   | Manager approval, conditional department approval, HR confirmation                          |
| Onboarding      | `ONBOARDING`      | HR profile, manager plan, IT provisioning, payroll setup, policy acknowledgement            |
| Asset Request   | `ASSET_REQUEST`   | Manager approval, asset availability, IT fulfilment, employee acknowledgement               |
| Salary Revision | `SALARY_REVISION` | Manager proposal, HR validation, finance approval, employee communication                   |
| Offboarding     | `OFFBOARDING`     | Manager confirmation, knowledge transfer, asset return, access revocation, final settlement |
| Payroll Run     | `PAYROLL_RUN`     | Payroll preparation, validation, finance review, final approval, processing                 |

Templates are starting points, not globally active workflows. Organizations clone and tailor them.

## API contract

All endpoints are organization-scoped and require HRMS settings-management permission.

```text
GET    /organization/hrms/workflow-definitions?status=&isTemplate=
GET    /organization/hrms/workflow-definitions/templates
POST   /organization/hrms/workflow-definitions
GET    /organization/hrms/workflow-definitions/:workflowId
PATCH  /organization/hrms/workflow-definitions/:workflowId
POST   /organization/hrms/workflow-definitions/:workflowId/clone
POST   /organization/hrms/workflow-definitions/:workflowId/publish

GET    /organization/hrms/workflow-instances?status=&definitionId=
POST   /organization/hrms/workflow-instances
GET    /organization/hrms/workflow-instances/:instanceId
POST   /organization/hrms/workflow-instances/:instanceId/actions
GET    /organization/hrms/workflow-instances/:instanceId/assignments
GET    /organization/hrms/workflow-instances/:instanceId/history
```

The create and clone APIs return an organization-owned draft. Archiving is a `PATCH` with `{ "status": "ARCHIVED" }`. Reads and assigned-user actions require `hrms.workflow.read`; definition and instance creation require `hrms.workflow.manage`.

Create an instance with an active definition:

```json
{ "definitionId": "<definition-id>", "context": { "request": { "amount": 5000 } } }
```

`context` is persisted with the immutable definition snapshot. An assignee submits:

```json
{ "action": "APPROVE", "comment": "Reviewed", "evidence": { "ticket": "HR-42" } }
```

Valid actions are `APPROVE`, `REJECT`, and `COMPLETE`. Only a user with a pending assignment for the current stage can act. Required approvals are counted transactionally, and the instance state update uses its current status and stage as an optimistic concurrency guard. The history endpoint returns immutable event records with prior/next state, actor, comment, and evidence.

## Frontend routes

```text
/{organizationSlug}/hrms/settings
/{organizationSlug}/hrms/settings/workflow/create
/{organizationSlug}/hrms/settings/workflow/{workflowId}
```

- The settings Workflows section lists organization workflows and available templates.
- **Create Workflow** opens the create route.
- The create route offers a blank workflow or a template choice.
- Choosing a template creates a new draft copy before entering the editor.
- Selecting an existing workflow opens its edit route.

## Runtime execution

When a business request starts, the backend:

1. Validate the business request and create its pending record.
2. Select the active workflow definition.
3. Snapshot request and employee context.
4. Creates a workflow instance associated with the published definition version and snapshot.
5. Resolves first-stage assignees and creates assignments.
6. Stores immutable workflow events.

Notifications, SLA escalation, automatic stage execution, and integration delivery are intentionally not run inside the approval transaction. They should consume the event trail through an outbox worker.

Final business changes, such as leave-balance deduction or payroll processing, must occur transactionally only after the workflow completes.

## Security and audit requirements

- Every definition and instance is organization-scoped.
- Only authorized HRMS administrators may create, edit, publish, clone, or archive definitions.
- The workflow-template rollout migration backfills six tenant-local default templates for every existing non-deleted organization with an active member. New organizations receive the same templates at creation. Template records cannot be modified; users must clone them before editing.
- Workflow events must record actor, timestamp, prior state, next state, comments, and contextual evidence.
- High-risk workflows (payroll, salary revisions, access revocation, and offboarding) require idempotent final actions.
- External notifications and provisioning are emitted through an outbox worker, never inside the approval transaction.

## Product differentiation

Dhriti workflows should provide:

- Explainable routing: show why a participant was selected.
- Simulation before publish using sample employee/request context.
- Reusable templates with organization-specific cloning.
- Human fallback: reassign, delegate, pause, resume, and override with an audit reason.
- Cross-product automation with Flow tasks, Connect notifications, Pulse calendar updates, and access revocation.

## Initial implementation notes

- `HrmsWorkflowDefinition`, published version snapshots, instances, assignments, and events are organization-scoped. Instance events are append-only and all instance reads are tenant-filtered.
- The settings page lists only organization-owned definitions and its default templates. Template selection clones first, then routes to the draft editor.
- The editor validates required workflow and stage names, saves drafts, publishes drafts, and archives definitions. Active definitions are presented as read-only in the initial UI.
- Deploy the workflow migration before deploying the API and web changes. Existing organizations obtain default templates through the standard seed; newly created organizations receive them during organization creation.
