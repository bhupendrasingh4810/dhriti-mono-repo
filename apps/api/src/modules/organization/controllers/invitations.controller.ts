import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import {
    CurrentUser,
    type AuthenticatedUser,
} from "../../../common/decorators/current-user.decorator";
import {
    CurrentOrganization,
    type OrganizationContext,
} from "../../../common/decorators/organization.decorator";
import { RequirePermission } from "../../../common/decorators/access.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";

import { InvitationsService } from "../services/invitations.service";
import { SessionService } from "../../auth/services/session.service";
import {
    AcceptInvitationDto,
    CreateInvitationDto,
} from "../dto/invitation.dto";

@ApiTags("organizations")
@ApiBearerAuth()
@Controller()
export class InvitationsController {
    constructor(
        private readonly invitations: InvitationsService,
        private readonly sessions: SessionService,
    ) { }
    // ---------------- Invitations ----------------

    @Get("organization/invitations")
    @UseGuards(TenantGuard, AccessGuard)
    @RequirePermission("organization.members.read")
    @ApiOperation({ summary: "List invitations (auto-expires stale pending ones)" })
    async listInvitations(@CurrentOrganization() organization: OrganizationContext) {
        return this.invitations.listInvitations(organization.organizationId);
    }

    @Post("organization/invitations")
    @UseGuards(TenantGuard, AccessGuard)
    @RequirePermission("organization.members.invite")
    @ApiOperation({ summary: "Invite a user by email" })
    async createInvitation(
        @CurrentUser() user: AuthenticatedUser,
        @CurrentOrganization() organization: OrganizationContext,
        @Body() dto: CreateInvitationDto,
    ) {
        return this.invitations.createInvitation(
            organization,
            user,
            dto.email,
        );
    }

    @Post("organization/invitations/bulk")
    @UseGuards(TenantGuard, AccessGuard)
    @RequirePermission("organization.members.invite")
    @ApiOperation({ summary: "Invite multiple users by email" })
    async bulkInvitation(
        @CurrentUser() user: AuthenticatedUser,
        @CurrentOrganization() organization: OrganizationContext,
        @Body() dto: { emails: string },
    ) {
        return this.invitations.bulkInvitation(
            organization,
            user,
            dto.emails.split(','),
        );
    }

    @Post("invitations/accept")
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: "Accept an invitation with its token" })
    async acceptInvitation(
        @CurrentUser() user: AuthenticatedUser,
        @Body() dto: AcceptInvitationDto,
    ): Promise<void> {
        return this.invitations.acceptInvitation(dto.token, user.userId);
    }

    @Delete("organization/invitations/:invitationId")
    @HttpCode(HttpStatus.NO_CONTENT)
    @UseGuards(TenantGuard, AccessGuard)
    @RequirePermission("organization.members.invite")
    @ApiOperation({ summary: "Cancel a pending invitation" })
    async cancelInvitation(
        @CurrentUser() user: AuthenticatedUser,
        @CurrentOrganization() organization: OrganizationContext,
        @Param("invitationId") invitationId: string,
    ): Promise<void> {
        return this.invitations.cancelInvitation(organization.organizationId, invitationId, user.userId);
    }
}
