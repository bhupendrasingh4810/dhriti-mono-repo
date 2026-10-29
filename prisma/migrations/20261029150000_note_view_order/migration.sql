CREATE TABLE "note_view_orders" (
  "id" UUID NOT NULL,
  "organizationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "scope" TEXT NOT NULL,
  "noteIds" UUID[] NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "note_view_orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "note_view_orders_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "note_view_orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "note_view_orders_organizationId_userId_scope_key" ON "note_view_orders"("organizationId", "userId", "scope");
CREATE INDEX "note_view_orders_userId_idx" ON "note_view_orders"("userId");
