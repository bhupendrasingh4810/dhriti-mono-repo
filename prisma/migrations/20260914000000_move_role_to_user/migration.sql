CREATE TYPE "UserRole" AS ENUM (
  'PLATFORM_ADMIN',
  'ADMIN',
  'SUPPORT',
  'SALES',
  'ORG_ADMIN',
  'HUMAN_RESOURCE',
  'MEMBER',
  'GUEST'
);

ALTER TABLE "users" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'MEMBER';

UPDATE "users" AS "user"
SET "role" = CASE
  WHEN EXISTS (
    SELECT 1 FROM "organization_members"
    WHERE "userId" = "user"."id" AND "role" = 'OWNER'
  ) THEN 'ORG_ADMIN'::"UserRole"
  WHEN EXISTS (
    SELECT 1 FROM "organization_members"
    WHERE "userId" = "user"."id" AND "role" = 'ADMIN'
  ) THEN 'ADMIN'::"UserRole"
  WHEN EXISTS (
    SELECT 1 FROM "organization_members"
    WHERE "userId" = "user"."id" AND "role" = 'GUEST'
  ) THEN 'GUEST'::"UserRole"
  ELSE 'MEMBER'::"UserRole"
END;

ALTER TABLE "organization_members" DROP COLUMN "role";
ALTER TABLE "invitations" DROP COLUMN "role";
DROP TYPE "OrganizationRole";