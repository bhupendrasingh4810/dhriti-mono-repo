import { createHash, randomUUID } from "node:crypto";

import { HttpStatus, Injectable } from "@nestjs/common";
import type { StoredFile } from "@prisma/client";

import { PrismaService } from "../../database/prisma.service";
import { ApiConfigService } from "../../config/config.service";
import { AppError } from "../../common/errors/app-error";
import { ErrorCode } from "../../common/errors/error-codes";
import { AuditService } from "../audit/audit.service";
import { StorageService } from "./storage.service";

const ALLOWED_CONTENT_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/zip",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

export interface UploadedFileInput {
  originalName: string;
  contentType: string;
  data: Buffer;
}

@Injectable()
export class FileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly config: ApiConfigService,
    private readonly audit: AuditService,
  ) {}

  async upload(
    organizationId: string,
    uploaderUserId: string,
    file: UploadedFileInput,
    context: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<StoredFile> {
    this.validate(file);

    const objectKey = `${organizationId}/${randomUUID()}/${this.sanitizeFileName(file.originalName)}`;

    await this.storage.upload({
      objectKey,
      body: file.data,
      contentType: file.contentType,
    });

    const stored = await this.prisma.storedFile.create({
      data: {
        organizationId,
        uploadedById: uploaderUserId,
        bucket: this.config.s3.bucket,
        objectKey,
        originalName: file.originalName,
        contentType: file.contentType,
        sizeBytes: file.data.byteLength,
        checksumSha256: createHash("sha256").update(file.data).digest("hex"),
      },
    });

    await this.audit.record({
      action: "file.uploaded",
      organizationId,
      actorUserId: uploaderUserId,
      resourceType: "StoredFile",
      resourceId: stored.id,
      metadata: { originalName: file.originalName, sizeBytes: stored.sizeBytes },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return stored;
  }

  async getDownloadUrl(
    organizationId: string,
    fileId: string,
    actorUserId: string,
    context: { ipAddress?: string; userAgent?: string } = {},
  ): Promise<{ url: string; expiresIn: number }> {
    const file = await this.getFile(organizationId, fileId);
    const url = await this.storage.presignDownload(file.objectKey, file.originalName);
    await this.audit.record({
      action: "file.downloaded",
      organizationId,
      actorUserId,
      resourceType: "StoredFile",
      resourceId: file.id,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    return { url, expiresIn: this.config.s3.presignTtlSeconds };
  }

  async listFiles(organizationId: string, limit = 100): Promise<StoredFile[]> {
    return this.prisma.storedFile.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: Math.min(limit, 500),
    });
  }

  async delete(organizationId: string, fileId: string, actorUserId: string): Promise<void> {
    const file = await this.getFile(organizationId, fileId);
    if (file.uploadedById !== actorUserId) {
      throw new AppError(ErrorCode.FORBIDDEN, "Only the uploader can delete this file", HttpStatus.FORBIDDEN);
    }

    await this.prisma.storedFile.update({
      where: { id: file.id },
      data: { deletedAt: new Date() },
    });

    // Best-effort object cleanup; metadata removal already succeeded.
    try {
      await this.storage.delete(file.objectKey);
    } catch {
      // Object deletion is retried by lifecycle rules; do not fail the request.
    }

    await this.audit.record({
      action: "file.deleted",
      organizationId,
      actorUserId,
      resourceType: "StoredFile",
      resourceId: file.id,
    });
  }

  private async getFile(organizationId: string, fileId: string): Promise<StoredFile> {
    const file = await this.prisma.storedFile.findFirst({
      where: { id: fileId, organizationId, deletedAt: null },
    });
    if (!file) {
      throw new AppError(ErrorCode.FILE_NOT_FOUND, "File not found", HttpStatus.NOT_FOUND);
    }
    return file;
  }

  private validate(file: UploadedFileInput): void {
    if (file.data.byteLength === 0) {
      throw new AppError(ErrorCode.FILE_EMPTY, "File is empty", HttpStatus.BAD_REQUEST);
    }
    if (file.data.byteLength > this.config.fileMaxSizeBytes) {
      throw new AppError(
        ErrorCode.FILE_TOO_LARGE,
        `File exceeds the ${this.config.fileMaxSizeBytes / (1024 * 1024)}MB limit`,
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
    if (!ALLOWED_CONTENT_TYPES.has(file.contentType)) {
      throw new AppError(
        ErrorCode.FILE_TYPE_NOT_ALLOWED,
        `Content type "${file.contentType}" is not allowed`,
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
  }

  private sanitizeFileName(name: string): string {
    const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-120);
    return cleaned.length > 0 ? cleaned : "file";
  }
}
