import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import {
  CreateHrmsEmployeeDto,
  EmployeeTemplateQueryDto,
  ExportHrmsEmployeesDto,
  ImportEmployeesDto,
  ListHrmsEmployeesDto,
  UpdateHrmsEmployeeDto,
} from "../dto/hrms-employee.dto";
import { EMPLOYEE_IMPORT_MAX_BYTES, HrmsEmployeeImportService } from "../services/hrms-employee-import.service";
import { HrmsEmployeeService } from "../services/hrms-employee.service";

const WORKFORCE = { entitlement: "hrms.enabled", permission: "hrms.employee.manage" };

interface UploadedMultipartFile {
  buffer: Buffer;
  originalname: string;
  size: number;
}

/**
 * Static routes (access, options, me/shift, me/start-date, org-chart, import/*, export) are declared before ":employeeId"
 * so they are never captured by the parameterised route.
 */
@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/hrms/employees")
export class HrmsEmployeeController {
  constructor(
    private readonly employees: HrmsEmployeeService,
    private readonly imports: HrmsEmployeeImportService,
  ) {}

  @Get()
  @RequireAccess(WORKFORCE)
  list(@CurrentOrganization() organization: OrganizationContext, @Query() query: ListHrmsEmployeesDto) {
    return this.employees.list(organization.organizationId, query);
  }

  /** Any organization member may read their own shift (Home attendance card, Pulse calendar). */
  @Get("me/shift")
  myShift(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.employees.myShift(organization.organizationId, user.userId);
  }

  /** Any organization member may read their own joining date (attendance log lower bound). */
  @Get("me/start-date")
  myStartDate(@CurrentOrganization() organization: OrganizationContext, @CurrentUser() user: AuthenticatedUser) {
    return this.employees.myStartDate(organization.organizationId, user.userId);
  }

  @Get("options")
  @RequireAccess(WORKFORCE)
  options(@CurrentOrganization() organization: OrganizationContext) {
    return this.employees.options(organization.organizationId);
  }

  @Get("org-chart")
  @RequireAccess(WORKFORCE)
  orgChart(@CurrentOrganization() organization: OrganizationContext) {
    return this.employees.orgChart(organization.organizationId);
  }

  @Get("import/template")
  @RequireAccess(WORKFORCE)
  @Header("Cache-Control", "no-store")
  async template(@Query() query: EmployeeTemplateQueryDto, @Res({ passthrough: true }) response: Response) {
    const file = await this.imports.buildTemplate(query.format);
    return this.attach(response, file);
  }

  @Post("import/parse")
  @HttpCode(HttpStatus.OK)
  @RequireAccess(WORKFORCE)
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file", { limits: { files: 1, fileSize: EMPLOYEE_IMPORT_MAX_BYTES } }))
  parse(@UploadedFile() file: UploadedMultipartFile | undefined) {
    return this.imports.parseUpload(file);
  }

  @Post("import/validate")
  @HttpCode(HttpStatus.OK)
  @RequireAccess(WORKFORCE)
  validateImport(@CurrentOrganization() organization: OrganizationContext, @Body() dto: ImportEmployeesDto) {
    return this.imports.validate(organization.organizationId, dto.rows);
  }

  @Post("import")
  @RequireAccess(WORKFORCE)
  import(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ImportEmployeesDto,
  ) {
    return this.imports.importRows(organization.organizationId, user.userId, dto.rows);
  }

  @Post("export")
  @HttpCode(HttpStatus.OK)
  @RequireAccess(WORKFORCE)
  @Header("Cache-Control", "no-store")
  async export(
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: ExportHrmsEmployeesDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const filtered = dto.scope === "filtered";
    const rows = await this.employees.listForExport(
      organization.organizationId,
      filtered ? { query: dto.query, status: dto.status, departmentId: dto.departmentId } : {},
      { ids: dto.scope === "selected" ? (dto.ids ?? []) : undefined, sortBy: dto.sortBy, sortOrder: dto.sortOrder },
    );
    return this.attach(response, await this.imports.buildExport(dto.format, rows));
  }

  @Get(":employeeId")
  @RequireAccess(WORKFORCE)
  get(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
  ) {
    return this.employees.get(organization.organizationId, employeeId);
  }

  @Post()
  @RequireAccess(WORKFORCE)
  create(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateHrmsEmployeeDto,
  ) {
    return this.employees.create(organization.organizationId, user.userId, dto);
  }

  @Patch(":employeeId")
  @RequireAccess(WORKFORCE)
  update(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
    @Body() dto: UpdateHrmsEmployeeDto,
  ) {
    return this.employees.update(organization.organizationId, employeeId, user.userId, dto);
  }

  @Delete(":employeeId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequireAccess(WORKFORCE)
  delete(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
  ) {
    return this.employees.delete(organization.organizationId, employeeId, user.userId);
  }

  private attach(response: Response, file: { buffer: Buffer; contentType: string; fileName: string }) {
    response.setHeader("Content-Type", file.contentType);
    response.setHeader("Content-Disposition", `attachment; filename="${file.fileName}"`);
    return new StreamableFile(file.buffer);
  }
}
