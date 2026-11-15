import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { HrmsAssetService } from "./hrms-asset.service";

// Explicit opt-in; fixture inventory, employees and audit history always roll back.
const databaseTest = process.env.HRMS_ASSET_DB_INTEGRATION === "true" ? describe : describe.skip;
databaseTest("asset database workflows", () => {
  const prisma = new PrismaClient();
  afterAll(() => prisma.$disconnect());
  it("preserves custody, history, tenant privacy and atomic audit failures across the full lifecycle", async () => {
    const rollback = new Error("Rollback synthetic asset fixtures");
    let syntheticAssetId = "";
    await expect(
      prisma.$transaction(
        async (tx) => {
          let rejectAudit = false;
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return async <T>(
                  operation: ((client: Prisma.TransactionClient) => Promise<T>) | Promise<unknown>[],
                ) => {
                  if (Array.isArray(operation)) {
                    return Promise.all(operation);
                  }
                  // Savepoints model independent failed service writes inside the rollback-only fixture.
                  await tx.$executeRaw`SAVEPOINT asset_operation`;
                  try {
                    const data = await operation(transactional);
                    await tx.$executeRaw`RELEASE SAVEPOINT asset_operation`;
                    return data;
                  } catch (reason) {
                    await tx.$executeRaw`ROLLBACK TO SAVEPOINT asset_operation`;
                    await tx.$executeRaw`RELEASE SAVEPOINT asset_operation`;
                    throw reason;
                  }
                };
              }
              if (key === "auditLog" && rejectAudit) {
                return new Proxy(target.auditLog, {
                  get(delegate, property) {
                    if (property === "create") {
                      return () => Promise.reject(new Error("Synthetic audit failure"));
                    }
                    return Reflect.get(delegate, property);
                  },
                });
              }
              return Reflect.get(target, key);
            },
          });
          const org = await tx.organization.create({
            data: { name: "Synthetic assets", slug: `asset-${randomUUID()}` },
          });
          const foreign = await tx.organization.create({
            data: { name: "Foreign asset tenant", slug: `asset-${randomUUID()}` },
          });
          const holder = await tx.user.create({
            data: { name: "Synthetic asset holder", email: `${randomUUID()}@assets.example.test` },
          });
          const employee = await tx.hrmsEmployee.create({
            data: { userId: holder.id, organizationId: org.id, employeeNumber: "ASSET-001", status: "ACTIVE" },
          });
          const service = new HrmsAssetService(transactional as never);
          const category = await service.saveCategory(org.id, holder.id, { name: "Developer equipment" });
          const asset = await service.create(org.id, holder.id, {
            name: "Synthetic notebook",
            assetTag: "DEV-001",
            type: "LAPTOP",
            categoryId: category.id,
            custodianEmployeeId: employee.id,
            purchaseCost: "1000.125",
            currency: "INR",
            notes: "Private inventory note",
          });
          syntheticAssetId = asset.id;
          expect(asset.serialNumber).toBeNull();
          expect(asset.revision).toBe(1);
          expect((await service.list(org.id)).items[0].custodianEmployee?.user.name).toBe("Synthetic asset holder");
          await expect(service.history(foreign.id, asset.id)).rejects.toMatchObject({ status: 404 });
          await expect(
            service.create(foreign.id, holder.id, {
              name: "Cross-tenant category",
              assetTag: "INVALID-001",
              type: "LAPTOP",
              categoryId: category.id,
            }),
          ).rejects.toMatchObject({ status: 400 });
          await expect(
            service.custody(foreign.id, asset.id, holder.id, "ISSUE", {
              revision: 1,
              condition: "NEW",
              notes: "Invalid tenant",
              employeeId: employee.id,
            }),
          ).rejects.toMatchObject({ status: 404 });
          rejectAudit = true;
          await expect(
            service.custody(org.id, asset.id, holder.id, "ISSUE", {
              revision: 1,
              condition: "NEW",
              notes: "Must roll back",
              employeeId: employee.id,
            }),
          ).rejects.toThrow("Synthetic audit failure");
          rejectAudit = false;
          expect(await tx.hrmsAsset.findUnique({ where: { id: asset.id } })).toMatchObject({
            revision: 1,
            status: "AVAILABLE",
            assignedEmployeeId: null,
          });
          expect(await tx.hrmsAssetEvent.count({ where: { assetId: asset.id, action: "ISSUED" } })).toBe(0);
          expect(await tx.auditLog.count({ where: { resourceId: asset.id, action: "hrms.asset.issue" } })).toBe(0);
          const issued = await service.custody(org.id, asset.id, holder.id, "ISSUE", {
            revision: 1,
            condition: "NEW",
            notes: "Notebook and charger",
            employeeId: employee.id,
            expectedReturnDate: "2099-12-01",
          });
          expect(issued).toMatchObject({
            status: "ASSIGNED",
            assignedEmployeeId: employee.id,
            revision: 2,
            acknowledgedAt: null,
          });
          await expect(
            service.custody(org.id, asset.id, holder.id, "ISSUE", {
              revision: 1,
              condition: "NEW",
              notes: "Stale double issue",
              employeeId: employee.id,
            }),
          ).rejects.toMatchObject({ status: 409 });
          await expect(service.acknowledge(org.id, asset.id, randomUUID(), { revision: 2 })).rejects.toMatchObject({
            status: 404,
          });
          await service.acknowledge(org.id, asset.id, holder.id, { revision: 2 });
          const mine = await service.myAssets(org.id, holder.id);
          expect(mine.items).toHaveLength(1);
          expect(mine.items[0].acknowledgedAt).toBeInstanceOf(Date);
          expect(mine.items[0]).not.toHaveProperty("notes");
          expect(mine.items[0]).not.toHaveProperty("purchaseCost");
          expect(await service.clearance(org.id, employee.id)).toMatchObject({ clear: false, scope: "ASSETS_ONLY" });
          await expect(service.archive(org.id, asset.id, holder.id, { revision: 3 })).rejects.toMatchObject({
            status: 409,
          });
          const returned = await service.custody(org.id, asset.id, holder.id, "RETURN", {
            revision: 3,
            condition: "GOOD",
            notes: "Returned with charger",
            status: "AVAILABLE",
          });
          expect(returned).toMatchObject({
            revision: 4,
            assignedEmployeeId: null,
            assignedAt: null,
            expectedReturnDate: null,
            acknowledgedAt: null,
            status: "AVAILABLE",
          });
          expect(await service.clearance(org.id, employee.id)).toMatchObject({ clear: true, scope: "ASSETS_ONLY" });
          expect(await service.myAssets(org.id, holder.id)).toMatchObject({ items: [], total: 0 });
          await service.archive(org.id, asset.id, holder.id, { revision: 4 });
          expect(await service.list(org.id)).toMatchObject({ items: [], summary: { total: 0 } });
          expect((await service.list(org.id, { archived: "true" })).items).toHaveLength(1);
          const history = await service.history(org.id, asset.id);
          expect(history.items.map((event) => event.action).sort()).toEqual([
            "ACKNOWLEDGED",
            "ARCHIVED",
            "CREATED",
            "ISSUED",
            "RETURNED",
          ]);
          expect(await tx.auditLog.count({ where: { organizationId: org.id, resourceId: asset.id } })).toBe(5);
          expect((await service.export(org.id, { archived: "true" })).csv).toContain('"1000.125"');
          expect(await tx.hrmsEmployee.findUnique({ where: { id: employee.id } })).toMatchObject({
            status: "ACTIVE",
            endDate: null,
          });
          expect(await tx.hrmsPayrollRecord.count({ where: { employeeId: employee.id } })).toBe(0);
          throw rollback;
        },
        { timeout: 30000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    ).rejects.toBe(rollback);
    expect(await prisma.hrmsAsset.count({ where: { id: syntheticAssetId } })).toBe(0);
  });
  it("does not invent events or acknowledgement when existing assigned inventory is first read", async () => {
    const rollback = new Error("Rollback legacy asset fixture");
    await expect(
      prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: { name: "Legacy assets fixture", slug: `asset-${randomUUID()}` },
        });
        const user = await tx.user.create({
          data: { name: "Legacy holder", email: `${randomUUID()}@assets.example.test` },
        });
        const employee = await tx.hrmsEmployee.create({
          data: { organizationId: org.id, userId: user.id, employeeNumber: "LEGACY-1", status: "ACTIVE" },
        });
        const asset = await tx.hrmsAsset.create({
          data: {
            organizationId: org.id,
            name: "Legacy equipment",
            type: "LAPTOP",
            serialNumber: randomUUID(),
            assignedEmployeeId: employee.id,
            assignedAt: new Date("2020-01-01"),
            status: "ASSIGNED",
          },
        });
        const transactional = new Proxy(tx, {
          get(target, key) {
            if (key === "$transaction") {
              return (operations: Promise<unknown>[]) => Promise.all(operations);
            }
            return Reflect.get(target, key);
          },
        });
        const service = new HrmsAssetService(transactional as never);
        expect((await service.list(org.id)).items[0]).toMatchObject({
          assignedEmployeeId: employee.id,
          acknowledgedAt: null,
        });
        expect((await service.history(org.id, asset.id)).items).toEqual([]);
        expect(await tx.auditLog.count({ where: { resourceId: asset.id } })).toBe(0);
        throw rollback;
      }),
    ).rejects.toBe(rollback);
  });
});
