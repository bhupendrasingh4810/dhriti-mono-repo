BEGIN;

ALTER TABLE "user_profiles"
  ADD COLUMN "prefix" VARCHAR(20),
  ADD COLUMN "work_email" VARCHAR(254),
  ADD COLUMN "alternate_email" VARCHAR(254),
  ADD COLUMN "isd_code" VARCHAR(5);

ALTER TABLE "user_hrms_profiles"
  ADD COLUMN "blood_group" VARCHAR(3);

ALTER TABLE "hrms_employees"
  ADD COLUMN "biometric_id" VARCHAR(64),
  ADD COLUMN "retirement_date" DATE,
  ADD COLUMN "resignation_date" DATE;

COMMIT;
