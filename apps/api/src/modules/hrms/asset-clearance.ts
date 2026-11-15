import { createHash } from "node:crypto";
import { HttpStatus } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";

/** Revisions bind an override to the exact outstanding custody, including unreturned accessories. */
export async function assetClearance(db: Prisma.TransactionClient, organizationId: string, employeeId: string) {
  const outstanding = await db.hrmsAsset.findMany({
    where: { organizationId, assignedEmployeeId: employeeId, archivedAt: null },
    select: { id: true, assetTag: true, name: true, status: true, expectedReturnDate: true, revision: true },
    orderBy: { id: "asc" },
  });
  const fingerprint = createHash("sha256")
    .update(JSON.stringify(outstanding.map(({ id, revision }) => ({ id, revision }))))
    .digest("hex");
  const override = outstanding.length
    ? await db.hrmsAssetClearanceOverride.findFirst({
        where: { organizationId, employeeId, fingerprint },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: { actorUserId: true, reason: true, createdAt: true },
      })
    : null;
  return {
    clear: !outstanding.length || !!override,
    outstanding,
    override,
    fingerprint,
    scope: "ASSETS_ONLY" as const,
  };
}

export async function assertAssetClearance(db: Prisma.TransactionClient, organizationId: string, employeeId: string) {
  if (!(await assetClearance(db, organizationId, employeeId)).clear) {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      "Outstanding assets block offboarding. Verify returns or ask HR/Admin to record an asset-clearance override.",
      HttpStatus.CONFLICT,
    );
  }
}
