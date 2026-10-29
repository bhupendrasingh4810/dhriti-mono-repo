ALTER TABLE "connect_organization_settings" ADD COLUMN "retentionEnabledAt" TIMESTAMP(3);

ALTER TABLE "pulse_organization_settings"
  ADD CONSTRAINT "pulse_organization_settings_working_hours_check"
  CHECK ("workingHoursStart" >= 0 AND "workingHoursEnd" <= 24 AND "workingHoursStart" < "workingHoursEnd"),
  ADD CONSTRAINT "pulse_organization_settings_working_days_check"
  CHECK (cardinality("workingDays") > 0 AND "workingDays" <@ ARRAY[1, 2, 3, 4, 5, 6, 7]::integer[]);

CREATE INDEX "connect_user_settings_manualStatusExpiresAt_idx" ON "connect_user_settings"("manualStatusExpiresAt");
