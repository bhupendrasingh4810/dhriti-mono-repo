import { randomUUID } from "node:crypto";
import { PrismaClient, type Prisma } from "@prisma/client";
import { FileService } from "../../file/file.service";
import { HrmsEmployeeDocumentService } from "./hrms-employee-document.service";

// Opt-in persistence test; storage is mocked and every synthetic database record is rolled back.
const databaseTest = process.env.HRMS_DOCUMENT_DB_INTEGRATION === "true" ? describe : describe.skip;

databaseTest("employee document database integration", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());

  it("persists private employee documents and audit events while enforcing generic-file and employee boundaries", async () => {
    const rollback = new Error("Rollback employee document fixture");
    await expect(
      prisma.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return <T>(operation: Promise<unknown>[] | ((client: Prisma.TransactionClient) => Promise<T>)) =>
                  Array.isArray(operation) ? Promise.all(operation) : operation(tx);
              }
              return Reflect.get(target, key);
            },
          });
          const org = await tx.organization.create({
            data: { name: "Synthetic document fixture", slug: `document-test-${randomUUID()}` },
          });
          const actor = await tx.user.create({
            data: { name: "Synthetic HR manager", email: `${randomUUID()}@documents.example.test` },
          });
          const employee = await tx.hrmsEmployee.create({
            data: { organizationId: org.id, userId: actor.id, employeeNumber: "EMP-1", status: "ACTIVE" },
          });
          const otherUser = await tx.user.create({
            data: { name: "Other synthetic employee", email: `${randomUUID()}@documents.example.test` },
          });
          const otherEmployee = await tx.hrmsEmployee.create({
            data: { organizationId: org.id, userId: otherUser.id, employeeNumber: "EMP-2", status: "ACTIVE" },
          });
          const storage = {
            upload: jest.fn().mockResolvedValue(undefined),
            delete: jest.fn().mockResolvedValue(undefined),
            presignDownload: jest.fn().mockResolvedValue("https://storage.example.test/private"),
          };
          const files = new FileService(
            transactional as never,
            storage as never,
            {
              s3: { bucket: "synthetic-test-bucket", presignTtlSeconds: 900 },
              fileMaxSizeBytes: 10 * 1024 * 1024,
            } as never,
            { record: jest.fn() } as never,
          );
          const service = new HrmsEmployeeDocumentService(transactional as never, files);
          const document = await service.upload(
            org.id,
            employee.id,
            actor.id,
            { title: "Contract", category: "EMPLOYMENT" },
            { originalName: "contract.pdf", contentType: "application/pdf", data: Buffer.from("%PDF-1.7\nfixture") },
          );

          const stored = await tx.hrmsEmployeeDocument.findUniqueOrThrow({
            where: { id: document.id },
            include: { file: true },
          });
          expect(stored.file.accessScope).toBe("HRMS_EMPLOYEE_DOCUMENT");
          expect(stored.file.organizationId).toBe(org.id);
          expect(stored.employeeId).toBe(employee.id);
          expect(await files.listFiles(org.id)).toEqual([]);
          await expect(files.getDownloadUrl(org.id, stored.fileId, actor.id)).rejects.toMatchObject({ status: 404 });
          await expect(files.delete(org.id, stored.fileId, actor.id)).rejects.toMatchObject({ status: 404 });
          await expect(service.download(org.id, otherEmployee.id, document.id, actor.id)).rejects.toMatchObject({
            status: 404,
          });
          const foreignOrg = await tx.organization.create({
            data: { name: "Other synthetic organization", slug: `document-test-${randomUUID()}` },
          });
          await expect(service.list(foreignOrg.id, employee.id, { page: 1, pageSize: 20 })).rejects.toMatchObject({
            status: 404,
          });
          expect((await service.list(foreignOrg.id, undefined, { page: 1, pageSize: 20 })).items).toEqual([]);
          expect(
            (await service.list(org.id, undefined, { page: 1, pageSize: 20 })).items.map((item) => item.id),
          ).toEqual([document.id]);
          await expect(service.download(org.id, employee.id, document.id, actor.id)).resolves.toMatchObject({
            expiresIn: 900,
          });
          await service.archive(org.id, employee.id, document.id, actor.id);
          expect((await service.list(org.id, employee.id, { page: 1, pageSize: 20 })).total).toBe(0);
          await expect(service.download(org.id, employee.id, document.id, actor.id)).rejects.toMatchObject({
            status: 404,
          });
          await expect(service.archive(org.id, employee.id, document.id, actor.id)).rejects.toMatchObject({
            status: 404,
          });
          expect(await tx.storedFile.count({ where: { id: stored.fileId, deletedAt: null } })).toBe(1);
          expect(storage.delete).not.toHaveBeenCalled();
          const events = await tx.auditLog.findMany({
            where: { organizationId: org.id, resourceType: "HrmsEmployeeDocument", resourceId: document.id },
            orderBy: { createdAt: "asc" },
          });
          expect(events.map((event) => event.action)).toEqual([
            "hrms.employee.document_uploaded",
            "hrms.employee.document_archived",
          ]);
          expect(events.every((event) => event.actorUserId === actor.id)).toBe(true);
          throw rollback;
        },
        { timeout: 30_000 },
      ),
    ).rejects.toBe(rollback);
  });
});
