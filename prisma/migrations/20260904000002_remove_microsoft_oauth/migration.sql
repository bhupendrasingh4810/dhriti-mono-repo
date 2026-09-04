-- Remove MICROSOFT from the OAuthProvider enum.
-- Any existing MICROSOFT-linked identities are removed first so the enum
-- recreation cannot fail on rows still referencing the dropped value.

-- Data cleanup
DELETE FROM "user_identities" WHERE "provider" = 'MICROSOFT';

-- Recreate enum without MICROSOFT (PostgreSQL cannot drop enum values in place)
CREATE TYPE "OAuthProvider_new" AS ENUM ('GOOGLE', 'GITHUB');

ALTER TABLE "user_identities"
  ALTER COLUMN "provider" TYPE "OAuthProvider_new"
  USING ("provider"::text::"OAuthProvider_new");

DROP TYPE "OAuthProvider";

ALTER TYPE "OAuthProvider_new" RENAME TO "OAuthProvider";
