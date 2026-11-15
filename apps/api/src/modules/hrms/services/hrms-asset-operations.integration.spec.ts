import { randomUUID } from "node:crypto";
import { Prisma, PrismaClient } from "@prisma/client";
import { HrmsAssetService } from "./hrms-asset.service";
import { HrmsAssetOperationsService } from "./hrms-asset-operations.service";
import { HrmsAssetEvidenceService } from "./hrms-asset-evidence.service";
import { assertAssetClearance } from "../asset-clearance";
import { HrmsWorkflowInstanceService } from "./hrms-workflow-instance.service";
import { HrmsEmployeeService } from "./hrms-employee.service";
import { HrmsWorkflowDefinitionService } from "./hrms-workflow-definition.service";

const databaseTest = process.env.HRMS_ASSET_DB_INTEGRATION === "true" ? describe : describe.skip;
databaseTest("connected asset operations persistence", () => {
  const db = new PrismaClient();
  afterAll(() => db.$disconnect());
  it("runs replacement, accessory, clearance override, maintenance, stock, import and finance workflows without side effects outside asset management", async () => {
    const rollback = new Error("Rollback connected asset fixtures");
    await expect(
      db.$transaction(
        async (tx) => {
          const transactional = new Proxy(tx, {
            get(target, key) {
              if (key === "$transaction") {
                return async <T>(
                  operation: ((client: Prisma.TransactionClient) => Promise<T>) | Promise<unknown>[],
                ) => {
                  if (Array.isArray(operation)) {
                    return Promise.all(operation);
                  }
                  await tx.$executeRaw`SAVEPOINT asset_operations`;
                  try {
                    const result = await operation(transactional);
                    await tx.$executeRaw`RELEASE SAVEPOINT asset_operations`;
                    return result;
                  } catch (error) {
                    await tx.$executeRaw`ROLLBACK TO SAVEPOINT asset_operations`;
                    await tx.$executeRaw`RELEASE SAVEPOINT asset_operations`;
                    throw error;
                  }
                };
              }
              return Reflect.get(target, key);
            },
          });
          const org = await tx.organization.create({
            data: { name: "Synthetic asset operations", slug: `ops-${randomUUID()}` },
          });
          const foreign = randomUUID();
          const createUser = (name: string) =>
            tx.user.create({ data: { name, email: `${randomUUID()}@asset-ops.example.test` } });
          const [hr, manager, holder, outsider] = await Promise.all(
            ["HR", "Manager", "Holder", "Other"].map(createUser),
          );
          await tx.organizationMember.create({ data: { organizationId: org.id, userId: hr.id } });
          const managerEmployee = await tx.hrmsEmployee.create({
            data: { organizationId: org.id, userId: manager.id, employeeNumber: "M-1", status: "ACTIVE" },
          });
          const employee = await tx.hrmsEmployee.create({
            data: {
              organizationId: org.id,
              userId: holder.id,
              employeeNumber: "E-1",
              status: "ACTIVE",
              reportingManagerId: managerEmployee.id,
            },
          });
          const permissions = {
            hasPermission: jest.fn(async ({ userId }: { userId: string }) => userId === hr.id),
            assertPermission: jest.fn(async ({ userId }: { userId: string }) => {
              if (userId !== hr.id) {
                throw new Error("Finance denied");
              }
            }),
            isOrganizationAdministrator: jest.fn(async (id: string) => id === hr.id),
          };
          const assets = new HrmsAssetService(transactional as never);
          const operations = new HrmsAssetOperationsService(transactional as never, assets, permissions as never);
          const createAsset = (tag: string) =>
            assets.create(org.id, hr.id, {
              name: tag,
              assetTag: tag,
              type: "LAPTOP",
              purchaseDate: "2026-01-15",
              purchaseCost: "1200.000",
              currency: "INR",
            });
          let original = await createAsset("OPS-1");
          const replacement = await createAsset("OPS-2");
          const accessory = await operations.addAccessory(org.id, hr.id, original.id, {
            revision: original.revision,
            name: "Charger",
            quantity: 2,
          });
          original = await tx.hrmsAsset.findUniqueOrThrow({
            where: { id: original.id },
            include: {
              assignedEmployee: { select: { id: true, employeeNumber: true, user: { select: { name: true } } } },
              category: { select: { id: true, name: true, isActive: true } },
            },
          });
          const issued = await assets.custody(org.id, original.id, hr.id, "ISSUE", {
            revision: original.revision,
            employeeId: employee.id,
            condition: "NEW",
            notes: "Issued with two chargers",
          });
          expect((await operations.accessories(org.id, original.id))[0].outstanding).toBe(2);
          await expect(
            assets.custody(org.id, original.id, hr.id, "RETURN", {
              revision: issued.revision,
              condition: "GOOD",
              notes: "Incomplete return",
            }),
          ).rejects.toMatchObject({ status: 409 });
          await expect(
            operations.requestReplacement(org.id, outsider.id, {
              assetId: original.id,
              revision: issued.revision,
              reason: "Not mine",
            }),
          ).rejects.toMatchObject({ status: 403 });
          const request = await operations.requestReplacement(org.id, holder.id, {
            assetId: original.id,
            revision: issued.revision,
            reason: "Faulty battery",
          });
          expect(request.managerUserId).toBe(manager.id);
          expect(
            await tx.notificationOutbox.count({ where: { organizationId: org.id, recipientId: manager.id } }),
          ).toBe(1);
          await expect(
            operations.requestReplacement(org.id, holder.id, {
              assetId: original.id,
              revision: issued.revision,
              reason: "Duplicate",
            }),
          ).rejects.toMatchObject({ status: 409 });
          expect((await operations.requests(org.id, outsider.id, 1, 20)).total).toBe(0);
          expect((await operations.requests(org.id, outsider.id, 1, 20, true)).total).toBe(0);
          expect((await operations.requests(org.id, holder.id, 1, 20, true)).items[0]).toMatchObject({
            isOwn: true,
            canFulfil: false,
            requestedFor: { employeeNumber: "E-1", user: { name: "Holder" } },
          });
          expect((await operations.requests(org.id, hr.id, 1, 20, true)).total).toBe(0);
          expect((await operations.requests(org.id, manager.id, 1, 20)).items[0].canDecide).toBe(true);
          await expect(
            operations.decideRequest(org.id, hr.id, request.id, {
              revision: 1,
              action: "APPROVE",
              note: "Not assigned manager",
            }),
          ).rejects.toMatchObject({ status: 403 });
          const approved = await operations.decideRequest(org.id, manager.id, request.id, {
            revision: 1,
            action: "APPROVE",
            note: "Replacement approved",
          });
          expect((await operations.requests(org.id, hr.id, 1, 20, true)).items[0]).toMatchObject({
            isOwn: false,
            canDecide: false,
            canFulfil: true,
            status: "APPROVED",
          });
          await expect(
            operations.decideRequest(org.id, hr.id, request.id, {
              revision: approved.revision,
              action: "FULFIL",
              note: "Too early",
              replacementAssetId: replacement.id,
              assetRevision: replacement.revision,
            }),
          ).rejects.toMatchObject({ status: 409 });
          const clearance = await assets.clearance(org.id, employee.id);
          expect(clearance.clear).toBe(false);
          await expect(assertAssetClearance(tx, org.id, employee.id)).rejects.toMatchObject({ status: 409 });
          const employees = new HrmsEmployeeService(transactional as never, { record: jest.fn() } as never);
          await expect(employees.update(org.id, employee.id, hr.id, { status: "INACTIVE" })).rejects.toMatchObject({
            status: 409,
          });
          await expect(employees.delete(org.id, employee.id, hr.id)).rejects.toMatchObject({ status: 409 });
          const stages = [
            { id: "offboarding-2", name: "Clearance", type: "TASK" },
            { id: "offboarding-3", name: "Completed", type: "AUTOMATION", isTerminal: true },
          ];
          const transitions = [{ from: "offboarding-2", to: "offboarding-3", action: "COMPLETE" }];
          const definition = await tx.hrmsWorkflowDefinition.create({
            data: {
              organizationId: org.id,
              name: "Synthetic offboarding",
              stages,
              transitions,
              status: "ACTIVE",
              assetClearanceRequired: true,
              createdByUserId: hr.id,
            },
          });
          const version = await tx.hrmsWorkflowDefinitionVersion.create({
            data: {
              definitionId: definition.id,
              version: 1,
              name: definition.name,
              stages,
              transitions,
              publishedByUserId: hr.id,
            },
          });
          const instance = await tx.hrmsWorkflowInstance.create({
            data: {
              organizationId: org.id,
              definitionId: definition.id,
              definitionVersionId: version.id,
              definitionVersion: 1,
              currentStageId: "offboarding-2",
              context: { employeeId: employee.id },
              definitionSnapshot: { stages, transitions },
              initiatedByUserId: hr.id,
            },
          });
          const assignment = await tx.hrmsWorkflowAssignment.create({
            data: { organizationId: org.id, instanceId: instance.id, stageId: "offboarding-2", assigneeUserId: hr.id },
          });
          const workflows = new HrmsWorkflowInstanceService(transactional as never, { record: jest.fn() } as never);
          const definitions = new HrmsWorkflowDefinitionService(transactional as never, { record: jest.fn() } as never);
          const clone = await definitions.clone(org.id, definition.id, hr.id);
          await definitions.update(org.id, clone.id, hr.id, {
            stages: [
              { id: "review", key: "review", name: "Review", type: "TASK", assigneeRule: { kind: "INITIATOR" } },
              { id: "done", key: "done", name: "Done", type: "AUTOMATION", isTerminal: true },
            ],
            transitions: [{ from: "review", to: "done", action: "COMPLETE" }],
          });
          await definitions.publish(org.id, clone.id, hr.id);
          const renamedInstance = await workflows.create(org.id, hr.id, {
            definitionId: clone.id,
            context: { employeeId: employee.id },
          });
          expect(renamedInstance.definitionSnapshot).toMatchObject({ assetClearanceRequired: true });
          await expect(workflows.act(org.id, renamedInstance.id, hr.id, { action: "COMPLETE" })).rejects.toMatchObject({
            status: 409,
          });
          await expect(workflows.act(org.id, instance.id, hr.id, { action: "COMPLETE" })).rejects.toMatchObject({
            status: 409,
          });
          expect(await tx.hrmsWorkflowAssignment.findUnique({ where: { id: assignment.id } })).toMatchObject({
            status: "PENDING",
          });
          await expect(
            operations.overrideClearance(org.id, outsider.id, employee.id, {
              reason: "Unauthorized",
              fingerprint: clearance.fingerprint,
            }),
          ).rejects.toMatchObject({ status: 403 });
          expect(
            (
              await operations.overrideClearance(org.id, hr.id, employee.id, {
                reason: "HR approved temporary exception",
                fingerprint: clearance.fingerprint,
              })
            ).clear,
          ).toBe(true);
          await expect(assertAssetClearance(tx, org.id, employee.id)).resolves.toBeUndefined();
          expect((await workflows.act(org.id, instance.id, hr.id, { action: "COMPLETE" })).status).toBe("COMPLETED");
          const currentAccessory = await tx.hrmsAssetAccessory.findUniqueOrThrow({ where: { id: accessory.id } });
          await operations.returnAccessory(org.id, hr.id, accessory.id, {
            revision: currentAccessory.revision,
            quantity: 1,
            condition: "GOOD",
            note: "First charger",
          });
          expect((await assets.clearance(org.id, employee.id)).clear).toBe(false);
          await expect(
            operations.overrideClearance(org.id, hr.id, employee.id, {
              reason: "Stale override",
              fingerprint: clearance.fingerprint,
            }),
          ).rejects.toMatchObject({ status: 409 });
          const partial = await tx.hrmsAssetAccessory.findUniqueOrThrow({ where: { id: accessory.id } });
          expect(partial.outstanding).toBe(1);
          await operations.returnAccessory(org.id, hr.id, accessory.id, {
            revision: partial.revision,
            quantity: 1,
            condition: "GOOD",
            note: "Second charger",
          });
          const assetBeforeReturn = await tx.hrmsAsset.findUniqueOrThrow({ where: { id: original.id } });
          const returned = await assets.custody(org.id, original.id, hr.id, "RETURN", {
            revision: assetBeforeReturn.revision,
            condition: "FAIR",
            notes: "Original returned",
          });
          const fulfilled = await operations.decideRequest(org.id, hr.id, request.id, {
            revision: approved.revision,
            action: "FULFIL",
            note: "Replacement issued",
            replacementAssetId: replacement.id,
            assetRevision: replacement.revision,
          });
          expect(fulfilled.status).toBe("FULFILLED");
          expect((await operations.requests(org.id, hr.id, 1, 20, true)).total).toBe(0);
          expect((await operations.requests(org.id, holder.id, 1, 20, true)).total).toBe(0);
          expect(await tx.hrmsAsset.findUnique({ where: { id: replacement.id } })).toMatchObject({
            assignedEmployeeId: employee.id,
            acknowledgedAt: null,
          });
          const ticket = await operations.openMaintenance(org.id, hr.id, {
            assetId: original.id,
            revision: returned.revision,
            fault: "Battery",
            vendor: "Synthetic repair vendor",
          });
          await expect(
            assets.custody(org.id, original.id, hr.id, "ISSUE", {
              revision: returned.revision + 1,
              employeeId: employee.id,
              condition: "FAIR",
              notes: "Cannot issue in repair",
            }),
          ).rejects.toMatchObject({ status: 409 });
          const repaired = await operations.closeMaintenance(org.id, hr.id, ticket.id, {
            revision: ticket.revision,
            assetRevision: returned.revision + 1,
            resolution: "Battery replaced",
            cost: "125.125",
            currency: "INR",
            condition: "GOOD",
            status: "AVAILABLE",
          });
          expect(repaired.cost?.toString()).toBe("125.125");
          await expect(
            operations.closeMaintenance(org.id, hr.id, ticket.id, {
              revision: ticket.revision,
              assetRevision: returned.revision + 1,
              resolution: "Duplicate",
              cost: "0",
              currency: "INR",
              condition: "GOOD",
              status: "AVAILABLE",
            }),
          ).rejects.toMatchObject({ status: 409 });
          const stock = await operations.createStockCheck(org.id, hr.id, { name: "Annual equipment check" });
          const stockItems = await operations.stockItems(org.id, stock.id, 1, 20);
          expect(stockItems.total).toBe(2);
          await expect(operations.completeStock(org.id, hr.id, stock.id, stock.revision)).rejects.toMatchObject({
            status: 409,
          });
          for (const [index, item] of stockItems.items.entries()) {
            const observed = await operations.observeStock(org.id, hr.id, item.id, {
              revision: item.revision,
              result: index ? "FOUND" : "MISSING",
              note: "Physical check performed",
            });
            if (!index) {
              await operations.observeStock(
                org.id,
                hr.id,
                item.id,
                {
                  revision: observed.revision,
                  resolution: "Located in repair store; inventory correction tracked separately",
                },
                true,
              );
            }
          }
          const checkNow = await tx.hrmsAssetStockCheck.findUniqueOrThrow({ where: { id: stock.id } });
          expect((await operations.completeStock(org.id, hr.id, stock.id, checkNow.revision)).status).toBe("COMPLETED");
          await expect(operations.stockItems(foreign, stock.id, 1, 20)).rejects.toMatchObject({ status: 404 });
          const purchase = await operations.createProcurement(org.id, outsider.id, {
            name: "Monitors",
            quantity: 2,
            estimatedCost: "200.000",
            currency: "INR",
            reason: "New team",
          });
          expect(
            (
              await operations.decideProcurement(org.id, hr.id, purchase.id, {
                revision: purchase.revision,
                action: "APPROVE",
                note: "Budget approved",
              })
            ).status,
          ).toBe("APPROVED");
          const selfPurchase = await operations.createProcurement(org.id, hr.id, {
            name: "Desk",
            quantity: 1,
            estimatedCost: "100",
            currency: "INR",
            reason: "Workspace",
          });
          await expect(
            operations.decideProcurement(org.id, hr.id, selfPurchase.id, {
              revision: 1,
              action: "APPROVE",
              note: "Self approval",
            }),
          ).rejects.toMatchObject({ status: 403 });
          expect((await operations.accounting(org.id, "2027-01-15")).rows[0].status).toBe("DISABLED");
          await operations.configureDepreciation(org.id, hr.id, {
            revision: 0,
            method: "STRAIGHT_LINE",
            usefulLifeMonths: 24,
            residualPercent: "10",
            reason: "Finance approved policy",
          });
          const accounting = await operations.accounting(org.id, "2027-01-15");
          expect(accounting.rows[0]).toMatchObject({
            depreciation: "540.000",
            netBookValue: "660.000",
            status: "CALCULATED",
          });
          expect((await operations.accounting(org.id, "2025-01-15")).rows[0].depreciation).toBe("0.000");
          expect((await operations.accounting(org.id, "2035-01-15")).rows[0].netBookValue).toBe("120.000");
          const files = {
            upload: jest.fn(
              async (_org: string, actor: string, file: { originalName: string; contentType: string; data: Buffer }) =>
                tx.storedFile.create({
                  data: {
                    organizationId: org.id,
                    uploadedById: actor,
                    bucket: "synthetic-only",
                    objectKey: randomUUID(),
                    originalName: file.originalName,
                    contentType: file.contentType,
                    sizeBytes: file.data.length,
                    checksumSha256: "synthetic",
                    accessScope: "HRMS_ASSET_DOCUMENT",
                  },
                }),
            ),
            delete: jest.fn(),
            getDownloadUrl: jest.fn().mockResolvedValue({ url: "https://example.test/private", expiresIn: 60 }),
          };
          const evidence = new HrmsAssetEvidenceService(transactional as never, files as never, assets);
          const attachment = await evidence.upload(
            org.id,
            hr.id,
            original.id,
            { title: "Repair invoice", kind: "INVOICE" },
            { originalName: "invoice.pdf", contentType: "application/pdf", data: Buffer.from("%PDF-synthetic") },
          );
          expect((await evidence.attachments(org.id, original.id))[0].title).toBe("Repair invoice");
          await expect(evidence.download(foreign, hr.id, attachment.id)).rejects.toMatchObject({ status: 404 });
          await evidence.download(org.id, hr.id, attachment.id);
          expect(files.getDownloadUrl).toHaveBeenCalledWith(org.id, expect.any(String), hr.id, {
            accessScope: "HRMS_ASSET_DOCUMENT",
          });
          await evidence.archive(org.id, hr.id, attachment.id);
          expect(await evidence.attachments(org.id, original.id)).toEqual([]);
          await expect(
            evidence.upload(
              org.id,
              hr.id,
              original.id,
              { title: "Bad photo", kind: "CONDITION" },
              { originalName: "bad.png", contentType: "image/png", data: Buffer.from("not-a-png") },
            ),
          ).rejects.toMatchObject({ status: 400 });
          const csv = (text: string) => ({
            originalName: "assets.csv",
            contentType: "text/csv",
            data: Buffer.from(text),
          });
          const invalid = await evidence.preview(
            org.id,
            hr.id,
            csv("name,assetTag,type\nExisting,OPS-1,LAPTOP\nFirst,DUP,LAPTOP\nSecond,DUP,LAPTOP"),
          );
          expect(invalid.valid).toBe(1);
          expect(await evidence.apply(org.id, hr.id, invalid.id)).toEqual({ count: 1, skipped: 2 });
          expect(await tx.hrmsAsset.count({ where: { organizationId: org.id, assetTag: "DUP" } })).toBe(1);
          const preview = await evidence.preview(
            org.id,
            hr.id,
            csv('name,assetTag,type\n"Imported, equipment",IMPORTED-1,LAPTOP'),
          );
          expect(preview.valid).toBe(1);
          await expect(evidence.apply(org.id, outsider.id, preview.id)).rejects.toMatchObject({ status: 409 });
          expect(await evidence.apply(org.id, hr.id, preview.id)).toEqual({ count: 1, skipped: 0 });
          await expect(evidence.apply(org.id, hr.id, preview.id)).rejects.toMatchObject({ status: 409 });
          expect(
            await tx.hrmsAsset.count({
              where: { organizationId: org.id, assetTag: "IMPORTED-1", status: "AVAILABLE" },
            }),
          ).toBe(1);
          expect(await tx.hrmsEmployee.findUnique({ where: { id: employee.id } })).toMatchObject({
            status: "ACTIVE",
            deletedAt: null,
          });
          expect(await tx.hrmsPayrollRecord.count({ where: { employeeId: employee.id } })).toBe(0);
          throw rollback;
        },
        { timeout: 60000, isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      ),
    ).rejects.toBe(rollback);
  });
});
