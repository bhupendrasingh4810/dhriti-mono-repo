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
import { OrgRoles } from "../../common/decorators/org-roles.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { OrgRolesGuard } from "../../common/guards/org-roles.guard";

import { WebhookService } from "./webhook.service";
import { CreateWebhookDto, UpdateWebhookDto } from "./dto/webhook.dto";

@ApiTags("webhooks")
@ApiBearerAuth()
@UseGuards(TenantGuard, OrgRolesGuard)
@OrgRoles("PLATFORM_ADMIN", "ADMIN", "ORG_ADMIN")
@Controller("organization/webhooks")
export class WebhookController {
  constructor(private readonly webhooks: WebhookService) {}

  @Get()
  @ApiOperation({ summary: "List webhooks (secrets redacted) — OWNER/ADMIN" })
  async list(@CurrentOrganization() organization: OrganizationContext) {
    return this.webhooks.list(organization.organizationId);
  }

  @Post()
  @ApiOperation({ summary: "Create a webhook; returns the signing secret once" })
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooks.create(organization.organizationId, user.userId, dto);
  }

  @Patch(":webhookId")
  @ApiOperation({ summary: "Update a webhook (url, events, active, description)" })
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("webhookId") webhookId: string,
    @Body() dto: UpdateWebhookDto,
  ) {
    return this.webhooks.update(organization.organizationId, webhookId, user.userId, dto);
  }

  @Post(":webhookId/rotate-secret")
  @ApiOperation({ summary: "Rotate the webhook signing secret" })
  async rotateSecret(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("webhookId") webhookId: string,
  ) {
    return this.webhooks.rotateSecret(organization.organizationId, webhookId, user.userId);
  }

  @Delete(":webhookId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete a webhook" })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("webhookId") webhookId: string,
  ): Promise<void> {
    return this.webhooks.delete(organization.organizationId, webhookId, user.userId);
  }

  @Get(":webhookId/deliveries")
  @ApiOperation({ summary: "List recent delivery attempts for a webhook" })
  async listDeliveries(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("webhookId") webhookId: string,
  ) {
    return this.webhooks.listDeliveries(organization.organizationId, webhookId);
  }
}
