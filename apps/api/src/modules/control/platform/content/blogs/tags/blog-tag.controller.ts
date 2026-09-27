import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../../../../../common/decorators/public.decorator";
import { PlatformRoles } from "../../../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../../../common/guards/platform-roles.guard";

import { BlogTagService } from "./blog-tag.service";
import { CreateBlogTagDto, UpdateBlogTagDto } from "./dto/blog-tag.dto";

@ApiTags("content/blogs/tags")
@Controller("content/blogs/tags")
export class BlogTagController {
  constructor(private readonly tags: BlogTagService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List blog tags" })
  async list() {
    return this.tags.list();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a blog tag by id" })
  async getById(@Param("id") id: string) {
    return this.tags.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a blog tag (admin)" })
  async create(@Body() dto: CreateBlogTagDto) {
    return this.tags.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a blog tag (admin)" })
  async update(@Param("id") id: string, @Body() dto: UpdateBlogTagDto) {
    return this.tags.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a blog tag (admin)" })
  async remove(@Param("id") id: string): Promise<void> {
    return this.tags.remove(id);
  }
}
