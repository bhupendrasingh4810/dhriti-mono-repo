import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { RequireAccess } from "../../common/decorators/access.decorator";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { ConnectService } from "./connect.service";
import { AddChannelMemberDto, CreateChannelDto, UpdateChannelDto } from "./dto/channel.dto";
import { AddReactionDto, CreateMessageDto, ListMessagesQueryDto, UpdateMessageDto } from "./dto/message.dto";

@ApiTags("connect")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/connect")
export class ConnectController {
  constructor(private readonly connect: ConnectService) {}

  // ---------------- Channels ----------------

  @Get("channels")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List channels visible to the current user" })
  async listChannels(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.connect.listChannels(organization.organizationId, user.userId);
  }

  @Post("channels")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.create" })
  @ApiOperation({ summary: "Create a channel" })
  async createChannel(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateChannelDto,
  ) {
    return this.connect.createChannel(organization.organizationId, user.userId, dto);
  }

  @Patch("channels/:channelId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @ApiOperation({ summary: "Update a channel (name, topic, description, archive)" })
  async updateChannel(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
    @Body() dto: UpdateChannelDto,
  ) {
    return this.connect.updateChannel(organization.organizationId, channelId, user.userId, dto);
  }

  @Post("channels/:channelId/members")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Add a member to a channel" })
  async addMember(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
    @Body() dto: AddChannelMemberDto,
  ): Promise<void> {
    return this.connect.addMember(organization.organizationId, channelId, user.userId, dto.userId);
  }

  @Delete("channels/:channelId/members/:userId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a member from a channel" })
  async removeMember(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.connect.removeMember(organization.organizationId, channelId, user.userId, userId);
  }

  // ---------------- Messages ----------------

  @Get("channels/:channelId/messages")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List channel messages (cursor-paginated, newest first)" })
  async listMessages(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
    @Query() query: ListMessagesQueryDto,
  ) {
    return this.connect.listMessages(organization.organizationId, channelId, user.userId, {
      cursor: query.cursor,
      limit: query.limit,
    });
  }

  @Post("channels/:channelId/messages")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.create" })
  @ApiOperation({ summary: "Post a message; supports parentId for threads and mentions" })
  async createMessage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
    @Body() dto: CreateMessageDto,
  ) {
    return this.connect.createMessage(organization.organizationId, channelId, user.userId, dto);
  }

  @Patch("messages/:messageId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.create" })
  @ApiOperation({ summary: "Edit a message (author only)" })
  async updateMessage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("messageId") messageId: string,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.connect.updateMessage(organization.organizationId, messageId, user.userId, dto);
  }

  @Delete("messages/:messageId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.delete" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a message (author only)" })
  async deleteMessage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("messageId") messageId: string,
  ): Promise<void> {
    return this.connect.deleteMessage(organization.organizationId, messageId, user.userId);
  }

  // ---------------- Reactions ----------------

  @Post("messages/:messageId/reactions")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.create" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Add an emoji reaction to a message" })
  async addReaction(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("messageId") messageId: string,
    @Body() dto: AddReactionDto,
  ): Promise<void> {
    return this.connect.addReaction(organization.organizationId, messageId, user.userId, dto.emoji);
  }

  @Delete("messages/:messageId/reactions/:emoji")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.create" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove an emoji reaction from a message" })
  async removeReaction(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("messageId") messageId: string,
    @Param("emoji") emoji: string,
  ): Promise<void> {
    return this.connect.removeReaction(organization.organizationId, messageId, user.userId, emoji);
  }
}
