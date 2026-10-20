DELETE FROM "message_reactions" AS duplicate
USING "message_reactions" AS retained
WHERE duplicate."messageId" = retained."messageId"
  AND duplicate."userId" = retained."userId"
  AND (duplicate."createdAt" > retained."createdAt"
    OR (duplicate."createdAt" = retained."createdAt" AND duplicate.id > retained.id));

ALTER TABLE "message_reactions"
  DROP CONSTRAINT IF EXISTS "message_reactions_messageId_userId_emoji_key";

ALTER TABLE "message_reactions"
  ADD CONSTRAINT "message_reactions_messageId_userId_key" UNIQUE ("messageId", "userId");