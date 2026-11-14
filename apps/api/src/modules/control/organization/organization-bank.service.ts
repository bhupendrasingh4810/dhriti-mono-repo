import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../database/prisma.service";
import { SecretEncryptionService } from "../../../common/crypto/secret-encryption.service";
import { ApiConfigService } from "../../../config/config.service";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { AuditService } from "../../audit/audit.service";
import type { CreateOrganizationBankDto, ReviewOrganizationBankDto } from "./dto/organization-bank.dto";
import { BankFormatError, validateBankAccount } from "./bank-account-validation";

// Explicit projection is shared by every response: no ciphertext or full transfer instructions leave this service.
const PUBLIC_ACCOUNT = {
  id: true,
  label: true,
  accountHolder: true,
  bankName: true,
  countryCode: true,
  currency: true,
  accountType: true,
  lastFour: true,
  formatCheck: true,
  reviewStatus: true,
  createdById: true,
  reviewedById: true,
  reviewedAt: true,
  archivedAt: true,
  createdAt: true,
} satisfies Prisma.OrganizationBankAccountSelect;

const transactionOptions = {
  isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
  maxWait: 5000,
  timeout: 10000,
};
function invalid(message: string, status = HttpStatus.BAD_REQUEST): never {
  throw new AppError(ErrorCode.VALIDATION_FAILED, message, status);
}

