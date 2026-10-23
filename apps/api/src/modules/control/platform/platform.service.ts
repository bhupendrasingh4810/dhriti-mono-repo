import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma, Product, Subscription, SupportTicket, SupportTicketStatus } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { MetricsService, type MetricsSnapshot } from "../../../common/metrics/metrics.service";
import { RedisService } from "../../../redis/redis.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { AuditService } from "../../audit/audit.service";
import { assertUserHasNoOtherActiveOrganizationMembership } from "../../organization/services/organization-membership";
import type {
  CreateEntitlementDto,
  ListPlatformOrganizationsQueryDto,
  ListEntitlementsQueryDto,
  CreatePlanDto,
  CreateProductDto,
  CreatePlatformOrganizationDto,
  CreateTicketDto,
  UpdateProductDto,
  UpdateEntitlementDefinitionDto,
  UpdateSubscriptionDto,
  UpdateTicketDto,
} from "./dto/platform.dto";

export interface PlatformDashboard {
  organizations: { total: number; active: number; suspended: number };
  users: { total: number; active: number; mfaEnabled: number };
  subscriptions: { trialing: number; active: number; pastDue: number; cancelled: number };
  products: { total: number; active: number };
  support: { open: number; escalated: number };
  metrics: {
    totalOrganizations: number;
    activeUsers: number;
    monthlyRecurringRevenueMinor: number;
    uptimePercent: number | null;
    observedSince: string;
  };
  recentOrganizations: Array<{
    id: string;
    name: string;
    plan: string;
    seats: number;
    status: string;
  }>;
  alerts: Array<{
    severity: "critical" | "warning" | "info";
    message: string;
    observedAt: string;
    source: "http" | "redis" | "database" | "organization";
  }>;
  topOrganizationsByUsage: Array<{ id: string; name: string; usage: number; percentage: number }>;
  monitoring: MetricsSnapshot & { dependencies: { database: "up" | "down"; redis: "up" | "down" } };
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly metrics: MetricsService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Dashboard ----------------

