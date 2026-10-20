DO $$
BEGIN
    CREATE TYPE "ConnectMemberRole" AS ENUM ('ADMIN', 'MEMBER');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "teams"
    ADD COLUMN IF NOT EXISTS "visibility" "ChannelVisibility" NOT NULL DEFAULT 'PUBLIC';

ALTER TABLE "team_members"
    ADD COLUMN IF NOT EXISTS "role" "ConnectMemberRole" NOT NULL DEFAULT 'MEMBER';

ALTER TABLE "channel_members"
    ADD COLUMN IF NOT EXISTS "role" "ConnectMemberRole" NOT NULL DEFAULT 'MEMBER';

UPDATE "team_members"
SET "role" = 'ADMIN'
WHERE "id" IN (
    SELECT DISTINCT ON ("teamId") "id"
    FROM "team_members"
    ORDER BY "teamId", "createdAt" ASC
);

UPDATE "channel_members"
SET "role" = 'ADMIN'
FROM "channels"
WHERE "channel_members"."channelId" = "channels"."id"
  AND "channel_members"."userId" = "channels"."createdById";

CREATE INDEX IF NOT EXISTS "team_members_teamId_role_idx"
    ON "team_members"("teamId", "role");

CREATE INDEX IF NOT EXISTS "channel_members_channelId_role_idx"
    ON "channel_members"("channelId", "role");
