import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../../../../common/decorators/public.decorator";
import { PlatformRoles } from "../../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../../common/guards/platform-roles.guard";

import { FaqService } from "./faq.service";
import {
  CreateFaqGroupDto,
  CreateFaqItemDto,
  UpdateFaqGroupDto,
  UpdateFaqItemDto,
} from "./dto/faq.dto";

@ApiTags("content/faq")
@Controller("content/faq")
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Public()
  @Get("groups")
  @ApiOperation({ summary: "List FAQ groups with published items only" })
  async listPublicGroups() {
    return this.faq.listGroups(false);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Get("groups/admin")
  @ApiOperation({ summary: "List FAQ groups including draft items (admin)" })
  async listAdminGroups() {
    return this.faq.listGroups(true);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post("groups")
  @ApiOperation({ summary: "Create a FAQ group (admin)" })
  async createGroup(@Body() dto: CreateFaqGroupDto) {
    return this.faq.createGroup(dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Patch("groups/:groupId")
  @ApiOperation({ summary: "Update a FAQ group (admin)" })
  async updateGroup(@Param("groupId") groupId: string, @Body() dto: UpdateFaqGroupDto) {
    return this.faq.updateGroup(groupId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Delete("groups/:groupId")
  @ApiOperation({ summary: "Delete a FAQ group and its items (admin)" })
  async removeGroup(@Param("groupId") groupId: string): Promise<void> {
    return this.faq.removeGroup(groupId);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post("groups/:groupId/items")
  @ApiOperation({ summary: "Create a FAQ item within a group (admin)" })
  async createItem(@Param("groupId") groupId: string, @Body() dto: CreateFaqItemDto) {
    return this.faq.createItem(groupId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Patch("items/:itemId")
  @ApiOperation({ summary: "Update a FAQ item (admin)" })
  async updateItem(@Param("itemId") itemId: string, @Body() dto: UpdateFaqItemDto) {
    return this.faq.updateItem(itemId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Delete("items/:itemId")
  @ApiOperation({ summary: "Delete a FAQ item (admin)" })
  async removeItem(@Param("itemId") itemId: string): Promise<void> {
    return this.faq.removeItem(itemId);
  }
}
