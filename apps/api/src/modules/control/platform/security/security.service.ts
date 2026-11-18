import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../database/prisma.service";
import { RedisService } from "../../../../redis/redis.service";
import { canonicalIp } from "./ip-address";
import type { SecurityEventsDto, SecurityPageDto } from "./security.dto";
import { SecurityIntegrationsService } from "./security-integrations.service";

const activeBlocks = (): Prisma.BlockedIpWhereInput => ({
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
});

@Injectable()
export class SecurityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly integrations: SecurityIntegrationsService,
  ) {}

  async overview() {
    const [activeThreats, blockedIps, totalUsers, mfaUsers, totalOrgs, enforced, optional, ssoOrgs] =
      await this.prisma.$transaction([
        this.prisma.securityEvent.count({ where: { resolvedAt: null } }),
        this.prisma.blockedIp.count({ where: activeBlocks() }),
        this.prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
        this.prisma.user.count({ where: { deletedAt: null, status: "ACTIVE", auth: { mfaEnabled: true } } }),
        this.prisma.organization.count({ where: { deletedAt: null } }),
        this.prisma.organization.count({ where: { deletedAt: null, settings: { mfaEnforced: true } } }),
        this.prisma.organization.count({
          where: {
            deletedAt: null,
            OR: [{ settings: null }, { settings: { mfaEnforced: false } }],
            members: {
              some: { deletedAt: null, status: "ACTIVE", user: { deletedAt: null, auth: { mfaEnabled: true } } },
            },
          },
        }),
        this.prisma.organizationOidc.count({ where: { enabled: true, organization: { deletedAt: null } } }),
      ]);
    return {
      activeThreats,
      blockedIps,
      mfaAdoption: totalUsers ? Math.round((mfaUsers / totalUsers) * 100) : 0,
      ssoOrgs,
      mfaStatus: { enforced, optional, none: totalOrgs - enforced - optional, total: totalOrgs },
    };
  }

  async events(query: SecurityEventsDto) {
    if (query.from && query.to && new Date(query.from) > new Date(query.to)) {
      throw new BadRequestException("Start date must not be after end date");
    }
    const where: Prisma.SecurityEventWhereInput = {
      ...(query.severity ? { severity: query.severity } : {}),
      ...(query.status ? { resolvedAt: query.status === "open" ? null : { not: null } } : {}),
      ...(query.ipAddress ? { ipAddress: canonicalIp(query.ipAddress) } : {}),
      ...(query.from || query.to
        ? {
            createdAt: {
              ...(query.from ? { gte: new Date(query.from) } : {}),
              ...(query.to ? { lte: new Date(query.to) } : {}),
            },
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.securityEvent.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.securityEvent.count({ where }),
    ]);
    return {
      items,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async blocked(query: SecurityPageDto) {
    const where = activeBlocks();
    const [items, total] = await this.prisma.$transaction([
      this.prisma.blockedIp.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { ipAddress: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        select: { ipAddress: true, createdAt: true, expiresAt: true, reason: true },
      }),
      this.prisma.blockedIp.count({ where }),
    ]);
    return {
      items,
      pagination: { page: query.page, limit: query.limit, total, totalPages: Math.ceil(total / query.limit) },
    };
  }

  async event(id: string) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id } });
    if (!event) {
      throw new NotFoundException("Security event not found");
    }
    const timeline = await this.prisma.auditLog.findMany({
      where: {
        OR: [
          { resourceType: "SecurityEvent", resourceId: id },
          ...(event.ipAddress
            ? [{ resourceType: "BlockedIp", resourceId: event.ipAddress, createdAt: { gte: event.createdAt } }]
            : []),
        ],
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 101,
      select: { id: true, action: true, createdAt: true, actorUserId: true, metadata: true },
    });
    return { event, timeline: timeline.slice(0, 100).reverse(), hasMoreTimeline: timeline.length > 100 };
  }

  async resolve(id: string, actorUserId: string) {
    return this.prisma.$transaction(async (tx) => {
      const event = await tx.securityEvent.findUnique({ where: { id } });
      if (!event) {
        throw new NotFoundException("Security event not found");
      }
      const result = await tx.securityEvent.updateMany({
        where: { id, resolvedAt: null },
        data: { resolvedAt: new Date(), resolvedById: actorUserId },
      });
      if (result.count) {
        await tx.auditLog.create({
          data: { action: "security.event.resolved", actorUserId, resourceType: "SecurityEvent", resourceId: id },
        });
      }
    });
  }

  async block(ip: string, actorUserId: string, callerIp: string, options: { reason: string; expiresAt?: string }) {
    const ipAddress = canonicalIp(ip);
    const reason = options.reason.trim();
    if (!reason || reason.length > 500) {
      throw new BadRequestException("A block reason of 1-500 characters is required");
    }
    const expiresAt = options.expiresAt ? new Date(options.expiresAt) : null;
    if (expiresAt && (!Number.isFinite(expiresAt.getTime()) || expiresAt <= new Date())) {
      throw new BadRequestException("Block expiry must be in the future");
    }
    if (canonicalIp(callerIp) === ipAddress) {
      throw new ConflictException("You cannot block your current IP address");
    }
    await this.prisma.$transaction(async (tx) => {
      await tx.blockedIp.upsert({
        where: { ipAddress },
        create: { ipAddress, createdById: actorUserId, reason, expiresAt },
        update: { createdById: actorUserId, createdAt: new Date(), reason, expiresAt },
      });
      await tx.auditLog.create({
        data: {
          action: "security.ip.blocked",
          actorUserId,
          resourceType: "BlockedIp",
          resourceId: ipAddress,
          metadata: { reason, expiresAt: expiresAt?.toISOString() ?? null },
        },
      });
    });
  }

  async unblock(ip: string, actorUserId: string) {
    const ipAddress = canonicalIp(ip);
    await this.prisma.$transaction(async (tx) => {
      await tx.blockedIp.deleteMany({ where: { ipAddress } });
      await tx.auditLog.create({
        data: { action: "security.ip.unblocked", actorUserId, resourceType: "BlockedIp", resourceId: ipAddress },
      });
    });
  }

  /** One event on the fifth rejected password login per IP in a fixed ten-minute window. Never stores credentials. */
  async failedLogin(ip: string) {
    const ipAddress = canonicalIp(ip);
    const count = await this.redis.incrementWithExpiry(`security:failed-login:${ipAddress}`, 600);
    if (count === 5) {
      await this.integrations.recordEvent({
        severity: "high",
        type: "Brute Force",
        description: "At least 5 rejected password login attempts from this IP within 10 minutes",
        ipAddress,
      });
    }
  }
}
