import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";

import { ACCESS_REQUIREMENTS_KEY, type AccessRequirements } from "../decorators/access.decorator";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";
import type { OrganizationContext } from "../decorators/organization.decorator";
import { EntitlementService } from "../../modules/authorization/entitlement.service";
import { PermissionService } from "../../modules/authorization/permission.service";
import { PrismaService } from "../../database/prisma.service";

interface AccessRequest extends Request {
  user?: AuthenticatedUser;
  organization?: OrganizationContext;
}

@Injectable()
export class AccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlement: EntitlementService,
    private readonly permissions: PermissionService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requirements = this.reflector.getAllAndOverride<AccessRequirements | undefined>(
      ACCESS_REQUIREMENTS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requirements) {
      return true;
    }
    const request = context.switchToHttp().getRequest<AccessRequest>();
    if (!request.user) {
      throw new UnauthorizedException();
    }
    if (!request.organization) {
      return false;
    }
    const { organizationId } = request.organization;
    if (requirements.entitlement) {
      await this.entitlement.assertFeatureEnabled(organizationId, requirements.entitlement);
    }
    if (requirements.permission) {
      const resource = await this.resolveResource(organizationId, request.params);
      await this.permissions.assertPermission({
        userId: request.user.userId,
        organizationId,
        permissionKey: requirements.permission,
        resource,
      });
    }
    return true;
  }

  private async resolveResource(
    organizationId: string,
    params: Record<string, string>,
  ): Promise<{ type: string; flowProjectId?: string } | undefined> {
    if (params.projectId) {
      return { type: "FLOW_PROJECT", flowProjectId: params.projectId };
    }
    if (params.issueId) {
      const issue = await this.prisma.issue.findFirst({
        where: { id: params.issueId, organizationId, deletedAt: null },
        select: { projectId: true },
      });
      return issue ? { type: "FLOW_PROJECT", flowProjectId: issue.projectId } : undefined;
    }
    if (params.boardId) {
      const board = await this.prisma.board.findFirst({
        where: { id: params.boardId, deletedAt: null, project: { organizationId, deletedAt: null } },
        select: { projectId: true },
      });
      return board ? { type: "FLOW_PROJECT", flowProjectId: board.projectId } : undefined;
    }
    return undefined;
  }
}