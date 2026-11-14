CREATE TABLE "hrms_variable_pay_inputs" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "profileId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "calculation" TEXT NOT NULL,
  "quantity" DECIMAL(18,4) NOT NULL,
  "rate" DECIMAL(18,4) NOT NULL,
  "multiplier" DECIMAL(8,4) NOT NULL,
  "amount" DECIMAL(18,4) NOT NULL,
  "startPeriod" VARCHAR(7) NOT NULL,
  "endPeriod" VARCHAR(7) NOT NULL,
  "reason" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdById" UUID NOT NULL,
  "decidedById" UUID,
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "hrms_variable_pay_inputs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "hrms_variable_pay_inputs_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "hrms_variable_pay_inputs_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "hrms_variable_pay_inputs_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "hrms_payroll_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "hrms_variable_pay_inputs_period_check" CHECK ("endPeriod" >= "startPeriod"),
  CONSTRAINT "hrms_variable_pay_inputs_amount_check" CHECK ("amount" > 0 AND "quantity" > 0 AND "rate" > 0 AND "multiplier" > 0)
);
CREATE INDEX "hrms_variable_pay_inputs_organizationId_employeeId_startPeriod_idx"
  ON "hrms_variable_pay_inputs" ("organizationId", "employeeId", "startPeriod");
