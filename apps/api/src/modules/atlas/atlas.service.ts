import { HttpStatus, Injectable } from "@nestjs/common";
import type { AtlasComment, AtlasPage, AtlasSpace, User } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import type { CreateSpaceDto, UpdateSpaceDto } from "./dto/space.dto";
import type { CreateCommentDto, CreatePageDto, UpdatePageDto } from "./dto/page.dto";

export type PageWithMeta = AtlasPage & {
  author: Pick<User, "id" | "name" | "avatarUrl">;
  _count: { children: number; comments: number };
};

export type CommentWithAuthor = AtlasComment & {
  author: Pick<User, "id" | "name" | "avatarUrl">;
};

@Injectable()
export class AtlasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ---------------- Spaces ----------------

  async listSpaces(organizationId: string): Promise<Array<AtlasSpace & { pageCount: number }>> {
    const spaces = await this.prisma.atlasSpace.findMany({
      where: { organizationId, deletedAt: null },
      include: { _count: { select: { pages: { where: { deletedAt: null } } } } },
      orderBy: { createdAt: "asc" },
    });
    return spaces.map(({ _count, ...space }) => ({ ...space, pageCount: _count.pages }));
  }

  async createSpace(organizationId: string, userId: string, dto: CreateSpaceDto): Promise<AtlasSpace> {
    const keyTaken = await this.prisma.atlasSpace.findUnique({
      where: { organizationId_key: { organizationId, key: dto.key } },
      select: { id: true },
    });
    if (keyTaken) {
      throw new AppError(ErrorCode.SPACE_KEY_TAKEN, "A space with this key already exists", HttpStatus.CONFLICT);
    }

    const space = await this.prisma.atlasSpace.create({
      data: {
        organizationId,
        key: dto.key,
        name: dto.name.trim(),
        description: dto.description ?? null,
        icon: dto.icon ?? null,
        createdById: userId,
      },
    });

    await this.audit.record({
      action: "atlas.space.created",
      organizationId,
      actorUserId: userId,
      resourceType: "AtlasSpace",
      resourceId: space.id,
    });
    return space;
  }

  async getSpace(organizationId: string, spaceId: string): Promise<AtlasSpace> {
    const space = await this.prisma.atlasSpace.findFirst({
      where: { id: spaceId, organizationId, deletedAt: null },
    });
    if (!space) {
      throw new AppError(ErrorCode.SPACE_NOT_FOUND, "Space not found", HttpStatus.NOT_FOUND);
    }
    return space;
  }

  async updateSpace(
    organizationId: string,
    spaceId: string,
    userId: string,
    dto: UpdateSpaceDto,
  ): Promise<AtlasSpace> {
    await this.getSpace(organizationId, spaceId);
    const updated = await this.prisma.atlasSpace.update({
      where: { id: spaceId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.icon !== undefined ? { icon: dto.icon } : {}),
      },
    });

    await this.audit.record({
      action: "atlas.space.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "AtlasSpace",
      resourceId: spaceId,
    });
    return updated;
  }

  async deleteSpace(organizationId: string, spaceId: string, userId: string): Promise<void> {
    await this.getSpace(organizationId, spaceId);
    await this.prisma.$transaction([
      this.prisma.atlasPage.updateMany({
        where: { spaceId },
        data: { deletedAt: new Date() },
      }),
      this.prisma.atlasSpace.update({
        where: { id: spaceId },
        data: { deletedAt: new Date() },
      }),
    ]);

    await this.audit.record({
      action: "atlas.space.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "AtlasSpace",
      resourceId: spaceId,
    });
  }

  // ---------------- Pages ----------------

  /** Returns the page tree (all non-deleted pages in a space, ordered). */
  async listPages(organizationId: string, spaceId: string): Promise<PageWithMeta[]> {
    await this.getSpace(organizationId, spaceId);
    return this.prisma.atlasPage.findMany({
      where: { organizationId, spaceId, deletedAt: null },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        _count: { select: { children: { where: { deletedAt: null } }, comments: { where: { deletedAt: null } } } },
      },
    });
  }

  async createPage(
    organizationId: string,
    spaceId: string,
    userId: string,
    dto: CreatePageDto,
  ): Promise<PageWithMeta> {
    await this.getSpace(organizationId, spaceId);

    if (dto.parentId) {
      await this.getPageInSpace(organizationId, spaceId, dto.parentId);
    }

    const page = await this.prisma.atlasPage.create({
      data: {
        organizationId,
        spaceId,
        parentId: dto.parentId ?? null,
        title: dto.title.trim(),
        content: dto.content ?? "",
        position: dto.position ?? 0,
        isPublished: dto.isPublished ?? false,
        createdById: userId,
      },
      include: this.pageInclude,
    });

    await this.audit.record({
      action: "atlas.page.created",
      organizationId,
      actorUserId: userId,
      resourceType: "AtlasPage",
      resourceId: page.id,
    });
    return page;
  }

  async getPage(organizationId: string, pageId: string): Promise<PageWithMeta> {
    const page = await this.prisma.atlasPage.findFirst({
      where: { id: pageId, organizationId, deletedAt: null },
      include: this.pageInclude,
    });
    if (!page) {
      throw new AppError(ErrorCode.PAGE_NOT_FOUND, "Page not found", HttpStatus.NOT_FOUND);
    }
    return page;
  }

  async updatePage(
    organizationId: string,
    pageId: string,
    userId: string,
    dto: UpdatePageDto,
  ): Promise<PageWithMeta> {
    const existing = await this.getPage(organizationId, pageId);

    if (dto.parentId && dto.parentId === pageId) {
      throw new AppError(ErrorCode.PAGE_CYCLE, "A page cannot be its own parent", HttpStatus.BAD_REQUEST);
    }
    if (dto.parentId) {
      const parent = await this.getPageInSpace(organizationId, existing.spaceId, dto.parentId);
      if (await this.isDescendant(organizationId, pageId, parent.id)) {
        throw new AppError(ErrorCode.PAGE_CYCLE, "Cannot move a page under its own descendant", HttpStatus.BAD_REQUEST);
      }
    }

    // Content change bumps the version (co-authoring/version history hook).
    const contentChanged = dto.content !== undefined && dto.content !== existing.content;

    const updated = await this.prisma.atlasPage.update({
      where: { id: pageId },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.parentId !== undefined ? { parentId: dto.parentId } : {}),
        ...(dto.position !== undefined ? { position: dto.position } : {}),
        ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
        ...(contentChanged ? { version: { increment: 1 } } : {}),
      },
      include: this.pageInclude,
    });

    await this.audit.record({
      action: "atlas.page.updated",
      organizationId,
      actorUserId: userId,
      resourceType: "AtlasPage",
      resourceId: pageId,
      metadata: { version: updated.version, contentChanged },
    });
    return updated;
  }

  async deletePage(organizationId: string, pageId: string, userId: string): Promise<void> {
    await this.getPage(organizationId, pageId);
    // Soft-delete the page and its subtree.
    await this.softDeleteSubtree(pageId, organizationId);

    await this.audit.record({
      action: "atlas.page.deleted",
      organizationId,
      actorUserId: userId,
      resourceType: "AtlasPage",
      resourceId: pageId,
    });
  }

  // ---------------- Comments ----------------

  async listComments(organizationId: string, pageId: string): Promise<CommentWithAuthor[]> {
    await this.getPage(organizationId, pageId);
    return this.prisma.atlasComment.findMany({
      where: { organizationId, pageId, deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async addComment(
    organizationId: string,
    pageId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentWithAuthor> {
    await this.getPage(organizationId, pageId);
    return this.prisma.atlasComment.create({
      data: { organizationId, pageId, authorId: userId, content: dto.content },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    });
  }

  async resolveComment(organizationId: string, commentId: string, userId: string, isResolved: boolean): Promise<AtlasComment> {
    const comment = await this.prisma.atlasComment.findFirst({
      where: { id: commentId, organizationId, deletedAt: null },
    });
    if (!comment) {
      throw new AppError(ErrorCode.COMMENT_NOT_FOUND, "Comment not found", HttpStatus.NOT_FOUND);
    }
    return this.prisma.atlasComment.update({
      where: { id: commentId },
      data: { isResolved },
    });
  }

  async deleteComment(organizationId: string, commentId: string, userId: string): Promise<void> {
    const comment = await this.prisma.atlasComment.findFirst({
      where: { id: commentId, organizationId, deletedAt: null },
    });
    if (!comment) {
      throw new AppError(ErrorCode.COMMENT_NOT_FOUND, "Comment not found", HttpStatus.NOT_FOUND);
    }
    if (comment.authorId !== userId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the author can delete a comment", HttpStatus.FORBIDDEN);
    }
    await this.prisma.atlasComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }

  // ---------------- Internals ----------------

  private readonly pageInclude = {
    author: { select: { id: true, name: true, avatarUrl: true } },
    _count: {
      select: {
        children: { where: { deletedAt: null } },
        comments: { where: { deletedAt: null } },
      },
    },
  } as const;

  private async getPageInSpace(organizationId: string, spaceId: string, pageId: string): Promise<AtlasPage> {
    const page = await this.prisma.atlasPage.findFirst({
      where: { id: pageId, organizationId, spaceId, deletedAt: null },
    });
    if (!page) {
      throw new AppError(ErrorCode.PAGE_NOT_FOUND, "Parent page not found in this space", HttpStatus.BAD_REQUEST);
    }
    return page;
  }

  /** True if `candidateId` is in the subtree rooted at `rootId`. */
  private async isDescendant(organizationId: string, rootId: string, candidateId: string): Promise<boolean> {
    let current: string | null = candidateId;
    let depth = 0;
    while (current && depth < 100) {
      if (current === rootId) {
        return true;
      }
      const node: { parentId: string | null } | null = await this.prisma.atlasPage.findFirst({
        where: { id: current, organizationId, deletedAt: null },
        select: { parentId: true },
      });
      current = node?.parentId ?? null;
      depth += 1;
    }
    return false;
  }

  private async softDeleteSubtree(pageId: string, organizationId: string): Promise<void> {
    const now = new Date();
    await this.prisma.atlasPage.update({
      where: { id: pageId },
      data: { deletedAt: now },
    });
    const children = await this.prisma.atlasPage.findMany({
      where: { parentId: pageId, organizationId, deletedAt: null },
      select: { id: true },
    });
    for (const child of children) {
      await this.softDeleteSubtree(child.id, organizationId);
    }
  }
}
