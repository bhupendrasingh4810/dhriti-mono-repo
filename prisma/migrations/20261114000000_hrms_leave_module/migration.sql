-- Leave module: admin-managed leave types, comp-off requests, request-more-info and leave policy settings.
ALTER TYPE "LeaveStatus" ADD VALUE IF NOT EXISTS 'NEEDS_INFO';

ALTER TABLE "hrms_organization_settings"
  ADD COLUMN "leaveOnBehalfEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "leaveMinNoticeDays" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "leaveBackdateLimitDays" INTEGER,
  ADD COLUMN "birthdayLeaveEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "birthdayLeaveDays" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "optionalLeaveEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "optionalLeaveDays" INTEGER NOT NULL DEFAULT 2;

CREATE TABLE "hrms_leave_types" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "category" "LeaveType" NOT NULL DEFAULT 'VACATION',
  "annualDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "carryForwardDays" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "isPaid" BOOLEAN NOT NULL DEFAULT true,
  "allowHalfDay" BOOLEAN NOT NULL DEFAULT true,
  "isCompOff" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_leave_types_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hrms_leave_types_organizationId_code_key" ON "hrms_leave_types"("organizationId", "code");
ALTER TABLE "hrms_leave_types" ADD CONSTRAINT "hrms_leave_types_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hrms_leave_requests"
  ADD COLUMN "leaveTypeId" UUID,
  ADD COLUMN "requestedByUserId" UUID,
  ADD COLUMN "moreInfoNote" TEXT,
  ADD COLUMN "moreInfoRequestedByUserId" UUID,
  ADD COLUMN "moreInfoRequestedAt" TIMESTAMP(3),
  ADD COLUMN "moreInfoReply" TEXT,
  ADD COLUMN "attachmentFileId" UUID,
  ADD COLUMN "attachmentName" TEXT;
ALTER TABLE "hrms_leave_requests" ADD CONSTRAINT "hrms_leave_requests_leaveTypeId_fkey"
  FOREIGN KEY ("leaveTypeId") REFERENCES "hrms_leave_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "hrms_comp_off_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "employeeId" UUID NOT NULL,
  "workedDate" DATE NOT NULL,
  "workedEndDate" DATE,
  "days" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "reason" TEXT,
  "status" "LeaveStatus" NOT NULL DEFAULT 'PENDING',
  "requestedByUserId" UUID,
  "decidedByUserId" UUID,
  "decidedAt" TIMESTAMP(3),
  "decisionReason" TEXT,
  "moreInfoNote" TEXT,
  "moreInfoRequestedByUserId" UUID,
  "moreInfoRequestedAt" TIMESTAMP(3),
  "moreInfoReply" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "hrms_comp_off_requests_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hrms_comp_off_requests_organizationId_status_idx" ON "hrms_comp_off_requests"("organizationId", "status");
CREATE INDEX "hrms_comp_off_requests_employeeId_workedDate_idx" ON "hrms_comp_off_requests"("employeeId", "workedDate");
ALTER TABLE "hrms_comp_off_requests" ADD CONSTRAINT "hrms_comp_off_requests_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "hrms_comp_off_requests" ADD CONSTRAINT "hrms_comp_off_requests_employeeId_fkey"
  FOREIGN KEY ("employeeId") REFERENCES "hrms_employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
