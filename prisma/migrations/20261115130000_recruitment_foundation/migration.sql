CREATE TABLE "hrms_recruitment_grants" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "role" VARCHAR(20) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_recruitment_grants_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_grants_role_check" CHECK ("role" IN ('MANAGER', 'INTERVIEWER'))
);
CREATE UNIQUE INDEX "hrms_recruitment_grants_organizationId_userId_key" ON "hrms_recruitment_grants"("organizationId", "userId");
ALTER TABLE "hrms_recruitment_grants" ADD CONSTRAINT "hrms_recruitment_grants_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_recruitment_grants" ADD CONSTRAINT "hrms_recruitment_grants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hrms_job_openings" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "department" VARCHAR(120) NOT NULL,
  "location" VARCHAR(200) NOT NULL,
  "employmentType" VARCHAR(40) NOT NULL,
  "workMode" VARCHAR(20) NOT NULL,
  "description" TEXT NOT NULL,
  "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  "createdById" UUID NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_job_openings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_job_openings_status_check" CHECK ("status" IN ('DRAFT', 'OPEN', 'CLOSED'))
);
CREATE INDEX "hrms_job_openings_organizationId_status_idx" ON "hrms_job_openings"("organizationId", "status");
ALTER TABLE "hrms_job_openings" ADD CONSTRAINT "hrms_job_openings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
