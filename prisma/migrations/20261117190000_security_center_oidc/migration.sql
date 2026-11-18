CREATE TYPE "SecuritySeverity" AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TABLE "security_events" (
  "id" UUID NOT NULL, "severity" "SecuritySeverity" NOT NULL, "type" TEXT NOT NULL,
  "description" TEXT NOT NULL, "ipAddress" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3), "resolvedById" UUID, CONSTRAINT "security_events_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "security_events_resolvedAt_createdAt_idx" ON "security_events"("resolvedAt", "createdAt");
CREATE INDEX "security_events_createdAt_id_idx" ON "security_events"("createdAt", "id");
CREATE TABLE "blocked_ips" (
  "ipAddress" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdById" UUID NOT NULL, CONSTRAINT "blocked_ips_pkey" PRIMARY KEY ("ipAddress")
);
CREATE TABLE "organization_oidc" (
  "organizationId" UUID NOT NULL, "issuer" TEXT NOT NULL, "clientId" TEXT NOT NULL,
  "clientSecretEncrypted" TEXT NOT NULL, "enabled" BOOLEAN NOT NULL DEFAULT false,
  "version" INTEGER NOT NULL DEFAULT 1, "lastVerifiedAt" TIMESTAMP(3), "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "organization_oidc_pkey" PRIMARY KEY ("organizationId"),
  CONSTRAINT "organization_oidc_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "organization_oidc_identities" (
  "organizationId" UUID NOT NULL, "subject" TEXT NOT NULL, "userId" UUID NOT NULL,
  CONSTRAINT "organization_oidc_identities_pkey" PRIMARY KEY ("organizationId", "subject"),
  CONSTRAINT "organization_oidc_identities_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organization_oidc"("organizationId") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "organization_oidc_identities_organizationId_userId_key" ON "organization_oidc_identities"("organizationId", "userId");
