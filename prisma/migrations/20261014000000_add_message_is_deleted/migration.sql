ALTER TABLE "messages" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "messages" SET "isDeleted" = true WHERE "deletedAt" IS NOT NULL;