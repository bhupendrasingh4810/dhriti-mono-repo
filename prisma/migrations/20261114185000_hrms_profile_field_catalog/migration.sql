ALTER TABLE "organizations"
ADD COLUMN "hrms_profile_fields" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "hrms_profile_fields_version" INTEGER NOT NULL DEFAULT 0;
