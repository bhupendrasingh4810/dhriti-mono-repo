-- Workforce hierarchy: department, designation and reporting manager per employee.
ALTER TABLE "hrms_employees"
  ADD COLUMN "departmentId" UUID,
  ADD COLUMN "designationId" UUID,
  ADD COLUMN "reportingManagerId" UUID;

ALTER TABLE "hrms_employees"
  ADD CONSTRAINT "hrms_employees_departmentId_fkey" FOREIGN KEY ("departmentId")
    REFERENCES "organization_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "hrms_employees_designationId_fkey" FOREIGN KEY ("designationId")
    REFERENCES "hrms_designations"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "hrms_employees_reportingManagerId_fkey" FOREIGN KEY ("reportingManagerId")
    REFERENCES "hrms_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "hrms_employees_organizationId_departmentId_idx" ON "hrms_employees"("organizationId", "departmentId");
CREATE INDEX "hrms_employees_organizationId_reportingManagerId_idx" ON "hrms_employees"("organizationId", "reportingManagerId");
