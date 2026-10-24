CREATE UNIQUE INDEX "organization_members_one_active_membership_per_user"
ON "organization_members" ("userId")
WHERE "deletedAt" IS NULL
  AND "status" IN ('INVITED', 'ACTIVE', 'SUSPENDED');
