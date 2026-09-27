CREATE TABLE "user_compliance_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "gdpr_consent" BOOLEAN NOT NULL DEFAULT false,
  "gdpr_consent_date" TIMESTAMP(3),
  "gdpr_consent_ip" TEXT,
  "data_processing_consent" BOOLEAN NOT NULL DEFAULT false,
  "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
  "terms_accepted_at" TIMESTAMP(3),
  "terms_version" TEXT,
  "privacy_policy_accepted_at" TIMESTAMP(3),
  "nda_accepted_at" TIMESTAMP(3),
  "code_of_conduct_accepted_at" TIMESTAMP(3),
  "background_check_status" TEXT,
  "background_check_date" TIMESTAMP(3),
  "reference_check_status" TEXT,
  "right_to_work_status" TEXT,
  "right_to_work_document" TEXT,
  "right_to_work_expiry" TIMESTAMP(3),
  "visa_type" TEXT,
  "visa_expiry" TIMESTAMP(3),
  "tax_id" TEXT,
  "tax_filing_status" TEXT,
  "last_modified_by" TEXT,
  CONSTRAINT "user_compliance_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_compliance_profiles_userId_key" ON "user_compliance_profiles"("userId");
CREATE INDEX "user_compliance_profiles_userId_idx" ON "user_compliance_profiles"("userId");

ALTER TABLE "user_compliance_profiles"
  ADD CONSTRAINT "user_compliance_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;