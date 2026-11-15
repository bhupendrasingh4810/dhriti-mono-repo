CREATE UNIQUE INDEX "hrms_job_openings_organizationId_id_key" ON "hrms_job_openings"("organizationId", "id");
CREATE TABLE "hrms_recruitment_stages" (
  "id" UUID NOT NULL, "organizationId" UUID NOT NULL, "name" VARCHAR(80) NOT NULL,
  "position" INTEGER NOT NULL, "systemKey" VARCHAR(20),
  CONSTRAINT "hrms_recruitment_stages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_stages_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "hrms_recruitment_stages_organizationId_id_key" ON "hrms_recruitment_stages"("organizationId", "id");
CREATE UNIQUE INDEX "hrms_recruitment_stages_organizationId_name_key" ON "hrms_recruitment_stages"("organizationId", "name");
CREATE UNIQUE INDEX "hrms_recruitment_stages_organizationId_systemKey_key" ON "hrms_recruitment_stages"("organizationId", "systemKey");
CREATE TABLE "hrms_recruitment_candidates" (
  "id" UUID NOT NULL, "organizationId" UUID NOT NULL, "openingId" UUID NOT NULL, "stageId" UUID NOT NULL,
  "name" VARCHAR(200) NOT NULL, "email" VARCHAR(320) NOT NULL, "phone" VARCHAR(40),
  "assignedUserId" UUID, "outcome" VARCHAR(20), "revision" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_recruitment_candidates_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_candidates_org_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hrms_recruitment_candidates_outcome_check" CHECK ("outcome" IS NULL OR "outcome" IN ('JOINED', 'OFFER_DECLINED')),
  CONSTRAINT "hrms_recruitment_candidates_opening_fkey" FOREIGN KEY ("organizationId", "openingId") REFERENCES "hrms_job_openings"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "hrms_recruitment_candidates_stage_fkey" FOREIGN KEY ("organizationId", "stageId") REFERENCES "hrms_recruitment_stages"("organizationId", "id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "hrms_recruitment_candidates_organizationId_id_key" ON "hrms_recruitment_candidates"("organizationId", "id");
CREATE INDEX "hrms_recruitment_candidates_organizationId_stageId_outcome_idx" ON "hrms_recruitment_candidates"("organizationId", "stageId", "outcome");
CREATE INDEX "hrms_recruitment_candidates_organizationId_assignedUserId_idx" ON "hrms_recruitment_candidates"("organizationId", "assignedUserId");
CREATE TABLE "hrms_recruitment_comments" (
  "id" UUID NOT NULL, "organizationId" UUID NOT NULL, "candidateId" UUID NOT NULL, "authorUserId" UUID NOT NULL,
  "text" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_recruitment_comments_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_recruitment_comments_candidate_fkey" FOREIGN KEY ("organizationId", "candidateId") REFERENCES "hrms_recruitment_candidates"("organizationId", "id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "hrms_recruitment_comments_organizationId_candidateId_createdAt_idx" ON "hrms_recruitment_comments"("organizationId", "candidateId", "createdAt");