  /**
   * Retrieves the platform dashboard data, including statistics for organizations, users, subscriptions, products, and support tickets.
   * @returns The platform dashboard data.
   * @throws Error if there is an issue retrieving the dashboard data.
   */
  async dashboard(): Promise<PlatformDashboard> {
    const [
      totalOrgs,
      suspendedOrgs,
      totalUsers,
      activeUsers,
      mfaUsers,
      subs,
      products,
      openTickets,
      escalatedTickets,
      recentOrganizations,
      revenueSubscriptions,
      usageByOrganization,
      database,
      redis,
    ] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.subscription.count({ where: { organization: { deletedAt: null }, status: "SUSPENDED" } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      this.prisma.userAuth.count({ where: { mfaEnabled: true, user: { deletedAt: null } } }),
      this.prisma.subscription.groupBy({ by: ["status"], _count: true }),
      this.prisma.product.count(),
      this.prisma.supportTicket.count({ where: { status: "OPEN" } }),
      this.prisma.supportTicket.count({ where: { status: "ESCALATED" } }),
      this.prisma.organization.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          name: true,
          seats: true,
          _count: { select: { members: true } },
          subscription: { select: { plan: true, status: true, seats: true } },
        },
      }),
      this.prisma.subscription.findMany({
        where: { status: { in: ["ACTIVE", "TRIALING", "PAST_DUE"] } },
        select: {
          seats: true,
          planRecord: {
            select: { prices: { where: { interval: "MONTH", isActive: true }, select: { amountMinor: true } } },
          },
        },
      }),
      this.prisma.message.groupBy({
        by: ["organizationId"],
        where: { deletedAt: null, createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 5,
      }),
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const subCounts = Object.fromEntries(subs.map((row) => [row.status, row._count]));
    const metrics = this.metrics.snapshot();
    const usageOrganizationIds = usageByOrganization.map((entry) => entry.organizationId);
    const usageOrganizations = await this.prisma.organization.findMany({
      where: { id: { in: usageOrganizationIds }, deletedAt: null },
      select: { id: true, name: true },
    });
    const organizationNames = new Map(usageOrganizations.map((organization) => [organization.id, organization.name]));
    const highestUsage = usageByOrganization[0]?._count.id ?? 0;
    const monthlyRecurringRevenueMinor = revenueSubscriptions.reduce(
      (total, subscription) => total + (subscription.planRecord?.prices[0]?.amountMinor ?? 0) * subscription.seats,
      0,
    );
    const alerts = this.dashboardAlerts(metrics, database, redis, recentOrganizations);

    return {
      organizations: { total: totalOrgs, active: totalOrgs - suspendedOrgs, suspended: suspendedOrgs },
      users: { total: totalUsers, active: activeUsers, mfaEnabled: mfaUsers },
      subscriptions: {
        trialing: subCounts.TRIALING ?? 0,
        active: subCounts.ACTIVE ?? 0,
        pastDue: subCounts.PAST_DUE ?? 0,
        cancelled: subCounts.CANCELLED ?? 0,
      },
      products: { total: products, active: await this.prisma.product.count({ where: { isActive: true } }) },
      support: { open: openTickets, escalated: escalatedTickets },
      metrics: {
        totalOrganizations: totalOrgs,
        activeUsers,
        monthlyRecurringRevenueMinor,
        uptimePercent: database === "up" && redis === "up" ? 100 : null,
        observedSince: metrics.process.startedAt,
      },
      recentOrganizations: recentOrganizations.map((organization) => ({
        id: organization.id,
        name: organization.name,
        plan: organization.subscription?.plan ?? "FREE",
        seats: organization.subscription?.seats ?? organization.seats,
        status: organization.subscription?.status ?? "TRIALING",
      })),
      alerts,
      topOrganizationsByUsage: usageByOrganization.flatMap((entry) => {
        const name = organizationNames.get(entry.organizationId);
        if (!name) {
          return [];
        }
        return [
          {
            id: entry.organizationId,
            name,
            usage: entry._count.id,
            percentage: highestUsage === 0 ? 0 : Math.round((entry._count.id / highestUsage) * 100),
          },
        ];
      }),
      monitoring: { ...metrics, dependencies: { database, redis } },
    };
  }

