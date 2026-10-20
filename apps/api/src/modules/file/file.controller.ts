import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { ApiConfigService } from "../../config/config.service";

import { FileService, type UploadedFileInput } from "./file.service";

interface UploadedMultipartFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@ApiTags("files")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/files")
export class FileController {
  constructor(
    private readonly files: FileService,
    private readonly config: ApiConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Upload a file to the active organization" })
  @ApiConsumes("multipart/form-data")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: { files: 1 },
      storage: undefined, // memory storage; validated + streamed to S3 by the service
    }),
  )
  async upload(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @UploadedFile() file: UploadedMultipartFile | undefined,
    @Ip() ip: string,
    @Req() request: Request,
  ) {
    if (!file) {
      throw new AppError(ErrorCode.FILE_EMPTY, 'No file provided in the "file" field', HttpStatus.BAD_REQUEST);
    }

    const input: UploadedFileInput = {
      originalName: file.originalname,
      contentType: file.mimetype,
      data: file.buffer,
    };

    const userAgentHeader = request.headers["user-agent"];
    return this.files.upload(organization.organizationId, user.userId, input, {
      ipAddress: ip,
      userAgent: Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader,
    });
  }

  @Get()
  @ApiOperation({ summary: "List files in the active organization" })
  async list(@CurrentOrganization() organization: OrganizationContext) {
    return this.files.listFiles(organization.organizationId);
  }

  @Get(":fileId/download")
  @ApiOperation({ summary: "Get a short-lived presigned download URL" })
  async download(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("fileId") fileId: string,
    @Ip() ip: string,
    @Req() request: Request,
  ): Promise<{ url: string; expiresIn: number }> {
    const userAgentHeader = request.headers["user-agent"];
    return this.files.getDownloadUrl(organization.organizationId, fileId, user.userId, {
      ipAddress: ip,
      userAgent: Array.isArray(userAgentHeader) ? userAgentHeader[0] : userAgentHeader,
    });
  }

  @Delete(":fileId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a file (uploader only)" })
  async delete(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("fileId") fileId: string,
  ): Promise<void> {
    return this.files.delete(organization.organizationId, fileId, user.userId);
  }
}
