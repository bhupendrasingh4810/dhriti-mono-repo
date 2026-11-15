ALTER TABLE "stored_files"
  ADD COLUMN "access_scope" VARCHAR(40) NOT NULL DEFAULT 'ORGANIZATION';

CREATE TABLE "hrms_employee_documents" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "fileId" UUID NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "category" VARCHAR(32) NOT NULL,
  "uploadedById" UUID NOT NULL,
  "archivedAt" TIMESTAMP(3),
  "archivedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_employee_documents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_employee_documents_category_check"
    CHECK ("category" IN ('PERSONAL', 'EMPLOYMENT', 'EDUCATION', 'COMPLIANCE', 'OTHER')),
  CONSTRAINT "hrms_employee_documents_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hrms_employee_documents_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hrms_employee_documents_fileId_fkey"
    FOREIGN KEY ("fileId") REFERENCES "stored_files"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "hrms_employee_documents_fileId_key" ON "hrms_employee_documents"("fileId");
CREATE INDEX "hrms_employee_documents_org_employee_archive_created_idx"
  ON "hrms_employee_documents"("organizationId", "employeeId", "archivedAt", "createdAt");
