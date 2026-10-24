-- A deleted channel must not retain a slug that blocks creating a replacement.
UPDATE "channels"
SET "slug" = NULL
WHERE "deletedAt" IS NOT NULL
  AND "slug" IS NOT NULL;
