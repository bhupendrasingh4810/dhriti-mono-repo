import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import type { AnalyticsQueryDto, TrackEventDto } from "./dto/analytics.dto";

export interface UsageByApp {
  app: string;
  count: number;
}

export interface DailyActivity {
  date: string;
  count: number;
}

export interface EngagementMetrics {
  dau: number;
  wau: number;
  mau: number;
}

export interface TeamVelocity {
  issuesCompleted: number;
  issuesCreated: number;
  avgCycleHours: number | null;
}

export interface AnalyticsOverview {
  usageByApp: UsageByApp[];
  dailyActivity: DailyActivity[];
  engagement: EngagementMetrics;
  velocity: TeamVelocity;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(organizationId: string, userId: string | null, dto: TrackEventDto): Promise<void> {
    await this.prisma.usageEvent.create({
      data: {
        organizationId,
        userId,
        event: dto.event,
        app: dto.app,
        metadata: dto.metadata as never,
      },
    });
  }

  async overview(organizationId: string, query: AnalyticsQueryDto): Promise<AnalyticsOverview> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    if (to <= from) {
      throw new AppError(ErrorCode.INVALID_RANGE, "`to` must be after `from`", HttpStatus.BAD_REQUEST);
    }

    const [usageByApp, engagement, velocity] = await Promise.all([
      this.usageByApp(organizationId, from, to, query.app),
      this.engagement(organizationId),
      this.teamVelocity(organizationId, from, to),
    ]);

    return {
      usageByApp,
      dailyActivity: await this.dailyActivity(organizationId, from, to, query.app),
      engagement,
      velocity,
    };
  }

  async usageByApp(organizationId: string, from: Date, to: Date, app?: string): Promise<UsageByApp[]> {
    const rows = await this.prisma.usageEvent.groupBy({
      by: ["app"],
      where: {
        organizationId,
        createdAt: { gte: from, lt: to },
        ...(app ? { app } : {}),
      },
      _count: true,
      orderBy: { _count: { app: "desc" } },
    });
    return rows.map((row) => ({ app: row.app, count: row._count }));
  }

  async dailyActivity(organizationId: string, from: Date, to: Date, app?: string): Promise<DailyActivity[]> {
    const rows = await this.prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
      SELECT to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') AS date, COUNT(*)::bigint AS count
      FROM "usage_events"
      WHERE "organizationId" = ${organizationId}::uuid
        AND "createdAt" >= ${from}
        AND "createdAt" < ${to}
        ${app ? Prisma.sql`AND app = ${app}` : Prisma.empty}
      GROUP BY 1
      ORDER BY 1
    `;
    return rows.map((row) => ({ date: row.date, count: Number(row.count) }));
  }

  /** DAU / WAU / MAU from distinct users seen in usage events. */
  async engagement(organizationId: string): Promise<EngagementMetrics> {
    const now = new Date();
    const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [dau, wau, mau] = await Promise.all([
      this.distinctUsers(organizationId, day),
      this.distinctUsers(organizationId, week),
      this.distinctUsers(organizationId, month),
    ]);
    return { dau, wau, mau };
  }

  /** Flow team velocity for the range: issues created/completed and avg cycle time. */
  async teamVelocity(organizationId: string, from: Date, to: Date): Promise<TeamVelocity> {
    const issuesCreated = await this.prisma.issue.count({
      where: { organizationId, createdAt: { gte: from, lt: to }, deletedAt: null },
    });

    const completed = await this.prisma.issue.findMany({
      where: {
        organizationId,
        status: "DONE",
        updatedAt: { gte: from, lt: to },
        deletedAt: null,
      },
      select: { createdAt: true, updatedAt: true },
    });

    let avgCycleHours: number | null = null;
    if (completed.length > 0) {
      const totalMs = completed.reduce(
        (sum, issue) => sum + (issue.updatedAt.getTime() - issue.createdAt.getTime()),
        0,
      );
      avgCycleHours = Math.round((totalMs / completed.length / (1000 * 60 * 60)) * 10) / 10;
    }

    return { issuesCreated, issuesCompleted: completed.length, avgCycleHours };
  }

  // ---------------- Internals ----------------

  private async distinctUsers(organizationId: string, since: Date): Promise<number> {
    const rows = await this.prisma.usageEvent.findMany({
      where: { organizationId, createdAt: { gte: since }, userId: { not: null } },
      select: { userId: true },
      distinct: ["userId"],
    });
    return rows.length;
  }
}
