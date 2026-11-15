# TODO

- [ ] Confirm the production deployment target, release owner, migration gate, rollback procedure, and environment-promotion workflow.
- [ ] Define observability ownership, SLOs, dashboards, alert thresholds, on-call rotation, and escalation process.
- [ ] Establish repository governance: CODEOWNERS, branch protection, required review/check policy, release ownership, and dependency-update ownership.
- [ ] Choose and document the public API contract-versioning strategy.
- [ ] Assign ownership and procedures for billing reconciliation, webhook dead-letter recovery, and retry incident response.

## HRMS

Screenshot references below refer to the 26 supplied Keka illustrations. They are
workflow/design references, not validated implementation details or statutory rules.
These are remaining-work items; existing foundations do not imply end-to-end completion.

### 1. Reliability and acceptance

- [ ] Diagnose and fix the reported employee-document upload failure using approved runtime diagnostics; verify upload, download, archive and private access against configured object storage.
- [ ] Finish type checks, scoped lint and build validation for the latest confirmation-dialog and storage-error changes.
- [ ] Verify existing employee, document, attendance, leave, payroll, expense and asset workflows in the running application, including failures, permissions and tenant isolation.
- [ ] Remove misleading demo metrics and completion claims; distinguish unavailable features from functioning workflows.

### 2. UI foundation and live dashboards (screenshots 1, 8, 11)

- [ ] Standardize HRMS page hierarchy, aligned grids, card padding, table density, form widths and responsive layouts using shared components and theme tokens.
- [ ] Use restrained neutral surfaces, consistent typography and semantic status colors; reserve brand emphasis for primary actions.
- [ ] Replace verbose everyday setup copy with contextual help and progressive disclosure.
- [ ] Standardize dialogs, drawers, validation, loading/empty/error states, compact pagination and accessible actions; add stories when shared UI changes.
- [ ] Separate employee self-service, manager worklists and HR administration; avoid presenting placeholder tabs as completed features.
- [ ] Replace hardcoded dashboard metrics with authorized live aggregations, trends, contextual summaries and actionable drill-downs.
- [ ] Add executive cross-module summaries, headcount targets, hiring-plan health, registered/unregistered employee counts, worker-type/gender trends and document/asset summaries.
- [ ] Add manager approvals, team availability and pending-work queues, plus HR onboarding/new-hire/probation/exit queues and an employee task inbox.

### 3. Core HR and lifecycle (screenshots 3, 9, 10, 20)

#### Foundation programme: initial features and downstream workflows

Implement in connected milestones, starting with employee foundations. Lifecycle
decisions require explicit HR action: reminders must never automatically confirm
probation, terminate employment or revoke access. Organization policy values remain
unconfigured until HR sets them; do not infer statutory rules.

- [x] First employee-foundation slice: add the Lifecycle profile tab, manual probation confirmation/extension, contract renewal tracking, employee-specific notice days/approved last working date, transactional career events and advisory setup checklist; strengthen manager edits with serializable reference checks.
- [ ] Finish this milestone: organization notice defaults, due-soon worklists/reminders and employee-number sequencing; downstream workflow integration remains separate from tracking.
- [ ] Probation: end-date tracking, due-soon views, reasoned confirmation/extension; connect confirmation approvals and lifecycle automation.
- [ ] Contracts: start/end dates, expiry status and renewal reminders; connect contract renewal workflows and offboarding.
- [ ] Notice periods: organization default, employee override and proposed last working day; connect resignation approval and final settlement.
- [ ] Data readiness: missing manager/location/shift/work-week/required-profile checklist; connect onboarding readiness and payroll preflight.
- [ ] Reporting structure: validate manager/self/cycle changes across normal edits/imports; surface missing managers and connect org charts/multi-level approvals.
- [ ] Employee numbering: configurable prefix/sequence and unique manual override; connect imports, bulk onboarding and hiring conversion.
- [ ] Grades/bands: tenant catalog and employee assignment; connect salary bands, promotions and benefit eligibility.
- [ ] Cost centers: code/name/status and employee assignment; connect payroll journals, expense allocation and workforce costing.
- [ ] Location timezones: validated IANA timezone and explicit display; connect multi-geography attendance, shifts and reminders without silently rewriting historical dates.
- [ ] Change reasons: promotion/transfer/correction/confirmation/resignation catalog; connect timelines, analytics and event automation.
- [ ] Document expiry: issue/expiry dates and expiring-soon views; connect reminders, renewal and compliance checks.
- [ ] Document verification: pending/verified/rejected with reviewer/date/reason; connect onboarding clearance and compliance checks.
- [ ] Employee groups: tenant-local static groups with searchable multi-select; connect bulk policies, announcements and surveys.
- [ ] Checklist templates: ordered reusable tasks; connect employee onboarding/offboarding, ownership, deadlines and asset clearance.
- [ ] Policy acknowledgement: published policy versions and employee acknowledgements; connect distribution/reminders and compliance evidence.
- [ ] Saved directory views: per-user filters/columns/sorting; connect manager workspaces and reporting.
- [ ] Bulk-change preview: authorized target counts and before/after differences; connect safe transfers/mass policy assignments with stale-data protection.
- [ ] Settings history: actor/timestamp/old/new setting values with sensitive-value redaction; connect audit, troubleshooting and policy governance.