  private dashboardAlerts(
    metrics: MetricsSnapshot,
    database: "up" | "down",
    redis: "up" | "down",
    organizations: Array<{
      name: string;
      seats: number;
      _count: { members: number };
      subscription: { seats: number } | null;
    }>,
  ): PlatformDashboard["alerts"] {
    const observedAt = new Date().toISOString();
    const alerts: PlatformDashboard["alerts"] = [];
    if (database === "down") {
      alerts.push({ severity: "critical", message: "Database health check failed", observedAt, source: "database" });
    }
    if (redis === "down") {
      alerts.push({ severity: "critical", message: "Redis health check failed", observedAt, source: "redis" });
    }
    if ((metrics.http.p95LatencyMs ?? 0) >= 1_000) {
      alerts.push({
        severity: "critical",
        message: `API p95 latency is ${Math.round(metrics.http.p95LatencyMs ?? 0)}ms`,
        observedAt,
        source: "http",
      });
    } else if ((metrics.http.p95LatencyMs ?? 0) >= 500) {
      alerts.push({
        severity: "warning",
        message: `API p95 latency is ${Math.round(metrics.http.p95LatencyMs ?? 0)}ms`,
        observedAt,
        source: "http",
      });
    }
    if (metrics.redis.cacheHitRate !== null && metrics.redis.cacheHitRate < 0.8) {
      alerts.push({
        severity: "warning",
        message: `Redis cache hit rate is ${Math.round(metrics.redis.cacheHitRate * 100)}%`,
        observedAt,
        source: "redis",
      });
    }
    const nearCapacity = organizations.filter((organization) => {
      const purchasedSeats = organization.subscription?.seats ?? organization.seats;
      return purchasedSeats > 0 && organization._count.members / purchasedSeats >= 0.8;
    });
    if (nearCapacity.length > 0) {
      alerts.push({
        severity: "info",
        message: `${nearCapacity.length} recent organization${nearCapacity.length === 1 ? " is" : "s are"} at or above 80% of configured seats`,
        observedAt,
        source: "organization",
      });
    }
    return alerts;
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
      return (await this.redis.raw.ping()) === "PONG" ? "up" : "down";
    } catch {
      return "down";
    }
  }

  // ---------------- Organizations ----------------

  /**
   * Retrieves a list of all organizations with their member counts and subscription details.
   * @returns An array of organizations with additional information.
   * @throws AppError if there is an issue retrieving the list of organizations.
   */
  async listOrganizations(query: ListPlatformOrganizationsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const where: Prisma.OrganizationWhereInput = {
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search, mode: "insensitive" } } : {}),
      ...(query.plan || query.status
        ? {
            subscription: {
              is: { ...(query.plan ? { plan: query.plan } : {}), ...(query.status ? { status: query.status } : {}) },
            },
          }
        : {}),
    };
    const sortBy = query.sortBy ?? "createdAt";
    const sortOrder = query.sortOrder ?? "desc";
    const orderBy: Prisma.OrganizationOrderByWithRelationInput = { [sortBy]: sortOrder };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { members: true } },
          subscription: { select: { plan: true, status: true, seats: true } },
        },
      }),
      this.prisma.organization.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async createOrganization(actorUserId: string, dto: CreatePlatformOrganizationDto) {
    const admin = await this.prisma.user.findUnique({
      where: { email: dto.adminEmail.toLowerCase() },
      select: { id: true, deletedAt: true },
    });
    if (!admin || admin.deletedAt) {
      throw new AppError(
        ErrorCode.USER_NOT_FOUND,
        "The administrator must be an active, registered user",
        HttpStatus.NOT_FOUND,
      );
    }

    const slug = await this.nextOrganizationSlug(dto.name);
    const organization = await this.prisma.$transaction(async (transaction) => {
      await assertUserHasNoOtherActiveOrganizationMembership(transaction, admin.id);
      return transaction.organization.create({
        data: {
          name: dto.name.trim(),
          slug,
          members: { create: { userId: admin.id, status: "ACTIVE", isOwner: true } },
          subscription: {
            create: { plan: dto.plan, status: "TRIALING", seats: dto.seats },
          },
        },
        include: {
          _count: { select: { members: true } },
          subscription: { select: { plan: true, status: true, seats: true } },
        },
      });
    });

    await this.audit.record({
      action: "control.org.created",
      organizationId: organization.id,
      actorUserId,
      resourceType: "Organization",
      resourceId: organization.id,
      metadata: { adminUserId: admin.id, plan: dto.plan },
    });
    return organization;
  }

  /**
   * Sets the suspended status of an organization.
   * @param organizationId The ID of the organization to update.
   * @param suspended Whether the organization should be suspended.
   * @param actorUserId The ID of the user performing the action.
   * @throws AppError if the organization is not found.
   */
  async setOrganizationSuspended(organizationId: string, suspended: boolean, actorUserId: string): Promise<void> {
    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found", HttpStatus.NOT_FOUND);
    }

    await this.prisma.subscription.upsert({
      where: { organizationId },
      create: { organizationId, plan: "FREE", seats: 5, status: suspended ? "SUSPENDED" : "ACTIVE" },
      update: { status: suspended ? "SUSPENDED" : "ACTIVE" },
    });

    await this.audit.record({
      action: suspended ? "control.org.suspended" : "control.org.reactivated",
      organizationId,
      actorUserId,
      resourceType: "Organization",
      resourceId: organizationId,
    });
  }

  async deleteOrganization(organizationId: string, actorUserId: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!organization || organization.deletedAt) {
      throw new AppError(ErrorCode.ORGANIZATION_NOT_FOUND, "Organization not found", HttpStatus.NOT_FOUND);
    }

    await this.prisma.organization.update({ where: { id: organizationId }, data: { deletedAt: new Date() } });
    await this.audit.record({
      action: "control.org.deleted",
      organizationId,
      actorUserId,
      resourceType: "Organization",
      resourceId: organizationId,
    });
  }

  private async nextOrganizationSlug(name: string): Promise<string> {
    const base =
      name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 56) || "organization";

    for (let suffix = 0; ; suffix += 1) {
      const slug = suffix === 0 ? base : `${base}-${suffix}`;
      const existing = await this.prisma.organization.findUnique({ where: { slug }, select: { id: true } });
      if (!existing) {
        return slug;
      }
    }
  }

  // ---------------- Users ----------------

  /**
   * Retrieves a list of all users with their authentication and membership details.
   * @returns An array of users with additional information.
   * @throws AppError if there is an issue retrieving the list of users.
   */
  async listUsers(): Promise<unknown[]> {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        auth: { select: { platformRole: true, mfaEnabled: true, lastLoginAt: true } },
        _count: { select: { memberships: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
  }

  /**
   * Sets the suspended status of a user.
   * @param userId The ID of the user to update.
   * @param suspended Whether the user should be suspended.
   * @param actorUserId The ID of the user performing the action.
   * @throws AppError if the user is not found.
   */
  async setUserSuspended(userId: string, suspended: boolean, actorUserId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new AppError(ErrorCode.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: suspended ? "SUSPENDED" : "ACTIVE" },
    });

    await this.audit.record({
      action: suspended ? "control.user.suspended" : "control.user.reactivated",
      actorUserId,
      resourceType: "User",
      resourceId: userId,
    });
  }

  // ---------------- Products ----------------

  /**
   * Retrieves a list of all products.
   * @returns An array of products.
   * @throws AppError if there is an issue retrieving the list of products.
   */
  async listProducts(): Promise<Product[]> {
    return this.prisma.product.findMany({ orderBy: { createdAt: "asc" } });
  }

  /**
   * Creates a new product.
   * @param actorUserId The ID of the user performing the action.
   * @param dto The data transfer object containing product details.
   * @returns The created product.
   * @throws AppError if the product key already exists.
   */
  async createProduct(actorUserId: string, dto: CreateProductDto): Promise<Product> {
    const existing = await this.prisma.product.findUnique({ where: { key: dto.key } });
    if (existing) {
      throw new AppError(ErrorCode.PRODUCT_KEY_TAKEN, "Product key already exists", HttpStatus.CONFLICT);
    }

    const product = await this.prisma.product.create({
      data: {
        key: dto.key,
        name: dto.name.trim(),
        description: dto.description ?? null,
        priceMonthly: dto.priceMonthly ?? 0,
      },
    });

    await this.audit.record({
      action: "control.product.created",
      actorUserId,
      resourceType: "Product",
      resourceId: product.id,
    });
    return product;
  }

  /**
   * Updates an existing product.
   * @param productId The ID of the product to update.
   * @param actorUserId The ID of the user performing the action.
   * @param dto The data transfer object containing updated product details.
   * @returns The updated product.
   * @throws AppError if the product is not found.
   */
  async updateProduct(productId: string, actorUserId: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError(ErrorCode.PRODUCT_NOT_FOUND, "Product not found", HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.priceMonthly !== undefined ? { priceMonthly: dto.priceMonthly } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      },
    });

    await this.audit.record({
      action: "control.product.updated",
      actorUserId,
      resourceType: "Product",
      resourceId: productId,
    });
    return updated;
  }

  async listEntitlementDefinitions(query: ListEntitlementsQueryDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.EntitlementWhereInput = {
      ...(query.search
        ? {
            OR: [
              { key: { contains: query.search, mode: "insensitive" } },
              { name: { contains: query.search, mode: "insensitive" } },
            ],
          }
        : {}),
      ...(query.productKey ? { productKey: query.productKey } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
    };
    const sortBy = query.sortBy ?? "key";
    const sortOrder = query.sortOrder ?? "asc";
    const orderBy: Prisma.EntitlementOrderByWithRelationInput = { [sortBy]: sortOrder };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.entitlement.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: { _count: { select: { planEntitlements: true, overrides: true } } },
      }),
      this.prisma.entitlement.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  }

  async createEntitlement(actorUserId: string, dto: CreateEntitlementDto) {
    const entitlement = await this.prisma.entitlement.create({
      data: {
        key: dto.key.trim(),
        name: dto.name.trim(),
        kind: dto.kind,
        productKey: dto.productKey?.trim() || null,
        description: dto.description?.trim() || null,
        unit: dto.unit?.trim() || null,
      },
      include: { _count: { select: { planEntitlements: true, overrides: true } } },
    });
    await this.audit.record({
      action: "control.entitlement.created",
      actorUserId,
      resourceType: "Entitlement",
      resourceId: entitlement.id,
    });
    return entitlement;
  }

  async updateEntitlement(entitlementId: string, actorUserId: string, dto: UpdateEntitlementDefinitionDto) {
    const existing = await this.prisma.entitlement.findUnique({ where: { id: entitlementId }, select: { id: true } });
    if (!existing) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Entitlement not found", HttpStatus.NOT_FOUND);}
    const entitlement = await this.prisma.entitlement.update({
      where: { id: entitlementId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.kind !== undefined ? { kind: dto.kind } : {}),
        ...(dto.productKey !== undefined ? { productKey: dto.productKey.trim() || null } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(dto.unit !== undefined ? { unit: dto.unit.trim() || null } : {}),
      },
      include: { _count: { select: { planEntitlements: true, overrides: true } } },
    });
    await this.audit.record({
      action: "control.entitlement.updated",
      actorUserId,
      resourceType: "Entitlement",
      resourceId: entitlementId,
    });
    return entitlement;
  }

  async deleteEntitlement(entitlementId: string, actorUserId: string): Promise<void> {
    const usage = await this.prisma.entitlement.findUnique({
      where: { id: entitlementId },
      select: { _count: { select: { planEntitlements: true, overrides: true } } },
    });
    if (!usage) {throw new AppError(ErrorCode.VALIDATION_FAILED, "Entitlement not found", HttpStatus.NOT_FOUND);}
    if (usage._count.planEntitlements > 0 || usage._count.overrides > 0) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Entitlements assigned to plans or overrides cannot be deleted",
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.entitlement.delete({ where: { id: entitlementId } });
    await this.audit.record({
      action: "control.entitlement.deleted",
      actorUserId,
      resourceType: "Entitlement",
      resourceId: entitlementId,
    });
  }

  async listPlans() {
    return this.prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
      include: { entitlements: { include: { entitlement: true }, orderBy: { entitlement: { key: "asc" } } } },
    });
  }

  async createPlan(actorUserId: string, dto: CreatePlanDto) {
    const assignments = await this.resolvePlanEntitlements(dto.entitlements ?? []);
    const plan = await this.prisma.plan.create({
      data: {
        key: dto.key,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        entitlements: { create: assignments },
      },
      include: { entitlements: { include: { entitlement: true } } },
    });
    await this.audit.record({ action: "control.plan.created", actorUserId, resourceType: "Plan", resourceId: plan.id });
    return plan;
  }

  async replacePlanEntitlements(
    planId: string,
    actorUserId: string,
    input: Array<{ entitlementKey: string; enabled: boolean; value?: number }>,
  ) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) {throw new AppError(ErrorCode.PLAN_NOT_FOUND, "Plan not found", HttpStatus.NOT_FOUND);}
    const assignments = await this.resolvePlanEntitlements(input);
    const updated = await this.prisma.$transaction(async (transaction) => {
      await transaction.planEntitlement.deleteMany({ where: { planId } });
      return transaction.plan.update({
        where: { id: planId },
        data: { entitlements: { create: assignments } },
        include: { entitlements: { include: { entitlement: true } } },
      });
    });
    await this.audit.record({
      action: "control.plan.entitlements-updated",
      actorUserId,
      resourceType: "Plan",
      resourceId: planId,
    });
    return updated;
  }

  async updatePlanStatus(planId: string, actorUserId: string, isActive: boolean) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId }, select: { id: true } });
    if (!plan) {throw new AppError(ErrorCode.PLAN_NOT_FOUND, "Plan not found", HttpStatus.NOT_FOUND);}
    const updated = await this.prisma.plan.update({
      where: { id: planId },
      data: { isActive },
      include: { entitlements: { include: { entitlement: true }, orderBy: { entitlement: { key: "asc" } } } },
    });
    await this.audit.record({
      action: isActive ? "control.plan.enabled" : "control.plan.disabled",
      actorUserId,
      resourceType: "Plan",
      resourceId: planId,
    });
    return updated;
  }

  async deletePlan(planId: string, actorUserId: string): Promise<void> {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      select: { id: true, _count: { select: { subscriptions: true } } },
    });
    if (!plan) {throw new AppError(ErrorCode.PLAN_NOT_FOUND, "Plan not found", HttpStatus.NOT_FOUND);}
    if (plan._count.subscriptions > 0) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Plans assigned to organizations cannot be deleted",
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.plan.delete({ where: { id: planId } });
    await this.audit.record({ action: "control.plan.deleted", actorUserId, resourceType: "Plan", resourceId: planId });
  }

  private async resolvePlanEntitlements(input: Array<{ entitlementKey: string; enabled: boolean; value?: number }>) {
    const keys = input.map((assignment) => assignment.entitlementKey);
    const definitions = await this.prisma.entitlement.findMany({
      where: { key: { in: keys } },
      select: { id: true, key: true, kind: true },
    });
    if (definitions.length !== keys.length) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Unknown entitlement key", HttpStatus.BAD_REQUEST);
    }
    return input.map((assignment) => {
      const definition = definitions.find((item) => item.key === assignment.entitlementKey);
      if (!definition) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Unknown entitlement key", HttpStatus.BAD_REQUEST);
      }
      if (definition.kind === "LIMIT" && (assignment.value === undefined || !assignment.enabled)) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          `A value is required for ${definition.key}`,
          HttpStatus.BAD_REQUEST,
        );
      }
      return {
        entitlementId: definition.id,
        enabled: assignment.enabled,
        value: definition.kind === "LIMIT" ? assignment.value : null,
      };
    });
  }

  // ---------------- Subscriptions ----------------

  /**
   * Retrieves the subscription for a given organization.
   * @param organizationId The ID of the organization.
   * @returns The subscription if found, otherwise null.
   * @throws AppError if there is an issue retrieving the subscription.
   */

  async getSubscription(organizationId: string): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { organizationId } });
  }

  /**
   * Creates or updates a subscription for a given organization.
   * @param organizationId The ID of the organization.
   * @param actorUserId The ID of the user performing the action.
   * @param dto The data transfer object containing subscription details.
   * @returns The created or updated subscription.
   * @throws AppError if there is an issue upserting the subscription.
   */
  async upsertSubscription(
    organizationId: string,
    actorUserId: string,
    dto: UpdateSubscriptionDto,
  ): Promise<Subscription> {
    const existing = await this.prisma.subscription.findUnique({ where: { organizationId } });

    const subscription = existing
      ? await this.prisma.subscription.update({
          where: { organizationId },
          data: {
            ...(dto.plan !== undefined ? { plan: dto.plan } : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            ...(dto.seats !== undefined ? { seats: dto.seats } : {}),
            ...(dto.cancelAtPeriodEnd !== undefined ? { cancelAtPeriodEnd: dto.cancelAtPeriodEnd } : {}),
          },
        })
      : await this.prisma.subscription.create({
          data: {
            organizationId,
            plan: dto.plan ?? "FREE",
            status: dto.status ?? "TRIALING",
            seats: dto.seats ?? 5,
            cancelAtPeriodEnd: dto.cancelAtPeriodEnd ?? false,
          },
        });

    await this.audit.record({
      action: "control.subscription.changed",
      organizationId,
      actorUserId,
      resourceType: "Subscription",
      resourceId: subscription.id,
      metadata: { plan: subscription.plan, status: subscription.status },
    });
    return subscription;
  }

  // ---------------- Support tickets ----------------

  /**
   * Retrieves a list of support tickets, optionally filtered by status.
   * @param status The status to filter tickets by (optional).
   * @returns An array of support tickets.
   * @throws AppError if there is an issue retrieving the tickets.
   */
  async listTickets(status?: SupportTicketStatus): Promise<SupportTicket[]> {
    return this.prisma.supportTicket.findMany({
      where: status ? { status } : undefined,
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
  }

  /**
   * Creates a new support ticket.
   * @param userId The ID of the user creating the ticket.
   * @param organizationId The ID of the organization associated with the ticket (optional).
   * @param dto The data transfer object containing ticket details.
   * @returns The created support ticket.
   * @throws AppError if there is an issue creating the ticket.
   */
  async createTicket(userId: string, organizationId: string | null, dto: CreateTicketDto): Promise<SupportTicket> {
    return this.prisma.supportTicket.create({
      data: {
        userId,
        organizationId,
        subject: dto.subject.trim(),
        body: dto.body,
        priority: dto.priority ?? "NORMAL",
      },
    });
  }

  /**
   * Updates an existing support ticket.
   * @param ticketId The ID of the ticket to update.
   * @param actorUserId The ID of the user performing the action.
   * @param dto The data transfer object containing updated ticket details.
   * @returns The updated support ticket.
   * @throws AppError if the ticket is not found or there is an issue updating it.
   */
  async updateTicket(ticketId: string, actorUserId: string, dto: UpdateTicketDto): Promise<SupportTicket> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError(ErrorCode.TICKET_NOT_FOUND, "Ticket not found", HttpStatus.NOT_FOUND);
    }

    const updated = await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.assignedToId !== undefined ? { assignedToId: dto.assignedToId } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    await this.audit.record({
      action: "control.ticket.updated",
      actorUserId,
      resourceType: "SupportTicket",
      resourceId: ticketId,
      metadata: { status: dto.status },
    });
    return updated;
  }

  // ---------------- Platform audit ----------------

  /**
   * Retrieves a list of audit logs, optionally limited by the specified number.
   * @param limit The maximum number of audit logs to retrieve (default is 100, maximum is 500).
   * @returns An array of audit logs.
   * @throws AppError if there is an issue retrieving the audit logs.
   */
  async listAuditLogs(limit = 100): Promise<unknown[]> {
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
    });
  }

  // ---------------- System health ----------------
  /**
   * Retrieves the current system health status, including uptime, memory usage, and Redis connectivity.
   * @returns An object containing system health information.
   * @throws AppError if there is an issue retrieving the system health.
   */

  async systemHealth(): Promise<{ uptime: number; memory: NodeJS.MemoryUsage; redis: string }> {
    const redis = await this.redis.raw.info("server").catch(() => "");
    return {
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      redis: redis.length > 0 ? "up" : "down",
    };
  }
}
