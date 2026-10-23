import { createHash, randomBytes } from "node:crypto";

import { HttpStatus, Injectable } from "@nestjs/common";
import { EmailService } from "../../notification/email.service";
import type { Invitation, OrganizationMember, User } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { ApiConfigService } from "../../../config/config.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { AuditService } from "../../audit/audit.service";
import { EntitlementService } from "../../authorization/services/entitlement.service";
import { AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { OrganizationContext } from "../../../common/decorators/organization.decorator";
import { assignDefaultUserPermissionGroups } from "./default-permission-groups";
import { assertUserHasNoOtherActiveOrganizationMembership } from "./organization-membership";

export interface MemberWithUser extends OrganizationMember {
  user: Pick<User, "id" | "email" | "name" | "avatarUrl" | "status" | "role">;
}

@Injectable()
export class InvitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly email: EmailService,
    private readonly config: ApiConfigService,
    private readonly entitlements: EntitlementService,
  ) {}

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
    organization: OrganizationContext,
    user: AuthenticatedUser,
    email: string,
  ): Promise<Invitation | null> {
    const [result] = await this.createInvitations(organization, user, [email]);
    return result ?? null;
  }

  async bulkInvitation(
    organization: OrganizationContext,
    user: AuthenticatedUser,
    emails: string[],
  ): Promise<Invitation[]> {
    return this.createInvitations(organization, user, emails);
  }

  private async createInvitations(
    organization: OrganizationContext,
    user: AuthenticatedUser,
    emails: string[],
  ): Promise<Invitation[]> {
    const normalizedEmails = [
      ...new Set(emails.map((email) => email.trim().toLowerCase()).filter((email) => email.length > 0)),
    ];
    if (normalizedEmails.length === 0) {
      return [];
    }

    const [users, pendingInvitations, organizationRecord, inviter] = await Promise.all([
      this.prisma.user.findMany({
        where: { email: { in: normalizedEmails } },
        select: {
          email: true,
          name: true,
          memberships: {
            where: { organizationId: organization.organizationId, deletedAt: null },
            select: { id: true },
          },
        },
      }),
      this.prisma.invitation.findMany({
        where: {
          organizationId: organization.organizationId,
          email: { in: normalizedEmails },
          status: "PENDING",
        },
        select: { email: true },
      }),
      this.prisma.organization.findUniqueOrThrow({
        where: { id: organization.organizationId },
        select: { name: true },
      }),
      this.prisma.user.findUniqueOrThrow({
        where: { id: user.userId },
        select: { name: true },
      }),
    ]);

    const membersByEmail = new Map(users.map((member) => [member.email, member]));
    const pendingEmails = new Set(pendingInvitations.map((invitation) => invitation.email));
    const eligibleEmails = normalizedEmails.filter(
      (email) => !membersByEmail.get(email)?.memberships.length && !pendingEmails.has(email),
    );
    const expiryDays = 7;
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const results: Invitation[] = [];

    for (const email of eligibleEmails) {
      const token = randomBytes(32).toString("base64url");
      const invitation = await this.prisma.invitation.create({
        data: {
          organizationId: organization.organizationId,
          email,
          invitedById: user.userId,
          tokenHash: createHash("sha256").update(token).digest("hex"),
          expiresAt,
        },
      });
      const recipientName = membersByEmail.get(email)?.name ?? email.split("@")[0];
      const invitationUrl = `${this.config.webAppUrl}/invitation/accept?token=${encodeURIComponent(token)}`;

      await this.email.sendInvitationEmail(
        [email],
        recipientName,
        email,
        inviter.name,
        organizationRecord.name,
        invitationUrl,
        expiryDays,
      );
      await this.audit.record({
        action: "iam.invitation.created",
        organizationId: organization.organizationId,
        actorUserId: user.userId,
        resourceType: "Invitation",
        resourceId: invitation.id,
        metadata: { email },
      });
      results.push(invitation);
    }

    return results;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation = await this.prisma.invitation.findUnique({
      where: { tokenHash: createHash("sha256").update(token).digest("hex") },
    });

    if (!invitation) {
      throw new AppError(ErrorCode.INVITATION_INVALID, "Invitation is invalid or already used", HttpStatus.BAD_REQUEST);
    }
    if (invitation.status === "ACCEPTED") {
      const existing = await this.prisma.organizationMember.findFirst({
        where: { organizationId: invitation.organizationId, userId, status: "ACTIVE", deletedAt: null },
        select: { id: true },
      });
      if (existing) {
        return;
      }
      throw new AppError(ErrorCode.INVITATION_INVALID, "Invitation has already been accepted", HttpStatus.BAD_REQUEST);
    }
    if (invitation.status !== "PENDING") {
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

    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId: invitation.organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!membership) {
      const memberCount = await this.prisma.organizationMember.count({
        where: { organizationId: invitation.organizationId, deletedAt: null },
      });
      await this.entitlements.assertWithinLimit(invitation.organizationId, "max_users", memberCount + 1);
    }

    const acceptedAt = new Date();
    await this.prisma.$transaction(async (transaction) => {
      await assertUserHasNoOtherActiveOrganizationMembership(transaction, userId, invitation.organizationId);
      const claim = await transaction.invitation.updateMany({
        where: { id: invitation.id, status: "PENDING", expiresAt: { gt: acceptedAt } },
        data: { status: "ACCEPTED", acceptedAt },
      });
      if (claim.count !== 1) {
        throw new AppError(
          ErrorCode.INVITATION_INVALID,
          "Invitation is invalid or already used",
          HttpStatus.BAD_REQUEST,
        );
      }
      await transaction.organizationMember.upsert({
        where: { organizationId_userId: { organizationId: invitation.organizationId, userId } },
        create: { organizationId: invitation.organizationId, userId, status: "ACTIVE", joinedAt: new Date() },
        update: { status: "ACTIVE", joinedAt: new Date(), suspendedAt: null, removedAt: null, deletedAt: null },
      });
      await assignDefaultUserPermissionGroups(transaction, invitation.organizationId, userId, userId);
    });

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
      throw new AppError(
        ErrorCode.INVITATION_INVALID,
        "Only pending invitations can be cancelled",
        HttpStatus.BAD_REQUEST,
      );
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
}