@Injectable()
export class OrganizationBankService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly secrets: SecretEncryptionService,
    private readonly config: ApiConfigService,
    private readonly audit: AuditService,
  ) {}

  async list(organizationId: string) {
    const accounts = await this.prisma.organizationBankAccount.findMany({
      where: { organizationId },
      select: PUBLIC_ACCOUNT,
      orderBy: { createdAt: "desc" },
    });
    return {
      accounts,
      capabilities: {
        encryptedStorageAvailable: Boolean(this.config.secretEncryptionKey),
        providerConnected: false as const,
        ownershipVerificationAvailable: false as const,
        paymentsAvailable: false as const,
        methods: [
          {
            key: "MANUAL_DOCUMENT_REVIEW",
            available: Boolean(this.config.secretEncryptionKey),
            establishesOwnership: false,
          },
          { key: "MICRODEPOSIT", available: false, establishesOwnership: false },
          { key: "OPEN_BANKING", available: false, establishesOwnership: false },
          { key: "PROVIDER_ACCOUNT_VALIDATION", available: false, establishesOwnership: false },
        ],
      },
    };
  }

  async create(organizationId: string, actorUserId: string, dto: CreateOrganizationBankDto) {
    this.requireEncryption();
    let details: ReturnType<typeof validateBankAccount>;
    try {
      details = validateBankAccount(dto);
    } catch (error) {
      if (error instanceof BankFormatError) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, error.message, HttpStatus.BAD_REQUEST, {
          fieldErrors: Object.fromEntries(error.fields.map((field) => [field, error.message])),
        });
      }
      throw error;
    }
    const account = await this.prisma.organizationBankAccount.create({
      data: {
        organizationId,
        createdById: actorUserId,
        label: dto.label.trim(),
        accountHolder: dto.accountHolder.trim(),
        bankName: dto.bankName.trim(),
        countryCode: dto.countryCode,
        currency: dto.currency,
        accountType: dto.accountType,
        accountDetailsEncrypted: this.secrets.encrypt(
          JSON.stringify({
            accountNumber: details.accountNumber,
            routingCode: details.routingCode,
            swiftCode: details.swiftCode,
          }),
        ),
        lastFour: details.accountNumber.slice(-4),
        formatCheck: details.formatCheck,
      },
      select: PUBLIC_ACCOUNT,
    });
    await this.log(organizationId, actorUserId, "created", account.id);
    return account;
  }

  /** Manual evidence is an independent attestation, never bank ownership verification or payout authorization. */
  async review(organizationId: string, actorUserId: string, id: string, dto: ReviewOrganizationBankDto) {
    this.requireEncryption();
    const evidence = dto.evidenceReference.trim();
    const note = dto.note.trim();
    if (evidence.length < 3 || note.length < 3) {
      invalid("Provide an evidence reference and review note");
    }
    const result = await this.write(() =>
      this.prisma.$transaction(async (db) => {
        const account = await db.organizationBankAccount.findFirst({
          where: { id, organizationId, archivedAt: null },
          select: { id: true, createdById: true, reviewStatus: true },
        });
        if (!account) {
          invalid("Active bank account not found", HttpStatus.NOT_FOUND);
        }
        if (account.createdById === actorUserId) {
          invalid("A different organization administrator must review this account", HttpStatus.FORBIDDEN);
        }
        if (account.reviewStatus !== "PENDING") {
          invalid("This account was already reviewed; add a replacement for changes", HttpStatus.CONFLICT);
        }
        return db.organizationBankAccount.update({
          where: { id },
          data: {
            reviewStatus: dto.decision === "ACCEPT" ? "MANUALLY_REVIEWED" : "REJECTED",
            reviewedById: actorUserId,
            reviewedAt: new Date(),
            reviewEvidenceEncrypted: this.secrets.encrypt(JSON.stringify({ evidenceReference: evidence, note })),
          },
          select: PUBLIC_ACCOUNT,
        });
      }, transactionOptions),
    );
    await this.log(organizationId, actorUserId, dto.decision === "ACCEPT" ? "manually_reviewed" : "rejected", id);
    return result;
  }

  async archive(organizationId: string, actorUserId: string, id: string) {
    const result = await this.prisma.organizationBankAccount.updateMany({
      where: { id, organizationId, archivedAt: null },
      data: { archivedAt: new Date(), archivedById: actorUserId },
    });
    if (result.count !== 1) {
      invalid("Active bank account not found; reload before retrying", HttpStatus.NOT_FOUND);
    }
    await this.log(organizationId, actorUserId, "archived", id);
    return { id, archived: true };
  }

  /** Evidence is available only through an explicit, tenant-authorized, audited read; never in account lists. */
  async reviewEvidence(organizationId: string, actorUserId: string, id: string) {
    this.requireEncryption();
    const account = await this.prisma.organizationBankAccount.findFirst({
      where: { id, organizationId },
      select: { reviewEvidenceEncrypted: true, reviewedAt: true, reviewedById: true },
    });
    if (!account?.reviewEvidenceEncrypted) {
      invalid("Bank review evidence not found", HttpStatus.NOT_FOUND);
    }
    const evidence: unknown = JSON.parse(this.secrets.decrypt(account.reviewEvidenceEncrypted));
    if (
      !evidence ||
      typeof evidence !== "object" ||
      !("evidenceReference" in evidence) ||
      !("note" in evidence) ||
      typeof evidence.evidenceReference !== "string" ||
      typeof evidence.note !== "string"
    ) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Stored bank review evidence is invalid",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    await this.log(organizationId, actorUserId, "review.viewed", id);
    return {
      evidenceReference: evidence.evidenceReference,
      note: evidence.note,
      reviewedAt: account.reviewedAt,
      reviewedById: account.reviewedById,
    };
  }

  providerVerification(): never {
    throw new AppError(
      ErrorCode.VALIDATION_FAILED,
      "Bank ownership verification is unavailable: no provider is connected. Format checks and manual review do not verify ownership.",
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }

  private requireEncryption() {
    if (!this.config.secretEncryptionKey) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Bank account storage is unavailable. An operator must configure SECRETS_ENCRYPTION_KEY before saving financial details.",
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async write<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
        invalid("Bank account changed concurrently; reload and retry", HttpStatus.CONFLICT);
      }
      throw error;
    }
  }

  private log(organizationId: string, actorUserId: string, action: string, resourceId: string) {
    // Account numbers, routing, holder data, evidence, and notes must never enter audit metadata.
    return this.audit.record({
      organizationId,
      actorUserId,
      action: `organization.bank.${action}`,
      resourceType: "OrganizationBankAccount",
      resourceId,
    });
  }
}
