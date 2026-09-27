CREATE TYPE "LegacyPlatformRole_new" AS ENUM (
  'PLATFORM_ADMIN',
  'ADMIN',
  'PLATFORM_USER',
  'SUPPORT',
  'BILLING',
  'SECURITY',
  'ENGINEERING',
  'ACCOUNTS'
);

ALTER TABLE "user_auth"
  ALTER COLUMN "platformRole" TYPE "LegacyPlatformRole_new"
  USING (
    CASE "platformRole"::text
      WHEN 'SUPER_ADMIN' THEN 'PLATFORM_ADMIN'
      ELSE "platformRole"::text
    END
  )::"LegacyPlatformRole_new";

DROP TYPE "LegacyPlatformRole";
ALTER TYPE "LegacyPlatformRole_new" RENAME TO "LegacyPlatformRole";