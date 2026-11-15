import { Readable } from "node:stream";
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import ExcelJS from "exceljs";
import { z, hrmsAssetRegisterSchema, hrmsAssetAttachmentSchema } from "@dhriti/validation";
import { PrismaService } from "../../../database/prisma.service";
import { FileService, type UploadedFileInput } from "../../file/file.service";
import { HrmsAssetService } from "./hrms-asset.service";
import { assetInput, assetFailure, assetWrite, assetAudit, requireAsset } from "./hrms-asset-operations.service";

const scope = "HRMS_ASSET_DOCUMENT";
export const ASSET_FILE_MAX_BYTES = 10 * 1024 * 1024;
const importFields = [
  "name",
  "assetTag",
  "serialNumber",
  "type",
  "customCategory",
  "brand",
  "model",
  "specifications",
  "location",
  "purchaseDate",
  "purchaseCost",
  "currency",
  "vendor",
  "warrantyExpiresOn",
  "notes",
] as const;
const previewSchema = z.array(
  z.object({
    row: z.number().int(),
    input: hrmsAssetRegisterSchema.nullable(),
    errors: z.array(z.string()),
  }),
);

@Injectable()
export class HrmsAssetEvidenceService {
  private readonly logger = new Logger(HrmsAssetEvidenceService.name);
  constructor(
    private readonly db: PrismaService,
    private readonly files: FileService,
    private readonly assets: HrmsAssetService,
  ) {}
  async attachments(org: string, assetId: string) {
    const asset = await this.db.hrmsAsset.findFirst({
      where: { id: assetId, organizationId: org },
      select: { id: true },
    });
    if (!asset) {
      throw assetFailure("Asset not found.", HttpStatus.NOT_FOUND);
    }
    return this.db.hrmsAssetAttachment.findMany({
      where: { organizationId: org, assetId, archivedAt: null, file: { accessScope: scope, deletedAt: null } },
      select: {
        id: true,
        title: true,
        kind: true,
        createdAt: true,
        file: { select: { originalName: true, contentType: true, sizeBytes: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }
  async upload(org: string, actor: string, assetId: string, body: unknown, file?: UploadedFileInput) {
    const input = assetInput(hrmsAssetAttachmentSchema, body);
    await requireAsset(this.db, org, assetId);
    if (!file || !file.data.length) {
      throw assetFailure("Choose a non-empty PDF, PNG, JPEG or WebP file.");
    }
    if (file.data.length > ASSET_FILE_MAX_BYTES) {
      throw assetFailure("Attachments must not exceed 10 MB.", HttpStatus.PAYLOAD_TOO_LARGE);
    }
    const data = file.data;
    const valid =
      (file.contentType === "application/pdf" && data.subarray(0, 5).toString() === "%PDF-") ||
      (file.contentType === "image/png" &&
        data.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
      (file.contentType === "image/jpeg" && data[0] === 255 && data[1] === 216 && data[2] === 255) ||
      (file.contentType === "image/webp" &&
        data.subarray(0, 4).toString() === "RIFF" &&
        data.subarray(8, 12).toString() === "WEBP");
    if (!valid) {
      throw assetFailure("File contents must match PDF, PNG, JPEG or WebP format.");
    }
    const stored = await this.files.upload(org, actor, file, { accessScope: scope });
    try {
      return await assetWrite(this.db, async (tx) => {
        await requireAsset(tx, org, assetId);
        const result = await tx.hrmsAssetAttachment.create({
          data: { organizationId: org, assetId, fileId: stored.id, ...input },
        });
        await assetAudit(tx, org, actor, assetId, "attachment_uploaded", { attachmentId: result.id, kind: input.kind });
        return result;
      });
    } catch (error) {
      try {
        await this.files.delete(org, stored.id, actor, scope);
      } catch (cleanupError) {
        this.logger.error("Failed to clean up unlinked private asset attachment", cleanupError);
      }
      throw error;
    }
  }
  async download(org: string, actor: string, id: string) {
    const attachment = await this.db.hrmsAssetAttachment.findFirst({
      where: {
        id,
        organizationId: org,
        archivedAt: null,
        file: { accessScope: scope, deletedAt: null, organizationId: org },
      },
      select: { fileId: true },
    });
    if (!attachment) {
      throw assetFailure("Attachment not found.", HttpStatus.NOT_FOUND);
    }
    return this.files.getDownloadUrl(org, attachment.fileId, actor, { accessScope: scope });
  }
  async archive(org: string, actor: string, id: string) {
    return assetWrite(this.db, async (tx) => {
      const attachment = await tx.hrmsAssetAttachment.findFirst({
        where: { id, organizationId: org, archivedAt: null },
      });
      if (!attachment) {
        throw assetFailure("Attachment not found.", HttpStatus.NOT_FOUND);
      }
      await tx.hrmsAssetAttachment.update({
        where: { id, organizationId: org, archivedAt: null },
        data: { archivedAt: new Date() },
      });
      await assetAudit(tx, org, actor, attachment.assetId, "attachment_archived", { attachmentId: id });
    });
  }
  template() {
    return {
      csv: `${importFields.join(",")}\r\nEngineering laptop,IT-001,,LAPTOP,,Example,Model A,,Office,2026-01-01,1000.000,INR,Vendor,2027-01-01,Imported stock`,
    };
  }
  async preview(org: string, actor: string, file?: UploadedFileInput) {
    if (!file || !file.originalName.toLowerCase().endsWith(".csv") || !file.data.length) {
      throw assetFailure("Choose a non-empty .csv inventory file.");
    }
    if (file.data.length > ASSET_FILE_MAX_BYTES) {
      throw assetFailure("CSV must not exceed 10 MB.", HttpStatus.PAYLOAD_TOO_LARGE);
    }
    const workbook = new ExcelJS.Workbook();
    let worksheet: ExcelJS.Worksheet;
    try {
      worksheet = await workbook.csv.read(Readable.from(file.data));
    } catch {
      throw assetFailure("Cannot parse CSV. Check quoted values and column structure.");
    }
    if (worksheet.rowCount < 2 || worksheet.rowCount > 1001) {
      throw assetFailure("Import must contain between 1 and 1,000 data rows.");
    }
    const headers: string[] = [];
    worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell) => {
      headers.push(cell.text.trim().replace(/^\uFEFF/, ""));
    });
    if (
      !["name", "assetTag", "type"].every((key) => headers.includes(key)) ||
      new Set(headers).size !== headers.length ||
      headers.some((key) => !importFields.some((field) => field === key))
    ) {
      throw assetFailure(
        "Use the CSV template headers. name, assetTag and type are required; unknown or duplicate headers are not allowed.",
      );
    }
    const seenTags = new Set<string>();
    const seenSerials = new Set<string>();
    const rows = Array.from({ length: worksheet.rowCount - 1 }, (_, index) => {
      const row = worksheet.getRow(index + 2);
      const values = Object.fromEntries(
        headers.map((key, column) => [key, row.getCell(column + 1).text.trim() || null]),
      );
      const parsed = hrmsAssetRegisterSchema.safeParse(values);
      const errors = parsed.success
        ? []
        : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      if (parsed.success) {
        if (seenTags.has(parsed.data.assetTag)) {
          errors.push("Duplicate asset tag in file.");
        }
        seenTags.add(parsed.data.assetTag);
        if (parsed.data.serialNumber) {
          if (seenSerials.has(parsed.data.serialNumber)) {
            errors.push("Duplicate serial in file.");
          }
          seenSerials.add(parsed.data.serialNumber);
        }
      }
      return { row: index + 2, input: parsed.success ? parsed.data : null, errors };
    });
    const existing = await this.db.hrmsAsset.findMany({
      where: {
        organizationId: org,
        OR: [{ assetTag: { in: [...seenTags] } }, { serialNumber: { in: [...seenSerials] } }],
      },
      select: { assetTag: true, serialNumber: true },
    });
    for (const row of rows) {
      if (row.input && existing.some((asset) => asset.assetTag === row.input?.assetTag)) {
        row.errors.push("Asset tag already exists.");
      }
      if (row.input?.serialNumber && existing.some((asset) => asset.serialNumber === row.input?.serialNumber)) {
        row.errors.push("Serial already exists.");
      }
    }
    const batch = await this.db.hrmsAssetImport.create({ data: { organizationId: org, actorUserId: actor, rows } });
    return { id: batch.id, rows, valid: rows.filter((row) => !row.errors.length).length, total: rows.length };
  }
  async apply(org: string, actor: string, id: string) {
    return assetWrite(this.db, async (tx) => {
      const batch = await tx.hrmsAssetImport.findFirst({
        where: {
          id,
          organizationId: org,
          actorUserId: actor,
          appliedAt: null,
          createdAt: { gte: new Date(Date.now() - 3600000) },
        },
      });
      if (!batch) {
        throw assetFailure("Import preview expired, applied or not found. Upload again.", HttpStatus.CONFLICT);
      }
      const rows = assetInput(previewSchema, batch.rows);
      const valid = rows.filter((row) => !row.errors.length && row.input);
      if (!valid.length) {
        throw assetFailure("No valid rows to import. Fix preview errors and upload again.");
      }
      // Only server-validated preview rows are selected; a new conflict rolls back the entire selection.
      for (const row of valid) {
        await this.assets.create(org, actor, row.input, tx);
      }
      await tx.hrmsAssetImport.update({ where: { id, appliedAt: null }, data: { appliedAt: new Date() } });
      const result = { count: valid.length, skipped: rows.length - valid.length };
      await assetAudit(tx, org, actor, id, "import_applied", result);
      return result;
    });
  }
}
