import { Body, Controller, Delete, Get, Param, ParseEnumPipe, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { LegalDocumentType } from "@prisma/client";

import { Public } from "../../../../../common/decorators/public.decorator";
import { PlatformRoles } from "../../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../../common/guards/platform-roles.guard";

import { LegalDocumentService } from "./legal-document.service";
import { CreateLegalDocumentDto, UpdateLegalDocumentDto } from "./dto/legal-document.dto";

@ApiTags("content/legal-documents")
@Controller("content/legal-documents")
export class LegalDocumentController {
  constructor(private readonly legalDocuments: LegalDocumentService) {}

  @Public()
  @Get(":type/published")
  @ApiOperation({ summary: "Get the currently published document for a type" })
  async getPublished(@Param("type", new ParseEnumPipe(LegalDocumentType)) type: LegalDocumentType) {
    return this.legalDocuments.getPublished(type);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Get(":type")
  @ApiOperation({ summary: "List all versions of a document type (admin)" })
  async listByType(@Param("type", new ParseEnumPipe(LegalDocumentType)) type: LegalDocumentType) {
    return this.legalDocuments.listByType(type);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Get("id/:id")
  @ApiOperation({ summary: "Get a document version by id (admin)" })
  async getById(@Param("id") id: string) {
    return this.legalDocuments.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a new document version (admin)" })
  async create(@Body() dto: CreateLegalDocumentDto) {
    return this.legalDocuments.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a document's title/content (admin)" })
  async update(@Param("id") id: string, @Body() dto: UpdateLegalDocumentDto) {
    return this.legalDocuments.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post(":id/publish")
  @ApiOperation({ summary: "Publish a document version (admin)" })
  async publish(@Param("id") id: string) {
    return this.legalDocuments.publish(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post(":id/unpublish")
  @ApiOperation({ summary: "Unpublish a document version (admin)" })
  async unpublish(@Param("id") id: string) {
    return this.legalDocuments.unpublish(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a document version (admin)" })
  async remove(@Param("id") id: string): Promise<void> {
    return this.legalDocuments.remove(id);
  }
}
