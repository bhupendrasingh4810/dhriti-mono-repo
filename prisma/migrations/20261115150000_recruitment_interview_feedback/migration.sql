ALTER TABLE "hrms_recruitment_candidates" ADD COLUMN "interviewerUserId" UUID;

CREATE TABLE "hrms_recruitment_interview_feedback" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "candidateId" UUID NOT NULL,
  "authorUserId" UUID NOT NULL,
  "verdict" VARCHAR(10) NOT NULL,
  "feedback" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_recruitment_interview_feedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_interview_feedback_verdict_check" CHECK ("verdict" IN ('PASSED', 'FAILED')),
  CONSTRAINT "hrms_recruitment_interview_feedback_candidate_fkey" FOREIGN KEY ("organizationId", "candidateId") REFERENCES "hrms_recruitment_candidates"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hrms_recruitment_interview_feedback_organizationId_candidateId_createdAt_idx"
  ON "hrms_recruitment_interview_feedback"("organizationId", "candidateId", "createdAt");
