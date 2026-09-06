import { HttpStatus, Injectable } from "@nestjs/common";
import type { LegalDocument, LegalDocumentType } from "@prisma/client";

import { PrismaService } from "../../../../../database/prisma.service";
import { AppError } from "../../../../../common/errors/app-error";
import { ErrorCode } from "../../../../../common/errors/error-codes";

import type { CreateLegalDocumentDto, UpdateLegalDocumentDto } from "./dto/legal-document.dto";

@Injectable()
export class LegalDocumentService {
  constructor(private readonly prisma: PrismaService) {}

  async listByType(type: LegalDocumentType): Promise<LegalDocument[]> {
    return this.prisma.legalDocument.findMany({
      where: { type },
      orderBy: { createdAt: "desc" },
    });
  }

  async getPublished(type: LegalDocumentType): Promise<LegalDocument> {
    const document = await this.prisma.legalDocument.findFirst({
      where: { type, isPublished: true },
      orderBy: { publishedAt: "desc" },
    });
    if (!document) {
      throw new AppError(
        ErrorCode.LEGAL_DOCUMENT_NOT_FOUND,
        "No published document found for this type",
        HttpStatus.NOT_FOUND,
      );
    }
    return document;
  }

  async findById(id: string): Promise<LegalDocument> {
    const document = await this.prisma.legalDocument.findUnique({ where: { id } });
    if (!document) {
      throw new AppError(ErrorCode.LEGAL_DOCUMENT_NOT_FOUND, "Document not found", HttpStatus.NOT_FOUND);
    }
    return document;
  }

  async create(dto: CreateLegalDocumentDto): Promise<LegalDocument> {
    const existing = await this.prisma.legalDocument.findUnique({
      where: { type_version: { type: dto.type, version: dto.version } },
    });
    if (existing) {
      throw new AppError(
        ErrorCode.LEGAL_DOCUMENT_VERSION_TAKEN,
        "This version already exists for the document type",
        HttpStatus.CONFLICT,
      );
    }

    return this.prisma.legalDocument.create({
      data: {
        type: dto.type,
        version: dto.version,
        title: dto.title,
        content: dto.content,
      },
    });
  }

  async update(id: string, dto: UpdateLegalDocumentDto): Promise<LegalDocument> {
    await this.findById(id);
    return this.prisma.legalDocument.update({ where: { id }, data: dto });
  }

  async publish(id: string): Promise<LegalDocument> {
    await this.findById(id);
    return this.prisma.legalDocument.update({
      where: { id },
      data: { isPublished: true, publishedAt: new Date() },
    });
  }

  async unpublish(id: string): Promise<LegalDocument> {
    await this.findById(id);
    return this.prisma.legalDocument.update({
      where: { id },
      data: { isPublished: false, publishedAt: null },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.prisma.legalDocument.delete({ where: { id } });
  }
}
