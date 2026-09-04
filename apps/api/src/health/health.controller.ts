import { Controller, Get, HttpCode, HttpStatus, ServiceUnavailableException } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";

import { PrismaService } from "../database/prisma.service";
import { RedisService } from "../redis/redis.service";
import { Public } from "../common/decorators/public.decorator";

export interface HealthReport {
  status: "ok" | "error";
  timestamp: string;
  checks: {
    database: "up" | "down";
    redis: "up" | "down";
  };
  uptimeSeconds: number;
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get("live")
  @ApiOperation({ summary: "Liveness probe (process is up)" })
  liveness(): { status: "ok" } {
    return { status: "ok" };
  }

  @Public()
  @Get("ready")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Readiness probe (database + redis reachable)" })
  async readiness(): Promise<HealthReport> {
    const [database, redis] = await Promise.all([this.checkDatabase(), this.checkRedis()]);
    const report: HealthReport = {
      status: database === "up" && redis === "up" ? "ok" : "error",
      timestamp: new Date().toISOString(),
      checks: { database, redis },
      uptimeSeconds: Math.floor(process.uptime()),
    };

    if (report.status === "error") {
      throw new ServiceUnavailableException(report);
    }
    return report;
  }

  private async checkDatabase(): Promise<"up" | "down"> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "up";
    } catch {
      return "down";
    }
  }

  private async checkRedis(): Promise<"up" | "down"> {
    try {
      const result = await this.redis.raw.ping();
      return result === "PONG" ? "up" : "down";
    } catch {
      return "down";
    }
  }
}
