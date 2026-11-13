-- Shift times are wall-clock in the shift's own IANA time zone. Existing shifts inherit their organization's zone.
ALTER TABLE "hrms_shifts" ADD COLUMN "timeZone" TEXT NOT NULL DEFAULT 'Asia/Kolkata';

UPDATE "hrms_shifts" AS s
SET "timeZone" = o."timezone"
FROM "organizations" AS o
WHERE o."id" = s."organizationId";
