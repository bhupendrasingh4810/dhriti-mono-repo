-- Per-date organization holidays and an audit trail of holiday-list emails.
CREATE TABLE "hrms_holidays" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "date" DATE NOT NULL,
    "name" TEXT NOT NULL,
    "isHalfDay" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "hrms_holidays_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "hrms_holidays_organizationId_date_key" ON "hrms_holidays"("organizationId", "date");
CREATE INDEX "hrms_holidays_organizationId_date_idx" ON "hrms_holidays"("organizationId", "date");
ALTER TABLE "hrms_holidays" ADD CONSTRAINT "hrms_holidays_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "hrms_holiday_broadcasts" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "audience" VARCHAR(10) NOT NULL,
    "recipientCount" INTEGER NOT NULL,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "sentByUserId" UUID,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "hrms_holiday_broadcasts_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "hrms_holiday_broadcasts_organizationId_year_sentAt_idx" ON "hrms_holiday_broadcasts"("organizationId", "year", "sentAt");
ALTER TABLE "hrms_holiday_broadcasts" ADD CONSTRAINT "hrms_holiday_broadcasts_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
