import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { SecretEncryptionService } from "../../../common/crypto/secret-encryption.service";
import { OrganizationBankService } from "./organization-bank.service";
import { OrganizationBankController } from "./organization-bank.controller";
import { ACCESS_REQUIREMENTS_KEY } from "../../../common/decorators/access.decorator";

function setup() {
  const config = { secretEncryptionKey: randomBytes(32).toString("base64") };
  const secrets = new SecretEncryptionService(config as never);
  const account = { id: "bank-a", organizationId: "org-a", createdById: "creator", reviewStatus: "PENDING" };
  const db = {
    organizationBankAccount: {
      create: jest.fn().mockResolvedValue({ id: account.id, lastFour: "5432" }),
      findMany: jest.fn().mockResolvedValue([]),
      findFirst: jest.fn().mockResolvedValue(account),
      update: jest.fn().mockResolvedValue({ id: account.id, reviewStatus: "MANUALLY_REVIEWED" }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const prisma = { ...db, $transaction: jest.fn(async <T>(fn: (client: typeof db) => Promise<T>) => fn(db)) };
  const audit = { record: jest.fn().mockResolvedValue(undefined) };
  return {
    db,
    config,
    secrets,
    prisma,
    audit,
    service: new OrganizationBankService(prisma as never, secrets, config as never, audit as never),
  };
}
const input = {
  label: "Main funding",
  accountHolder: "Example Organization",
  bankName: "Example Bank",
  countryCode: "GB",
  currency: "GBP",
  accountType: "IBAN" as const,
  accountNumber: "GB82WEST12345698765432",
  routingCode: "",
  swiftCode: "",
};
const review = {
  decision: "ACCEPT" as const,
  evidenceReference: "secure-document-reference",
  note: "Reviewed independently",
};

describe("organization bank accounts", () => {
  it("requires settings permission on all banking endpoints", () => {
    expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, OrganizationBankController)).toEqual({
      permission: "organization.settings.manage",
    });
  });
  it("encrypts actual account details and uses a public projection for responses and audit IDs only", async () => {
    const { db, secrets, service, audit } = setup();
    expect(await service.create("org-a", "actor", input)).toEqual({ id: "bank-a", lastFour: "5432" });
    const call = db.organizationBankAccount.create.mock.calls[0][0];
    expect(call.data.organizationId).toBe("org-a");
    expect(call.data.accountDetailsEncrypted).not.toContain(input.accountNumber);
    expect(JSON.parse(secrets.decrypt(call.data.accountDetailsEncrypted))).toEqual({
      accountNumber: input.accountNumber,
      routingCode: "",
      swiftCode: "",
    });
    expect(call.select).not.toHaveProperty("accountDetailsEncrypted");
    expect(call.select).not.toHaveProperty("reviewEvidenceEncrypted");
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(input.accountNumber);
    expect(audit.record).toHaveBeenCalledWith(
      expect.objectContaining({ action: "organization.bank.created", resourceId: "bank-a" }),
    );
  });
  it("lists only tenant account metadata and reports provider operations unavailable", async () => {
    const { db, service } = setup();
    const result = await service.list("org-a");
    expect(db.organizationBankAccount.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-a" } }),
    );
    expect(result.capabilities).toMatchObject({
      providerConnected: false,
      ownershipVerificationAvailable: false,
      paymentsAvailable: false,
    });
    expect(() => service.providerVerification()).toThrow("no provider is connected");
    expect(() => service.providerVerification()).toThrow(expect.objectContaining({ status: 503 }));
  });
  it("fails closed when encryption is unconfigured", async () => {
    const { config, service, db } = setup();
    config.secretEncryptionKey = "";
    expect((await service.list("org-a")).capabilities.encryptedStorageAvailable).toBe(false);
    await expect(service.create("org-a", "actor", input)).rejects.toMatchObject({ status: 503 });
    await expect(service.review("org-a", "reviewer", "bank-a", review)).rejects.toMatchObject({ status: 503 });
    expect(db.organizationBankAccount.create).not.toHaveBeenCalled();
    expect(db.organizationBankAccount.update).not.toHaveBeenCalled();
  });
  it("does not save invalid formats", async () => {
    const { service, db } = setup();
    await expect(
      service.create("org-a", "actor", { ...input, accountNumber: "GB83WEST12345698765432" }),
    ).rejects.toThrow("checksum");
    expect(db.organizationBankAccount.create).not.toHaveBeenCalled();
  });
  it("requires an independent reviewer and a pending active tenant account", async () => {
    const { service, db } = setup();
    await expect(service.review("org-a", "creator", "bank-a", review)).rejects.toMatchObject({ status: 403 });
    db.organizationBankAccount.findFirst.mockResolvedValueOnce(null);
    await expect(service.review("org-b", "reviewer", "bank-a", review)).rejects.toMatchObject({ status: 404 });
    expect(db.organizationBankAccount.findFirst).toHaveBeenLastCalledWith(
      expect.objectContaining({ where: { id: "bank-a", organizationId: "org-b", archivedAt: null } }),
    );
    db.organizationBankAccount.findFirst.mockResolvedValueOnce({
      id: "bank-a",
      createdById: "creator",
      reviewStatus: "REJECTED",
    });
    await expect(service.review("org-a", "reviewer", "bank-a", review)).rejects.toMatchObject({ status: 409 });
    expect(db.organizationBankAccount.update).not.toHaveBeenCalled();
  });
  it.each(["ACCEPT", "REJECT"] as const)(
    "records %s as a manual decision, encrypts evidence and never changes ownership/payment state",
    async (decision) => {
      const { service, db, secrets, prisma } = setup();
      await service.review("org-a", "reviewer", "bank-a", { ...review, decision });
      const call = db.organizationBankAccount.update.mock.calls[0][0];
      expect(call.data.reviewStatus).toBe(decision === "ACCEPT" ? "MANUALLY_REVIEWED" : "REJECTED");
      expect(call.data.reviewedById).toBe("reviewer");
      expect(JSON.parse(secrets.decrypt(call.data.reviewEvidenceEncrypted))).toEqual({
        evidenceReference: review.evidenceReference,
        note: review.note,
      });
      expect(call.data).not.toHaveProperty("accountDetailsEncrypted");
      expect(call.data).not.toHaveProperty("ownershipVerified");
      expect(prisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({ isolationLevel: "Serializable" }),
      );
    },
  );
  it("returns explicit conflicts for concurrent review changes", async () => {
    const { db, service } = setup();
    db.organizationBankAccount.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Conflict", { code: "P2034", clientVersion: "test" }),
    );
    await expect(service.review("org-a", "reviewer", "bank-a", review)).rejects.toMatchObject({ status: 409 });
  });
  it("archives only active tenant accounts without deleting history", async () => {
    const { service, db } = setup();
    await expect(service.archive("org-a", "actor", "bank-a")).resolves.toEqual({ id: "bank-a", archived: true });
    expect(db.organizationBankAccount.updateMany).toHaveBeenCalledWith({
      where: { id: "bank-a", organizationId: "org-a", archivedAt: null },
      data: { archivedById: "actor", archivedAt: expect.any(Date) },
    });
    db.organizationBankAccount.updateMany.mockResolvedValue({ count: 0 });
    await expect(service.archive("org-b", "actor", "bank-a")).rejects.toMatchObject({ status: 404 });
  });
  it("decrypts evidence only on explicit tenant-scoped reads and records access without contents", async () => {
    const { service, db, secrets, audit } = setup();
    db.organizationBankAccount.findFirst.mockResolvedValueOnce({
      reviewEvidenceEncrypted: secrets.encrypt(JSON.stringify(review)),
      reviewedById: "reviewer",
      reviewedAt: new Date(),
    });
    expect(await service.reviewEvidence("org-a", "actor", "bank-a")).toMatchObject({
      evidenceReference: review.evidenceReference,
      note: review.note,
    });
    expect(db.organizationBankAccount.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org-a", id: "bank-a" } }),
    );
    expect(audit.record).toHaveBeenCalledWith(expect.objectContaining({ action: "organization.bank.review.viewed" }));
    expect(JSON.stringify(audit.record.mock.calls)).not.toContain(review.evidenceReference);
    db.organizationBankAccount.findFirst.mockResolvedValueOnce(null);
    await expect(service.reviewEvidence("org-b", "actor", "bank-a")).rejects.toMatchObject({ status: 404 });
  });
});
