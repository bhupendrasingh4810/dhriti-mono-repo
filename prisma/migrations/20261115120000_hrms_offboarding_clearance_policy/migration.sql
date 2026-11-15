ALTER TABLE "hrms_workflow_definitions"
ADD COLUMN "assetClearanceRequired" BOOLEAN NOT NULL DEFAULT false;

-- Preserve the safety policy on existing templates and their identifiable clones.
UPDATE "hrms_workflow_definitions"
SET "assetClearanceRequired" = true
WHERE "templateKey" = 'offboarding'
   OR EXISTS (
     SELECT 1 FROM jsonb_array_elements("stages") AS stage
     WHERE stage->>'id' LIKE 'offboarding-%'
   );

UPDATE "hrms_workflow_instances" AS instance
SET "definitionSnapshot" = instance."definitionSnapshot" || '{"assetClearanceRequired":true}'::jsonb
FROM "hrms_workflow_definitions" AS definition
WHERE instance."definitionId" = definition.id
  AND definition."assetClearanceRequired";
