ALTER TABLE "messages"
    ADD COLUMN IF NOT EXISTS "clientMessageId" UUID;

CREATE UNIQUE INDEX IF NOT EXISTS "messages_organizationId_channelId_clientMessageId_key"
    ON "messages"("organizationId", "channelId", "clientMessageId");