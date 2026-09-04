import { HttpStatus, Injectable } from "@nestjs/common";
import type { FeatureFlag, OrganizationSettings, ProductEntitlement, Subscription } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { AuditService } from "../../audit/audit.service";
import type {
  UpdateOrgEntitlementDto,
  UpdateOrgSettingsDto,
  UpsertOrgFeatureFlagDto,
} from "./dto/organization.dto";

export interface OrgDashboard {
  members: { total: number; active: number; owners: number; admins: number };
  teams: number;
  products: { enabled: number; total: number };
  subscription: Subscription | null;
  storage: { files: number; bytes: number };
  messages: number;
  issues: number;
  pages: number;
}

@Injectable()
export class OrganizationAdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Dashboard ----------------

  async dashboard(organizationId: string): Promise<OrgDashboard> {
    const [
      members,
      owners,
      admins,
      teams,
      entitlements,
      products,
      subscription,
      filesAgg,
      messages,
      issues,
      pages,
    ] = await Promise.all([
      this.prisma.organizationMember.count({ where: { organizationId } }),
      this.prisma.organizationMember.count({ where: { organizationId, role: "OWNER" } }),
      this.prisma.organizationMember.count({ where: { organizationId, role: "ADMIN" } }),
      this.prisma.team.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.productEntitlement.count({ where: { organizationId, isEnabled: true } }),
      this.prisma.product.count({ where: { isActive: true } }),
      this.prisma.subscription.findUnique({ where: { organizationId } }),
      this.prisma.storedFile.aggregate({
        where: { organizationId, deletedAt: null },
        _count: true,
        _sum: { sizeBytes: true },
      }),
      this.prisma.message.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.issue.count({ where: { organizationId, deletedAt: null } }),
      this.prisma.atlasPage.count({ where: { organizationId, deletedAt: null } }),
    ]);

    return {
      members: { total: members, active: members, owners, admins },
      teams,
      products: { enabled: entitlements, total: products },
      subscription,
      storage: { files: filesAgg._count, bytes: filesAgg._sum.sizeBytes ?? 0 },
      messages,
      issues,
      pages,
    };
  }

  // ---------------- Settings ----------------

  async getSettings(organizationId: string): Promise<OrganizationSettings> {
    return this.ensureSettings(organizationId);
  }

  async updateSettings(
    organizationId: string,
    actorUserId: string,
    dto: UpdateOrgSettingsDto,
  ): Promise<OrganizationSettings> {
    const settings = await this.prisma.organizationSettings.upsert({
      where: { organizationId },
      create: {
        organizationId,
        domain: dto.domain ?? null,
        brandingLogoUrl: dto.brandingLogoUrl ?? null,
        timezone: dto.timezone ?? "UTC",
        locale: dto.locale ?? "en",
        mfaEnforced: dto.mfaEnforced ?? false,
        passwordMinLength: dto.passwordMinLength ?? 10,
        sessionTimeoutMinutes: dto.sessionTimeoutMinutes ?? 10080,
        dataRetentionDays: dto.dataRetentionDays ?? null,
      },
      update: {
        ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
        ...(dto.brandingLogoUrl !== undefined ? { brandingLogoUrl: dto.brandingLogoUrl } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
        ...(dto.locale !== undefined ? { locale: dto.locale } : {}),
        ...(dto.mfaEnforced !== undefined ? { mfaEnforced: dto.mfaEnforced } : {}),
        ...(dto.passwordMinLength !== undefined ? { passwordMinLength: dto.passwordMinLength } : {}),
        ...(dto.sessionTimeoutMinutes !== undefined ? { sessionTimeoutMinutes: dto.sessionTimeoutMinutes } : {}),
        ...(dto.dataRetentionDays !== undefined ? { dataRetentionDays: dto.dataRetentionDays } : {}),
      },
    });

    await this.audit.record({
      action: "control.org.settings-updated",
      organizationId,
      actorUserId,
      resourceType: "OrganizationSettings",
      resourceId: settings.id,
    });
    return settings;
  }

  // ---------------- Entitlements (app access) ----------------

  async listEntitlements(organizationId: string): Promise<ProductEntitlement[]> {
    return this.prisma.productEntitlement.findMany({
      where: { organizationId },
      include: { product: { select: { key: true, name: true, isActive: true } } },
    });
  }

  async setEntitlement(
    organizationId: string,
    actorUserId: string,
    dto: UpdateOrgEntitlementDto,
  ): Promise<ProductEntitlement> {
    const product = await this.prisma.product.findUnique({ where: { key: dto.productKey } });
    if (!product) {
      throw new AppError(ErrorCode.PRODUCT_NOT_FOUND, `Unknown product "${dto.productKey}"`, HttpStatus.NOT_FOUND);
    }

    const entitlement = await this.prisma.productEntitlement.upsert({
      where: { organizationId_productId: { organizationId, productId: product.id } },
      create: { organizationId, productId: product.id, isEnabled: dto.isEnabled },
      update: { isEnabled: dto.isEnabled },
    });

    await this.audit.record({
      action: "control.org.entitlement-changed",
      organizationId,
      actorUserId,
      resourceType: "ProductEntitlement",
      resourceId: entitlement.id,
      metadata: { productKey: dto.productKey, isEnabled: dto.isEnabled },
    });
    return entitlement;
  }

  // ---------------- Feature flags ----------------

  async listFeatureFlags(organizationId: string): Promise<FeatureFlag[]> {
    return this.prisma.featureFlag.findMany({
      where: { organizationId },
      orderBy: { key: "asc" },
    });
  }

  async upsertFeatureFlag(
    organizationId: string,
    actorUserId: string,
    dto: UpsertOrgFeatureFlagDto,
  ): Promise<FeatureFlag> {
    const flag = await this.prisma.featureFlag.upsert({
      where: { organizationId_key: { organizationId, key: dto.key } },
      create: { organizationId, key: dto.key, isEnabled: dto.isEnabled },
      update: { isEnabled: dto.isEnabled },
    });

    await this.audit.record({
      action: "control.org.feature-flag-changed",
      organizationId,
      actorUserId,
      resourceType: "FeatureFlag",
      resourceId: flag.id,
      metadata: { key: dto.key, isEnabled: dto.isEnabled },
    });
    return flag;
  }

  // ---------------- Subscription ----------------

  async getSubscription(organizationId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { organizationId } });
  }

  // ---------------- Audit export ----------------

  async exportAuditLogs(organizationId: string, limit = 1000): Promise<string> {
    const logs = await this.prisma.auditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 5000),
    });

    const header = "id,createdAt,actorUserId,action,resourceType,resourceId,ipAddress\n";
    const rows = logs
      .map((log) =>
        [
          log.id,
          log.createdAt.toISOString(),
          log.actorUserId ?? "",
          log.action,
          log.resourceType ?? "",
          log.resourceId ?? "",
          log.ipAddress ?? "",
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(","),
      )
      .join("\n");

    await this.audit.record({
      action: "control.org.audit-exported",
      organizationId,
      resourceType: "AuditLog",
      metadata: { count: logs.length },
    });
    return header + rows;
  }

  // ---------------- Internals ----------------

  private async ensureSettings(organizationId: string): Promise<OrganizationSettings> {
    return this.prisma.organizationSettings.upsert({
      where: { organizationId },
      create: { organizationId },
      update: {},
    });
  }
}
