import { Injectable, Logger } from "@nestjs/common";
import type { AuditLog, Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";

export interface AuditEntry {
  action: string;
  organizationId?: string | null;
  actorUserId?: string | null;
  resourceType?: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Records an audit event. Never throws into the request path — audit failures
   * are logged and swallowed so a logging outage cannot break business flows.
   */
  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: entry.action,
          organizationId: entry.organizationId ?? null,
          actorUserId: entry.actorUserId ?? null,
          resourceType: entry.resourceType ?? null,
          resourceId: entry.resourceId ?? null,
          metadata: entry.metadata,
          ipAddress: entry.ipAddress ?? null,
          userAgent: entry.userAgent ?? null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to record audit action="${entry.action}"`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async listForOrganization(
    organizationId: string,
    options: { limit?: number; action?: string; resourceType?: string } = {},
  ): Promise<AuditLog[]> {
    return this.prisma.auditLog.findMany({
      where: {
        organizationId,
        ...(options.action ? { action: options.action } : {}),
        ...(options.resourceType ? { resourceType: options.resourceType } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: Math.min(options.limit ?? 100, 500),
    });
  }
}
