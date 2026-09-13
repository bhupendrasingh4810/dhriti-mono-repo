import { HttpStatus, Injectable } from "@nestjs/common";
import type { BlogTag } from "@prisma/client";

import { PrismaService } from "../../../../../../database/prisma.service";
import { AppError } from "../../../../../../common/errors/app-error";
import { ErrorCode } from "../../../../../../common/errors/error-codes";

import type { CreateBlogTagDto, UpdateBlogTagDto } from "./dto/blog-tag.dto";

@Injectable()
export class BlogTagService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<BlogTag[]> {
    return this.prisma.blogTag.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<BlogTag> {
    const tag = await this.prisma.blogTag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError(ErrorCode.BLOG_TAG_NOT_FOUND, "Tag not found", HttpStatus.NOT_FOUND);
    }
    return tag;
  }

  async create(dto: CreateBlogTagDto): Promise<BlogTag> {
    const existing = await this.prisma.blogTag.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new AppError(ErrorCode.BLOG_TAG_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
    }
    return this.prisma.blogTag.create({ data: dto });
  }

  async update(id: string, dto: UpdateBlogTagDto): Promise<BlogTag> {
    await this.findById(id);
    if (dto.slug) {
      const existing = await this.prisma.blogTag.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new AppError(ErrorCode.BLOG_TAG_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
      }
    }
    return this.prisma.blogTag.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.blogTag.delete({ where: { id } });
  }
}
