ALTER TABLE "notes" ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "note_permissions" ADD COLUMN "isOwner" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "note_access_requests" (
  "id" UUID NOT NULL,
  "noteId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "requestedRole" TEXT NOT NULL,
  "grantedRole" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reviewedById" UUID,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "note_access_requests_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "note_access_requests_role_check" CHECK ("requestedRole" IN ('EDIT', 'OWNER')),
  CONSTRAINT "note_access_requests_granted_role_check" CHECK ("grantedRole" IS NULL OR "grantedRole" IN ('EDIT', 'OWNER')),
  CONSTRAINT "note_access_requests_status_check" CHECK ("status" IN ('PENDING', 'APPROVED', 'REJECTED'))
);
CREATE UNIQUE INDEX "note_access_requests_noteId_userId_key" ON "note_access_requests"("noteId", "userId");
CREATE INDEX "note_access_requests_userId_status_idx" ON "note_access_requests"("userId", "status");
ALTER TABLE "note_access_requests" ADD CONSTRAINT "note_access_requests_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "note_access_requests" ADD CONSTRAINT "note_access_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
