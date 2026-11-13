-- Daily hours are now defined by shifts. Carry each organization's previous day bounds into its "Day" shift
-- so Pulse keeps the same window for employees who are assigned that shift.
UPDATE "hrms_shifts" s
SET "startTime" = lpad(h."workingHoursStart"::text, 2, '0') || ':00',
    "endTime" = lpad((h."workingHoursEnd" % 24)::text, 2, '0') || ':00'
FROM "hrms_organization_settings" h
WHERE s."organizationId" = h."organizationId"
  AND s."name" = 'Day'
  AND (h."workingHoursStart" <> 9 OR h."workingHoursEnd" <> 18);

ALTER TABLE "hrms_organization_settings"
  DROP CONSTRAINT IF EXISTS "hrms_organization_settings_working_hours_check",
  DROP COLUMN "workingHoursStart",
  DROP COLUMN "workingHoursEnd";

-- Employee shift assignment; deleting a shift leaves the employee unassigned.
ALTER TABLE "hrms_employees" ADD COLUMN "shiftId" UUID;
CREATE INDEX "hrms_employees_organizationId_shiftId_idx" ON "hrms_employees"("organizationId", "shiftId");
ALTER TABLE "hrms_employees" ADD CONSTRAINT "hrms_employees_shiftId_fkey"
  FOREIGN KEY ("shiftId") REFERENCES "hrms_shifts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Existing employees start on the organization's Day shift.
UPDATE "hrms_employees" e
SET "shiftId" = s."id"
FROM "hrms_shifts" s
WHERE s."organizationId" = e."organizationId" AND s."name" = 'Day';
