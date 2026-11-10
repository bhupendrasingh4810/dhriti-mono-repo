# HRMS workflows

## Purpose

HRMS workflows coordinate organization-scoped approvals, tasks, and automation for employee operations. A workflow definition is reusable configuration; a workflow instance is a runtime execution of a published definition.

The runtime persists tenant-scoped instances, assignments, and immutable events. It resolves the supported declarative assignee rules (`INITIATOR` and `USER_IDS`) and never evaluates user-provided code.

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
