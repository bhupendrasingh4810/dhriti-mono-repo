import { HttpStatus, Injectable } from "@nestjs/common";
import type { Product, Subscription, SupportTicket, SupportTicketStatus } from "@prisma/client";

import { PrismaService } from "../../../database/prisma.service";
import { RedisService } from "../../../redis/redis.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { AuditService } from "../../audit/audit.service";
import type {
  CreateProductDto,
  CreateTicketDto,
  UpdateProductDto,
  UpdateSubscriptionDto,
  UpdateTicketDto,
} from "./dto/platform.dto";

export interface PlatformDashboard {
  organizations: { total: number; active: number; suspended: number };
  users: { total: number; active: number; mfaEnabled: number };
  subscriptions: { trialing: number; active: number; pastDue: number; cancelled: number };
  products: { total: number; active: number };
  support: { open: number; escalated: number };
}

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Dashboard ----------------

  /**
   * Retrieves the platform dashboard data, including statistics for organizations, users, subscriptions, products, and support tickets.
   * @returns The platform dashboard data.
   * @throws Error if there is an issue retrieving the dashboard data.
   */
  async dashboard(): Promise<PlatformDashboard> {
    const [totalOrgs, suspendedOrgs, totalUsers, activeUsers, mfaUsers, subs, products, openTickets, escalatedTickets] =
      await Promise.all([
        this.prisma.organization.count(),
        this.prisma.organization.count({ where: { deletedAt: { not: null } } }),
        this.prisma.user.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
        this.prisma.userAuth.count({ where: { mfaEnabled: true, user: { deletedAt: null } } }),
        this.prisma.subscription.groupBy({ by: ["status"], _count: true }),
        this.prisma.product.count(),
        this.prisma.supportTicket.count({ where: { status: "OPEN" } }),
        this.prisma.supportTicket.count({ where: { status: "ESCALATED" } }),
      ]);

    const subCounts = Object.fromEntries(subs.map((row) => [row.status, row._count]));

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
    };
  }

  // ---------------- Organizations ----------------

  /**
   * Retrieves a list of all organizations with their member counts and subscription details.
   * @returns An array of organizations with additional information.
   * @throws AppError if there is an issue retrieving the list of organizations.
   */
  async listOrganizations(): Promise<unknown[]> {
    return this.prisma.organization.findMany({
      include: {
        _count: { select: { members: true } },
        subscription: { select: { plan: true, status: true, seats: true } },
      },
      orderBy: { createdAt: "desc" },
    });
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

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { deletedAt: suspended ? new Date() : null },
    });

    await this.audit.record({
      action: suspended ? "control.org.suspended" : "control.org.reactivated",
      organizationId,
      actorUserId,
      resourceType: "Organization",
      resourceId: organizationId,
    });
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
