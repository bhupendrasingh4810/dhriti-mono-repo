import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../database/prisma.service";
import type { AuthenticatedUser } from "../../../../common/decorators/current-user.decorator";

/** Security operations require administrator or security staff, not merely the platform-user flag. */
@Injectable()
export class SecurityAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext) {
    const { user } = context.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!user) {
      throw new ForbiddenException("Authentication required");
    }
    const record = await this.prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        isPlatformUser: true,
        role: true,
        deletedAt: true,
        status: true,
        auth: { select: { platformRole: true } },
        platformRoleAssignments: {
          where: { revokedAt: null, platformRole: { key: { in: ["platform_admin", "security"] } } },
          take: 1,
        },
      },
    });
    if (
      !record?.isPlatformUser ||
      record.deletedAt ||
      record.status !== "ACTIVE" ||
      !(
        record.role === "PLATFORM_ADMIN" ||
        ["PLATFORM_ADMIN", "SECURITY"].includes(record.auth?.platformRole ?? "") ||
        record.platformRoleAssignments.length
      )
    ) {
      throw new ForbiddenException("Platform administrator or security role required");
    }
    return true;
  }
}
