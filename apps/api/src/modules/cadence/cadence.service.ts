import { HttpStatus, Injectable } from "@nestjs/common";
import type { CadenceCard, CadencePhase, CadenceSession } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import type { CreateCardDto, CreateSessionDto, GroupCardDto } from "./dto/cadence.dto";
import { AppSettingsService } from "../settings/app-settings.service";
import { resolveAppSettings, settingsPolicyError } from "../settings/settings.defaults";
import { enqueueNotification } from "../notification/notification-events";

export type SessionWithCards = CadenceSession & {
  cards: Array<CadenceCard & { _count: { votes: number } }>;
  _count: { cards: number };
};

@Injectable()
export class CadenceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly settings: AppSettingsService,
  ) {}

  // ---------------- Sessions ----------------

  async listSessions(organizationId: string): Promise<Array<CadenceSession & { _count: { cards: number } }>> {
    const { sessionListSize } = await resolveAppSettings(this.settings, "cadence", organizationId);
    return this.prisma.cadenceSession.findMany({
      where: { organizationId },
      include: { _count: { select: { cards: { where: { deletedAt: null } } } } },
      orderBy: { createdAt: "desc" },
      take: sessionListSize,
    });
  }

  async createSession(organizationId: string, facilitatorId: string, dto: CreateSessionDto): Promise<CadenceSession> {
    await this.assertOrganizationMember(organizationId, facilitatorId);
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: dto.teamId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!team) {
        throw new AppError(ErrorCode.TEAM_NOT_FOUND, "Team not found", HttpStatus.BAD_REQUEST);
      }
    }
    const policy = await resolveAppSettings(this.settings, "cadence", organizationId);
    const session = await this.prisma.$transaction(async (tx) => {
      const created = await tx.cadenceSession.create({
        data: {
          organizationId,
          teamId: dto.teamId ?? null,
          type: dto.type,
          title: dto.title.trim(),
          facilitatorId,
          isAnonymous: dto.isAnonymous ?? policy.anonymousFeedbackByDefault,
          phase: "COLLECT",
          startedAt: new Date(),
        },
      });
      if (created.teamId) {
        const members = await tx.teamMember.findMany({ where: { teamId: created.teamId }, select: { userId: true } });
        await enqueueNotification(tx, {
          organizationId,
          actorId: facilitatorId,
          sourceType: "cadence",
          sourceId: created.id,
          type: "CADENCE_INVITATION",
          recipientIds: members.map((member) => member.userId),
          title: "A retrospective session is ready",
          path: "cadence",
        });
      }
      return created;
    });

    await this.audit.record({
      action: "cadence.session.created",
      organizationId,
      actorUserId: facilitatorId,
      resourceType: "CadenceSession",
      resourceId: session.id,
    });
    return session;
  }

  async getSession(organizationId: string, sessionId: string, userId: string): Promise<SessionWithCards> {
    const session = await this.prisma.cadenceSession.findFirst({
      where: { id: sessionId, organizationId },
      include: {
        cards: {
          where: { deletedAt: null },
          orderBy: [{ column: "asc" }, { position: "asc" }, { createdAt: "asc" }],
          include: { _count: { select: { votes: true } } },
        },
        _count: { select: { cards: { where: { deletedAt: null } } } },
      },
    });
    if (!session) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, "Session not found", HttpStatus.NOT_FOUND);
    }

    // Anonymize card authors for non-facilitators during anonymous sessions.
    if (session.isAnonymous && session.facilitatorId !== userId) {
      session.cards = session.cards.map((card) => ({ ...card, authorId: "" }));
    }
    return session;
  }

  async setPhase(
    organizationId: string,
    sessionId: string,
    userId: string,
    phase: CadencePhase,
  ): Promise<CadenceSession> {
    const session = await this.getSessionRow(organizationId, sessionId);
    this.assertFacilitator(session, userId);

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.cadenceSession.update({
        where: { id: sessionId },
        data: {
          phase,
          ...(phase === "DONE" ? { endedAt: new Date() } : {}),
        },
      });
      if (phase === "DONE" && session.phase !== "DONE") {
        const authors = await tx.cadenceCard.findMany({
          where: { sessionId, deletedAt: null },
          select: { authorId: true },
        });
        await enqueueNotification(tx, {
          organizationId,
          actorId: userId,
          sourceType: "cadence",
          sourceId: sessionId,
          type: "CADENCE_RESULTS",
          recipientIds: [session.facilitatorId, ...authors.map((card) => card.authorId)],
          title: "A retrospective session has completed",
          path: "cadence",
        });
      }
      return result;
    });

    await this.audit.record({
      action: "cadence.session.phase-changed",
      organizationId,
      actorUserId: userId,
      resourceType: "CadenceSession",
      resourceId: sessionId,
      metadata: { phase },
    });
    return updated;
  }

  // ---------------- Cards ----------------

  async addCard(organizationId: string, sessionId: string, authorId: string, dto: CreateCardDto): Promise<CadenceCard> {
    const session = await this.getSessionRow(organizationId, sessionId);
    if (session.phase !== "COLLECT") {
      throw new AppError(
        ErrorCode.PHASE_LOCKED,
        "Cards can only be added during the collect phase",
        HttpStatus.BAD_REQUEST,
      );
    }
    const { maxCardContentLength } = await resolveAppSettings(this.settings, "cadence", organizationId);
    if (dto.content.length > maxCardContentLength) {
      throw settingsPolicyError(`Cards are limited to ${maxCardContentLength} characters`, HttpStatus.BAD_REQUEST);
    }

    const maxPosition = await this.prisma.cadenceCard.aggregate({
      where: { sessionId, column: dto.column, deletedAt: null },
      _max: { position: true },
    });

    return this.prisma.cadenceCard.create({
      data: {
        sessionId,
        authorId,
        content: dto.content,
        column: dto.column,
        position: (maxPosition._max.position ?? -1) + 1,
      },
    });
  }

  async groupCard(
    organizationId: string,
    sessionId: string,
    cardId: string,
    userId: string,
    dto: GroupCardDto,
  ): Promise<CadenceCard> {
    const session = await this.getSessionRow(organizationId, sessionId);
    this.assertFacilitator(session, userId);

    const card = await this.prisma.cadenceCard.findFirst({
      where: { id: cardId, sessionId, deletedAt: null },
    });
    if (!card) {
      throw new AppError(ErrorCode.CARD_NOT_FOUND, "Card not found", HttpStatus.NOT_FOUND);
    }

    return this.prisma.cadenceCard.update({
      where: { id: cardId },
      data: {
        groupId: dto.groupId ?? null,
        ...(dto.position !== undefined ? { position: dto.position } : {}),
      },
    });
  }

  async deleteCard(organizationId: string, sessionId: string, cardId: string, userId: string): Promise<void> {
    const session = await this.getSessionRow(organizationId, sessionId);
    const card = await this.prisma.cadenceCard.findFirst({
      where: { id: cardId, sessionId, deletedAt: null },
    });
    if (!card) {
      throw new AppError(ErrorCode.CARD_NOT_FOUND, "Card not found", HttpStatus.NOT_FOUND);
    }
    // Author or facilitator can delete.
    if (card.authorId !== userId && session.facilitatorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author or facilitator can delete a card", HttpStatus.FORBIDDEN);
    }
    await this.prisma.cadenceCard.update({ where: { id: cardId }, data: { deletedAt: new Date() } });
  }

  // ---------------- Voting ----------------

  async vote(organizationId: string, sessionId: string, cardId: string, userId: string): Promise<void> {
    const session = await this.getSessionRow(organizationId, sessionId);
    if (session.phase !== "VOTE") {
      throw new AppError(ErrorCode.PHASE_LOCKED, "Voting is only open during the vote phase", HttpStatus.BAD_REQUEST);
    }
    const card = await this.prisma.cadenceCard.findFirst({
      where: { id: cardId, sessionId, deletedAt: null },
      select: { id: true },
    });
    if (!card) {
      throw new AppError(ErrorCode.CARD_NOT_FOUND, "Card not found", HttpStatus.NOT_FOUND);
    }

    await this.prisma.cadenceVote.upsert({
      where: { cardId_userId: { cardId, userId } },
      create: { cardId, userId },
      update: {},
    });
  }

  async unvote(organizationId: string, sessionId: string, cardId: string, userId: string): Promise<void> {
    await this.getSessionRow(organizationId, sessionId);
    if (!(await resolveAppSettings(this.settings, "cadence", organizationId)).allowVoteChanges) {
      throw settingsPolicyError("Votes cannot be changed in this organization");
    }
    await this.prisma.cadenceVote.deleteMany({ where: { cardId, userId } });
  }

  // ---------------- Internals ----------------

  private async getSessionRow(organizationId: string, sessionId: string): Promise<CadenceSession> {
    const session = await this.prisma.cadenceSession.findFirst({
      where: { id: sessionId, organizationId },
    });
    if (!session) {
      throw new AppError(ErrorCode.SESSION_NOT_FOUND, "Session not found", HttpStatus.NOT_FOUND);
    }
    return session;
  }

  private async assertOrganizationMember(organizationId: string, userId: string): Promise<void> {
    const member = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!member) {
      throw new AppError(ErrorCode.MEMBER_NOT_FOUND, "User is not an active organization member", HttpStatus.FORBIDDEN);
    }
  }

  private assertFacilitator(session: CadenceSession, userId: string): void {
    if (session.facilitatorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the facilitator can do this", HttpStatus.FORBIDDEN);
    }
  }
}
