import { Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma.service";
import { SessionService } from "../../../auth/services/session.service";
import type { SecurityPageDto, SecuritySessionsDto } from "./security.dto";

@Injectable()
export class SecurityOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionService,
  ) {}

  async activeSessions(query: SecuritySessionsDto, currentSessionId: string) {
    const where: Prisma.UserSessionWhereInput = {
      revokedAt: null,
      rotatedAt: null,
      expiresAt: { gt: new Date() },
      ...(query.search
        ? {
            OR: [
              { user: { email: { contains: query.search, mode: "insensitive" } } },
              { ipAddress: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.userSession.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          id: true,
          organizationId: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
          expiresAt: true,
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.userSession.count({ where }),
    ]);
    return {
      items: items.map((item) => ({ ...item, current: item.id === currentSessionId })),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async revoke(id: string, actorUserId: string, reason: string) {
    const session = await this.prisma.userSession.findUnique({ where: { id }, select: { id: true } });
    if (!session) {
      throw new NotFoundException("Session not found");
    }
    // Persist an audit intent before revocation. The shared service also evicts Redis and disconnects live sockets.
    await this.prisma.auditLog.create({
      data: {
        action: "security.session.revoke_requested",
        actorUserId,
        resourceType: "UserSession",
        resourceId: id,
        metadata: { reason },
      },
    });
    await this.sessions.revokeSession(id, { rejectRotated: true });
    await this.prisma.auditLog.create({
      data: {
        action: "security.session.revoked",
        actorUserId,
        resourceType: "UserSession",
        resourceId: id,
        metadata: { reason },
      },
    });
  }

  async compliance(query: SecurityPageDto) {
    const where: Prisma.OrganizationWhereInput = { deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        select: {
          id: true,
          name: true,
          slug: true,
          settings: { select: { mfaEnforced: true } },
          oidc: { select: { enabled: true, lastVerifiedAt: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);
    const ids = rows.map((row) => row.id);
    const active: Prisma.OrganizationMemberWhereInput = {
      organizationId: { in: ids },
      status: "ACTIVE",
      deletedAt: null,
      user: { status: "ACTIVE", deletedAt: null },
    };
    const counts = this.prisma.organizationMember.groupBy({
      by: ["organizationId"],
      orderBy: { organizationId: "asc" },
      where: active,
      _count: { _all: true },
    });
    const mfaCounts = this.prisma.organizationMember.groupBy({
      by: ["organizationId"],
      orderBy: { organizationId: "asc" },
      where: { ...active, user: { status: "ACTIVE", deletedAt: null, auth: { mfaEnabled: true } } },
      _count: { _all: true },
    });
    const [members, protectedMembers] = await this.prisma.$transaction([counts, mfaCounts]);
    return {
      items: rows.map((row) => {
        const count = members.find((entry) => entry.organizationId === row.id)?._count._all ?? 0;
        const enabled = protectedMembers.find((entry) => entry.organizationId === row.id)?._count._all ?? 0;
        return {
          id: row.id,
          name: row.name,
          slug: row.slug,
          mfaEnforced: row.settings?.mfaEnforced ?? false,
          activeMembers: count,
          mfaEnabledMembers: enabled,
          mfaGap: Math.max(0, count - enabled),
          ssoStatus: !row.oidc
            ? "not_configured"
            : !row.oidc.enabled
              ? "disabled"
              : row.oidc.lastVerifiedAt
                ? "verified"
                : "configured",
          lastVerifiedAt: row.oidc?.lastVerifiedAt ?? null,
        };
      }),
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }
}
