CREATE TABLE "holiday_calendars" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "organizationId" UUID NOT NULL, "name" TEXT NOT NULL,
  "countryCode" TEXT, "region" TEXT, "holidays" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "holiday_calendars_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "holiday_calendars_organizationId_name_key" ON "holiday_calendars"("organizationId", "name");
CREATE INDEX "holiday_calendars_organizationId_idx" ON "holiday_calendars"("organizationId");
ALTER TABLE "holiday_calendars" ADD CONSTRAINT "holiday_calendars_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;