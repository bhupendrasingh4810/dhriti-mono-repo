-- Working days/hours move from Pulse settings to HRMS settings. Pulse now reads them from HRMS.
ALTER TABLE "hrms_organization_settings"
  ADD COLUMN "workingDays" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4]::INTEGER[],
  ADD COLUMN "workingHoursStart" INTEGER NOT NULL DEFAULT 9,
  ADD COLUMN "workingHoursEnd" INTEGER NOT NULL DEFAULT 18;

-- Preserve every organization's existing Pulse configuration before the Pulse columns are dropped.
INSERT INTO "hrms_organization_settings" ("id", "organizationId", "workingDays", "workingHoursStart", "workingHoursEnd", "updatedAt")
SELECT gen_random_uuid(), p."organizationId", p."workingDays", p."workingHoursStart", p."workingHoursEnd", CURRENT_TIMESTAMP
FROM "pulse_organization_settings" p
ON CONFLICT ("organizationId") DO UPDATE SET
  "workingDays" = EXCLUDED."workingDays",
  "workingHoursStart" = EXCLUDED."workingHoursStart",
  "workingHoursEnd" = EXCLUDED."workingHoursEnd";

ALTER TABLE "hrms_organization_settings"
  ALTER COLUMN "workingDays" SET NOT NULL,
  ADD CONSTRAINT "hrms_organization_settings_working_hours_check"
  CHECK ("workingHoursStart" >= 0 AND "workingHoursEnd" <= 24 AND "workingHoursStart" < "workingHoursEnd"),
  ADD CONSTRAINT "hrms_organization_settings_working_days_check"
  CHECK (cardinality("workingDays") > 0 AND "workingDays" <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::integer[]);

-- The matching Pulse CHECK constraints are dropped together with their columns.
ALTER TABLE "pulse_organization_settings"
  DROP COLUMN "workingDays",
  DROP COLUMN "workingHoursStart",
  DROP COLUMN "workingHoursEnd";

-- CreateTable
CREATE TABLE "hrms_shifts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" VARCHAR(5) NOT NULL,
    "endTime" VARCHAR(5) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hrms_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hrms_shifts_organizationId_name_key" ON "hrms_shifts"("organizationId", "name");

-- CreateIndex
CREATE INDEX "hrms_shifts_organizationId_isActive_idx" ON "hrms_shifts"("organizationId", "isActive");

-- AddForeignKey
ALTER TABLE "hrms_shifts" ADD CONSTRAINT "hrms_shifts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Default shifts for existing organizations; admins can edit the times.
INSERT INTO "hrms_shifts" ("id", "organizationId", "name", "startTime", "endTime", "sortOrder", "updatedAt")
SELECT gen_random_uuid(), o."id", s."name", s."startTime", s."endTime", s."sortOrder", CURRENT_TIMESTAMP
FROM "organizations" o
CROSS JOIN (VALUES
  ('Morning', '06:00', '14:00', 0),
  ('Day', '09:00', '18:00', 1),
  ('Evening', '14:00', '22:00', 2),
  ('Night', '22:00', '06:00', 3)
) AS s("name", "startTime", "endTime", "sortOrder");
