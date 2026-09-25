import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { RequirePermission } from "../../../common/decorators/access.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";

import { OrganizationService, type MemberWithUser } from "../services/organization.service";
import { SessionService } from "../../auth/services/session.service";
import { CreateOrganizationDto, UpdateOrganizationDto } from "../dto/organization.dto";
import {
  InviteMemberDto,
  TransferOwnershipDto,
  UpdateMemberLifecycleDto,
  UpdateMemberRoleDto,
} from "../dto/member.dto";
import { CreateTeamDto, UpdateTeamDto } from "../dto/team.dto";
import { CreateGroupDto, UpdateGroupDto } from "../dto/invitation.dto";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller()
export class OrganizationController {
  constructor(
    private readonly organizations: OrganizationService,
    private readonly sessions: SessionService,
  ) {}

  // ---------------- My organizations ----------------

  @Get("organizations")
  @ApiOperation({ summary: "List organizations the current user belongs to" })
  async listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.organizations.listMyOrganizations(user.userId);
  }

  @Post("organizations")
  @ApiOperation({ summary: "Create an organization" })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 409, description: "Slug already taken" })
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    const organization = await this.organizations.createOrganization(user.userId, dto);
    await this.sessions.setSessionOrganization(user.sessionId, organization.id);
    return organization;
  }

  // ---------------- Active organization (tenant-scoped) ----------------

  @Get("organization")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "Get the active organization" })
  async getActive(@CurrentOrganization() organization: OrganizationContext) {
    return this.organizations.getOrganization(organization.organizationId);
  }

  @Patch("organization")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.settings.manage")
  @ApiOperation({ summary: "Rename the active organization" })
  async updateActive(@CurrentOrganization() organization: OrganizationContext, @Body() dto: UpdateOrganizationDto) {
    return this.organizations.updateOrganization(organization.organizationId, dto.name);
  }

  @Get("organization/members")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.members.read")
  @ApiOperation({ summary: "List members of the active organization" })
  async listMembers(@CurrentOrganization() organization: OrganizationContext): Promise<MemberWithUser[]> {
    return this.organizations.listMembers(organization.organizationId);
  }

  @Post("organization/members")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.members.invite")
  @ApiOperation({ summary: "Add an existing user to the organization" })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Already a member" })
  async addMember(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InviteMemberDto,
  ): Promise<MemberWithUser> {
    return this.organizations.addMember(organization.organizationId, user.userId, dto.email, dto.role);
  }

  @Patch("organization/members/:memberId")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Change a member's global role" })
  async updateMemberRole(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<MemberWithUser> {
    return this.organizations.updateMemberRole(organization.organizationId, memberId, user.userId, dto.role);
  }

  @Patch("organization/members/:memberId/lifecycle")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.members.remove")
  async updateMemberLifecycle(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberLifecycleDto,
  ): Promise<MemberWithUser> {
    return this.organizations.updateMemberLifecycle(organization.organizationId, memberId, user.userId, dto.status);
  }

  @Post("organization/members/:memberId/transfer-ownership")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  async transferOwnership(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("memberId") memberId: string,
    @Body() dto: TransferOwnershipDto,
  ): Promise<void> {
    return this.organizations.transferOwnership(organization.organizationId, memberId, dto.memberId, user.userId);
  }

  @Delete("organization/members/:memberId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.members.remove")
  @ApiOperation({ summary: "Remove a member" })
  async removeMember(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("memberId") memberId: string,
  ): Promise<void> {
    return this.organizations.removeMember(organization.organizationId, memberId, user.userId);
  }

  // ---------------- Teams ----------------

  @Get("organization/teams")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.members.read")
  @ApiOperation({ summary: "List teams in the active organization" })
  async listTeams(@CurrentOrganization() organization: OrganizationContext) {
    return this.organizations.listTeams(organization.organizationId);
  }

  @Post("organization/teams")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Create a team (OWNER/ADMIN)" })
  async createTeam(@CurrentOrganization() organization: OrganizationContext, @Body() dto: CreateTeamDto) {
    return this.organizations.createTeam(organization.organizationId, dto);
  }

  @Patch("organization/teams/:teamId")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Update a team (OWNER/ADMIN)" })
  async updateTeam(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("teamId") teamId: string,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.organizations.updateTeam(organization.organizationId, teamId, dto);
  }

  @Delete("organization/teams/:teamId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Soft-delete a team (OWNER/ADMIN)" })
  async deleteTeam(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("teamId") teamId: string,
  ): Promise<void> {
    return this.organizations.deleteTeam(organization.organizationId, teamId);
  }

  @Post("organization/teams/:teamId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Add an organization member to a team (OWNER/ADMIN)" })
  async addTeamMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("teamId") teamId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.organizations.addTeamMember(organization.organizationId, teamId, userId);
  }

  @Delete("organization/teams/:teamId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Remove a member from a team (OWNER/ADMIN)" })
  async removeTeamMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("teamId") teamId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.organizations.removeTeamMember(organization.organizationId, teamId, userId);
  }

  // ---------------- Groups ----------------

  @Get("organization/groups")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.members.read")
  @ApiOperation({ summary: "List groups in the active organization" })
  async listGroups(@CurrentOrganization() organization: OrganizationContext) {
    return this.organizations.listGroups(organization.organizationId);
  }

  @Post("organization/groups")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Create a manual group" })
  async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateGroupDto,
  ) {
    return this.organizations.createGroup(organization.organizationId, user.userId, dto);
  }

  @Patch("organization/groups/:groupId")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Update a group" })
  async updateGroup(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
    @Body() dto: UpdateGroupDto,
  ) {
    return this.organizations.updateGroup(organization.organizationId, groupId, user.userId, dto);
  }

  @Delete("organization/groups/:groupId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Soft-delete a group" })
  async deleteGroup(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
  ): Promise<void> {
    return this.organizations.deleteGroup(organization.organizationId, groupId, user.userId);
  }

  @Post("organization/groups/:groupId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Add a member to a group" })
  async addGroupMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.organizations.addGroupMember(organization.organizationId, groupId, userId);
  }

  @Delete("organization/groups/:groupId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Remove a member from a group" })
  async removeGroupMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.organizations.removeGroupMember(organization.organizationId, groupId, userId);
  }

  @Post("organization/groups/:groupId/sync")
  @UseGuards(TenantGuard, AccessGuard)
  @RequirePermission("organization.permissions.manage")
  @ApiOperation({ summary: "Re-evaluate a dynamic group's rule and sync membership" })
  async syncDynamicGroup(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
  ) {
    return this.organizations.syncDynamicGroup(organization.organizationId, groupId, user.userId);
  }
}
