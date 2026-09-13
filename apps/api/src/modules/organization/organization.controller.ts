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
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";

import {
  CurrentUser,
  type AuthenticatedUser,
} from "../../common/decorators/current-user.decorator";
import {
  CurrentOrganization,
  type OrganizationContext,
} from "../../common/decorators/organization.decorator";
import { OrgRoles } from "../../common/decorators/org-roles.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { OrgRolesGuard } from "../../common/guards/org-roles.guard";

import { OrganizationService, type MemberWithUser } from "./organization.service";
import { SessionService } from "../auth/services/session.service";
import { CreateOrganizationDto, UpdateOrganizationDto } from "./dto/organization.dto";
import { InviteMemberDto, UpdateMemberRoleDto } from "./dto/member.dto";
import { CreateTeamDto, UpdateTeamDto } from "./dto/team.dto";
import {
  AcceptInvitationDto,
  CreateGroupDto,
  CreateInvitationDto,
  UpdateGroupDto,
} from "./dto/invitation.dto";

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
  @ApiOperation({ summary: "Create an organization; the creator becomes OWNER" })
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
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Rename the active organization (OWNER/ADMIN)" })
  async updateActive(
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.organizations.updateOrganization(organization.organizationId, dto.name);
  }

  @Get("organization/members")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "List members of the active organization" })
  async listMembers(
    @CurrentOrganization() organization: OrganizationContext,
  ): Promise<MemberWithUser[]> {
    return this.organizations.listMembers(organization.organizationId);
  }

  @Post("organization/members")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Add an existing user to the organization (OWNER/ADMIN)" })
  @ApiResponse({ status: 201 })
  @ApiResponse({ status: 404, description: "User not found" })
  @ApiResponse({ status: 409, description: "Already a member" })
  async addMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: InviteMemberDto,
  ): Promise<MemberWithUser> {
    return this.organizations.addMember(organization.organizationId, dto.email, dto.role);
  }

  @Patch("organization/members/:memberId")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Change a member's role; the last OWNER cannot be demoted" })
  async updateMemberRole(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ): Promise<MemberWithUser> {
    return this.organizations.updateMemberRole(organization.organizationId, memberId, dto.role);
  }

  @Delete("organization/members/:memberId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Remove a member; the last OWNER cannot be removed" })
  async removeMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("memberId") memberId: string,
  ): Promise<void> {
    return this.organizations.removeMember(organization.organizationId, memberId);
  }

  // ---------------- Teams ----------------

  @Get("organization/teams")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "List teams in the active organization" })
  async listTeams(@CurrentOrganization() organization: OrganizationContext) {
    return this.organizations.listTeams(organization.organizationId);
  }

  @Post("organization/teams")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Create a team (OWNER/ADMIN)" })
  async createTeam(
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateTeamDto,
  ) {
    return this.organizations.createTeam(organization.organizationId, dto);
  }

  @Patch("organization/teams/:teamId")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
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
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Soft-delete a team (OWNER/ADMIN)" })
  async deleteTeam(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("teamId") teamId: string,
  ): Promise<void> {
    return this.organizations.deleteTeam(organization.organizationId, teamId);
  }

  @Post("organization/teams/:teamId/members/:userId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
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
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Remove a member from a team (OWNER/ADMIN)" })
  async removeTeamMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("teamId") teamId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.organizations.removeTeamMember(organization.organizationId, teamId, userId);
  }

  // ---------------- Invitations ----------------

  @Get("organization/invitations")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "List invitations (auto-expires stale pending ones)" })
  async listInvitations(@CurrentOrganization() organization: OrganizationContext) {
    return this.organizations.listInvitations(organization.organizationId);
  }

  @Post("organization/invitations")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Invite a user by email; returns the invite token once" })
  async createInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateInvitationDto,
  ) {
    return this.organizations.createInvitation(
      organization.organizationId,
      user.userId,
      dto.email,
      dto.role ?? "MEMBER",
    );
  }

  @Post("invitations/accept")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Accept an invitation with its token" })
  async acceptInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AcceptInvitationDto,
  ): Promise<void> {
    return this.organizations.acceptInvitation(dto.token, user.userId);
  }

  @Delete("organization/invitations/:invitationId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Cancel a pending invitation" })
  async cancelInvitation(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("invitationId") invitationId: string,
  ): Promise<void> {
    return this.organizations.cancelInvitation(organization.organizationId, invitationId, user.userId);
  }

  // ---------------- Groups ----------------

  @Get("organization/groups")
  @UseGuards(TenantGuard)
  @ApiOperation({ summary: "List groups in the active organization" })
  async listGroups(@CurrentOrganization() organization: OrganizationContext) {
    return this.organizations.listGroups(organization.organizationId);
  }

  @Post("organization/groups")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Create a manual group" })
  async createGroup(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateGroupDto,
  ) {
    return this.organizations.createGroup(organization.organizationId, user.userId, dto);
  }

  @Patch("organization/groups/:groupId")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
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
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
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
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
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
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Remove a member from a group" })
  async removeGroupMember(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
    @Param("userId") userId: string,
  ): Promise<void> {
    return this.organizations.removeGroupMember(organization.organizationId, groupId, userId);
  }

  @Post("organization/groups/:groupId/sync")
  @UseGuards(TenantGuard, OrgRolesGuard)
  @OrgRoles("OWNER", "ADMIN")
  @ApiOperation({ summary: "Re-evaluate a dynamic group's rule and sync membership" })
  async syncDynamicGroup(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("groupId") groupId: string,
  ) {
    return this.organizations.syncDynamicGroup(organization.organizationId, groupId, user.userId);
  }
}
