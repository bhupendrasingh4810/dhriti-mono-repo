import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import {
  CurrentOrganization,
  type OrganizationContext,
} from "../../common/decorators/organization.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { NotificationService, type NotificationPage } from "./notification.service";
import {
  CreateNotificationDto,
  ListNotificationsQueryDto,
  UpsertPreferenceDto,
} from "./dto/notification.dto";

@ApiTags("notifications")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/notifications")
export class NotificationController {
  constructor(private readonly notifications: NotificationService) {}

  @Get()
  @ApiOperation({ summary: "List in-app notifications (cursor-paginated) with unread count" })
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<NotificationPage> {
    return this.notifications.list(organization.organizationId, user.userId, query);
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get the unread notification count" })
  async unreadCount(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<{ unreadCount: number }> {
    const count = await this.notifications.unreadCount(organization.organizationId, user.userId);
    return { unreadCount: count };
  }

  @Post()
  @ApiOperation({ summary: "Create a notification for a user (internal/mention use)" })
  async create(
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateNotificationDto,
  ) {
    return this.notifications.create(organization.organizationId, dto);
  }

  @Patch(":notificationId/read")
  @ApiOperation({ summary: "Mark a notification as read" })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("notificationId") notificationId: string,
  ): Promise<void> {
    return this.notifications.markRead(organization.organizationId, user.userId, notificationId);
  }

  @Patch("read-all")
  @ApiOperation({ summary: "Mark all notifications as read" })
  async markAllRead(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<{ markedRead: number }> {
    const count = await this.notifications.markAllRead(organization.organizationId, user.userId);
    return { markedRead: count };
  }

  // ---------------- Preferences ----------------

  @Get("preferences")
  @ApiOperation({ summary: "List notification preferences per type" })
  async listPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.notifications.listPreferences(organization.organizationId, user.userId);
  }

  @Post("preferences")
  @ApiOperation({ summary: "Upsert a notification preference (in-app/email/push per type)" })
  async upsertPreference(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpsertPreferenceDto,
  ) {
    return this.notifications.upsertPreference(organization.organizationId, user.userId, dto);
  }
}
