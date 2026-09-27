CREATE TYPE "EntitlementKind" AS ENUM ('FEATURE', 'LIMIT');

CREATE TABLE "permissions" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "key" TEXT NOT NULL, "resource" TEXT NOT NULL, "action" TEXT NOT NULL, "description" TEXT, "productKey" TEXT, "isAssignable" BOOLEAN NOT NULL DEFAULT true, "isSystemOnly" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "permissions_pkey" PRIMARY KEY ("id"));
CREATE TABLE "platform_roles" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "key" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "isSystem" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "platform_roles_pkey" PRIMARY KEY ("id"));
CREATE TABLE "platform_role_permissions" ("platformRoleId" UUID NOT NULL, "permissionId" UUID NOT NULL, CONSTRAINT "platform_role_permissions_pkey" PRIMARY KEY ("platformRoleId", "permissionId"));
CREATE TABLE "platform_user_role_assignments" ("userId" UUID NOT NULL, "platformRoleId" UUID NOT NULL, "assignedById" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "revokedAt" TIMESTAMP(3), CONSTRAINT "platform_user_role_assignments_pkey" PRIMARY KEY ("userId", "platformRoleId"));
CREATE TABLE "plans" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "key" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "isPublic" BOOLEAN NOT NULL DEFAULT true, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "plans_pkey" PRIMARY KEY ("id"));
CREATE TABLE "entitlements" ("id" UUID NOT NULL DEFAULT gen_random_uuid(), "key" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "kind" "EntitlementKind" NOT NULL, "productKey" TEXT, "unit" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id"));
CREATE TABLE "plan_entitlements" ("planId" UUID NOT NULL, "entitlementId" UUID NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT false, "value" INTEGER, CONSTRAINT "plan_entitlements_pkey" PRIMARY KEY ("planId", "entitlementId"));
CREATE TABLE "organization_entitlements" ("organizationId" UUID NOT NULL, "entitlementId" UUID NOT NULL, "enabled" BOOLEAN, "value" INTEGER, "reason" TEXT, "expiresAt" TIMESTAMP(3), "createdById" UUID, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "organization_entitlements_pkey" PRIMARY KEY ("organizationId", "entitlementId"));

CREATE UNIQUE INDEX "permissions_key_key" ON "permissions"("key");
CREATE INDEX "permissions_productKey_idx" ON "permissions"("productKey");
CREATE UNIQUE INDEX "platform_roles_key_key" ON "platform_roles"("key");
CREATE INDEX "platform_user_role_assignments_userId_revokedAt_idx" ON "platform_user_role_assignments"("userId", "revokedAt");
CREATE UNIQUE INDEX "plans_key_key" ON "plans"("key");
CREATE UNIQUE INDEX "entitlements_key_key" ON "entitlements"("key");
CREATE INDEX "entitlements_productKey_idx" ON "entitlements"("productKey");
CREATE INDEX "organization_entitlements_organizationId_expiresAt_idx" ON "organization_entitlements"("organizationId", "expiresAt");

ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_platformRoleId_fkey" FOREIGN KEY ("platformRoleId") REFERENCES "platform_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_role_permissions" ADD CONSTRAINT "platform_role_permissions_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_user_role_assignments" ADD CONSTRAINT "platform_user_role_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "platform_user_role_assignments" ADD CONSTRAINT "platform_user_role_assignments_platformRoleId_fkey" FOREIGN KEY ("platformRoleId") REFERENCES "platform_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "plan_entitlements" ADD CONSTRAINT "plan_entitlements_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_entitlements" ADD CONSTRAINT "organization_entitlements_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "organization_entitlements" ADD CONSTRAINT "organization_entitlements_entitlementId_fkey" FOREIGN KEY ("entitlementId") REFERENCES "entitlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;