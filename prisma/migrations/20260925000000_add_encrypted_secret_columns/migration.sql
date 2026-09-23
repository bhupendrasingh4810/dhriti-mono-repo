ALTER TABLE "user_auth"
    ADD COLUMN IF NOT EXISTS "mfaSecretEncrypted" TEXT;

ALTER TABLE "webhooks"
    ADD COLUMN IF NOT EXISTS "secretEncrypted" TEXT;

ALTER TABLE "webhooks"
    ALTER COLUMN "secret" DROP NOT NULL;