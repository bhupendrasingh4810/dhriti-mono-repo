import { HttpStatus, Injectable } from "@nestjs/common";

import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../audit/audit.service";
import { EntitlementService } from "./entitlement.service";

@Injectable()
export class OrganizationTeamService {
  constructor(private readonly prisma: PrismaService, private readonly audit: AuditService, private readonly entitlements: EntitlementService) {}

  list(organizationId: string) {
    return this.prisma.organizationTeam.findMany({ where: { organizationId, deletedAt: null }, include: { _count: { select: { members: true } } }, orderBy: { name: "asc" } });
  }

  async create(organizationId: string, actorUserId: string, input: { name: string; slug: string; description?: string }) {
    const [legacyTeamCount, organizationTeamCount] = await Promise.all([
      this.prisma.team.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.organizationTeam.count({ where: { organizationId, deletedAt: null } }),
    ]);
    await this.entitlements.assertWithinLimit(organizationId, "max_teams", legacyTeamCount + organizationTeamCount + 1);
    const team = await this.prisma.organizationTeam.create({ data: { organizationId, name: input.name.trim(), slug: input.slug, description: input.description?.trim() ?? null } }).catch(() => { throw new AppError(ErrorCode.TEAM_SLUG_TAKEN, "A team with this slug already exists", HttpStatus.CONFLICT); });
    await this.audit.record({ action: "iam.organization-team.created", organizationId, actorUserId, resourceType: "OrganizationTeam", resourceId: team.id });
    return team;
  }

  async update(organizationId: string, teamId: string, actorUserId: string, input: { name?: string; description?: string }) {
    await this.requireTeam(organizationId, teamId);
    const team = await this.prisma.organizationTeam.update({ where: { id: teamId }, data: { ...(input.name !== undefined ? { name: input.name.trim() } : {}), ...(input.description !== undefined ? { description: input.description.trim() } : {}) } });
    await this.audit.record({ action: "iam.organization-team.updated", organizationId, actorUserId, resourceType: "OrganizationTeam", resourceId: teamId });
    return team;
  }

  async delete(organizationId: string, teamId: string, actorUserId: string): Promise<void> {
    await this.requireTeam(organizationId, teamId);
    await this.prisma.organizationTeam.update({ where: { id: teamId }, data: { deletedAt: new Date() } });
    await this.audit.record({ action: "iam.organization-team.deleted", organizationId, actorUserId, resourceType: "OrganizationTeam", resourceId: teamId });
  }

  async addMember(organizationId: string, teamId: string, userId: string, actorUserId: string): Promise<void> {
    await this.requireTeam(organizationId, teamId);
    const member = await this.prisma.organizationMember.findFirst({ where: { organizationId, userId, deletedAt: null }, select: { id: true } });
    if (!member) throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User is not an active organization member", HttpStatus.BAD_REQUEST);
    await this.prisma.organizationTeamMember.upsert({ where: { teamId_userId: { teamId, userId } }, update: {}, create: { teamId, userId } });
    await this.audit.record({ action: "iam.organization-team.member-added", organizationId, actorUserId, resourceType: "OrganizationTeam", resourceId: teamId, metadata: { userId } });
  }

  async removeMember(organizationId: string, teamId: string, userId: string, actorUserId: string): Promise<void> {
    await this.requireTeam(organizationId, teamId);
    await this.prisma.organizationTeamMember.deleteMany({ where: { teamId, userId } });
    await this.audit.record({ action: "iam.organization-team.member-removed", organizationId, actorUserId, resourceType: "OrganizationTeam", resourceId: teamId, metadata: { userId } });
  }

  private async requireTeam(organizationId: string, teamId: string) {
    const team = await this.prisma.organizationTeam.findFirst({ where: { id: teamId, organizationId, deletedAt: null } });
    if (!team) throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.NOT_FOUND);
    return team;
  }
}