- [ ] Complete personal/job profiles, prior-employer career history and approved effective-dated job changes; define scheduling and retroactive payroll effects.
- [ ] Model legal entities, locations and geographies with entity-specific policies, currency and compliance configuration.
- [ ] Implement employee-linked preboarding/onboarding tasks, document collection, schedules, provisioning and tracked completion.
- [ ] Implement offboarding approvals, handover, document/asset clearance, controlled access revocation and final-settlement coordination.
- [ ] Connect joining, promotion, pay revision, department/location changes and exit events to the career timeline without fabricating legacy history.
- [ ] Complete document requests, employee visibility, policy distribution/acknowledgement, versions, verification, generated letters and provider-backed e-signatures.
- [ ] Implement employee helpdesk tickets, routing, grievances, status tracking and resolution.
- [ ] Assign policies by team/role/location/entity, support manager-chain multi-level approvals and connect lifecycle events to notifications, calendars, balances and payroll actions.
- [ ] Add policy/data-gap detection and auditable event automation after the underlying workflows are operational.

### 4. Attendance, leave and scheduling (screenshots 12–20)

- [x] Add themed Work Week settings: named monthly five-occurrence patterns, working/half/off cells, templates, duplicate/delete, dated defaults and employee assignments; apply schedules to attendance and new leave with saved payroll allocations.
- [x] Replace the Work Week assignment employee list with the shared searchable multi-select and chips; remove the 100-employee cap and support assigning all current non-archived organization employees.
- [ ] Complete Work Week acceptance: browser visual review was declined; rerun the expanded rollback-only database test after correcting its async audit mock (rerun permission declined).
- [x] Implement responsive mobile-web GPS/geofenced attendance with configurable accuracy checks, client-reported device/source visibility and explicit office/remote/field capture behavior; provide a native-ready API.
- [ ] Accept GPS attendance on target physical mobile devices (HTTPS, permissions, accuracy, boundary rejection and clock-out); automated browser and database coverage is not physical-device acceptance.
- [ ] Build a native iOS/Android application consuming the attendance capture contract; framework/platform scope remains a separate milestone.
- [ ] Add biometric/kiosk/card/selfie capture integrations and offline-punch reconciliation with appropriate privacy and provider contracts.
- [ ] Complete attendance-to-payroll loss-of-pay reconciliation, exception handling and traceable approved corrections.
- [ ] Add an employee leave credit/debit transaction ledger and richer accrual, carry-forward, proof and assignment rules.
- [ ] Verify leave approvals, team availability, balance updates and calendar/payroll synchronization end to end.
- [ ] Implement project timesheets, submission policies, tiered automatic overtime and capacity/billable-utilization reporting.
- [ ] Add date-specific weekly rosters, team/location scheduling, repeat schedules, rotations, shift swaps and reassignment.
- [ ] Enforce coverage, rest-gap and working-hour constraints; connect shift premiums, night allowances and roster compensation to payroll.

### 5. Payroll, expenses and travel (screenshots 2–7)

- [ ] Add data-derived payroll readiness, verification progress, compliance deadlines and a unified actionable exception workspace.
- [ ] Add legal-entity/pay-group oversight and controlled cross-entity consolidation with explicit currency/FX handling.
- [ ] Add salary-cost distribution analytics and specialized commission, incentive and allowance policy workflows.
- [ ] Implement arrears, off-cycle bonuses/corrections, missed payouts, finalized-run adjustments and reversals without silently mutating approved history.
- [ ] Add configurable anomaly thresholds, affected-employee counts, estimated financial impact and tracked resolution.
- [ ] Complete expense receipt uploads, policy controls, conditional approval chains, rejection/resubmission and reimbursement timing.
- [ ] Implement travel requests, coordination, travel advances and reconciliation.
- [ ] Complete loans/advances/recoveries, benefits, gratuity and full-and-final settlement.
- [ ] Deliver employee payslip self-service, PDF payslips, YTD opening balances, declarations and tax documents.
- [ ] Add accounting mappings/journals, exports, operational reports, configurable approvals and reminders.
- [ ] Implement versioned statutory compliance packs and filing-ready reports only with authoritative rules and qualified local validation.
- [ ] Integrate provider-backed payment verification, real disbursement, transfer results, idempotent retries and reconciliation; never simulate successful settlement.

