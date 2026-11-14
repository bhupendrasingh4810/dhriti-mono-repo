ALTER TABLE "hrms_payroll_runs"
  ADD COLUMN "closedById" UUID,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closureReason" TEXT;

DROP INDEX "hrms_payroll_runs_organizationId_profileId_period_scopeKey_key";
CREATE INDEX "hrms_payroll_runs_organizationId_profileId_period_scopeKey_idx"
  ON "hrms_payroll_runs" ("organizationId", "profileId", "period", "scopeKey");

-- Closed drafts retain history but do not prevent a replacement draft.
CREATE UNIQUE INDEX "hrms_payroll_runs_active_scope_key"
  ON "hrms_payroll_runs" ("organizationId", "profileId", "period", "scopeKey")
  WHERE "status" NOT IN ('CANCELLED', 'REJECTED');
