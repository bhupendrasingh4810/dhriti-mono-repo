import { createHash, randomBytes } from "node:crypto";

import { HttpStatus, Injectable } from "@nestjs/common";
import type {
  Group,
  Invitation,
  Organization,
  OrganizationMember,
  OrganizationRole,
  Team,
  User,
} from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";

export interface MemberWithUser extends OrganizationMember {
  user: Pick<User, "id" | "email" | "name" | "avatarUrl" | "status">;
}

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Organizations ----------------

  async createOrganization(
    creatorUserId: string,
    input: { name: string; slug: string },
  ): Promise<Organization> {
    const slugTaken = await this.prisma.organization.findUnique({
      where: { slug: input.slug },
      select: { id: true },
    });
    if (slugTaken) {
      throw new AppError(
        ErrorCode.ORGANIZATION_SLUG_TAKEN,
        "This organization slug is already in use",
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.organization.create({
      data: {
        name: input.name.trim(),
        slug: input.slug,
        members: {
          create: { userId: creatorUserId, role: "OWNER" },
        },
      },
    });
  }

  async listMyOrganizations(userId: string): Promise<Array<Organization & { role: OrganizationRole }>> {
    const memberships = await this.prisma.organizationMember.findMany({
      where: { userId, organization: { deletedAt: null } },
      include: { organization: true },
      orderBy: { createdAt: "asc" },
    });

    return memberships.map((membership) => ({
      ...membership.organization,
      role: membership.role,
    }));
  }

  async getOrganization(organizationId: string): Promise<Organization> {
    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!organization || organization.deletedAt) {
      throw new AppError(
        ErrorCode.ORGANIZATION_NOT_FOUND,
        "Organization not found",
        HttpStatus.NOT_FOUND,
      );
    }
    return organization;
  }

  async updateOrganization(organizationId: string, name: string): Promise<Organization> {
    await this.getOrganization(organizationId);
    return this.prisma.organization.update({
      where: { id: organizationId },
      data: { name: name.trim() },
    });
  }

  // ---------------- Members ----------------

  async listMembers(organizationId: string): Promise<MemberWithUser[]> {
    return this.prisma.organizationMember.findMany({
      where: { organizationId, user: { deletedAt: null } },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async addMember(
    organizationId: string,
    email: string,
    role: OrganizationRole,
  ): Promise<MemberWithUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || user.deletedAt) {
      throw new AppError(
        ErrorCode.USER_NOT_FOUND,
        "No active user with this email; they must register first",
        HttpStatus.NOT_FOUND,
      );
    }

    const existing = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId: user.id } },
    });
    if (existing) {
      throw new AppError(
        ErrorCode.MEMBER_ALREADY_EXISTS,
        "This user is already a member of the organization",
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.organizationMember.create({
      data: { organizationId, userId: user.id, role },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true, status: true } },
      },
    });
  }

  async updateMemberRole(
    organizationId: string,
    memberId: string,
    role: OrganizationRole,
  ): Promise<MemberWithUser> {
    const member = await this.getMember(organizationId, memberId);

    if (member.role === "OWNER" && role !== "OWNER") {
      await this.assertAnotherOwnerExists(organizationId, member.id);
    }

    return this.prisma.organizationMember.update({
      where: { id: member.id },
      data: { role },
      include: {
        user: { select: { id: true, email: true, name: true, avatarUrl: true, status: true } },
      },
    });
  }

  async removeMember(organizationId: string, memberId: string): Promise<void> {
    const member = await this.getMember(organizationId, memberId);
    if (member.role === "OWNER") {
      await this.assertAnotherOwnerExists(organizationId, member.id);
    }

    await this.prisma.$transaction([
      this.prisma.teamMember.deleteMany({ where: { userId: member.userId, team: { organizationId } } }),
      this.prisma.organizationMember.delete({ where: { id: member.id } }),
    ]);
  }

  // ---------------- Teams ----------------

  async listTeams(organizationId: string): Promise<Array<Team & { memberCount: number }>> {
    const teams = await this.prisma.team.findMany({
      where: { organizationId, deletedAt: null },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "asc" },
    });

    return teams.map(({ _count, ...team }) => ({ ...team, memberCount: _count.members }));
  }

  async createTeam(
    organizationId: string,
    input: { name: string; slug: string; description?: string },
  ): Promise<Team> {
    const slugTaken = await this.prisma.team.findUnique({
      where: { organizationId_slug: { organizationId, slug: input.slug } },
      select: { id: true },
    });
    if (slugTaken) {
      throw new AppError(
        ErrorCode.TEAM_SLUG_TAKEN,
        "A team with this slug already exists in the organization",
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.team.create({
      data: {
        organizationId,
        name: input.name.trim(),
        slug: input.slug,
        description: input.description?.trim() ?? null,
      },
    });
  }

  async updateTeam(
    organizationId: string,
    teamId: string,
    input: { name?: string; description?: string },
  ): Promise<Team> {
    await this.getTeam(organizationId, teamId);
    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        ...(input.name !== undefined ? { name: input.name.trim() } : {}),
        ...(input.description !== undefined ? { description: input.description.trim() } : {}),
      },
    });
  }

  async deleteTeam(organizationId: string, teamId: string): Promise<void> {
    await this.getTeam(organizationId, teamId);
    await this.prisma.team.update({
      where: { id: teamId },
      data: { deletedAt: new Date() },
    });
  }

  async addTeamMember(organizationId: string, teamId: string, userId: string): Promise<void> {
    await this.getTeam(organizationId, teamId);
    const membership = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
    });
    if (!membership) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "User must be an organization member before joining a team",
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });
  }

  async removeTeamMember(organizationId: string, teamId: string, userId: string): Promise<void> {
    await this.getTeam(organizationId, teamId);
    await this.prisma.teamMember.deleteMany({ where: { teamId, userId } });
  }

  // ---------------- Invitations ----------------

  async listInvitations(organizationId: string): Promise<Invitation[]> {
    // Expire stale pending invitations lazily on read.
    await this.prisma.invitation.updateMany({
      where: { organizationId, status: "PENDING", expiresAt: { lt: new Date() } },
      data: { status: "EXPIRED" },
    });
    return this.prisma.invitation.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async createInvitation(
    organizationId: string,
    invitedById: string,
    email: string,
    role: OrganizationRole,
  ): Promise<{ invitation: Invitation; token: string }> {
    const normalizedEmail = email.toLowerCase();

    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      const alreadyMember = await this.prisma.organizationMember.findUnique({
        where: { organizationId_userId: { organizationId, userId: existingUser.id } },
      });
      if (alreadyMember) {
        throw new AppError(
          ErrorCode.MEMBER_ALREADY_EXISTS,
          "This user is already a member of the organization",
          HttpStatus.CONFLICT,
        );
      }
    }

    const existing = await this.prisma.invitation.findFirst({
      where: { organizationId, email: normalizedEmail, status: "PENDING" },
    });
    if (existing) {
      throw new AppError(
        ErrorCode.INVITATION_EXISTS,
        "A pending invitation already exists for this email",
        HttpStatus.CONFLICT,
      );
    }

    const token = randomBytes(32).toString("base64url");
    const invitation = await this.prisma.invitation.create({
      data: {
        organizationId,
        email: normalizedEmail,
        role,
        invitedById,
        tokenHash: createHash("sha256").update(token).digest("hex"),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    await this.audit.record({
      action: "iam.invitation.created",
      organizationId,
      actorUserId: invitedById,
      resourceType: "Invitation",
      resourceId: invitation.id,
      metadata: { email: normalizedEmail, role },
    });
    return { invitation, token };
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    });

    if (!invitation || invitation.status !== "PENDING") {
      throw new AppError(ErrorCode.INVITATION_INVALID, "Invitation is invalid or already used", HttpStatus.BAD_REQUEST);
    }
    if (invitation.expiresAt <= new Date()) {
      await this.prisma.invitation.update({ where: { id: invitation.id }, data: { status: "EXPIRED" } });
      throw new AppError(ErrorCode.INVITATION_EXPIRED, "Invitation has expired", HttpStatus.BAD_REQUEST);
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.email.toLowerCase() !== invitation.email) {
      throw new AppError(ErrorCode.FORBIDDEN, "This invitation was sent to a different email", HttpStatus.FORBIDDEN);
    }

    await this.prisma.$transaction([
      this.prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
      this.prisma.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: invitation.organizationId, userId } },
        create: { organizationId: invitation.organizationId, userId, role: invitation.role },
        update: { role: invitation.role },
      }),
    ]);

    await this.audit.record({
      action: "iam.invitation.accepted",
      organizationId: invitation.organizationId,
      actorUserId: userId,
      resourceType: "Invitation",
      resourceId: invitation.id,
    });
  }

  async cancelInvitation(organizationId: string, invitationId: string, actorUserId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findFirst({
      where: { id: invitationId, organizationId },
    });
    if (!invitation) {
      throw new AppError(ErrorCode.INVITATION_NOT_FOUND, "Invitation not found", HttpStatus.NOT_FOUND);
    }
    if (invitation.status !== "PENDING") {
      throw new AppError(ErrorCode.INVITATION_INVALID, "Only pending invitations can be cancelled", HttpStatus.BAD_REQUEST);
    }

    await this.prisma.invitation.update({
      where: { id: invitationId },
      data: { status: "CANCELLED" },
    });

    await this.audit.record({
      action: "iam.invitation.cancelled",
      organizationId,
      actorUserId,
      resourceType: "Invitation",
      resourceId: invitationId,
    });
  }

  // ---------------- Groups ----------------

  async listGroups(organizationId: string): Promise<Array<Group & { memberCount: number }>> {
    const groups = await this.prisma.group.findMany({
      where: { organizationId, deletedAt: null },
      include: { _count: { select: { members: true } } },
      orderBy: { createdAt: "asc" },
    });
    return groups.map(({ _count, ...group }) => ({ ...group, memberCount: _count.members }));
  }

  async createGroup(
    organizationId: string,
    userId: string,
    dto: { name: string; description?: string; rule?: { field: string; op: "eq" | "in"; value: unknown } },
  ): Promise<Group> {
    const nameTaken = await this.prisma.group.findUnique({
      where: { organizationId_name: { organizationId, name: dto.name.trim() } },
      select: { id: true },
    });
    if (nameTaken) {
      throw new AppError(ErrorCode.GROUP_NAME_TAKEN, "A group with this name already exists", HttpStatus.CONFLICT);
    }

    const group = await this.prisma.group.create({
      data: {
        organizationId,
        name: dto.name.trim(),
        description: dto.description ?? null,
        rule: dto.rule === undefined ? undefined : (dto.rule as never),
      },
    });

    await this.audit.record({
      action: "iam.group.created",
      organizationId,
      actorUserId: userId,
      resourceType: "Group",
      resourceId: group.id,
    });
    return group;
  }

  async updateGroup(
    organizationId: string,
    groupId: string,
    userId: string,
    dto: { name?: string; description?: string },
  ): Promise<Group> {
    await this.getGroup(organizationId, groupId);
    return this.prisma.group.update({
      where: { id: groupId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });
  }

  async deleteGroup(organizationId: string, groupId: string, userId: string): Promise<void> {
    await this.getGroup(organizationId, groupId);
    await this.prisma.group.update({ where: { id: groupId }, data: { deletedAt: new Date() } });

    await this.audit.record({
      action: "iam.group.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "Group",
      resourceId: groupId,
    });
  }

  async addGroupMember(organizationId: string, groupId: string, userId: string): Promise<void> {
    await this.getGroup(organizationId, groupId);
    await this.assertMember(organizationId, userId);
    await this.prisma.groupMember.upsert({
      where: { groupId_userId: { groupId, userId } },
      create: { groupId, userId },
      update: {},
    });
  }

  async removeGroupMember(organizationId: string, groupId: string, userId: string): Promise<void> {
    await this.getGroup(organizationId, groupId);
    await this.prisma.groupMember.deleteMany({ where: { groupId, userId } });
  }

  /**
   * Evaluates a dynamic group's rule and syncs membership to the matching org
   * members. Rule shape: { field: "role" | "teamId", op: "eq" | "in", value }.
   */
  async syncDynamicGroup(organizationId: string, groupId: string, actorUserId: string): Promise<{ added: number; removed: number }> {
    const group = await this.getGroup(organizationId, groupId);
    if (!group.rule) {
      throw new AppError(ErrorCode.GROUP_NOT_DYNAMIC, "This group is manual and has no rule", HttpStatus.BAD_REQUEST);
    }

    const rule = group.rule as { field: string; op: "eq" | "in"; value: unknown };
    const matchingUserIds = await this.evaluateRule(organizationId, rule);

    const current = await this.prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    const currentIds = new Set(current.map((member) => member.userId));
    const targetIds = new Set(matchingUserIds);

    const toAdd = [...targetIds].filter((id) => !currentIds.has(id));
    const toRemove = [...currentIds].filter((id) => !targetIds.has(id));

    await this.prisma.$transaction([
      ...(toAdd.length > 0
        ? [this.prisma.groupMember.createMany({
            data: toAdd.map((userId) => ({ groupId, userId })),
            skipDuplicates: true,
          })]
        : []),
      ...(toRemove.length > 0
        ? [this.prisma.groupMember.deleteMany({ where: { groupId, userId: { in: toRemove } } })]
        : []),
    ]);

    await this.audit.record({
      action: "iam.group.synced",
      organizationId,
      actorUserId,
      resourceType: "Group",
      resourceId: groupId,
      metadata: { added: toAdd.length, removed: toRemove.length },
    });
    return { added: toAdd.length, removed: toRemove.length };
  }

  // ---------------- Internals ----------------

  private async getMember(organizationId: string, memberId: string): Promise<OrganizationMember> {
    const member = await this.prisma.organizationMember.findFirst({
      where: { id: memberId, organizationId },
    });
    if (!member) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "Member not found", HttpStatus.NOT_FOUND);
    }
    return member;
  }

  private async getTeam(organizationId: string, teamId: string): Promise<Team> {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId, deletedAt: null },
    });
    if (!team) {
      throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.NOT_FOUND);
    }
    return team;
  }

  private async getGroup(organizationId: string, groupId: string): Promise<Group> {
    const group = await this.prisma.group.findFirst({
      where: { id: groupId, organizationId, deletedAt: null },
    });
    if (!group) {
      throw new AppError(ErrorCode.GROUP_NOT_FOUND, "Group not found", HttpStatus.NOT_FOUND);
    }
    return group;
  }

  /** Resolves a dynamic group rule to the matching org member user ids. */
  private async evaluateRule(
    organizationId: string,
    rule: { field: string; op: "eq" | "in"; value: unknown },
  ): Promise<string[]> {
    const values = Array.isArray(rule.value) ? rule.value : [rule.value];

    if (rule.field === "role") {
      const members = await this.prisma.organizationMember.findMany({
        where: {
          organizationId,
          role: rule.op === "in" ? { in: values as never } : (rule.value as never),
        },
        select: { userId: true },
      });
      return members.map((member) => member.userId);
    }

    if (rule.field === "teamId") {
      const members = await this.prisma.teamMember.findMany({
        where: {
          teamId: rule.op === "in" ? { in: values as string[] } : (rule.value as string),
          team: { organizationId, deletedAt: null },
        },
        select: { userId: true },
      });
      return members.map((member) => member.userId);
    }

    throw new AppError(
      ErrorCode.GROUP_RULE_INVALID,
      `Unsupported group rule field "${rule.field}"`,
      HttpStatus.BAD_REQUEST,
    );
  }

  private async assertMember(organizationId: string, userId: string): Promise<void> {
    const member = await this.prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId, userId } },
      select: { id: true },
    });
    if (!member) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User must be an organization member", HttpStatus.BAD_REQUEST);
    }
  }

  private async assertAnotherOwnerExists(
    organizationId: string,
    excludeMemberId: string,
  ): Promise<void> {
    const owners = await this.prisma.organizationMember.count({
      where: { organizationId, role: "OWNER", id: { not: excludeMemberId } },
    });
    if (owners === 0) {
      throw new AppError(
        ErrorCode.LAST_OWNER,
        "The organization must keep at least one owner",
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
