ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT;

CREATE TYPE "UserRole_new" AS ENUM (
  'PLATFORM_ADMIN',
  'ADMIN',
  'SUPPORT',
  'SALES',
  'ORG_ADMIN',
  'HUMAN_RESOURCE',
  'EMPLOYEE',
  'GUEST'
);

ALTER TABLE "users"
  ALTER COLUMN "role" TYPE "UserRole_new"
  USING (
    CASE
      WHEN "role"::text = 'MEMBER' THEN 'EMPLOYEE'
      ELSE "role"::text
    END
  )::"UserRole_new";

ALTER TYPE "UserRole" RENAME TO "UserRole_old";
ALTER TYPE "UserRole_new" RENAME TO "UserRole";
DROP TYPE "UserRole_old";

ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';