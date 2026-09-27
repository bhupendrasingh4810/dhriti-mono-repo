CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'WORK_FROM_HOME', 'ON_LEAVE', 'HOLIDAY');
CREATE TYPE "LeaveType" AS ENUM ('VACATION', 'SICK_LEAVE', 'PERSONAL_LEAVE', 'MATERNITY_LEAVE', 'PATERNITY_LEAVE', 'BEREAVEMENT_LEAVE', 'JURY_DUTY', 'UNPAID_LEAVE', 'WORK_FROM_HOME', 'HALF_DAY');
CREATE TYPE "LeaveStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WITHDRAWN');
CREATE TYPE "ReviewType" AS ENUM ('SELF_REVIEW', 'MANAGER_REVIEW', 'PEER_REVIEW', 'PROBATION_REVIEW', 'ANNUAL_REVIEW', 'QUARTERLY_REVIEW');
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CALIBRATING', 'APPROVED');
CREATE TYPE "PayrollStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PAID', 'FAILED', 'CANCELLED');
CREATE TYPE "TrainingType" AS ENUM ('ONBOARDING', 'TECHNICAL', 'SOFT_SKILLS', 'COMPLIANCE', 'LEADERSHIP', 'SAFETY', 'PRODUCT', 'OTHER');
CREATE TYPE "TrainingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "TrainingEnrollmentStatus" AS ENUM ('ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'DROPPED_OUT');
CREATE TYPE "AssetType" AS ENUM ('LAPTOP', 'DESKTOP', 'MONITOR', 'KEYBOARD', 'MOUSE', 'HEADPHONES', 'PHONE', 'TABLET', 'FURNITURE', 'ACCESS_CARD', 'OTHER');
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'LOST', 'STOLEN', 'RETIRED', 'DISPOSABLE');

