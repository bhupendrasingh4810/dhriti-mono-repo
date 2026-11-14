import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { CreateHrmsPayrollDto } from "../dto/hrms-operations.dto";
import { HrmsPayrollService } from "../services/hrms-payroll.service";
import { HrmsPayrollWorkspaceService } from "../services/hrms-payroll-workspace.service";
import {
  ExpenseClaimDto,
  PayrollProfileDto,
  PayrollRunDto,
  PayrollRunDecisionDto,
  SalaryAssignmentDto,
  SalaryStructureDto,
  SandboxPaymentDto,
  VariablePayInputDto,
} from "../dto/hrms-payroll-workspace.dto";

const READ = { entitlement: "hrms.enabled", permission: "hrms.payroll.read" };
const MANAGE = { entitlement: "hrms.enabled", permission: "hrms.payroll.manage" };
const APPROVE = { entitlement: "hrms.enabled", permission: "hrms.payroll.approve" };

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/payroll")
export class HrmsPayrollController {
  constructor(
    private readonly payroll: HrmsPayrollService,
    private readonly workspace: HrmsPayrollWorkspaceService,
  ) {}
  @Get("workspace")
  @RequireAccess(READ)
  getWorkspace(@CurrentOrganization() org: OrganizationContext) {
    return this.workspace.workspace(org.organizationId);
  }
  @Get("profiles/:id/periods")
  @RequireAccess(READ)
  calendar(
    @CurrentOrganization() org: OrganizationContext,
    @Param("id", ParseUUIDPipe) id: string,
    @Query("year", ParseIntPipe) year: number,
  ) {
    return this.workspace.calendar(org.organizationId, id, year);
  }
  @Post("profiles")
  @RequireAccess(MANAGE)
  profile(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PayrollProfileDto,
  ) {
    return this.workspace.profile(org.organizationId, user.userId, dto);
  }
  @Patch("profiles/:id/verify")
  @RequireAccess(MANAGE)
  verifyProfile(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.verifyProfile(org.organizationId, user.userId, id);
  }
  @Post("structures")
  @RequireAccess(MANAGE)
  structure(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SalaryStructureDto,
  ) {
    return this.workspace.structure(org.organizationId, user.userId, dto);
  }
  @Post("assignments")
  @RequireAccess(MANAGE)
  assign(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SalaryAssignmentDto,
  ) {
    return this.workspace.assign(org.organizationId, user.userId, dto);
  }
  @Post("claims")
  @RequireAccess(MANAGE)
  claim(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExpenseClaimDto,
  ) {
    return this.workspace.claim(org.organizationId, user.userId, dto);
  }
  @Patch("claims/:id/approve")
  @RequireAccess(APPROVE)
  approveClaim(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.approveClaim(org.organizationId, user.userId, id);
  }
  @Post("runs/preview")
  @RequireAccess(READ)
  preview(@CurrentOrganization() org: OrganizationContext, @Body() dto: PayrollRunDto) {
    return this.workspace.preview(org.organizationId, dto);
  }
  @Post("variable-inputs")
  @RequireAccess(MANAGE)
  variableInput(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: VariablePayInputDto,
  ) {
    return this.workspace.variableInput(org.organizationId, user.userId, dto);
  }
  @Post("variable-inputs/:id/approve")
  @RequireAccess(APPROVE)
  approveVariable(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.decideVariable(org.organizationId, user.userId, id, { action: "APPROVE" });
  }
  @Post("variable-inputs/:id/reject")
  @RequireAccess(APPROVE)
  rejectVariable(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.decideVariable(org.organizationId, user.userId, id, { action: "REJECT" });
  }
  @Post("variable-inputs/:id/cancel")
  @RequireAccess(MANAGE)
  cancelVariable(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.decideVariable(org.organizationId, user.userId, id, { action: "CANCEL" });
  }
  @Post("runs")
  @RequireAccess(MANAGE)
  run(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: PayrollRunDto,
  ) {
    return this.workspace.createRun(org.organizationId, user.userId, dto);
  }
  @Patch("runs/:id/approve")
  @RequireAccess(APPROVE)
  approveRun(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.transition(org.organizationId, user.userId, id, "approve");
  }
  @Post("runs/:id/process")
  @RequireAccess(MANAGE)
  processRun(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.workspace.transition(org.organizationId, user.userId, id, "process");
  }
  @Post("runs/:id/cancel")
  @RequireAccess(MANAGE)
  cancelRun(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: PayrollRunDecisionDto,
  ) {
    return this.workspace.closeDraft(org.organizationId, user.userId, id, "cancel", dto.reason);
  }
  @Post("runs/:id/reject")
  @RequireAccess(APPROVE)
  rejectRun(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: PayrollRunDecisionDto,
  ) {
    return this.workspace.closeDraft(org.organizationId, user.userId, id, "reject", dto.reason);
  }
  @Post("runs/:id/sandbox-payment")
  @RequireAccess(APPROVE)
  sandbox(
    @CurrentOrganization() org: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: SandboxPaymentDto,
  ) {
    return this.workspace.sandbox(org.organizationId, user.userId, id, dto);
  }
  @Get() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.read" }) list(
    @CurrentOrganization() organization: OrganizationContext,
  ) {
    return this.payroll.list(organization.organizationId);
  }
  @Post() @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.manage" }) create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsPayrollDto,
  ) {
    return this.payroll.create(organization.organizationId, user.userId, dto);
  }
  @Patch(":payrollId/approve")
  @RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.payroll.approve" })
  approve(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("payrollId") payrollId: string,
  ) {
    return this.payroll.approve(organization.organizationId, payrollId, user.userId);
  }
}
