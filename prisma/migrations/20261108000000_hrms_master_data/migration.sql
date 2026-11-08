CREATE TABLE "hrms_locations" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "countryCode" VARCHAR(2) NOT NULL,
  "city" TEXT,
  "timezone" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_locations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_locations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "hrms_locations_organizationId_name_key" ON "hrms_locations"("organizationId", "name");
CREATE UNIQUE INDEX "hrms_locations_organizationId_code_key" ON "hrms_locations"("organizationId", "code");
CREATE INDEX "hrms_locations_organizationId_isActive_idx" ON "hrms_locations"("organizationId", "isActive");

CREATE TABLE "hrms_designations" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "departmentId" UUID,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_designations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_designations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hrms_designations_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "organization_departments"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "hrms_designations_organizationId_name_key" ON "hrms_designations"("organizationId", "name");
CREATE UNIQUE INDEX "hrms_designations_organizationId_code_key" ON "hrms_designations"("organizationId", "code");
CREATE INDEX "hrms_designations_organizationId_departmentId_isActive_idx" ON "hrms_designations"("organizationId", "departmentId", "isActive");

CREATE TABLE "hrms_employment_types" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_employment_types_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_employment_types_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "hrms_employment_types_organizationId_name_key" ON "hrms_employment_types"("organizationId", "name");
CREATE UNIQUE INDEX "hrms_employment_types_organizationId_code_key" ON "hrms_employment_types"("organizationId", "code");
CREATE INDEX "hrms_employment_types_organizationId_isActive_idx" ON "hrms_employment_types"("organizationId", "isActive");

ALTER TABLE "hrms_employees"
  ADD COLUMN "workLocationId" UUID,
  ADD CONSTRAINT "hrms_employees_workLocationId_fkey"
    FOREIGN KEY ("workLocationId") REFERENCES "hrms_locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "hrms_employees_organizationId_workLocationId_idx" ON "hrms_employees"("organizationId", "workLocationId");
