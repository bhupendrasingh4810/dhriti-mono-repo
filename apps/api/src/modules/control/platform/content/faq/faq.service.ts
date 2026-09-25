import { HttpStatus, Injectable } from "@nestjs/common";
import type { FaqGroup, FaqItem } from "@prisma/client";

import { PrismaService } from "../../../../../database/prisma.service";
import { AppError } from "../../../../../common/errors/app-error";
import { ErrorCode } from "../../../../../common/errors/error-codes";

import type { CreateFaqGroupDto, CreateFaqItemDto, UpdateFaqGroupDto, UpdateFaqItemDto } from "./dto/faq.dto";

export type FaqGroupWithItems = FaqGroup & { items: FaqItem[] };

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  /** Public callers only see non-draft items; admins see everything. */
  async listGroups(includeDrafts: boolean): Promise<FaqGroupWithItems[]> {
    return this.prisma.faqGroup.findMany({
      orderBy: { order: "asc" },
      include: {
        items: {
          where: includeDrafts ? undefined : { isDraft: false },
          orderBy: { order: "asc" },
        },
      },
    });
  }

  async findGroupById(groupId: string): Promise<FaqGroup> {
    const group = await this.prisma.faqGroup.findUnique({ where: { id: groupId } });
    if (!group) {
      throw new AppError(ErrorCode.FAQ_GROUP_NOT_FOUND, "FAQ group not found", HttpStatus.NOT_FOUND);
    }
    return group;
  }

  async createGroup(dto: CreateFaqGroupDto): Promise<FaqGroup> {
    const existing = await this.prisma.faqGroup.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new AppError(ErrorCode.FAQ_GROUP_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
    }
    return this.prisma.faqGroup.create({
      data: { name: dto.name, slug: dto.slug, order: dto.order ?? 0 },
    });
  }

  async updateGroup(groupId: string, dto: UpdateFaqGroupDto): Promise<FaqGroup> {
    await this.findGroupById(groupId);
    if (dto.slug) {
      const existing = await this.prisma.faqGroup.findUnique({ where: { slug: dto.slug } });
      if (existing && existing.id !== groupId) {
        throw new AppError(ErrorCode.FAQ_GROUP_SLUG_TAKEN, "Slug already exists", HttpStatus.CONFLICT);
      }
    }
    return this.prisma.faqGroup.update({ where: { id: groupId }, data: dto });
  }

  async removeGroup(groupId: string): Promise<void> {
    await this.findGroupById(groupId);
    await this.prisma.faqGroup.delete({ where: { id: groupId } });
  }

  async findItemById(itemId: string): Promise<FaqItem> {
    const item = await this.prisma.faqItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new AppError(ErrorCode.FAQ_ITEM_NOT_FOUND, "FAQ item not found", HttpStatus.NOT_FOUND);
    }
    return item;
  }

  async createItem(groupId: string, dto: CreateFaqItemDto): Promise<FaqItem> {
    await this.findGroupById(groupId);
    return this.prisma.faqItem.create({
      data: {
        groupId,
        question: dto.question,
        answer: dto.answer,
        order: dto.order ?? 0,
        isDraft: dto.isDraft ?? true,
      },
    });
  }

  async updateItem(itemId: string, dto: UpdateFaqItemDto): Promise<FaqItem> {
    await this.findItemById(itemId);
    return this.prisma.faqItem.update({ where: { id: itemId }, data: dto });
  }

  async removeItem(itemId: string): Promise<void> {
    await this.findItemById(itemId);
    await this.prisma.faqItem.delete({ where: { id: itemId } });
  }
}
