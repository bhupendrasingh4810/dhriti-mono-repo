CREATE TABLE "user_profiles" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "phoneNumber" TEXT,
  "first_name" TEXT,
  "last_name" TEXT,
  "avatar_thumbnail_url" TEXT,
  "bio" TEXT,
  "jobTitle" TEXT,
  "department" TEXT,
  "timezone" TEXT NOT NULL DEFAULT 'UTC',
  "locale" TEXT NOT NULL DEFAULT 'en',
  "theme" TEXT NOT NULL DEFAULT 'light',
  "language" TEXT NOT NULL DEFAULT 'en',
  "notification_preferences" JSONB,

  CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");
CREATE UNIQUE INDEX "user_profiles_phoneNumber_key" ON "user_profiles"("phoneNumber");
CREATE INDEX "user_profiles_userId_idx" ON "user_profiles"("userId");
CREATE INDEX "user_profiles_phoneNumber_idx" ON "user_profiles"("phoneNumber");
CREATE INDEX "user_profiles_department_idx" ON "user_profiles"("department");

ALTER TABLE "user_profiles"
  ADD CONSTRAINT "user_profiles_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;