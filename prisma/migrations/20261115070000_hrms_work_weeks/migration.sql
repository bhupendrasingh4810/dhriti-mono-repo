CREATE TABLE "hrms_work_week_rules" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_work_week_rules_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_work_week_versions" (
  "id" UUID NOT NULL,
  "ruleId" UUID NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  "pattern" JSONB NOT NULL,
  CONSTRAINT "hrms_work_week_versions_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_work_week_defaults" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "ruleId" UUID NOT NULL,
  "effectiveFrom" DATE NOT NULL,
  CONSTRAINT "hrms_work_week_defaults_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_work_week_assignments" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "ruleId" UUID,
  "effectiveFrom" DATE NOT NULL,
  CONSTRAINT "hrms_work_week_assignments_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hrms_work_week_rules_organizationId_name_key" ON "hrms_work_week_rules"("organizationId", "name");
CREATE UNIQUE INDEX "hrms_work_week_versions_ruleId_effectiveFrom_key" ON "hrms_work_week_versions"("ruleId", "effectiveFrom");
CREATE UNIQUE INDEX "hrms_work_week_defaults_organizationId_effectiveFrom_key" ON "hrms_work_week_defaults"("organizationId", "effectiveFrom");
CREATE UNIQUE INDEX "hrms_work_week_assignments_employeeId_effectiveFrom_key" ON "hrms_work_week_assignments"("employeeId", "effectiveFrom");
CREATE INDEX "hrms_work_week_assignments_organizationId_effectiveFrom_idx" ON "hrms_work_week_assignments"("organizationId", "effectiveFrom");
ALTER TABLE "hrms_work_week_rules" ADD CONSTRAINT "hrms_work_week_rules_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_work_week_versions" ADD CONSTRAINT "hrms_work_week_versions_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "hrms_work_week_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_work_week_defaults" ADD CONSTRAINT "hrms_work_week_defaults_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_work_week_defaults" ADD CONSTRAINT "hrms_work_week_defaults_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "hrms_work_week_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hrms_work_week_assignments" ADD CONSTRAINT "hrms_work_week_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_work_week_assignments" ADD CONSTRAINT "hrms_work_week_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_work_week_assignments" ADD CONSTRAINT "hrms_work_week_assignments_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "hrms_work_week_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hrms_leave_requests" ADD COLUMN "dayAllocation" JSONB;
