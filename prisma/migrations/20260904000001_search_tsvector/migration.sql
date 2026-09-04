-- Adds a PostgreSQL full-text search vector to search_index and keeps it in
-- sync via a trigger, plus a GIN index for fast @@ queries.

-- 1. Generated tsvector column combining title (weight A) and content (weight B).
ALTER TABLE "search_index"
  ADD COLUMN IF NOT EXISTS "search_vector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(content, '')), 'B')
  ) STORED;

-- 2. GIN index for the @@ full-text operator.
CREATE INDEX IF NOT EXISTS "search_index_vector_idx"
  ON "search_index" USING GIN ("search_vector");

-- 3. Composite index used by the search service's org scoping + ranking.
CREATE INDEX IF NOT EXISTS "search_index_org_vector_idx"
  ON "search_index" ("organizationId", "entityType");
