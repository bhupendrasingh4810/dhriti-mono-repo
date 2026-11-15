-- Tenant-scoped profiles do not reuse UserHRMSProfile, which is shared across organizations.
ALTER TABLE "hrms_employees"
ADD COLUMN "profile_data" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN "profile_version" INTEGER NOT NULL DEFAULT 0;
