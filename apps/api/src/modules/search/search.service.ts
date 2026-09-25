import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import type { SearchEntityType, SearchQueryDto } from "./dto/search.dto";

export interface SearchResult {
  entityType: SearchEntityType;
  entityId: string;
  title: string;
  snippet: string;
  authorId: string | null;
  createdAt: Date;
  rank: number;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cross-app full-text search scoped to the active organization. Uses the
   * SearchIndex tsvector column (maintained by a DB trigger) for relevance.
   * Falls back to ILIKE when tsvector is unavailable (e.g. unindexed rows).
   */
  async search(organizationId: string, userId: string, query: SearchQueryDto): Promise<SearchResult[]> {
    const limit = Math.min(query.limit ?? 25, 100);
    const q = query.q.trim();

    // Use tsvector full-text search with ranking; the `search_vector` column is
    // maintained by a migration trigger on SearchIndex.
    const results = await this.prisma.$queryRaw<
      Array<{
        entityType: string;
        entityId: string;
        title: string;
        snippet: string;
        authorId: string | null;
        createdAt: Date;
        rank: number;
      }>
    >`
      SELECT
        "entityType",
        "entityId",
        title,
        ts_headline('english', content, plainto_tsquery('english', ${q}), 'MaxWords=20, MinWords=8, ShortWord=2') AS snippet,
        "authorId",
        "createdAt",
        ts_rank(search_vector, plainto_tsquery('english', ${q}))::float AS rank
      FROM "search_index"
      WHERE "organizationId" = ${organizationId}::uuid
        AND search_vector @@ plainto_tsquery('english', ${q})
        ${query.type ? Prisma.sql`AND "entityType" = ${query.type}` : Prisma.empty}
      ORDER BY rank DESC, "createdAt" DESC
      LIMIT ${limit}
    `;

    await this.recordHistory(organizationId, userId, q, results.length);

    return results.map((row) => ({
      entityType: row.entityType as SearchEntityType,
      entityId: row.entityId,
      title: row.title,
      snippet: row.snippet,
      authorId: row.authorId,
      createdAt: row.createdAt,
      rank: row.rank,
    }));
  }

  /** Recent searches for the autocomplete/history UI. */
  async history(organizationId: string, userId: string, limit = 10): Promise<string[]> {
    const rows = await this.prisma.searchHistory.findMany({
      where: { organizationId, userId },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 50),
      select: { query: true },
      distinct: ["query"],
    });
    return rows.map((row) => row.query);
  }

  /**
   * Upserts a document into the search index. Called by the app modules when
   * content is created/updated so the index stays in sync.
   */
  async index(params: {
    organizationId: string;
    entityType: SearchEntityType;
    entityId: string;
    title: string;
    content: string;
    authorId?: string;
  }): Promise<void> {
    await this.prisma.searchIndex
      .upsert({
        where: {
          organizationId_entityType_entityId: {
            organizationId: params.organizationId,
            entityType: params.entityType,
            entityId: params.entityId,
          },
        },
        create: {
          organizationId: params.organizationId,
          entityType: params.entityType,
          entityId: params.entityId,
          title: params.title,
          content: params.content,
          authorId: params.authorId ?? null,
        },
        update: {
          title: params.title,
          content: params.content,
          authorId: params.authorId ?? null,
        },
      })
      .catch(() => this.upsertFallback(params));
  }

  async remove(organizationId: string, entityType: SearchEntityType, entityId: string): Promise<void> {
    await this.prisma.searchIndex.deleteMany({
      where: { organizationId, entityType, entityId },
    });
  }

  // ---------------- Internals ----------------

  private async upsertFallback(params: {
    organizationId: string;
    entityType: SearchEntityType;
    entityId: string;
    title: string;
    content: string;
    authorId?: string;
  }): Promise<void> {
    await this.prisma.searchIndex.deleteMany({
      where: { organizationId: params.organizationId, entityType: params.entityType, entityId: params.entityId },
    });
    await this.prisma.searchIndex.create({
      data: {
        organizationId: params.organizationId,
        entityType: params.entityType,
        entityId: params.entityId,
        title: params.title,
        content: params.content,
        authorId: params.authorId ?? null,
      },
    });
  }

  private async recordHistory(
    organizationId: string,
    userId: string,
    query: string,
    resultsCount: number,
  ): Promise<void> {
    await this.prisma.searchHistory.create({
      data: { organizationId, userId, query, resultsCount },
    });
  }
}
