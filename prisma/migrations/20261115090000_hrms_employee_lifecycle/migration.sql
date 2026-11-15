ALTER TABLE "hrms_employees"
  ADD COLUMN "lifecycle_data" JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN "lifecycle_version" INTEGER NOT NULL DEFAULT 0;
