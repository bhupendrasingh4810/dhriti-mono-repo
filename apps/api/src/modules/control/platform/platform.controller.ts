import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { PlatformRoles } from "../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../common/guards/platform-roles.guard";

import { PlatformService, type PlatformDashboard } from "./platform.service";
import {
  CreatePlatformOrganizationDto,
  CreateProductDto,
  CreateTicketDto,
  UpdateProductDto,
  CreatePlatformRoleDto,
  UpdateSubscriptionDto,
  UpdateTicketDto,
} from "./dto/platform.dto";
import { PlatformRoleService } from "../../authorization/services/platform-role.service";

@ApiTags("control/platform")
@ApiBearerAuth()
@UseGuards(PlatformRolesGuard)
@PlatformRoles("PLATFORM_ADMIN", "SUPPORT", "BILLING", "SECURITY", "ENGINEERING")
@Controller("control/platform")
export class PlatformController {
  constructor(
    private readonly platform: PlatformService,
    private readonly platformRoles: PlatformRoleService,
  ) {}

  // ---------------- Platform roles ----------------

  @Get("roles")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "List explicit platform roles and their permissions" })
  listRoles() {
    return this.platformRoles.list();
  }

  @Post("roles")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Create an explicit platform role" })
  createRole(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlatformRoleDto) {
    return this.platformRoles.create(user.userId, dto);
  }

  @Put("roles/:roleId/permissions/:permissionId")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Attach a permission to a platform role" })
  attachRolePermission(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roleId") roleId: string,
    @Param("permissionId") permissionId: string,
  ): Promise<void> {
    return this.platformRoles.attachPermission(roleId, permissionId, user.userId);
  }

  @Delete("roles/:roleId/permissions/:permissionId")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Remove a permission from a platform role" })
  removeRolePermission(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roleId") roleId: string,
    @Param("permissionId") permissionId: string,
  ): Promise<void> {
    return this.platformRoles.removePermission(roleId, permissionId, user.userId);
  }

  @Post("roles/:roleId/users/:userId")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Assign a platform role to a user" })
  assignRole(@CurrentUser() user: AuthenticatedUser, @Param("roleId") roleId: string, @Param("userId") userId: string) {
    return this.platformRoles.assign(roleId, userId, user.userId);
  }

  @Patch("roles/:roleId/users/:userId/revoke")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Revoke a platform role from a user" })
  revokeRole(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roleId") roleId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.platformRoles.revoke(roleId, userId, user.userId);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Platform dashboard: orgs, users, subscriptions, support" })
  async dashboard(): Promise<PlatformDashboard> {
    return this.platform.dashboard();
  }

  @Get("organizations")
  @ApiOperation({ summary: "List all organizations with member/subscription counts" })
  async listOrganizations() {
    return this.platform.listOrganizations();
  }

  @Post("organizations")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Create an organization with an existing user as its owner" })
  async createOrganization(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlatformOrganizationDto) {
    return this.platform.createOrganization(user.userId, dto);
  }

  @Post("organizations/:organizationId/suspend")
  @ApiOperation({ summary: "Suspend an organization" })
  async suspendOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
  ): Promise<void> {
    return this.platform.setOrganizationSuspended(organizationId, true, user.userId);
  }

  @Post("organizations/:organizationId/reactivate")
  @ApiOperation({ summary: "Reactivate a suspended organization" })
  async reactivateOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
  ): Promise<void> {
    return this.platform.setOrganizationSuspended(organizationId, false, user.userId);
  }

  @Delete("organizations/:organizationId")
  @PlatformRoles("PLATFORM_ADMIN")
  @ApiOperation({ summary: "Soft-delete an organization" })
  async deleteOrganization(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
  ): Promise<void> {
    return this.platform.deleteOrganization(organizationId, user.userId);
  }

  @Get("users")
  @ApiOperation({ summary: "List platform users (internal staff view)" })
  async listUsers() {
    return this.platform.listUsers();
  }

  @Post("users/:userId/suspend")
  @ApiOperation({ summary: "Suspend a user" })
  async suspendUser(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string): Promise<void> {
    return this.platform.setUserSuspended(userId, true, user.userId);
  }

  @Post("users/:userId/reactivate")
  @ApiOperation({ summary: "Reactivate a user" })
  async reactivateUser(@CurrentUser() user: AuthenticatedUser, @Param("userId") userId: string): Promise<void> {
    return this.platform.setUserSuspended(userId, false, user.userId);
  }

  // ---------------- Products & subscriptions ----------------

  @Get("products")
  @ApiOperation({ summary: "List the product catalog" })
  async listProducts() {
    return this.platform.listProducts();
  }

  @Post("products")
  @ApiOperation({ summary: "Create a product" })
  async createProduct(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.platform.createProduct(user.userId, dto);
  }

  @Patch("products/:productId")
  @ApiOperation({ summary: "Update a product (name, price, active)" })
  async updateProduct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("productId") productId: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.platform.updateProduct(productId, user.userId, dto);
  }

  @Put("organizations/:organizationId/subscription")
  @ApiOperation({ summary: "Upsert an organization's subscription (plan, seats, status)" })
  async upsertSubscription(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.platform.upsertSubscription(organizationId, user.userId, dto);
  }

  // ---------------- Support ----------------

  @Get("tickets")
  @ApiOperation({ summary: "List support tickets (optionally filter by status)" })
  async listTickets(@Query("status") status?: string) {
    return this.platform.listTickets(status as never);
  }

  @Post("tickets")
  @ApiOperation({ summary: "Create a support ticket" })
  async createTicket(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.platform.createTicket(user.userId, user.organizationId ?? null, dto);
  }

  @Patch("tickets/:ticketId")
  @ApiOperation({ summary: "Update a support ticket (status, assignee, notes)" })
  async updateTicket(
    @CurrentUser() user: AuthenticatedUser,
    @Param("ticketId") ticketId: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.platform.updateTicket(ticketId, user.userId, dto);
  }

  // ---------------- Audit & health ----------------

  @Get("audit-logs")
  @ApiOperation({ summary: "Cross-org platform audit logs" })
  async auditLogs(@Query("limit") limit?: string) {
    return this.platform.listAuditLogs(limit ? Number(limit) : 100);
  }

  @Get("health")
  @ApiOperation({ summary: "System health: uptime, memory, redis" })
  async health() {
    return this.platform.systemHealth();
  }
}
