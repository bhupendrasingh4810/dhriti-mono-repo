import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { hrmsEmployeeDocumentSchema } from "@dhriti/validation";
import type { HrmsEmployeeDocument, HrmsEmployeeDocumentPage } from "@dhriti/types";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { FileService, type UploadedFileInput } from "../../file/file.service";
import type { EmployeeTimelineQueryDto } from "../dto/hrms-employee.dto";

export const EMPLOYEE_DOCUMENT_MAX_BYTES = 10 * 1024 * 1024;
const scope = "HRMS_EMPLOYEE_DOCUMENT";
const documentSelect = {
  id: true,
  title: true,
  category: true,
  createdAt: true,
  file: { select: { originalName: true, contentType: true, sizeBytes: true } },
  employee: { select: { id: true, employeeNumber: true, user: { select: { name: true } } } },
} satisfies Prisma.HrmsEmployeeDocumentSelect;
type DocumentRecord = Prisma.HrmsEmployeeDocumentGetPayload<{ select: typeof documentSelect }>;

function response(document: DocumentRecord): HrmsEmployeeDocument {
  const parsed = hrmsEmployeeDocumentSchema.safeParse({ title: document.title, category: document.category });
  if (!parsed.success) {
    throw new AppError(
      ErrorCode.INTERNAL_ERROR,
      "Invalid persisted employee document",
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
  return {
    id: document.id,
    ...parsed.data,
    ...document.file,
    createdAt: document.createdAt.toISOString(),
    employee: {
      id: document.employee.id,
      employeeNumber: document.employee.employeeNumber,
      name: document.employee.user.name,
    },
  };
}

/** Private documents never use the organization-wide file listing or attach an existing public file. */
@Injectable()
export class HrmsEmployeeDocumentService {
  private readonly logger = new Logger(HrmsEmployeeDocumentService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FileService,
  ) {}

  async list(
    organizationId: string,
    employeeId: string | undefined,
    query: EmployeeTimelineQueryDto,
  ): Promise<HrmsEmployeeDocumentPage> {
    if (employeeId) {
      await this.requireEmployee(organizationId, employeeId);
    }
    const where = {
      organizationId,
      ...(employeeId ? { employeeId } : {}),
      archivedAt: null,
      employee: { organizationId, deletedAt: null },
      file: { organizationId, accessScope: scope, deletedAt: null },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hrmsEmployeeDocument.findMany({
        where,
        select: documentSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.hrmsEmployeeDocument.count({ where }),
    ]);
    return { items: items.map(response), total, page: query.page, pageSize: query.pageSize };
  }

  async upload(
    organizationId: string,
    employeeId: string,
    actorUserId: string,
    input: unknown,
    file: UploadedFileInput | undefined,
  ): Promise<HrmsEmployeeDocument> {
    await this.requireEmployee(organizationId, employeeId);
    const parsed = hrmsEmployeeDocumentSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        parsed.error.issues.map((issue) => issue.message).join("; "),
        HttpStatus.BAD_REQUEST,
      );
    }
    this.validateFile(file);
    const stored = await this.files.upload(organizationId, actorUserId, file, { accessScope: scope });
    try {
      const document = await this.prisma.$transaction(
        async (tx) => {
          // The employee may have been removed while the object was uploading.
          await this.requireEmployee(organizationId, employeeId, tx);
          const created = await tx.hrmsEmployeeDocument.create({
            data: { organizationId, employeeId, fileId: stored.id, uploadedById: actorUserId, ...parsed.data },
            select: documentSelect,
          });
          await tx.auditLog.create({
            data: {
              action: "hrms.employee.document_uploaded",
              organizationId,
              actorUserId,
              resourceType: "HrmsEmployeeDocument",
              resourceId: created.id,
              metadata: { employeeId, category: parsed.data.category },
            },
          });
          return response(created);
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      return document;
    } catch (error: unknown) {
      try {
        await this.files.delete(organizationId, stored.id, actorUserId, scope);
      } catch (cleanupError: unknown) {
        this.logger.error("Failed to clean up an unlinked private employee document", cleanupError);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Employee changed during upload. Reload and retry.",
          HttpStatus.CONFLICT,
        );
      }
      throw error;
    }
  }

  async download(organizationId: string, employeeId: string, documentId: string, actorUserId: string) {
    await this.requireEmployee(organizationId, employeeId);
    const document = await this.prisma.hrmsEmployeeDocument.findFirst({
      where: {
        id: documentId,
        organizationId,
        employeeId,
        archivedAt: null,
        file: { organizationId, accessScope: scope, deletedAt: null },
      },
      select: { fileId: true },
    });
    if (!document) {
      throw new AppError(ErrorCode.FILE_NOT_FOUND, "Employee document not found", HttpStatus.NOT_FOUND);
    }
    return this.files.getDownloadUrl(organizationId, document.fileId, actorUserId, { accessScope: scope });
  }

  /** Archive is retention, not physical deletion. Previously issued URLs expire at the storage TTL. */
  async archive(organizationId: string, employeeId: string, documentId: string, actorUserId: string): Promise<void> {
    await this.requireEmployee(organizationId, employeeId);
    await this.prisma.$transaction(async (tx) => {
      const changed = await tx.hrmsEmployeeDocument.updateMany({
        where: {
          id: documentId,
          organizationId,
          employeeId,
          archivedAt: null,
          employee: { organizationId, deletedAt: null },
          file: { organizationId, accessScope: scope, deletedAt: null },
        },
        data: { archivedAt: new Date(), archivedById: actorUserId },
      });
      if (changed.count !== 1) {
        throw new AppError(
          ErrorCode.FILE_NOT_FOUND,
          "Employee document not found or already archived",
          HttpStatus.NOT_FOUND,
        );
      }
      await tx.auditLog.create({
        data: {
          action: "hrms.employee.document_archived",
          organizationId,
          actorUserId,
          resourceType: "HrmsEmployeeDocument",
          resourceId: documentId,
          metadata: { employeeId },
        },
      });
    });
  }

  private async requireEmployee(
    organizationId: string,
    employeeId: string,
    db: Prisma.TransactionClient = this.prisma,
  ) {
    const employee = await db.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    }
  }

  private validateFile(file: UploadedFileInput | undefined): asserts file is UploadedFileInput {
    if (!file || file.data.byteLength === 0) {
      throw new AppError(ErrorCode.FILE_EMPTY, "A non-empty document file is required", HttpStatus.BAD_REQUEST);
    }
    if (file.data.byteLength > EMPLOYEE_DOCUMENT_MAX_BYTES) {
      throw new AppError(
        ErrorCode.FILE_TOO_LARGE,
        "Employee documents must not exceed 10 MB",
        HttpStatus.PAYLOAD_TOO_LARGE,
      );
    }
    if (
      !file.originalName.trim() ||
      file.originalName.length > 255 ||
      Array.from(file.originalName).some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127)
    ) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Invalid document filename", HttpStatus.BAD_REQUEST);
    }
    // Narrow initial formats with signature checks; this is not antivirus or document authenticity verification.
    const allowed =
      file.contentType === "application/pdf"
        ? file.data.subarray(0, 5).toString("ascii") === "%PDF-"
        : file.contentType === "image/png"
          ? file.data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
          : file.contentType === "image/jpeg"
            ? file.data.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
            : false;
    if (!allowed) {
      throw new AppError(
        ErrorCode.FILE_TYPE_NOT_ALLOWED,
        "Upload a PDF, PNG or JPEG file with matching content",
        HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      );
    }
  }
}
