-- AlterTable
ALTER TABLE "hrms_payroll_records" ADD COLUMN     "runId" UUID;

-- CreateTable
CREATE TABLE "hrms_payroll_profiles" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "countryCode" VARCHAR(2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "minorUnits" INTEGER NOT NULL DEFAULT 2,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "employmentModel" TEXT NOT NULL DEFAULT 'EMPLOYEE',
    "workLocationId" UUID,
    "registration" TEXT,
    "rulesVerified" BOOLEAN NOT NULL DEFAULT false,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_payroll_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_salary_structures" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "components" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_salary_structures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_salary_assignments" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "monthlyGross" DECIMAL(18,4) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_salary_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_expense_claims" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(18,4) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "expenseDate" DATE NOT NULL,
    "receiptReference" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" UUID,
    "runId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_expense_claims_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hrms_payroll_runs" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "period" TEXT NOT NULL,
    "scopeKey" TEXT NOT NULL DEFAULT 'ALL',
    "payDate" DATE NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "snapshot" JSONB NOT NULL,
    "totalNet" DECIMAL(18,4) NOT NULL,
    "employeeCount" INTEGER NOT NULL,
    "preparedById" UUID NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "sandboxReference" TEXT,
    "sandboxStatus" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hrms_payroll_runs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "hrms_payroll_profiles_organizationId_name_key" ON "hrms_payroll_profiles"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_salary_structures_organizationId_profileId_name_key" ON "hrms_salary_structures"("organizationId", "profileId", "name");

-- CreateIndex
CREATE INDEX "hrms_salary_assignments_organizationId_effectiveFrom_idx" ON "hrms_salary_assignments"("organizationId", "effectiveFrom");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_salary_assignments_employeeId_effectiveFrom_key" ON "hrms_salary_assignments"("employeeId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "hrms_expense_claims_organizationId_status_idx" ON "hrms_expense_claims"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_payroll_runs_sandboxReference_key" ON "hrms_payroll_runs"("sandboxReference");

-- CreateIndex
CREATE INDEX "hrms_payroll_runs_organizationId_status_idx" ON "hrms_payroll_runs"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "hrms_payroll_runs_organizationId_profileId_period_scopeKey_key" ON "hrms_payroll_runs"("organizationId", "profileId", "period", "scopeKey");

-- CreateIndex
CREATE INDEX "hrms_payroll_records_runId_idx" ON "hrms_payroll_records"("runId");

-- AddForeignKey
ALTER TABLE "hrms_payroll_records" ADD CONSTRAINT "hrms_payroll_records_runId_fkey" FOREIGN KEY ("runId") REFERENCES "hrms_payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_payroll_profiles" ADD CONSTRAINT "hrms_payroll_profiles_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_structures" ADD CONSTRAINT "hrms_salary_structures_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_structures" ADD CONSTRAINT "hrms_salary_structures_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "hrms_payroll_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_assignments" ADD CONSTRAINT "hrms_salary_assignments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_assignments" ADD CONSTRAINT "hrms_salary_assignments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_salary_assignments" ADD CONSTRAINT "hrms_salary_assignments_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "hrms_salary_structures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_expense_claims" ADD CONSTRAINT "hrms_expense_claims_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_expense_claims" ADD CONSTRAINT "hrms_expense_claims_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_expense_claims" ADD CONSTRAINT "hrms_expense_claims_runId_fkey" FOREIGN KEY ("runId") REFERENCES "hrms_payroll_runs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_payroll_runs" ADD CONSTRAINT "hrms_payroll_runs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hrms_payroll_runs" ADD CONSTRAINT "hrms_payroll_runs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "hrms_payroll_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
