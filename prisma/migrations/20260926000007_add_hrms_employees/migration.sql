CREATE TABLE "hrms_employees" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "employeeNumber" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "employmentType" TEXT,
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "hrms_employees_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hrms_employees_organizationId_userId_key" ON "hrms_employees"("organizationId", "userId");
CREATE UNIQUE INDEX "hrms_employees_organizationId_employeeNumber_key" ON "hrms_employees"("organizationId", "employeeNumber");
CREATE INDEX "hrms_employees_organizationId_status_idx" ON "hrms_employees"("organizationId", "status");

ALTER TABLE "hrms_employees" ADD CONSTRAINT "hrms_employees_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_employees" ADD CONSTRAINT "hrms_employees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;