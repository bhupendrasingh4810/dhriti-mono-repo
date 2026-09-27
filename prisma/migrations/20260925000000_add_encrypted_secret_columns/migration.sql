ALTER TYPE "PlatformRole" RENAME TO "LegacyPlatformRole";

ALTER TABLE "users"
    ADD COLUMN IF NOT EXISTS "isPlatformUser" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "managerId" UUID;

CREATE INDEX IF NOT EXISTS "users_managerId_idx" ON "users"("managerId");

ALTER TABLE "users"
    ADD CONSTRAINT "users_managerId_fkey"
    FOREIGN KEY ("managerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "users"
SET "isPlatformUser" = true
WHERE "platformRole" IS NOT NULL;

CREATE TABLE "user_auth" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "passwordHash" TEXT,
    "emailVerificationToken" TEXT,
    "emailVerificationSentAt" TIMESTAMP(3),
    "passwordResetToken" TEXT,
    "passwordResetExpires" TIMESTAMP(3),
    "phoneVerificationToken" TEXT,
    "phoneVerificationSentAt" TIMESTAMP(3),
    "phoneVerifiedAt" TIMESTAMP(3),
    "emailVerifiedAt" TIMESTAMP(3),
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "mfaSecret" TEXT,
    "mfaSecretEncrypted" TEXT,
    "mfaBackupCodesUsed" INTEGER NOT NULL DEFAULT 0,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "last_password_change" TIMESTAMP(3),
    "password_expires_at" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "loginCount" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'email',
    "sourceMetadata" JSONB,
    "external_id" TEXT,
    "platformRole" "LegacyPlatformRole",

    CONSTRAINT "user_auth_pkey" PRIMARY KEY ("id")
);

INSERT INTO "user_auth" (
    "userId", "passwordHash", "emailVerifiedAt", "mfaEnabled", "mfaSecret",
    "failedLoginAttempts", "lockedUntil", "lastLoginAt", "platformRole"
)
SELECT
    "id", "passwordHash", "emailVerifiedAt", "mfaEnabled", "mfaSecret",
    "failedLoginAttempts", "lockedUntil", "lastLoginAt", "platformRole"
FROM "users";

CREATE UNIQUE INDEX "user_auth_userId_key" ON "user_auth"("userId");
CREATE UNIQUE INDEX "user_auth_emailVerificationToken_key" ON "user_auth"("emailVerificationToken");
CREATE UNIQUE INDEX "user_auth_passwordResetToken_key" ON "user_auth"("passwordResetToken");
CREATE UNIQUE INDEX "user_auth_external_id_key" ON "user_auth"("external_id");
CREATE INDEX "user_auth_userId_idx" ON "user_auth"("userId");

ALTER TABLE "user_auth"
    ADD CONSTRAINT "user_auth_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users"
    DROP COLUMN "passwordHash",
    DROP COLUMN "platformRole",
    DROP COLUMN "emailVerifiedAt",
    DROP COLUMN "mfaEnabled",
    DROP COLUMN "mfaSecret",
    DROP COLUMN "failedLoginAttempts",
    DROP COLUMN "lockedUntil",
    DROP COLUMN "lastLoginAt";

ALTER TABLE "webhooks"
    ADD COLUMN IF NOT EXISTS "secretEncrypted" TEXT;

ALTER TABLE "webhooks"
    ALTER COLUMN "secret" DROP NOT NULL;