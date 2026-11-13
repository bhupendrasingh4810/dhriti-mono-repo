-- Location-specific holidays and richer broadcast history.
DROP INDEX "hrms_holidays_organizationId_date_key";
ALTER TABLE "hrms_holidays" ADD COLUMN "workLocationId" UUID;
CREATE INDEX "hrms_holidays_workLocationId_idx" ON "hrms_holidays"("workLocationId");
ALTER TABLE "hrms_holidays" ADD CONSTRAINT "hrms_holidays_workLocationId_fkey" FOREIGN KEY ("workLocationId") REFERENCES "hrms_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hrms_holiday_broadcasts" ADD COLUMN "changesOnly" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "hrms_holiday_broadcasts" ADD COLUMN "holidayCount" INTEGER NOT NULL DEFAULT 0;
