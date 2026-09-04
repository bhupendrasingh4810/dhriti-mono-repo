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

import { CadenceService } from "./cadence.service";
import {
  CreateCardDto,
  CreateSessionDto,
  GroupCardDto,
  UpdatePhaseDto,
  VoteCardDto,
} from "./dto/cadence.dto";

@ApiTags("cadence")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/cadence")
export class CadenceController {
  constructor(private readonly cadence: CadenceService) {}

  @Get("sessions")
  @ApiOperation({ summary: "List retrospective/estimation sessions" })
  async listSessions(@CurrentOrganization() organization: OrganizationContext) {
    return this.cadence.listSessions(organization.organizationId);
  }

  @Post("sessions")
  @ApiOperation({ summary: "Create a session; the creator becomes facilitator" })
  async createSession(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateSessionDto,
  ) {
    return this.cadence.createSession(organization.organizationId, user.userId, dto);
  }

  @Get("sessions/:sessionId")
  @ApiOperation({ summary: "Get a session with cards and vote counts (authors hidden when anonymous)" })
  async getSession(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
  ) {
    return this.cadence.getSession(organization.organizationId, sessionId, user.userId);
  }

  @Patch("sessions/:sessionId/phase")
  @ApiOperation({ summary: "Move the session to a new phase (facilitator only)" })
  async setPhase(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
    @Body() dto: UpdatePhaseDto,
  ) {
    return this.cadence.setPhase(organization.organizationId, sessionId, user.userId, dto.phase);
  }

  // ---------------- Cards ----------------

  @Post("sessions/:sessionId/cards")
  @ApiOperation({ summary: "Add a card during the collect phase" })
  async addCard(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
    @Body() dto: CreateCardDto,
  ) {
    return this.cadence.addCard(organization.organizationId, sessionId, user.userId, dto);
  }

  @Patch("sessions/:sessionId/cards/:cardId/group")
  @ApiOperation({ summary: "Group/ungroup a card (facilitator only)" })
  async groupCard(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
    @Param("cardId") cardId: string,
    @Body() dto: GroupCardDto,
  ) {
    return this.cadence.groupCard(organization.organizationId, sessionId, cardId, user.userId, dto);
  }

  @Delete("sessions/:sessionId/cards/:cardId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a card (author or facilitator)" })
  async deleteCard(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
    @Param("cardId") cardId: string,
  ): Promise<void> {
    return this.cadence.deleteCard(organization.organizationId, sessionId, cardId, user.userId);
  }

  // ---------------- Voting ----------------

  @Post("sessions/:sessionId/votes")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Vote for a card during the vote phase (one per user per card)" })
  async vote(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
    @Body() dto: VoteCardDto,
  ): Promise<void> {
    return this.cadence.vote(organization.organizationId, sessionId, dto.cardId, user.userId);
  }

  @Delete("sessions/:sessionId/votes/:cardId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove your vote from a card" })
  async unvote(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("sessionId") sessionId: string,
    @Param("cardId") cardId: string,
  ): Promise<void> {
    return this.cadence.unvote(organization.organizationId, sessionId, cardId, user.userId);
  }
}
