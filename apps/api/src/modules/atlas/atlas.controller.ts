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
import { RequireAccess } from "../../common/decorators/access.decorator";
import { AccessGuard } from "../../common/guards/access.guard";
import { TenantGuard } from "../../common/guards/tenant.guard";

import { AtlasService } from "./atlas.service";
import { CreateSpaceDto, UpdateSpaceDto } from "./dto/space.dto";
import { CreateCommentDto, CreatePageDto, UpdatePageDto } from "./dto/page.dto";

@ApiTags("atlas")
@ApiBearerAuth()
@UseGuards(TenantGuard, AccessGuard)
@Controller("organization/atlas")
export class AtlasController {
  constructor(private readonly atlas: AtlasService) {}

  // ---------------- Spaces ----------------

  @Get("spaces")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.space.read" })
  @ApiOperation({ summary: "List spaces in the active organization" })
  async listSpaces(@CurrentOrganization() organization: OrganizationContext) {
    return this.atlas.listSpaces(organization.organizationId);
  }

  @Post("spaces")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.space.create" })
  @ApiOperation({ summary: "Create a space (unique uppercase key)" })
  async createSpace(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Body() dto: CreateSpaceDto,
  ) {
    return this.atlas.createSpace(organization.organizationId, user.userId, dto);
  }

  @Patch("spaces/:spaceId")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.space.create" })
  @ApiOperation({ summary: "Update a space" })
  async updateSpace(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("spaceId") spaceId: string,
    @Body() dto: UpdateSpaceDto,
  ) {
    return this.atlas.updateSpace(organization.organizationId, spaceId, user.userId, dto);
  }

  @Delete("spaces/:spaceId")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.space.create" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete a space and its pages" })
  async deleteSpace(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("spaceId") spaceId: string,
  ): Promise<void> {
    return this.atlas.deleteSpace(organization.organizationId, spaceId, user.userId);
  }

  // ---------------- Pages ----------------

  @Get("spaces/:spaceId/pages")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.read" })
  @ApiOperation({ summary: "List pages in a space (ordered tree data)" })
  async listPages(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("spaceId") spaceId: string,
  ) {
    return this.atlas.listPages(organization.organizationId, spaceId);
  }

  @Post("spaces/:spaceId/pages")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.create" })
  @ApiOperation({ summary: "Create a page (supports parentId for nesting)" })
  async createPage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("spaceId") spaceId: string,
    @Body() dto: CreatePageDto,
  ) {
    return this.atlas.createPage(organization.organizationId, spaceId, user.userId, dto);
  }

  @Get("pages/:pageId")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.read" })
  @ApiOperation({ summary: "Get a page" })
  async getPage(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("pageId") pageId: string,
  ) {
    return this.atlas.getPage(organization.organizationId, pageId);
  }

  @Patch("pages/:pageId")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.update" })
  @ApiOperation({ summary: "Update a page; content change bumps version" })
  async updatePage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("pageId") pageId: string,
    @Body() dto: UpdatePageDto,
  ) {
    return this.atlas.updatePage(organization.organizationId, pageId, user.userId, dto);
  }

  @Delete("pages/:pageId")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Soft-delete a page and its subtree" })
  async deletePage(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("pageId") pageId: string,
  ): Promise<void> {
    return this.atlas.deletePage(organization.organizationId, pageId, user.userId);
  }

  // ---------------- Comments ----------------

  @Get("pages/:pageId/comments")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.read" })
  @ApiOperation({ summary: "List comments on a page" })
  async listComments(
    @CurrentOrganization() organization: OrganizationContext,
    @Param("pageId") pageId: string,
  ) {
    return this.atlas.listComments(organization.organizationId, pageId);
  }

  @Post("pages/:pageId/comments")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.update" })
  @ApiOperation({ summary: "Add a comment to a page" })
  async addComment(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("pageId") pageId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.atlas.addComment(organization.organizationId, pageId, user.userId, dto);
  }

  @Patch("comments/:commentId/resolve")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.update" })
  @ApiOperation({ summary: "Mark a comment resolved or unresolved" })
  async resolveComment(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("commentId") commentId: string,
    @Body("isResolved") isResolved: boolean,
  ) {
    return this.atlas.resolveComment(organization.organizationId, commentId, user.userId, isResolved === true);
  }

  @Delete("comments/:commentId")
  @RequireAccess({ entitlement: "atlas.enabled", permission: "atlas.page.update" })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a comment (author only)" })
  async deleteComment(
    @CurrentUser() user: AuthenticatedUser,
    @CurrentOrganization() organization: OrganizationContext,
    @Param("commentId") commentId: string,
  ): Promise<void> {
    return this.atlas.deleteComment(organization.organizationId, commentId, user.userId);
  }
}
