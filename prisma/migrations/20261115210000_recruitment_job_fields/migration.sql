ALTER TABLE "hrms_job_openings"
  ADD COLUMN "companyName" VARCHAR(200),
  ADD COLUMN "experienceMin" INTEGER,
  ADD COLUMN "experienceMax" INTEGER,
  ADD COLUMN "ctcMin" DECIMAL(14,2),
  ADD COLUMN "ctcMax" DECIMAL(14,2),
  ADD COLUMN "ctcCurrency" VARCHAR(3),
  ADD COLUMN "ctcPeriod" VARCHAR(20),
  ADD COLUMN "ctcNotDisclosed" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "postedDate" DATE,
  ADD COLUMN "openingsCount" INTEGER,
  ADD COLUMN "highlights" TEXT,
  ADD COLUMN "keySkills" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD CONSTRAINT "hrms_job_openings_experience_check" CHECK (
    ("experienceMin" IS NULL OR "experienceMin" >= 0) AND
    ("experienceMax" IS NULL OR "experienceMax" >= 0) AND
    ("experienceMin" IS NULL OR "experienceMax" IS NULL OR "experienceMin" <= "experienceMax")
  ),
  ADD CONSTRAINT "hrms_job_openings_ctc_check" CHECK (
    ("ctcMin" IS NULL OR "ctcMin" >= 0) AND
    ("ctcMax" IS NULL OR "ctcMax" >= 0) AND
    ("ctcMin" IS NULL OR "ctcMax" IS NULL OR "ctcMin" <= "ctcMax") AND
    ("ctcNotDisclosed" OR ("ctcMin" IS NOT NULL AND "ctcMax" IS NOT NULL AND "ctcCurrency" IS NOT NULL AND "ctcPeriod" IS NOT NULL))
  ),
  ADD CONSTRAINT "hrms_job_openings_openings_count_check" CHECK ("openingsCount" IS NULL OR "openingsCount" > 0);
