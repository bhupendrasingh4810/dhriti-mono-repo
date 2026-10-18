ALTER TABLE "organizations"
ADD COLUMN "isPlatformOrganization" BOOLEAN NOT NULL DEFAULT false;

UPDATE "organizations"
SET "isPlatformOrganization" = true
WHERE "slug" = 'platform';