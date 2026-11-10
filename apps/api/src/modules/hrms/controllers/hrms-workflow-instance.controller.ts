import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  ActOnHrmsWorkflowInstanceDto,
  CreateHrmsWorkflowInstanceDto,
  ListHrmsWorkflowInstancesDto,
} from "../dto/hrms-workflow-definition.dto";
import { HrmsWorkflowInstanceService } from "../services/hrms-workflow-instance.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/workflow-instances")
export class HrmsWorkflowInstanceController {
  constructor(private readonly instances: HrmsWorkflowInstanceService) {}

  @Get()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  list(@CurrentOrganization() organization: OrganizationContext, @Query() query: ListHrmsWorkflowInstancesDto) {
    return this.instances.list(organization.organizationId, query);
  }

  @Post()
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.manage" })
  create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsWorkflowInstanceDto,
  ) {
    return this.instances.create(organization.organizationId, user.userId, dto);
  }

  @Get(":instanceId")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  get(@CurrentOrganization() organization: OrganizationContext, @Param("instanceId") instanceId: string) {
    return this.instances.get(organization.organizationId, instanceId);
  }

  @Post(":instanceId/actions")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  act(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("instanceId") instanceId: string,
    @Body() dto: ActOnHrmsWorkflowInstanceDto,
  ) {
    return this.instances.act(organization.organizationId, instanceId, user.userId, dto);
  }

  @Get(":instanceId/assignments")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  assignments(@CurrentOrganization() organization: OrganizationContext, @Param("instanceId") instanceId: string) {
    return this.instances.listAssignments(organization.organizationId, instanceId);
  }

  @Get(":instanceId/history")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workflow.read" })
  history(@CurrentOrganization() organization: OrganizationContext, @Param("instanceId") instanceId: string) {
    return this.instances.listHistory(organization.organizationId, instanceId);
  }
}
