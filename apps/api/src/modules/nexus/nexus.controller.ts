import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
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

import { NexusService, type ExtractedTask } from "./nexus.service";
import {
  AskDto,
  ExtractTasksDto,
  SummarizeConversationDto,
  SummarizePageDto,
} from "./dto/nexus.dto";

@ApiTags("nexus")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/nexus")
export class NexusController {
  constructor(private readonly nexus: NexusService) {}

  @Post("summarize/conversation")
  @ApiOperation({ summary: "Summarize a Connect channel into summary, decisions, action items" })
  async summarizeConversation(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: SummarizeConversationDto,
  ) {
    return this.nexus.summarizeConversation(
      organization.organizationId,
      user.userId,
      dto.channelId,
      dto.messageLimit,
    );
  }

  @Post("summarize/page")
  @ApiOperation({ summary: "Summarize an Atlas page" })
  async summarizePage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: SummarizePageDto,
  ) {
    return this.nexus.summarizePage(organization.organizationId, user.userId, dto.pageId);
  }

  @Post("extract-tasks")
  @ApiOperation({ summary: "Extract action items (title, assignee, due date, priority) from text" })
  async extractTasks(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: ExtractTasksDto,
  ): Promise<ExtractedTask[]> {
    return this.nexus.extractTasks(organization.organizationId, user.userId, dto.text);
  }

  @Post("ask")
  @ApiOperation({ summary: "Ask Nexus a question; pass conversationId to continue a thread" })
  async ask(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: AskDto,
  ): Promise<{ conversationId: string; answer: string }> {
    return this.nexus.ask(organization.organizationId, user.userId, dto.question, dto.conversationId);
  }

  @Get("conversations")
  @ApiOperation({ summary: "List the current user's Nexus conversations" })
  async listConversations(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.nexus.listConversations(organization.organizationId, user.userId);
  }

  @Get("tasks")
  @ApiOperation({ summary: "List the current user's Nexus AI tasks (summaries, extractions)" })
  async listTasks(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.nexus.listTasks(organization.organizationId, user.userId);
  }
}
