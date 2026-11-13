-- Clock in/out with breaks, and employee-raised attendance regularizations that apply to the record once approved.
CREATE TYPE "AttendanceRegularizationType" AS ENUM ('MISSED_CLOCK_IN', 'MISSED_CLOCK_OUT', 'LATE_ARRIVAL', 'WORK_FROM_CLIENT_SITE', 'OTHER');
CREATE TYPE "AttendanceRegularizationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

ALTER TABLE "hrms_attendance_records"
  ADD COLUMN "breakMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "breakStartedAt" TIMESTAMP(3);

CREATE TABLE "hrms_attendance_regularizations" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "date" DATE NOT NULL,
  "type" "AttendanceRegularizationType" NOT NULL,
  "requestedCheckIn" TIMESTAMP(3),
  "requestedCheckOut" TIMESTAMP(3),
  "reason" TEXT NOT NULL,
  "status" "AttendanceRegularizationStatus" NOT NULL DEFAULT 'PENDING',
  "decidedByUserId" UUID,
  "decidedAt" TIMESTAMP(3),
  "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_attendance_regularizations_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "hrms_attendance_regularizations_organizationId_status_idx" ON "hrms_attendance_regularizations"("organizationId", "status");
CREATE INDEX "hrms_attendance_regularizations_employeeId_date_idx" ON "hrms_attendance_regularizations"("employeeId", "date");

ALTER TABLE "hrms_attendance_regularizations"
  ADD CONSTRAINT "hrms_attendance_regularizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "hrms_attendance_regularizations_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