CREATE TABLE "hrms_attendance_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyAttendanceId" UUID, "employeeId" UUID NOT NULL, "date" DATE NOT NULL, "checkIn" TIMESTAMP(3), "checkOut" TIMESTAMP(3), "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT', "workHours" DOUBLE PRECISION, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_attendance_records_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_leave_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyLeaveRequestId" UUID, "employeeId" UUID NOT NULL, "leaveType" "LeaveType" NOT NULL, "startDate" DATE NOT NULL, "endDate" DATE NOT NULL, "totalDays" DOUBLE PRECISION NOT NULL, "reason" TEXT, "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING', "approvedByUserId" UUID, "approvedAt" TIMESTAMP(3), "rejectedByUserId" UUID, "rejectedAt" TIMESTAMP(3), "rejectionReason" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_leave_requests_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_performance_reviews" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyPerformanceReviewId" UUID, "employeeId" UUID NOT NULL, "reviewerEmployeeId" UUID NOT NULL, "reviewType" "ReviewType" NOT NULL, "cycle" TEXT NOT NULL, "startDate" DATE NOT NULL, "dueDate" DATE NOT NULL, "completedAt" TIMESTAMP(3), "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING', "overallRating" INTEGER, "comments" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_performance_reviews_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_payroll_records" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyPayrollRecordId" UUID, "employeeId" UUID NOT NULL, "period" TEXT NOT NULL, "periodStart" DATE NOT NULL, "periodEnd" DATE NOT NULL, "payDate" DATE NOT NULL, "grossSalary" DOUBLE PRECISION NOT NULL, "totalDeductions" DOUBLE PRECISION NOT NULL, "netPay" DOUBLE PRECISION NOT NULL, "currency" TEXT NOT NULL DEFAULT 'USD', "status" "PayrollStatus" NOT NULL DEFAULT 'DRAFT', "approvedByUserId" UUID, "approvedAt" TIMESTAMP(3), "paidAt" TIMESTAMP(3), "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_payroll_records_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_trainings" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyTrainingId" UUID, "title" TEXT NOT NULL, "description" TEXT, "type" "TrainingType" NOT NULL, "startDate" TIMESTAMP(3), "endDate" TIMESTAMP(3), "status" "TrainingStatus" NOT NULL DEFAULT 'SCHEDULED', "maxParticipants" INTEGER, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_trainings_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_training_enrollments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyTrainingEnrollmentId" UUID, "trainingId" UUID NOT NULL, "employeeId" UUID NOT NULL, "status" "TrainingEnrollmentStatus" NOT NULL DEFAULT 'ENROLLED', "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "completedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_training_enrollments_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_assets" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyAssetId" UUID, "name" TEXT NOT NULL, "type" "AssetType" NOT NULL, "serialNumber" TEXT, "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE', "assignedEmployeeId" UUID, "assignedAt" TIMESTAMP(3), "location" TEXT, "notes" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_assets_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "hrms_benefit_enrollments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "legacyHealthInsuranceId" UUID, "employeeId" UUID NOT NULL, "provider" TEXT NOT NULL, "planName" TEXT NOT NULL, "policyNumber" TEXT, "coverageStarts" DATE NOT NULL, "coverageEnds" DATE, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_benefit_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "hrms_attendance_records_employeeId_date_key" ON "hrms_attendance_records"("employeeId", "date");
CREATE UNIQUE INDEX "hrms_attendance_records_organizationId_legacyAttendanceId_key" ON "hrms_attendance_records"("organizationId", "legacyAttendanceId");
CREATE INDEX "hrms_attendance_records_organizationId_date_idx" ON "hrms_attendance_records"("organizationId", "date");
CREATE INDEX "hrms_attendance_records_employeeId_date_idx" ON "hrms_attendance_records"("employeeId", "date");
CREATE INDEX "hrms_leave_requests_organizationId_status_idx" ON "hrms_leave_requests"("organizationId", "status");
CREATE UNIQUE INDEX "hrms_leave_requests_organizationId_legacyLeaveRequestId_key" ON "hrms_leave_requests"("organizationId", "legacyLeaveRequestId");
CREATE INDEX "hrms_leave_requests_employeeId_startDate_idx" ON "hrms_leave_requests"("employeeId", "startDate");
CREATE INDEX "hrms_performance_reviews_organizationId_status_idx" ON "hrms_performance_reviews"("organizationId", "status");
CREATE UNIQUE INDEX "hrms_performance_reviews_organizationId_legacyPerformanceReviewId_key" ON "hrms_performance_reviews"("organizationId", "legacyPerformanceReviewId");
CREATE INDEX "hrms_performance_reviews_employeeId_dueDate_idx" ON "hrms_performance_reviews"("employeeId", "dueDate");
CREATE INDEX "hrms_performance_reviews_reviewerEmployeeId_dueDate_idx" ON "hrms_performance_reviews"("reviewerEmployeeId", "dueDate");
CREATE UNIQUE INDEX "hrms_payroll_records_employeeId_period_key" ON "hrms_payroll_records"("employeeId", "period");
CREATE UNIQUE INDEX "hrms_payroll_records_organizationId_legacyPayrollRecordId_key" ON "hrms_payroll_records"("organizationId", "legacyPayrollRecordId");
CREATE INDEX "hrms_payroll_records_organizationId_status_idx" ON "hrms_payroll_records"("organizationId", "status");
CREATE INDEX "hrms_trainings_organizationId_status_idx" ON "hrms_trainings"("organizationId", "status");
CREATE UNIQUE INDEX "hrms_trainings_organizationId_legacyTrainingId_key" ON "hrms_trainings"("organizationId", "legacyTrainingId");
CREATE UNIQUE INDEX "hrms_training_enrollments_trainingId_employeeId_key" ON "hrms_training_enrollments"("trainingId", "employeeId");
CREATE UNIQUE INDEX "hrms_training_enrollments_organizationId_legacyTrainingEnrollmentId_key" ON "hrms_training_enrollments"("organizationId", "legacyTrainingEnrollmentId");
CREATE INDEX "hrms_training_enrollments_organizationId_status_idx" ON "hrms_training_enrollments"("organizationId", "status");
CREATE UNIQUE INDEX "hrms_assets_organizationId_serialNumber_key" ON "hrms_assets"("organizationId", "serialNumber");
CREATE UNIQUE INDEX "hrms_assets_organizationId_legacyAssetId_key" ON "hrms_assets"("organizationId", "legacyAssetId");
CREATE INDEX "hrms_assets_organizationId_status_idx" ON "hrms_assets"("organizationId", "status");
CREATE INDEX "hrms_benefit_enrollments_organizationId_isActive_idx" ON "hrms_benefit_enrollments"("organizationId", "isActive");
CREATE UNIQUE INDEX "hrms_benefit_enrollments_organizationId_legacyHealthInsuranceId_key" ON "hrms_benefit_enrollments"("organizationId", "legacyHealthInsuranceId");
CREATE INDEX "hrms_benefit_enrollments_employeeId_isActive_idx" ON "hrms_benefit_enrollments"("employeeId", "isActive");

ALTER TABLE "hrms_attendance_records" ADD CONSTRAINT "hrms_attendance_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_attendance_records" ADD CONSTRAINT "hrms_attendance_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_leave_requests" ADD CONSTRAINT "hrms_leave_requests_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_leave_requests" ADD CONSTRAINT "hrms_leave_requests_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_performance_reviews" ADD CONSTRAINT "hrms_performance_reviews_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_performance_reviews" ADD CONSTRAINT "hrms_performance_reviews_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_performance_reviews" ADD CONSTRAINT "hrms_performance_reviews_reviewerEmployeeId_fkey" FOREIGN KEY ("reviewerEmployeeId") REFERENCES "hrms_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "hrms_payroll_records" ADD CONSTRAINT "hrms_payroll_records_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_payroll_records" ADD CONSTRAINT "hrms_payroll_records_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_trainings" ADD CONSTRAINT "hrms_trainings_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_training_enrollments" ADD CONSTRAINT "hrms_training_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_training_enrollments" ADD CONSTRAINT "hrms_training_enrollments_trainingId_fkey" FOREIGN KEY ("trainingId") REFERENCES "hrms_trainings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_training_enrollments" ADD CONSTRAINT "hrms_training_enrollments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_assets" ADD CONSTRAINT "hrms_assets_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_assets" ADD CONSTRAINT "hrms_assets_assignedEmployeeId_fkey" FOREIGN KEY ("assignedEmployeeId") REFERENCES "hrms_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "hrms_benefit_enrollments" ADD CONSTRAINT "hrms_benefit_enrollments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_benefit_enrollments" ADD CONSTRAINT "hrms_benefit_enrollments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;