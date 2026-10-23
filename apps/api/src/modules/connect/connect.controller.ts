import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
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
import { CreateConnectTeamDto, UpdateConnectTeamDto, UpsertConnectMemberDto } from "./dto/team.dto";
import { AddReactionDto, CreateMessageDto, ListMessagesQueryDto, MarkMessagesReadDto, UpdateMessageDto } from "./dto/message.dto";
import { CreateDirectConversationDto, SetSidebarFavoriteDto, UpdateConversationNotificationDto, UpdateSidebarSettingsDto } from "./dto/sidebar.dto";
import { SetRecordingConsentDto } from "./dto/recording.dto";

@ApiTags("connect")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/connect")
export class ConnectController {
  constructor(private readonly connect: ConnectService) {}

  // ---------------- Sidebar and conversations ----------------

  @Get("users")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List active Connect users in the current organization" })
  async listUsers(@CurrentOrganization() organization: OrganizationContext) {
    return this.connect.listUsers(organization.organizationId);
  }

  @Get("users/paged")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List active Connect users with cursor pagination" })
  async listUsersPage(
    @CurrentOrganization() organization: OrganizationContext,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.connect.listUsersPage(organization.organizationId, cursor, limit ? Number(limit) : undefined);
  }

  @Get("sidebar")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Get the current user's Connect sidebar state" })
  async getSidebar(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.connect.getSidebar(organization.organizationId, user.userId);
  }

  @Put("sidebar/settings")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Update the current user's Connect sidebar settings" })
  async updateSidebarSettings(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpdateSidebarSettingsDto,
  ) {
    return this.connect.updateSidebarSettings(organization.organizationId, user.userId, dto);
  }

  @Put("sidebar/favorites")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Add or remove a chat, team, or channel favorite" })
  async setSidebarFavorite(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: SetSidebarFavoriteDto,
  ) {
    return this.connect.setSidebarFavorite(organization.organizationId, user.userId, dto);
  }

  @Put("conversations/:channelId/notifications")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Update the current user's notification preferences for a conversation" })
  async updateConversationNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId", ParseUUIDPipe) channelId: string,
    @Body() dto: UpdateConversationNotificationDto,
  ) {
    return this.connect.updateConversationNotifications(organization.organizationId, channelId, user.userId, dto);
  }

  @Delete("conversations/:channelId/history")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Remove a direct conversation from the current user's history" })
  async removeConversationHistory(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId", ParseUUIDPipe) channelId: string,
  ) {
    await this.connect.removeConversationHistory(organization.organizationId, channelId, user.userId);
  }

  @Get("conversations")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List the current user's direct and group conversations" })
  async listConversations(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.connect.listConversations(organization.organizationId, user.userId);
  }

  @Get("calls/:callId/token-access")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Authorize an RTC token request for an active Connect call" })
  async getCallTokenAccess(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("callId", new ParseUUIDPipe()) callId: string,
  ) {
    return this.connect.getCallTokenAccess(organization.organizationId, user.userId, callId);
  }

  @Post("calls/:callId/recording/request")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Request participant consent before recording an active Connect call" })
  async requestCallRecording(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("callId", new ParseUUIDPipe()) callId: string,
  ) {
    return this.connect.requestCallRecording(organization.organizationId, user.userId, callId);
  }

  @Get("calls/:callId/recording")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Get recording consent state for an authorized Connect call participant" })
  async getCallRecordingConsent(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("callId", new ParseUUIDPipe()) callId: string,
  ) {
    return this.connect.getCallRecordingConsent(organization.organizationId, user.userId, callId);
  }

  @Post("calls/:callId/recording/consent")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Record a participant's consent decision for an active Connect call" })
  async setCallRecordingConsent(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("callId", new ParseUUIDPipe()) callId: string,
    @Body() dto: SetRecordingConsentDto,
  ) {
    return this.connect.setCallRecordingConsent(organization.organizationId, user.userId, callId, dto.consent);
  }

  @Post("conversations/direct")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.create" })
  @ApiOperation({ summary: "Find or create a direct conversation with an organization member" })
  async createDirectConversation(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.connect.createDirectConversation(organization.organizationId, user.userId, dto.userId);
  }

  // ---------------- Channels ----------------

  @Get("channels")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List channels visible to the current user" })
  async listChannels(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.connect.listChannels(organization.organizationId, user.userId);
  }

  @Post("channels/:channelId/join")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Join a public channel in the current organization" })
  async joinPublicChannel(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
  ): Promise<void> {
    return this.connect.joinPublicChannel(organization.organizationId, channelId, user.userId);
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

  // ---------------- Teams ----------------

  @Get("teams")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "List Connect teams visible to the current user" })
  async listTeams(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.connect.listTeams(organization.organizationId, user.userId);
  }

  @Get("teams/:teamId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @ApiOperation({ summary: "Get Connect team details, members, and channels" })
  async getTeam(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Param("teamId") teamId: string) {
    return this.connect.getTeamDetails(organization.organizationId, teamId, user.userId);
  }

  @Post("teams")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.create" })
  @ApiOperation({ summary: "Create a Connect team" })
  async createTeam(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Body() dto: CreateConnectTeamDto) {
    return this.connect.createTeam(organization.organizationId, user.userId, dto);
  }

  @Patch("teams/:teamId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @ApiOperation({ summary: "Update a Connect team" })
  async updateTeam(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Param("teamId") teamId: string, @Body() dto: UpdateConnectTeamDto) {
    return this.connect.updateTeam(organization.organizationId, teamId, user.userId, dto);
  }

  @Delete("teams/:teamId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a Connect team" })
  async deleteTeam(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Param("teamId") teamId: string): Promise<void> {
    return this.connect.deleteTeam(organization.organizationId, teamId, user.userId);
  }

  @Post("teams/:teamId/members")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Add a user or admin to a Connect team" })
  async upsertTeamMember(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Param("teamId") teamId: string, @Body() dto: UpsertConnectMemberDto): Promise<void> {
    return this.connect.upsertTeamMember(organization.organizationId, teamId, user.userId, dto.userId, dto.role ?? "MEMBER");
  }

  @Delete("teams/:teamId/members/:userId")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a user from a Connect team" })
  async removeTeamMember(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Param("teamId") teamId: string, @Param("userId") userId: string): Promise<void> {
    return this.connect.removeTeamMember(organization.organizationId, teamId, user.userId, userId);
  }

  @Post("teams/:teamId/leave")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Leave a Connect team" })
  async leaveTeam(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext, @Param("teamId") teamId: string): Promise<void> {
    return this.connect.leaveTeam(organization.organizationId, teamId, user.userId);
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
    return this.connect.upsertChannelMember(organization.organizationId, channelId, user.userId, dto.userId, dto.role ?? "MEMBER");
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
      initial: query.initial,
      after: query.after,
    });
  }

  @Post("channels/:channelId/read")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.channel.read" })
  async markMessagesRead(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("channelId") channelId: string,
    @Body() dto: MarkMessagesReadDto,
  ) {
    const lastReadAt = await this.connect.markChannelRead(organization.organizationId, channelId, user.userId, dto.messageId);
    return { lastReadAt };
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

  @Post("messages/:messageId/restore")
  @RequireAccess({ entitlement: "connect.enabled", permission: "connect.message.delete" })
  @ApiOperation({ summary: "Restore a deleted message (author only)" })
  async restoreMessage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("messageId") messageId: string,
  ) {
    return this.connect.restoreMessage(organization.organizationId, messageId, user.userId);
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
