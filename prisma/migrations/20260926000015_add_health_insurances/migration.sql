CREATE TABLE "health_insurances" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "provider" TEXT NOT NULL,
  "planName" TEXT NOT NULL,
  "policyNumber" TEXT,
  "memberNumber" TEXT,
  "coverageStarts" DATE NOT NULL,
  "coverageEnds" DATE,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "health_insurances_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "health_insurances_organizationId_isActive_idx" ON "health_insurances"("organizationId", "isActive");
CREATE INDEX "health_insurances_userId_isActive_idx" ON "health_insurances"("userId", "isActive");

ALTER TABLE "health_insurances"
  ADD CONSTRAINT "health_insurances_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "health_insurances"
  ADD CONSTRAINT "health_insurances_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "user_hrms_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;