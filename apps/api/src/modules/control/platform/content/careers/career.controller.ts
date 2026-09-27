import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { Public } from "../../../../../common/decorators/public.decorator";
import { PlatformRoles } from "../../../../../common/decorators/platform-roles.decorator";
import { PlatformRolesGuard } from "../../../../../common/guards/platform-roles.guard";

import { CareerService } from "./career.service";
import { CreateJobPostDto, UpdateJobPostDto } from "./dto/career.dto";

@ApiTags("content/careers")
@Controller("content/careers")
export class CareerController {
  constructor(private readonly careers: CareerService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: "List published job posts" })
  async listPublished() {
    return this.careers.list(false);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Get("admin")
  @ApiOperation({ summary: "List all job posts including unpublished (admin)" })
  async listAll() {
    return this.careers.list(true);
  }

  @Public()
  @Get(":slug")
  @ApiOperation({ summary: "Get a published job post by slug" })
  async getBySlug(@Param("slug") slug: string) {
    return this.careers.findBySlug(slug);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Post()
  @ApiOperation({ summary: "Create a job post (admin)" })
  async create(@Body() dto: CreateJobPostDto) {
    return this.careers.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Patch(":id")
  @ApiOperation({ summary: "Update a job post (admin)" })
  async update(@Param("id") id: string, @Body() dto: UpdateJobPostDto) {
    return this.careers.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Post(":id/publish")
  @ApiOperation({ summary: "Publish a job post (admin)" })
  async publish(@Param("id") id: string) {
    return this.careers.publish(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Post(":id/unpublish")
  @ApiOperation({ summary: "Unpublish a job post (admin)" })
  async unpublish(@Param("id") id: string) {
    return this.careers.unpublish(id);
  }

  @ApiBearerAuth()
  @UseGuards(PlatformRolesGuard)
  @PlatformRoles("PLATFORM_ADMIN")
  @Delete(":id")
  @ApiOperation({ summary: "Delete a job post (admin)" })
  async remove(@Param("id") id: string): Promise<void> {
    return this.careers.remove(id);
  }
}
