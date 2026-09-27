ALTER TABLE "user_identities"
  ADD COLUMN "providerUserId" TEXT,
  ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "name" TEXT,
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "phoneNumber" TEXT,
  ADD COLUMN "accessToken" TEXT,
  ADD COLUMN "accessTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "refreshToken" TEXT,
  ADD COLUMN "refreshTokenExpiresAt" TIMESTAMP(3),
  ADD COLUMN "idToken" TEXT,
  ADD COLUMN "scope" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "providerMetadata" JSONB,
  ADD COLUMN "lastUsedAt" TIMESTAMP(3),
  ADD COLUMN "lastUsedIp" TEXT,
  ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "user_identities"
  ALTER COLUMN "updatedAt" DROP DEFAULT;

CREATE INDEX "user_identities_provider_idx" ON "user_identities"("provider");
CREATE INDEX "user_identities_email_idx" ON "user_identities"("email");