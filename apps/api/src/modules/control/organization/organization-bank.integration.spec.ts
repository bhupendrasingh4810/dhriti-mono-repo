import { randomBytes, randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { SecretEncryptionService } from "../../../common/crypto/secret-encryption.service";
import { OrganizationBankService } from "./organization-bank.service";

// All synthetic organizations/accounts are rolled back; never contact a bank or use real financial details.
const databaseTest = process.env.PAYROLL_DB_INTEGRATION === "true" ? describe : describe.skip;
databaseTest("organization banking database integration", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());
  it("encrypts account/evidence, isolates tenants and preserves independent review history without real verification", async () => {
    const rollback = new Error("Rollback synthetic bank fixture");
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction")
                {return <T>(callback: (db: Prisma.TransactionClient) => Promise<T>) => callback(tx);}
              return Reflect.get(target, key);
            },
          });
          const config = { secretEncryptionKey: randomBytes(32).toString("base64") };
          const secrets = new SecretEncryptionService(config as never);
          const audit = { record: jest.fn().mockResolvedValue(undefined) };
          const banks = new OrganizationBankService(transactional as never, secrets, config as never, audit as never);
          const org = await tx.organization.create({
            data: { name: "Synthetic Bank Fixture", slug: `bank-test-${randomUUID()}` },
          });
          const other = await tx.organization.create({
            data: { name: "Other Bank Fixture", slug: `bank-test-${randomUUID()}` },
          });
          const creator = randomUUID();
          const reviewer = randomUUID();
          const input = {
            label: "Synthetic funding",
            accountHolder: "Example Test Organization",
            bankName: "Example Test Bank",
            countryCode: "GB",
            currency: "GBP",
            accountType: "IBAN" as const,
            accountNumber: "GB82WEST12345698765432",
            routingCode: "",
            swiftCode: "",
          };
          const account = await banks.create(org.id, creator, input);
          expect(account.lastFour).toBe("5432");
          expect(account).not.toHaveProperty("accountDetailsEncrypted");
          expect(account).not.toHaveProperty("accountNumber");
          const stored = await tx.organizationBankAccount.findUniqueOrThrow({ where: { id: account.id } });
          expect(stored.accountDetailsEncrypted).not.toContain(input.accountNumber);
          expect(JSON.parse(secrets.decrypt(stored.accountDetailsEncrypted)).accountNumber).toBe(input.accountNumber);
          expect((await banks.list(other.id)).accounts).toEqual([]);
          await expect(banks.archive(other.id, reviewer, account.id)).rejects.toMatchObject({ status: 404 });
          const decision = {
            decision: "ACCEPT" as const,
            evidenceReference: "synthetic-secure-ref",
            note: "Checked document independently",
          };
          await expect(banks.review(other.id, reviewer, account.id, decision)).rejects.toMatchObject({ status: 404 });
          await expect(banks.review(org.id, creator, account.id, decision)).rejects.toMatchObject({ status: 403 });
          const reviewed = await banks.review(org.id, reviewer, account.id, decision);
          expect(reviewed).toMatchObject({ reviewStatus: "MANUALLY_REVIEWED", reviewedById: reviewer });
          expect(reviewed).not.toHaveProperty("reviewEvidenceEncrypted");
          await expect(banks.review(org.id, reviewer, account.id, decision)).rejects.toMatchObject({ status: 409 });
          await expect(banks.reviewEvidence(other.id, reviewer, account.id)).rejects.toMatchObject({ status: 404 });
          expect(await banks.reviewEvidence(org.id, reviewer, account.id)).toMatchObject({
            evidenceReference: decision.evidenceReference,
            note: decision.note,
          });
          const retained = await tx.organizationBankAccount.findUniqueOrThrow({ where: { id: account.id } });
          expect(retained.reviewEvidenceEncrypted).not.toContain(decision.evidenceReference);
          expect(() => banks.providerVerification()).toThrow(expect.objectContaining({ status: 503 }));
          await banks.archive(org.id, creator, account.id);
          expect((await banks.list(org.id)).accounts[0]).toMatchObject({
            reviewStatus: "MANUALLY_REVIEWED",
            archivedAt: expect.any(Date),
          });
          expect(await tx.organizationBankAccount.count({ where: { organizationId: org.id } })).toBe(1);
          await expect(banks.review(org.id, reviewer, account.id, decision)).rejects.toMatchObject({ status: 404 });
          expect(audit.record).toHaveBeenCalledWith(
            expect.objectContaining({ action: "organization.bank.review.viewed" }),
          );
          throw rollback;
        },
        { timeout: 30000 },
      ),
    ).rejects.toBe(rollback);
  });
});
