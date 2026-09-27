CREATE TABLE "user_hrms_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "userId" UUID NOT NULL,
  "employee_id" TEXT, "employment_type" TEXT, "employment_start_date" TIMESTAMP(3), "employment_end_date" TIMESTAMP(3), "office_location" TEXT, "work_schedule" JSONB,
  "salary" TEXT, "currency" TEXT DEFAULT 'USD', "pay_frequency" TEXT,
  "date_of_birth" TIMESTAMP(3), "dob_verified" BOOLEAN NOT NULL DEFAULT false, "gender" TEXT, "pronouns" TEXT, "marital_status" TEXT, "nationality" TEXT, "location" TEXT,
  "emergency_contact_name" TEXT, "emergency_contact_phone" TEXT, "emergency_contact_email" TEXT, "emergency_contact_relation" TEXT,
  "skills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[], "certifications" JSONB, "education" JSONB, "experience_years" INTEGER DEFAULT 0,
  CONSTRAINT "user_hrms_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "user_hrms_profiles_userId_key" ON "user_hrms_profiles"("userId");
CREATE UNIQUE INDEX "user_hrms_profiles_employee_id_key" ON "user_hrms_profiles"("employee_id");
CREATE INDEX "user_hrms_profiles_userId_idx" ON "user_hrms_profiles"("userId");
CREATE INDEX "user_hrms_profiles_employee_id_idx" ON "user_hrms_profiles"("employee_id");
CREATE INDEX "user_hrms_profiles_employment_type_idx" ON "user_hrms_profiles"("employment_type");
ALTER TABLE "user_hrms_profiles" ADD CONSTRAINT "user_hrms_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;