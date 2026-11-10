import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  CloneHrmsWorkflowDefinitionDto,
  CreateHrmsWorkflowDefinitionDto,
  ListHrmsWorkflowDefinitionsDto,
  UpdateHrmsWorkflowDefinitionDto,
} from "../dto/hrms-workflow-definition.dto";
import { HrmsWorkflowDefinitionService } from "../services/hrms-workflow-definition.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/workflow-definitions")
export class HrmsWorkflowDefinitionController {
  constructor(private readonly workflows: HrmsWorkflowDefinitionService) {}

  @Get()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  list(@CurrentOrganization() organization: OrganizationContext, @Query() query: ListHrmsWorkflowDefinitionsDto) {
    return this.workflows.list(organization.organizationId, query);
  }

  @Get("templates")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  listTemplates(@CurrentOrganization() organization: OrganizationContext) {
    return this.workflows.listTemplates(organization.organizationId);
  }

  @Get(":workflowId")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  get(@CurrentOrganization() organization: OrganizationContext, @Param("workflowId") workflowId: string) {
    return this.workflows.get(organization.organizationId, workflowId);
  }

  @Post()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.manage" })
  create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsWorkflowDefinitionDto,
  ) {
    return this.workflows.create(organization.organizationId, user.userId, dto);
  }

  @Patch(":workflowId")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.manage" })
  update(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("workflowId") workflowId: string,
    @Body() dto: UpdateHrmsWorkflowDefinitionDto,
  ) {
    return this.workflows.update(organization.organizationId, workflowId, user.userId, dto);
  }

  @Post(":workflowId/clone")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.manage" })
  clone(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("workflowId") workflowId: string,
    @Body() dto: CloneHrmsWorkflowDefinitionDto,
  ) {
    return this.workflows.clone(organization.organizationId, workflowId, user.userId, dto.name);
  }

  @Post(":workflowId/publish")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.manage" })
  publish(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("workflowId") workflowId: string,
  ) {
    return this.workflows.publish(organization.organizationId, workflowId, user.userId);
  }
}
