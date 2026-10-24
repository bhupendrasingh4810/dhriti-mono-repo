CREATE TABLE "connect_user_searches" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "actorUserId" UUID NOT NULL,
    "targetUserId" UUID NOT NULL,
    "selectionCount" INTEGER NOT NULL DEFAULT 1,
    "lastSelectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connect_user_searches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_user_searches_organizationId_actorUserId_targetUserId_key"
    ON "connect_user_searches"("organizationId", "actorUserId", "targetUserId");

CREATE INDEX "connect_user_searches_organizationId_actorUserId_lastSelectedAt_idx"
    ON "connect_user_searches"("organizationId", "actorUserId", "lastSelectedAt");

ALTER TABLE "connect_user_searches"
    ADD CONSTRAINT "connect_user_searches_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connect_user_searches"
    ADD CONSTRAINT "connect_user_searches_actorUserId_fkey"
    FOREIGN KEY ("actorUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "connect_user_searches"
    ADD CONSTRAINT "connect_user_searches_targetUserId_fkey"
    FOREIGN KEY ("targetUserId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
