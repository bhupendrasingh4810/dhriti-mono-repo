import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../../../../../common/decorators/public.decorator";
import { PlatformRoles } from "../../../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../../../common/guards/platform-roles.guard";

import { BlogPostService } from "./blog-post.service";
import { CreateBlogPostDto, UpdateBlogPostDto } from "./dto/blog-post.dto";

@ApiTags("content/blogs/posts")
@Controller("content/blogs/posts")
export class BlogPostController {
  constructor(private readonly posts: BlogPostService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List published blog posts" })
  async listPublished() {
    return this.posts.list(false);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Get("admin")
  @ApiOperation({ summary: "List all blog posts including unpublished (admin)" })
  async listAll() {
    return this.posts.list(true);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get a published blog post by slug" })
  async getBySlug(@Param("slug") slug: string) {
    return this.posts.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a blog post (admin)" })
  async create(@Body() dto: CreateBlogPostDto) {
    return this.posts.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a blog post (admin)" })
  async update(@Param("id") id: string, @Body() dto: UpdateBlogPostDto) {
    return this.posts.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post(":id/publish")
  @ApiOperation({ summary: "Publish a blog post (admin)" })
  async publish(@Param("id") id: string) {
    return this.posts.publish(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Post(":id/unpublish")
  @ApiOperation({ summary: "Unpublish a blog post (admin)" })
  async unpublish(@Param("id") id: string) {
    return this.posts.unpublish(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("SUPER_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a blog post (admin)" })
  async remove(@Param("id") id: string): Promise<void> {
    return this.posts.remove(id);
  }
}
