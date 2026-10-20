import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequirePermission } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { OrganizationContextGuard } from "../../../common/guards/organization-context.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  AddPermissionDto,
  AssignPermissionGroupDto,
  CreateDepartmentDto,
  CreatePermissionGroupDto,
  UpdateDepartmentDto,
  UpdatePermissionGroupDto,
} from "../dto/organization-access.dto";
import { OrganizationDepartmentService } from "../services/organization-department.service";
import { OrganizationPermissionGroupService } from "../services/organization-permission-group.service";
import { EntitlementService } from "../services/entitlement.service";
import { SubscriptionService } from "../services/subscription.service";
import { CreateSubscriptionDto, UpdateSubscriptionDto } from "../dto/subscription.dto";

@ApiTags("organization access")
@ApiBearerAuth()
@Controller("organizations/:organizationId")
@UseGuards(TenantGuard, OrganizationContextGuard, AccessGuard)
export class OrganizationAccessController {
  constructor(
    private readonly groups: OrganizationPermissionGroupService,
    private readonly departments: OrganizationDepartmentService,
    private readonly subscriptions: SubscriptionService,
    private readonly entitlements: EntitlementService,
  ) {}

  @Get("permission-groups")
  @RequirePermission("organization.members.read")
  listPermissionGroups(@CurrentOrganization() organization: OrganizationContext) {
    return this.groups.list(organization.organizationId);
  }
  @Get("permission-groups/:groupId")
  @RequirePermission("organization.members.read")
  getPermissionGroup(@CurrentOrganization() organization: OrganizationContext, @Param("groupId") groupId: string) {
    return this.groups.get(organization.organizationId, groupId);
  }
  @Post("permission-groups")
  @RequirePermission("organization.permissions.manage")
  createPermissionGroup(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePermissionGroupDto,
  ) {
    return this.groups.create(organization.organizationId, user.userId, dto);
  }
  @Patch("permission-groups/:groupId")
  @RequirePermission("organization.permissions.manage")
  updatePermissionGroup(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId") groupId: string,
    @Body() dto: UpdatePermissionGroupDto,
  ) {
    return this.groups.update(organization.organizationId, groupId, user.userId, dto);
  }
  @Delete("permission-groups/:groupId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  deletePermissionGroup(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId") groupId: string,
  ) {
    return this.groups.delete(organization.organizationId, groupId, user.userId);
  }
  @Post("permission-groups/:groupId/permissions")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  attachPermission(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId") groupId: string,
    @Body() dto: AddPermissionDto,
  ) {
    return this.groups.attachPermission(organization.organizationId, groupId, dto.permissionId, user.userId);
  }
  @Delete("permission-groups/:groupId/permissions/:permissionId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  removePermission(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId") groupId: string,
    @Param("permissionId") permissionId: string,
  ) {
    return this.groups.removePermission(organization.organizationId, groupId, permissionId, user.userId);
  }
  @Post("permission-groups/:groupId/users/:userId")
  @RequirePermission("organization.permissions.manage")
  assignPermissionGroup(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
    @Body() dto: AssignPermissionGroupDto,
  ) {
    return this.groups.assign(organization.organizationId, groupId, userId, user.userId, dto);
  }
  @Delete("permission-groups/:groupId/users/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  revokePermissionGroup(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
  ) {
    return this.groups.revoke(organization.organizationId, groupId, userId, user.userId);
  }
  @Get("permissions")
  @RequirePermission("organization.members.read")
  listPermissions() {
    return this.groups.listAssignablePermissions();
  }
  @Get("users/:userId/permissions")
  @RequirePermission("organization.members.read")
  getUserPermissions(@CurrentOrganization() organization: OrganizationContext, @Param("userId") userId: string) {
    return this.groups.getEffectiveUserPermissions(userId, organization.organizationId);
  }

  @Get("departments")
  @RequirePermission("organization.members.read")
  listDepartments(@CurrentOrganization() organization: OrganizationContext) {
    return this.departments.list(organization.organizationId);
  }
  @Post("departments")
  @RequirePermission("organization.permissions.manage")
  createDepartment(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDepartmentDto,
  ) {
    return this.departments.create(organization.organizationId, user.userId, dto);
  }
  @Patch("departments/:departmentId")
  @RequirePermission("organization.permissions.manage")
  updateDepartment(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("departmentId") departmentId: string,
    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.departments.update(organization.organizationId, departmentId, user.userId, dto);
  }
  @Delete("departments/:departmentId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  deleteDepartment(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("departmentId") departmentId: string,
  ) {
    return this.departments.delete(organization.organizationId, departmentId, user.userId);
  }
  @Post("departments/:departmentId/users/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  addDepartmentUser(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("departmentId") departmentId: string,
    @Param("userId") userId: string,
  ) {
    return this.departments.assignUser(organization.organizationId, departmentId, userId, user.userId);
  }
  @Delete("departments/:departmentId/users/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermission("organization.permissions.manage")
  removeDepartmentUser(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("departmentId") departmentId: string,
    @Param("userId") userId: string,
  ) {
    return this.departments.removeUser(organization.organizationId, departmentId, userId, user.userId);
  }

  @Get("subscription")
  @RequirePermission("billing.subscription.read")
  getSubscription(@CurrentOrganization() organization: OrganizationContext) {
    return this.subscriptions.getOrganizationSubscription(organization.organizationId);
  }
  @Post("subscription")
  @RequirePermission("billing.subscription.manage")
  createSubscription(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subscriptions.executeIdempotent(
      organization.organizationId,
      user.userId,
      idempotencyKey,
      "subscription.create",
      dto,
      () => this.subscriptions.createSubscription(organization.organizationId, user.userId, dto),
    );
  }
  @Patch("subscription")
  @RequirePermission("billing.subscription.manage")
  async updateSubscription(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subscriptions.executeIdempotent(
      organization.organizationId,
      user.userId,
      idempotencyKey,
      "subscription.update",
      dto,
      async () => {
        if (dto.planKey) {
          return this.subscriptions.changePlan(organization.organizationId, user.userId, dto.planKey);
        }
        if (dto.seatCount) {
          return this.subscriptions.updateSeatCount(organization.organizationId, user.userId, dto.seatCount);
        }
        if (dto.cancelAtPeriodEnd !== undefined) {
          return dto.cancelAtPeriodEnd
            ? this.subscriptions.cancelSubscription(organization.organizationId, user.userId)
            : this.subscriptions.reactivateSubscription(organization.organizationId, user.userId);
        }
        return this.subscriptions.getOrganizationSubscription(organization.organizationId);
      },
    );
  }
  @Post("subscription/cancel")
  @RequirePermission("billing.subscription.manage")
  cancelSubscription(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
  ) {
    return this.subscriptions.executeIdempotent(
      organization.organizationId,
      user.userId,
      idempotencyKey,
      "subscription.cancel",
      null,
      () => this.subscriptions.cancelSubscription(organization.organizationId, user.userId),
    );
  }
  @Post("subscription/reactivate")
  @RequirePermission("billing.subscription.manage")
  reactivateSubscription(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
  ) {
    return this.subscriptions.executeIdempotent(
      organization.organizationId,
      user.userId,
      idempotencyKey,
      "subscription.reactivate",
      null,
      () => this.subscriptions.reactivateSubscription(organization.organizationId, user.userId),
    );
  }
  @Get("entitlements")
  @RequirePermission("billing.subscription.read")
  listEntitlements(@CurrentOrganization() organization: OrganizationContext) {
    return this.entitlements.listEntitlements(organization.organizationId);
  }
  @Get("entitlements/:key")
  @RequirePermission("billing.subscription.read")
  getEntitlement(@CurrentOrganization() organization: OrganizationContext, @Param("key") key: string) {
    return this.entitlements.getEntitlement(organization.organizationId, key);
  }
}
