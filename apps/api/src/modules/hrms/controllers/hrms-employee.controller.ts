import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsEmployeeDto, UpdateHrmsEmployeeDto } from "../dto/hrms-employee.dto";
import { HrmsEmployeeService } from "../services/hrms-employee.service";

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/employees")
export class HrmsEmployeeController {
  constructor(private readonly employees: HrmsEmployeeService) {}

  @Get() 
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.employee.read" })
  list(@CurrentOrganization() organization: OrganizationContext) { 
    return this.employees.list(organization.organizationId); 
}

  @Get(":employeeId") 
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.employee.read" })
  get(@CurrentOrganization() organization: OrganizationContext, @Param("employeeId") employeeId: string) { 
    return this.employees.get(organization.organizationId, employeeId); }

  @Post() 
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.employee.manage" })
  create(
    @CurrentOrganization() organization: OrganizationContext, 
    @CurrentUser() user: AuthenticatedUser, 
    @Body() dto: CreateHrmsEmployeeDto) { 
        return this.employees.create(organization.organizationId, user.userId, dto); 
    }

  @Patch(":employeeId") 
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.employee.manage" })
  update(
    @CurrentOrganization() organization: OrganizationContext, 
    @CurrentUser() user: AuthenticatedUser, 
    @Param("employeeId") employeeId: string, 
    @Body() dto: UpdateHrmsEmployeeDto) { 
        return this.employees.update(organization.organizationId, employeeId, user.userId, dto); 
    }

  @Delete(":employeeId") 
  @HttpCode(HttpStatus.NO_CONTENT) 
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.employee.manage" })
  delete(
    @CurrentOrganization() organization: OrganizationContext, 
    @CurrentUser() user: AuthenticatedUser, 
    @Param("employeeId") employeeId: string) { 
        return this.employees.delete(organization.organizationId, employeeId, user.userId); 
    }
}