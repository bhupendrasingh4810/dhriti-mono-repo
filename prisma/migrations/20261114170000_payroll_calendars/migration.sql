ALTER TABLE "hrms_payroll_profiles"
  ADD COLUMN "calendarAnchor" DATE,
  ADD COLUMN "payDateOffset" INTEGER NOT NULL DEFAULT 0,
  ADD CONSTRAINT "hrms_payroll_profiles_calendar_check" CHECK (
    "frequency" IN ('MONTHLY', 'WEEKLY', 'BIWEEKLY', 'SEMIMONTHLY')
    AND "payDateOffset" BETWEEN 0 AND 60
    AND ("frequency" NOT IN ('WEEKLY', 'BIWEEKLY') OR "calendarAnchor" IS NOT NULL)
  );
ALTER TABLE "hrms_variable_pay_inputs" ADD COLUMN "targetPeriod" VARCHAR(10);
