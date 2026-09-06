import { HttpStatus, Injectable } from "@nestjs/common";
import type { JobPost } from "@prisma/client";

import { PrismaService } from "../../../../../../database/prisma.service";
import { AppError } from "../../../../../../common/errors/app-error";
import { ErrorCode } from "../../../../../../common/errors/error-codes";

import type { CreateJobPostDto, UpdateJobPostDto } from "./dto/career.dto";

@Injectable()
export class CareerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public callers only see published posts; admins see everything. */
  async list(includeUnpublished: boolean): Promise<JobPost[]> {
    return this.prisma.jobPost.findMany({
      where: includeUnpublished ? undefined : { isPublished: true },
      orderBy: { createdAt: "desc" },
    });
  }

  async findBySlug(slug: string): Promise<JobPost> {
    const post = await this.prisma.jobPost.findUnique({ where: { slug } });
    if (!post) {
      throw new AppError(ErrorCode.JOB_POST_NOT_FOUND, "Job post not found", HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async findById(id: string): Promise<JobPost> {
    const post = await this.prisma.jobPost.findUnique({ where: { id } });
    if (!post) {
      throw new AppError(ErrorCode.JOB_POST_NOT_FOUND, "Job post not found", HttpStatus.NOT_FOUND);
    }
    return post;
  }

  async create(dto: CreateJobPostDto): Promise<JobPost> {
    const existing = await this.prisma.jobPost.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new AppError(ErrorCode.JOB_POST_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
    }
    return this.prisma.jobPost.create({ data: dto });
  }

  async update(id: string, dto: UpdateJobPostDto): Promise<JobPost> {
    await this.findById(id);
    return this.prisma.jobPost.update({ where: { id }, data: dto });
  }

  async publish(id: string): Promise<JobPost> {
    await this.findById(id);
    return this.prisma.jobPost.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(id: string): Promise<JobPost> {
    await this.findById(id);
    return this.prisma.jobPost.update({
      where: { id },
      data: { isPublished: false, publishedAt: null },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.jobPost.delete({ where: { id } });
  }
}
