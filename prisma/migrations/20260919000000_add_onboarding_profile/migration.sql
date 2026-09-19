CREATE TABLE "OnBoardingProfile" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "userId" UUID NOT NULL,
    "isOnBoarded" BOOLEAN NOT NULL DEFAULT false,
    "isOrgAdded" BOOLEAN NOT NULL DEFAULT false,
    "usageType" TEXT NOT NULL DEFAULT '',
    "experience" TEXT NOT NULL DEFAULT '',
    "isProfilePhotoSkipped" BOOLEAN NOT NULL DEFAULT false,
    "legalAcceptedAt" TIMESTAMP(3) NOT NULL,
    "legalPrivacyPolicyAccepted" BOOLEAN NOT NULL DEFAULT true,
    "legalPrivacyPolicyVersion" TEXT NOT NULL DEFAULT '2026-09-01',
    "legalTermsAccepted" BOOLEAN NOT NULL DEFAULT true,
    "legalTermsVersion" TEXT NOT NULL DEFAULT '2026-09-01',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OnBoardingProfile_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'users'
          AND column_name = 'onboardingProfile'
    ) THEN
        EXECUTE $sql$
            INSERT INTO "OnBoardingProfile" (
                "userId", "isOnBoarded", "isOrgAdded", "usageType",
                "experience", "isProfilePhotoSkipped", "legalAcceptedAt",
                "legalPrivacyPolicyAccepted", "legalPrivacyPolicyVersion",
                "legalTermsAccepted", "legalTermsVersion", "createdAt", "updatedAt"
            )
            SELECT
                "id",
                COALESCE(("onboardingProfile"->>'isOnBoarded')::BOOLEAN, false),
                COALESCE(("onboardingProfile"->>'isOrgAdded')::BOOLEAN, false),
                COALESCE("onboardingProfile"->>'usageType', ''),
                COALESCE("onboardingProfile"->>'experience', ''),
                COALESCE(("onboardingProfile"->>'isProfilePhotoSkipped')::BOOLEAN, false),
                COALESCE(("onboardingProfile"->'legal'->>'acceptedAt')::TIMESTAMP(3), "createdAt"),
                COALESCE(("onboardingProfile"->'legal'->>'privacyPolicyAccepted')::BOOLEAN, true),
                COALESCE("onboardingProfile"->'legal'->>'privacyPolicyVersion', '2026-09-01'),
                COALESCE(("onboardingProfile"->'legal'->>'termsAccepted')::BOOLEAN, true),
                COALESCE("onboardingProfile"->'legal'->>'termsVersion', '2026-09-01'),
                "createdAt", "updatedAt"
            FROM "users"
        $sql$;
    ELSE
        INSERT INTO "OnBoardingProfile" (
            "userId", "legalAcceptedAt", "createdAt", "updatedAt"
        )
        SELECT "id", "createdAt", "createdAt", "updatedAt"
        FROM "users";
    END IF;
END $$;

CREATE UNIQUE INDEX "OnBoardingProfile_userId_key" ON "OnBoardingProfile"("userId");

ALTER TABLE "OnBoardingProfile"
    ADD CONSTRAINT "OnBoardingProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" DROP COLUMN IF EXISTS "onboardingProfile";