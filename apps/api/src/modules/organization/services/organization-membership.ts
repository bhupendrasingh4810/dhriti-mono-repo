import { HttpStatus } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import type { PrismaService } from "../../../database/prisma.service";

type MembershipClient = Prisma.TransactionClient | PrismaService;

export async function assertUserHasNoOtherActiveOrganizationMembership(
  client: MembershipClient,
  userId: string,
  organizationId?: string,
): Promise<void> {
  const membership = await client.organizationMember.findFirst({
    where: {
      userId,
      ...(organizationId ? { organizationId: { not: organizationId } } : {}),
      deletedAt: null,
      status: { in: ["INVITED", "ACTIVE", "SUSPENDED"] },
      organization: { deletedAt: null },
    },
    select: { organizationId: true },
  });
  if (membership) {
    throw new AppError(
      ErrorCode.USER_ALREADY_BELONGS_TO_ORGANIZATION,
      "A user can belong to only one organization",
      HttpStatus.CONFLICT,
    );
  }
}
