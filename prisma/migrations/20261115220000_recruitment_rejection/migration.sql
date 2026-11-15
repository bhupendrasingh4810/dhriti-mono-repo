ALTER TABLE "hrms_recruitment_candidates"
  ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "hrms_recruitment_candidates"
  DROP CONSTRAINT "hrms_recruitment_candidates_outcome_check";
ALTER TABLE "hrms_recruitment_candidates"
  ADD CONSTRAINT "hrms_recruitment_candidates_outcome_check"
  CHECK ("outcome" IS NULL OR "outcome" IN ('JOINED', 'OFFER_DECLINED', 'REJECTED')),
  ADD CONSTRAINT "hrms_recruitment_candidates_rejection_reason_check"
  CHECK ("outcome" IS DISTINCT FROM 'REJECTED' OR length(trim(coalesce("rejectionReason", ''))) > 0);
