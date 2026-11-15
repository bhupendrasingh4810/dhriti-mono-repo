import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiTags } from "@nestjs/swagger";
import { RequireAccess } from "../../../common/decorators/access.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../../common/decorators/organization.decorator";
import { CurrentUser, type AuthenticatedUser } from "../../../common/decorators/current-user.decorator";
import { AccessGuard } from "../../../common/guards/access.guard";
import { TenantGuard } from "../../../common/guards/tenant.guard";
import { EmployeeTimelineQueryDto } from "../dto/hrms-employee.dto";
import { EMPLOYEE_DOCUMENT_MAX_BYTES, HrmsEmployeeDocumentService } from "../services/hrms-employee-document.service";

interface MultipartDocument {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
}

/** All employee document operations remain HR-managed until employee self-service visibility is defined. */
@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workforce.manage" })
@Controller("organization/hrms/employees/:employeeId/documents")
export class HrmsEmployeeDocumentController {
  constructor(private readonly documents: HrmsEmployeeDocumentService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
    @Query() query: EmployeeTimelineQueryDto,
  ) {
    return this.documents.list(organization.organizationId, employeeId, query);
  }

  @Post()
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { files: 1, fileSize: EMPLOYEE_DOCUMENT_MAX_BYTES, fields: 2, fieldSize: 1024 },
    }),
  )
  upload(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
    @Body() input: unknown,
    @UploadedFile() file: MultipartDocument | undefined,
  ) {
    return this.documents.upload(
      organization.organizationId,
      employeeId,
      user.userId,
      input,
      file ? { originalName: file.originalname, contentType: file.mimetype, data: file.buffer } : undefined,
    );
  }

  @Get(":documentId/download")
  @Header("Cache-Control", "no-store")
  download(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.documents.download(organization.organizationId, employeeId, documentId, user.userId);
  }

  @Post(":documentId/archive")
  @HttpCode(HttpStatus.NO_CONTENT)
  archive(
    @CurrentOrganization() organization: OrganizationContext,
    @CurrentUser() user: AuthenticatedUser,
    @Param("employeeId", ParseUUIDPipe) employeeId: string,
    @Param("documentId", ParseUUIDPipe) documentId: string,
  ) {
    return this.documents.archive(organization.organizationId, employeeId, documentId, user.userId);
  }
}

@ApiTags("hrms")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@RequireAccess({ entitlement: "hrms.enabled", permission: "hrms.workforce.manage" })
@Controller("organization/hrms/documents")
export class HrmsDocumentLibraryController {
  constructor(private readonly documents: HrmsEmployeeDocumentService) {}

  @Get()
  @Header("Cache-Control", "no-store")
  list(@CurrentOrganization() organization: OrganizationContext, @Query() query: EmployeeTimelineQueryDto) {
    return this.documents.list(organization.organizationId, undefined, query);
  }
}