### 6. Performance and talent (screenshots 21–26)

- [ ] Replace demo performance screens with aligned company/department/individual goals and OKRs, progress tracking and at-risk insights.
- [ ] Implement configurable review templates/cycles, reviewer assignment, self/peer/multi-rater submissions, deadlines and publishing.
- [ ] Add continuous feedback, manager notes and links from performance outcomes to compensation and hiring workflows.
- [ ] Implement one-on-one scheduling, agendas, notes, action items and follow-up.
- [ ] Add competency/proficiency models, skill evidence, career ladders, readiness assessments and development/upskilling plans.
- [ ] Implement promotions, performance improvement plans, succession planning, 9-box calibration and rating-normalization analytics.
- [ ] Add review-progress dashboards, manager scorecards and top-performer insights using real data.

### 7. Remaining product breadth

#### Asset-management programme (Priorities 1-4)

Deliver connected API and UI workflows. The register/custody and operational
workflows below are implemented; the broader four-priority programme is not complete.

Approved policies: reporting manager approves requests and the asset manager
fulfils them; a missing manager requires explicit asset-manager review. Employees
acknowledge receipt, asset managers verify returns. Outstanding custody blocks
**asset clearance only**, never automatic salary deductions or access revocation.
Accounting starts with CSV. Depreciation remains disabled until finance supplies
method, useful life and residual value; there is no automatic ledger posting.
MDM and external device-provider integrations are deferred.

- [x] P1 foundation: tenant-unique asset tags, optional serials, category create/rename/activation, brand/model/specifications, location and custodian, purchase/vendor/cost/currency and warranty fields, read-only register details, archive, full filtered CSV export (explicit 10,000-row limit), optimistic revisions and atomic audit.
- [x] P1 operations: private invoices/warranties/condition/handover photos, authorized download/archive, and actor-owned CSV preview with duplicate/error reporting and atomic import.
- [x] P2 foundation: explicit issue/verified-return dialogs, condition and required handover notes, expected return, immutable custody events, employee acknowledgement and private-field-safe My assets. Remote employee lookup is paged/searchable, including beyond 100 employees.
- [x] P2 foundation: employee-scoped asset-clearance API and UI showing outstanding custody; preserves existing assignments and does not fabricate earlier events or acknowledgements.
- [x] P2 operations: issue accessories with their parent equipment, verify partial returns, gate offboarding clearance/completion and employee deactivation/archive, and allow HR/Admin overrides with mandatory audited reasons. No automatic payroll/access changes.
- [x] Permission-aware navigation: Assets requires `hrms.asset.manage`; Workforce requires `hrms.workforce.manage`. Dashboard shows private assigned equipment, receipt acknowledgement and the only replacement-request creation entry point.
- [x] P3 operations: dashboard replacement requests, reporting-manager decisions, explicit managerless review, verified-original-return before fulfilment, employee acknowledgement, decision notifications, and maintenance tickets/vendor/cost/service history.
- [x] P4 operations: snapshot stock counts and documented discrepancy resolution; procurement with separate finance approver; explicitly configured straight-line depreciation and accounting-value CSV export.
- [ ] P3 remaining: generic first-equipment requests, new-joiner reservations, lost/stolen reports, reminders/asset-manager notifications, revision-safe bulk previews/results, and authorized QR/barcode labels/lookup.
- [ ] P4 remaining: operational availability/exception/age/repair/replacement reports, category-specific finance policies, configurable accounting mappings and external ledger integrations.
- [ ] Runtime/browser acceptance and full programme regression once remaining integrations are implemented. Component and rollback-only database tests do not certify every production workflow.

- [ ] Implement ATS requisitions/approvals, hiring collaboration, candidate pipeline, sourcing, tagging, resume uploads/parsing and talent pools.
- [ ] Add career/internal-job portals, referrals, interviews/calendar coordination, scorecards, offers and candidate pre-onboarding.
- [ ] Add ATS analytics/custom reports and separately scoped job-board, email, video, assessment, background-check and SSO integrations.
- [ ] Complete employee HR requests, mobile self-service, learning courses, announcements, recognition, polls and configurable/pulse surveys.
- [ ] Implement custom HR reports, people analytics and scheduled report distribution with permission-aware visibility.

### 8. AI assistance after reliable workflows and data

- [ ] Add permission-aware HR questions and signals for attrition, payroll anomalies and goal drift with traceable evidence.
- [ ] Add assisted onboarding/helpdesk routing, review writing, one-on-one agendas/actions and upskilling recommendations.
- [ ] Add assisted job descriptions and candidate-to-job match scoring with human review; avoid decorative AI controls or unsupported claims.

For each item: define measurable acceptance criteria, preserve existing behavior,
enforce authorization/tenant isolation, use theme-only shared UI, cover relevant
tests/stories and validate the actual running workflow before marking it complete.
