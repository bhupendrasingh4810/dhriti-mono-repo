ALTER TABLE "messages" ADD COLUMN "pinnedAt" TIMESTAMP(3);

CREATE INDEX "messages_channelId_pinnedAt_idx" ON "messages"("channelId", "pinnedAt");
