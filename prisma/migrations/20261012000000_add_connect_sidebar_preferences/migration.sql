CREATE TABLE "connect_sidebar_preferences" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "preferences" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_sidebar_preferences_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_sidebar_preferences_organizationId_userId_key"
    ON "connect_sidebar_preferences"("organizationId", "userId");

ALTER TABLE "connect_sidebar_preferences"
    ADD CONSTRAINT "connect_sidebar_preferences_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connect_sidebar_preferences"
    ADD CONSTRAINT "connect_sidebar_preferences_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;