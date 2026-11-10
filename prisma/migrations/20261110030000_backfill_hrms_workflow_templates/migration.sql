-- Backfill the immutable tenant-local templates introduced with HRMS workflows.
-- A member is used as the historical creator because workflow definitions require
-- an actor even when the tenant predates this feature.
WITH organization_actors AS (
  SELECT DISTINCT ON (member."organizationId")
    member."organizationId",
    member."userId"
  FROM "organization_members" AS member
  JOIN "organizations" AS organization ON organization."id" = member."organizationId"
  WHERE member."status" = 'ACTIVE'
    AND member."deletedAt" IS NULL
    AND organization."deletedAt" IS NULL
  ORDER BY member."organizationId", member."isOwner" DESC, member."createdAt" ASC
),
template_catalog ("templateKey", "name", "stages", "transitions") AS (
  VALUES
    (
      'leave-request',
      'Leave Request',
      '[{"id":"leave-request-1","key":"leave-request-1","name":"Manager Review","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"leave-request-2","key":"leave-request-2","name":"Approved","type":"AUTOMATION","isTerminal":true,"slaHours":24},{"id":"leave-request-3","key":"leave-request-3","name":"Rejected","type":"AUTOMATION","isTerminal":true,"slaHours":24}]'::jsonb,
      '[{"from":"leave-request-1","to":"leave-request-2","action":"APPROVE"},{"from":"leave-request-1","to":"leave-request-3","action":"REJECT"}]'::jsonb
    ),
    (
      'onboarding',
      'Onboarding',
      '[{"id":"onboarding-1","key":"onboarding-1","name":"Documentation","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"onboarding-2","key":"onboarding-2","name":"Provisioning","type":"TASK","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"onboarding-3","key":"onboarding-3","name":"Completed","type":"AUTOMATION","isTerminal":true,"slaHours":24}]'::jsonb,
      '[{"from":"onboarding-1","to":"onboarding-2","action":"APPROVE"},{"from":"onboarding-1","to":"onboarding-3","action":"REJECT"},{"from":"onboarding-2","to":"onboarding-3","action":"COMPLETE"}]'::jsonb
    ),
    (
      'asset-request',
      'Asset Request',
      '[{"id":"asset-request-1","key":"asset-request-1","name":"Manager Review","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"asset-request-2","key":"asset-request-2","name":"IT Fulfilment","type":"TASK","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"asset-request-3","key":"asset-request-3","name":"Completed","type":"AUTOMATION","isTerminal":true,"slaHours":24}]'::jsonb,
      '[{"from":"asset-request-1","to":"asset-request-2","action":"APPROVE"},{"from":"asset-request-1","to":"asset-request-3","action":"REJECT"},{"from":"asset-request-2","to":"asset-request-3","action":"COMPLETE"}]'::jsonb
    ),
    (
      'salary-revision',
      'Salary Revision',
      '[{"id":"salary-revision-1","key":"salary-revision-1","name":"Manager Review","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"salary-revision-2","key":"salary-revision-2","name":"HR Review","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"salary-revision-3","key":"salary-revision-3","name":"Approved","type":"AUTOMATION","isTerminal":true,"slaHours":24}]'::jsonb,
      '[{"from":"salary-revision-1","to":"salary-revision-2","action":"APPROVE"},{"from":"salary-revision-1","to":"salary-revision-3","action":"REJECT"},{"from":"salary-revision-2","to":"salary-revision-3","action":"APPROVE"},{"from":"salary-revision-2","to":"salary-revision-3","action":"REJECT"}]'::jsonb
    ),
    (
      'offboarding',
      'Offboarding',
      '[{"id":"offboarding-1","key":"offboarding-1","name":"Knowledge Transfer","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"offboarding-2","key":"offboarding-2","name":"Clearance","type":"TASK","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"offboarding-3","key":"offboarding-3","name":"Completed","type":"AUTOMATION","isTerminal":true,"slaHours":24}]'::jsonb,
      '[{"from":"offboarding-1","to":"offboarding-2","action":"APPROVE"},{"from":"offboarding-1","to":"offboarding-3","action":"REJECT"},{"from":"offboarding-2","to":"offboarding-3","action":"COMPLETE"}]'::jsonb
    ),
    (
      'payroll-run',
      'Payroll Run',
      '[{"id":"payroll-run-1","key":"payroll-run-1","name":"Validation","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"payroll-run-2","key":"payroll-run-2","name":"Finance Approval","type":"APPROVAL","assigneeRule":{"kind":"INITIATOR"},"requiredApprovals":1,"slaHours":72},{"id":"payroll-run-3","key":"payroll-run-3","name":"Paid","type":"AUTOMATION","isTerminal":true,"slaHours":24}]'::jsonb,
      '[{"from":"payroll-run-1","to":"payroll-run-2","action":"APPROVE"},{"from":"payroll-run-1","to":"payroll-run-3","action":"REJECT"},{"from":"payroll-run-2","to":"payroll-run-3","action":"APPROVE"},{"from":"payroll-run-2","to":"payroll-run-3","action":"REJECT"}]'::jsonb
    )
),
inserted_templates AS (
  INSERT INTO "hrms_workflow_definitions" (
    "id",
    "organizationId",
    "name",
    "status",
    "stages",
    "transitions",
    "templateKey",
    "isTemplate",
    "isDefault",
    "createdByUserId",
    "publishedAt",
    "updatedAt"
  )
  SELECT
    gen_random_uuid(),
    actor."organizationId",
    template."name",
    'ACTIVE',
    template."stages",
    template."transitions",
    template."templateKey",
    true,
    true,
    actor."userId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  FROM organization_actors AS actor
  CROSS JOIN template_catalog AS template
  ON CONFLICT ("organizationId", "templateKey") DO NOTHING
  RETURNING "id", "version", "name", "stages", "transitions", "createdByUserId", "publishedAt"
)
INSERT INTO "hrms_workflow_definition_versions" (
  "id",
  "definitionId",
  "version",
  "name",
  "stages",
  "transitions",
  "publishedByUserId",
  "publishedAt"
)
SELECT
  gen_random_uuid(),
  template."id",
  template."version",
  template."name",
  template."stages",
  template."transitions",
  template."createdByUserId",
  template."publishedAt"
FROM inserted_templates AS template;
