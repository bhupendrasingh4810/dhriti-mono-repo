import { HttpStatus, Injectable } from "@nestjs/common";
import type { BlogPost } from "@prisma/client";

import { PrismaService } from "../../../../../../../database/prisma.service";
import { AppError } from "../../../../../../../common/errors/app-error";
import { ErrorCode } from "../../../../../../../common/errors/error-codes";

import type { CreateBlogPostDto, UpdateBlogPostDto } from "./dto/blog-post.dto";

const withRelations = {
  category: true,
  tags: { include: { tag: true } },
} as const;

export type BlogPostWithRelations = BlogPost & {
  category: { id: string; name: string; slug: string } | null;
  tags: { tag: { id: string; name: string; slug: string } }[];
};

@Injectable()
export class BlogPostService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public callers only see published posts; admins see everything. */
  async list(includeUnpublished: boolean): Promise<BlogPostWithRelations[]> {
    return this.prisma.blogPost.findMany({
      where: includeUnpublished ? undefined : { isPublished: true },
      orderBy: { createdAt: "desc" },
      include: withRelations,
    });
  }

  async findBySlug(slug: string): Promise<BlogPostWithRelations> {
    const post = await this.prisma.blogPost.findUnique({ where: { slug }, include: withRelations });
    if (!post) {
      throw new AppError(ErrorCode.BLOG_POST_NOT_FOUND, "Blog post not found", HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async findById(id: string): Promise<BlogPostWithRelations> {
    const post = await this.prisma.blogPost.findUnique({ where: { id }, include: withRelations });
    if (!post) {
      throw new AppError(ErrorCode.BLOG_POST_NOT_FOUND, "Blog post not found", HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async create(dto: CreateBlogPostDto): Promise<BlogPostWithRelations> {
    const existing = await this.prisma.blogPost.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new AppError(ErrorCode.BLOG_POST_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
    }

    const { tagIds, ...data } = dto;
    return this.prisma.blogPost.create({
      data: {
        ...data,
        tags: tagIds ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: withRelations,
    });
  }

  async update(id: string, dto: UpdateBlogPostDto): Promise<BlogPostWithRelations> {
    await this.findById(id);
    const { tagIds, ...data } = dto;
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...data,
        tags: tagIds ? { deleteMany: {}, create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      },
      include: withRelations,
    });
  }

  async publish(id: string): Promise<BlogPostWithRelations> {
    await this.findById(id);
    return this.prisma.blogPost.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
      include: withRelations,
    });
  }

  async unpublish(id: string): Promise<BlogPostWithRelations> {
    await this.findById(id);
    return this.prisma.blogPost.update({
      where: { id },
      data: { isPublished: false, publishedAt: null },
      include: withRelations,
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.blogPost.delete({ where: { id } });
  }
}
