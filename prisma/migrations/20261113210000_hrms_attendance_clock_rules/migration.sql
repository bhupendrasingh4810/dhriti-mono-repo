-- Shift-relative clock-in rules, configurable per organization from HRMS settings.
ALTER TABLE "hrms_organization_settings"
  ADD COLUMN "attendanceClockInWindowMinutes" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "attendanceLateAfterMinutes" INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN "missedClockInAlertEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "missedClockInAlertMinutes" INTEGER NOT NULL DEFAULT 25,
  ADD COLUMN "missedClockInAlertRepeatSeconds" INTEGER NOT NULL DEFAULT 5;
