import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../../../../../common/decorators/public.decorator";
import { PlatformRoles } from "../../../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../../../common/guards/platform-roles.guard";

import { BlogCategoryService } from "./blog-category.service";
import { CreateBlogCategoryDto, UpdateBlogCategoryDto } from "./dto/blog-category.dto";

@ApiTags("content/blogs/categories")
@Controller("content/blogs/categories")
export class BlogCategoryController {
  constructor(private readonly categories: BlogCategoryService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List blog categories" })
  async list() {
    return this.categories.list();
  }

  @Public()
  @Get(":id")
  @ApiOperation({ summary: "Get a blog category by id" })
  async getById(@Param("id") id: string) {
    return this.categories.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a blog category (admin)" })
  async create(@Body() dto: CreateBlogCategoryDto) {
    return this.categories.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a blog category (admin)" })
  async update(@Param("id") id: string, @Body() dto: UpdateBlogCategoryDto) {
    return this.categories.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a blog category (admin)" })
  async remove(@Param("id") id: string): Promise<void> {
    return this.categories.remove(id);
  }
}
