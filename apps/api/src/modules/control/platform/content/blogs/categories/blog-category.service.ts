import { HttpStatus, Injectable } from "@nestjs/common";
import type { BlogCategory } from "@prisma/client";

import { PrismaService } from "../../../../../../../database/prisma.service";
import { AppError } from "../../../../../../../common/errors/app-error";
import { ErrorCode } from "../../../../../../../common/errors/error-codes";

import type { CreateBlogCategoryDto, UpdateBlogCategoryDto } from "./dto/blog-category.dto";

@Injectable()
export class BlogCategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<BlogCategory[]> {
    return this.prisma.blogCategory.findMany({ orderBy: { name: "asc" } });
  }

  async findById(id: string): Promise<BlogCategory> {
    const category = await this.prisma.blogCategory.findUnique({ where: { id } });
    if (!category) {
      throw new AppError(ErrorCode.BLOG_CATEGORY_NOT_FOUND, "Category not found", HttpStatus.NOT_FOUND);
    }
    return category;
  }

  async create(dto: CreateBlogCategoryDto): Promise<BlogCategory> {
    const existing = await this.prisma.blogCategory.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new AppError(ErrorCode.BLOG_CATEGORY_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
    }
    return this.prisma.blogCategory.create({ data: dto });
  }

  async update(id: string, dto: UpdateBlogCategoryDto): Promise<BlogCategory> {
    await this.findById(id);
    if (dto.slug) {
      const existing = await this.prisma.blogCategory.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== id) {
        throw new AppError(ErrorCode.BLOG_CATEGORY_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
      }
    }
    return this.prisma.blogCategory.update({ where: { id }, data: dto });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.blogCategory.delete({ where: { id } });
  }
}
