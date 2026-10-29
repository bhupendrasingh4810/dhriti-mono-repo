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
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { CurrentUser, type AuthenticatedUser } from "../../common/decorators/current-user.decorator";
import { CurrentOrganization, type OrganizationContext } from "../../common/decorators/organization.decorator";
import { TenantGuard } from "../../common/guards/tenant.guard";
import {
  CreateNoteDto,
  CreateNoteFolderDto,
  DeleteNoteFolderDto,
  ListNotesQueryDto,
  UpdateNoteDto,
  UpdateNoteFolderDto,
  UpdateNoteOrderDto,
  CreateNoteAccessRequestDto,
  ReviewNoteAccessRequestDto,
} from "./dto/notes.dto";
import { NotesService } from "./notes.service";

@ApiTags("notes")
@ApiBearerAuth()
@UseGuards(TenantGuard)
@Controller("organization/notes")
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get("tree")
  @ApiOperation({ summary: "Get the current user's note tree and shared notes" })
  tree(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.notes.tree(organization.organizationId, user.userId);
  }

  @Get()
  @ApiOperation({ summary: "List all accessible notes, optionally filtered by folderId" })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Query() query: ListNotesQueryDto,
  ) {
    return this.notes.list(organization.organizationId, user.userId, query);
  }

  @Post("folders")
  createFolder(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateNoteFolderDto,
  ) {
    return this.notes.createFolder(organization.organizationId, user.userId, dto);
  }

  @Get("folders/:folderId")
  getFolder(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("folderId") folderId: string,
  ) {
    return this.notes.getFolder(organization.organizationId, user.userId, folderId);
  }

  @Patch("folders/:folderId")
  updateFolder(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("folderId") folderId: string,
    @Body() dto: UpdateNoteFolderDto,
  ) {
    return this.notes.updateFolder(organization.organizationId, user.userId, folderId, dto);
  }

  @Delete("folders/:folderId")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteFolder(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("folderId") folderId: string,
    @Body() dto: DeleteNoteFolderDto = {},
  ): Promise<void> {
    return this.notes.deleteFolder(organization.organizationId, user.userId, folderId, dto);
  }

  @Patch("order")
  @ApiOperation({ summary: "Save the current user's note ordering for All notes or one folder" })
  saveOrder(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: UpdateNoteOrderDto,
  ) {
    return this.notes.saveOrder(organization.organizationId, user.userId, dto);
  }

  @Post()
  createNote(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notes.createNote(organization.organizationId, user.userId, dto);
  }

  @Get("requests")
  listRequests(@CurrentUser() user: AuthenticatedUser, @CurrentOrganization() organization: OrganizationContext) {
    return this.notes.listRequests(organization.organizationId, user.userId);
  }

  @Post(":noteId/requests")
  requestAccess(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("noteId") noteId: string,
    @Body() dto: CreateNoteAccessRequestDto,
  ) {
    return this.notes.requestAccess(organization.organizationId, user.userId, noteId, dto);
  }

  @Patch("requests/:requestId")
  reviewRequest(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("requestId") requestId: string,
    @Body() dto: ReviewNoteAccessRequestDto,
  ) {
    return this.notes.reviewRequest(organization.organizationId, user.userId, requestId, dto);
  }

  @Get(":noteId")
  getNote(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("noteId") noteId: string,
  ) {
    return this.notes.getNote(organization.organizationId, user.userId, noteId);
  }

  @Patch(":noteId")
  updateNote(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("noteId") noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notes.updateNote(organization.organizationId, user.userId, noteId, dto);
  }

  @Delete(":noteId")
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("noteId") noteId: string,
  ): Promise<void> {
    return this.notes.deleteNote(organization.organizationId, user.userId, noteId);
  }
}
