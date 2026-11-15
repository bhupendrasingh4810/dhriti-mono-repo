import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { hrmsAssetRegisterSchema, hrmsAssetCustodySchema } from "@dhriti/validation";
import { HrmsAssetService } from "./hrms-asset.service";
import { HrmsAssetController, AssetEmployeeQueryDto } from "../controllers/hrms-asset.controller";
import { ListHrmsAssetsDto } from "../dto/hrms-operations.dto";
import { ACCESS_REQUIREMENTS_KEY } from "../../../common/decorators/access.decorator";

const employeeId = randomUUID();
const input = { name: "Engineering laptop", assetTag: "IT-001", type: "LAPTOP", serialNumber: null };
function fixture() {
  const asset = {
    id: randomUUID(),
    organizationId: "org",
    ...input,
    status: "AVAILABLE",
    condition: "GOOD",
    revision: 1,
    archivedAt: null,
    assignedEmployeeId: null,
    acknowledgedAt: null,
    expectedReturnDate: null,
    assignedEmployee: null,
    categoryId: null,
  };
  const employee = {
    id: employeeId,
    employeeNumber: "EMP-101",
    userId: "holder",
    user: { name: "Synthetic employee" },
  };
  const tx = {
    hrmsAsset: {
      findFirst: jest.fn().mockResolvedValue(asset),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ ...asset, ...data })),
      update: jest.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          ...asset,
          ...data,
          revision: 2,
        }),
      ),
    },
    hrmsEmployee: {
      findFirst: jest.fn().mockResolvedValue(employee),
      findMany: jest.fn().mockResolvedValue([employee]),
      count: jest.fn().mockResolvedValue(1),
    },
    hrmsAssetCategory: {
      findFirst: jest.fn().mockResolvedValue({ id: "category", isActive: true }),
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue({ id: "category", name: "Equipment", isActive: true }),
      update: jest.fn().mockResolvedValue({ id: "category", name: "Equipment", isActive: false }),
    },
    hrmsAssetEvent: {
      create: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    auditLog: { create: jest.fn().mockResolvedValue({}) },
    user: { findMany: jest.fn().mockResolvedValue([]) },
    hrmsAssetAccessory: { findMany: jest.fn().mockResolvedValue([]), update: jest.fn() },
    hrmsAssetClearanceOverride: { findFirst: jest.fn().mockResolvedValue(null) },
    hrmsAssetMaintenance: { findFirst: jest.fn().mockResolvedValue(null) },
  };
  const prisma = {
    ...tx,
    $transaction: jest.fn(async (operation: ((client: typeof tx) => Promise<unknown>) | Promise<unknown>[]) =>
      Array.isArray(operation) ? Promise.all(operation) : operation(tx),
    ),
  };
  return { asset, employee, tx, prisma, service: new HrmsAssetService(prisma as never) };
}
describe("asset register validation", () => {
  it("accepts tag-based inventory without a serial and trims identifiers", () => {
    expect(hrmsAssetRegisterSchema.parse({ ...input, assetTag: " IT-001 " })).toMatchObject({
      assetTag: "IT-001",
      serialNumber: null,
    });
  });
  it.each([
    { assetTag: " " },
    { name: "" },
    { type: "OTHER" },
    { purchaseCost: "-1", currency: "USD" },
    { purchaseCost: "1.2345", currency: "USD" },
    { purchaseCost: "1000000000000000", currency: "USD" },
    { purchaseCost: "50" },
    { purchaseCost: "50", currency: "usd" },
    { purchaseDate: "2026-02-30" },
    { purchaseDate: "2026-03-01", warrantyExpiresOn: "2026-02-01" },
    { revision: 2 },
    { categoryId: "not-an-id" },
  ])("rejects invalid register fields: %j", (change) => {
    expect(hrmsAssetRegisterSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
  it("accepts zero amounts, leap dates and an active-category reference for Other", () => {
    expect(
      hrmsAssetRegisterSchema.safeParse({
        ...input,
        type: "OTHER",
        categoryId: randomUUID(),
        purchaseDate: "2028-02-29",
        purchaseCost: "0.000",
        currency: "INR",
      }).success,
    ).toBe(true);
  });
  it("requires a revision, condition and meaningful handover note", () => {
    expect(hrmsAssetCustodySchema.safeParse({ revision: 1, condition: "GOOD", notes: " " }).success).toBe(false);
    expect(hrmsAssetCustodySchema.safeParse({ revision: 0, condition: "GOOD", notes: "Received" }).success).toBe(false);
  });
  it("rejects fractional pagination, oversized pages and unsupported filters at the HTTP boundary", async () => {
    const invalid = plainToInstance(ListHrmsAssetsDto, {
      page: "1.5",
      pageSize: "101",
      archived: "yes",
      status: "LOST",
    });
    expect((await validate(invalid)).map((error) => error.property)).toEqual(
      expect.arrayContaining(["page", "pageSize", "archived", "status"]),
    );
    expect(
      await validate(plainToInstance(AssetEmployeeQueryDto, { page: "3", pageSize: "50", includeInactive: "true" })),
    ).toEqual([]);
  });
});
describe("asset persistence contracts", () => {
  it("resolves inventory custodian labels within the tenant without private profile fields", async () => {
    const { service, tx, asset } = fixture();
    tx.hrmsAsset.findMany.mockResolvedValue([{ ...asset, custodianEmployeeId: employeeId }]);
    const result = await service.list("org");
    expect(result.items[0].custodianEmployee?.user.name).toBe("Synthetic employee");
    expect(tx.hrmsEmployee.findMany).toHaveBeenCalledWith({
      where: { organizationId: "org", id: { in: [employeeId] } },
      select: { id: true, employeeNumber: true, user: { select: { name: true } } },
    });
  });
  it("keeps register reads/writes protected and self-service holder scoped", () => {
    for (const action of ["list", "categories", "employees", "history", "export", "clearance"] as const) {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsAssetController.prototype[action])).toEqual({
        entitlement: "hrms.enabled",
        permission: "hrms.asset.read",
      });
    }
    for (const action of [
      "create",
      "update",
      "issue",
      "returnAsset",
      "archive",
      "createCategory",
      "updateCategory",
    ] as const) {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsAssetController.prototype[action])).toEqual({
        entitlement: "hrms.enabled",
        permission: "hrms.asset.manage",
      });
    }
    for (const action of ["mine", "acknowledge"] as const) {
      expect(Reflect.getMetadata(ACCESS_REQUIREMENTS_KEY, HrmsAssetController.prototype[action])).toEqual({
        entitlement: "hrms.enabled",
      });
    }
  });
  it("registers an asset and event/audit in a serializable transaction", async () => {
    const { service, tx, prisma } = fixture();
    const asset = await service.create("org", "actor", input);
    expect(asset.serialNumber).toBeNull();
    expect(tx.hrmsAsset.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ organizationId: "org", assetTag: input.assetTag }) }),
    );
    expect(tx.hrmsAssetEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "CREATED", organizationId: "org", actorUserId: "actor" }),
    });
    expect(tx.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "Serializable" });
  });
  it.each(["FOREIGN", "INACTIVE"] as const)("rejects %s categories", async (kind) => {
    const { service, tx } = fixture();
    tx.hrmsAssetCategory.findFirst.mockResolvedValue(kind === "FOREIGN" ? null : { isActive: false });
    await expect(service.create("org", "actor", { ...input, categoryId: randomUUID() })).rejects.toMatchObject({
      status: 400,
    });
    expect(tx.hrmsAsset.create).not.toHaveBeenCalled();
  });
  it("rejects unknown custodians and assignee/status mismatches", async () => {
    const { service, tx } = fixture();
    tx.hrmsEmployee.findFirst.mockResolvedValue(null);
    await expect(service.create("org", "actor", { ...input, custodianEmployeeId: employeeId })).rejects.toMatchObject({
      status: 404,
    });
    await expect(service.create("org", "actor", { ...input, status: "ASSIGNED" })).rejects.toMatchObject({
      status: 400,
    });
    expect(tx.hrmsAsset.create).not.toHaveBeenCalled();
  });
  it("requires CAS revision and active tenant employees when issuing", async () => {
    const { service, tx, asset } = fixture();
    const result = await service.custody("org", asset.id, "actor", "ISSUE", {
      revision: 1,
      employeeId,
      condition: "GOOD",
      notes: "Charger included",
      expectedReturnDate: "2099-12-01",
    });
    expect(result.status).toBe("ASSIGNED");
    expect(tx.hrmsAsset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: asset.id, organizationId: "org", revision: 1 },
        data: expect.objectContaining({
          assignedEmployeeId: employeeId,
          acknowledgedAt: null,
          revision: { increment: 1 },
        }),
      }),
    );
    expect(tx.hrmsEmployee.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: employeeId, organizationId: "org", deletedAt: null, status: "ACTIVE" },
      }),
    );
    expect(tx.hrmsAssetEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "ISSUED",
        employeeName: "Synthetic employee (EMP-101)",
        notes: "Charger included",
      }),
    });
  });
  it.each(["stale", "assigned", "archived", "maintenance", "foreign", "inactive", "past-due"] as const)(
    "rejects %s issue without events",
    async (kind) => {
      const { service, tx, asset } = fixture();
      tx.hrmsAsset.findFirst.mockResolvedValue(
        kind === "foreign"
          ? null
          : {
              ...asset,
              ...(kind === "stale" ? { revision: 2 } : {}),
              ...(kind === "assigned" ? { assignedEmployeeId: employeeId, status: "ASSIGNED" } : {}),
              ...(kind === "archived" ? { archivedAt: new Date() } : {}),
              ...(kind === "maintenance" ? { status: "MAINTENANCE" } : {}),
            },
      );
      if (kind === "inactive") {
        tx.hrmsEmployee.findFirst.mockResolvedValue(null);
      }
      await expect(
        service.custody("org", asset.id, "actor", "ISSUE", {
          revision: 1,
          employeeId,
          condition: "GOOD",
          notes: "Issue",
          ...(kind === "past-due" ? { expectedReturnDate: "2000-01-01" } : {}),
        }),
      ).rejects.toBeDefined();
      expect(tx.hrmsAsset.update).not.toHaveBeenCalled();
      expect(tx.hrmsAssetEvent.create).not.toHaveBeenCalled();
    },
  );
  it("prevents metadata edits bypassing issue/return or changing assigned condition", async () => {
    const { service, tx, asset, employee } = fixture();
    tx.hrmsAsset.findFirst.mockResolvedValue({
      ...asset,
      assignedEmployeeId: employeeId,
      assignedEmployee: employee,
      status: "ASSIGNED",
    });
    for (const change of [{ assignedEmployeeId: null }, { status: "AVAILABLE" }, { condition: "FAIR" }]) {
      await expect(
        service.update("org", asset.id, "actor", { ...input, revision: 1, ...change }),
      ).rejects.toBeDefined();
    }
    expect(tx.hrmsAsset.update).not.toHaveBeenCalled();
  });
  it("verifies return without requiring a departed holder to still be active", async () => {
    const { service, tx, asset, employee } = fixture();
    tx.hrmsAsset.findFirst.mockResolvedValue({
      ...asset,
      status: "ASSIGNED",
      assignedEmployeeId: employeeId,
      assignedEmployee: employee,
      acknowledgedAt: new Date(),
    });
    await service.custody("org", asset.id, "actor", "RETURN", {
      revision: 1,
      condition: "FAIR",
      notes: "Screen requires repair",
      status: "MAINTENANCE",
    });
    expect(tx.hrmsEmployee.findFirst).not.toHaveBeenCalled();
    expect(tx.hrmsAsset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "MAINTENANCE",
          assignedEmployeeId: null,
          assignedAt: null,
          acknowledgedAt: null,
          expectedReturnDate: null,
        }),
      }),
    );
    expect(tx.hrmsAssetEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "RETURNED", employeeId }),
    });
  });
  it("prevents return from transferring custody or setting another due date", async () => {
    const { service, tx, asset, employee } = fixture();
    tx.hrmsAsset.findFirst.mockResolvedValue({
      ...asset,
      status: "ASSIGNED",
      assignedEmployeeId: employeeId,
      assignedEmployee: employee,
    });
    await expect(
      service.custody("org", asset.id, "actor", "RETURN", {
        revision: 1,
        employeeId,
        condition: "GOOD",
        notes: "Return",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(tx.hrmsAsset.update).not.toHaveBeenCalled();
  });
  it("acknowledges only for the current authenticated holder", async () => {
    const { service, tx, asset } = fixture();
    tx.hrmsAsset.findFirst.mockResolvedValue({ ...asset, assignedEmployeeId: employeeId, status: "ASSIGNED" });
    await service.acknowledge("org", asset.id, "holder", { revision: 1 });
    expect(tx.hrmsEmployee.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: employeeId,
          organizationId: "org",
          userId: "holder",
          deletedAt: null,
        },
      }),
    );
    tx.hrmsEmployee.findFirst.mockResolvedValue(null);
    await expect(service.acknowledge("org", asset.id, "stranger", { revision: 1 })).rejects.toMatchObject({
      status: 404,
    });
  });
  it("does not allow acknowledgement twice", async () => {
    const { service, tx, asset } = fixture();
    tx.hrmsAsset.findFirst.mockResolvedValue({
      ...asset,
      assignedEmployeeId: employeeId,
      status: "ASSIGNED",
      acknowledgedAt: new Date(),
    });
    await expect(service.acknowledge("org", asset.id, "holder", { revision: 1 })).rejects.toMatchObject({
      status: 409,
    });
    expect(tx.hrmsAsset.update).not.toHaveBeenCalled();
  });
  it("limits self-service to holder fields with real pagination", async () => {
    const { service, tx } = fixture();
    await service.myAssets("org", "holder", 3, 50);
    expect(tx.hrmsAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: "org", assignedEmployeeId: employeeId, archivedAt: null },
        skip: 100,
        take: 50,
      }),
    );
    const selection = tx.hrmsAsset.findMany.mock.calls[0][0].select;
    expect(selection.purchaseCost).toBeUndefined();
    expect(selection.notes).toBeUndefined();
  });
  it("returns asset-only clearance and forbids archiving held equipment", async () => {
    const { service, tx, asset } = fixture();
    tx.hrmsAsset.findMany.mockResolvedValue([{ id: asset.id }]);
    expect(await service.clearance("org", employeeId)).toMatchObject({ clear: false, scope: "ASSETS_ONLY" });
    tx.hrmsAsset.findFirst.mockResolvedValue({ ...asset, assignedEmployeeId: employeeId });
    await expect(service.archive("org", asset.id, "actor", { revision: 1 })).rejects.toMatchObject({ status: 409 });
    expect(tx.hrmsAsset.update).not.toHaveBeenCalled();
  });
  it("archives rather than deleting and keeps history readable", async () => {
    const { service, tx, asset } = fixture();
    await service.archive("org", asset.id, "actor", { revision: 1 });
    expect(tx.hrmsAsset.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          archivedAt: expect.any(Date),
          revision: { increment: 1 },
        },
      }),
    );
    await service.history("org", asset.id, 2);
    expect(tx.hrmsAssetEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: "org", assetId: asset.id }, skip: 20, take: 20 }),
    );
  });
  it("pages employee lookup beyond 100 without exposing employee profiles", async () => {
    const { service, tx } = fixture();
    await service.employees("org", { page: 4, pageSize: 50, query: "EMP-151" });
    expect(tx.hrmsEmployee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 150,
        take: 50,
        where: expect.objectContaining({ organizationId: "org", status: "ACTIVE", deletedAt: null }),
        select: { id: true, employeeNumber: true, user: { select: { name: true } } },
      }),
    );
    await service.employees("org", { includeInactive: "true" });
    expect(tx.hrmsEmployee.findMany.mock.calls[1][0].where.status).toBeUndefined();
  });
  it("exports all filtered rows, safely quoting CSV and neutralizing formulas", async () => {
    const { service, tx, asset, prisma } = fixture();
    tx.hrmsAsset.count.mockResolvedValue(2);
    tx.hrmsAsset.findMany.mockResolvedValue([
      { ...asset, name: '=HYPERLINK("test")', vendor: " \t+SUM(1,2)" },
      { ...asset, assetTag: "IT-002", name: "Name,\nsecond line", purchaseCost: new Prisma.Decimal("100.125") },
    ]);
    const result = await service.export("org", { status: "AVAILABLE", page: 9, pageSize: 1 });
    expect(result.count).toBe(2);
    expect(result.csv).toContain('"\'=HYPERLINK(""test"")"');
    expect(result.csv).toContain('"\' \t+SUM(1,2)"');
    expect(result.csv).toContain('"Name,\nsecond line"');
    expect(result.csv).toContain('"100.125"');
    expect(tx.hrmsAsset.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          organizationId: "org",
          archivedAt: null,
          status: "AVAILABLE",
        },
      }),
    );
    expect(tx.hrmsAsset.findMany.mock.calls[0][0].take).toBeUndefined();
    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), { isolationLevel: "RepeatableRead" });
    tx.hrmsAsset.count.mockResolvedValue(10001);
    await expect(service.export("org", {})).rejects.toMatchObject({ status: 400 });
  });
  it.each(["P2002", "P2034", "P2025", "P2003"])("surfaces %s as a reloadable conflict", async (code) => {
    const { service, tx } = fixture();
    tx.hrmsAsset.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Conflict", { code, clientVersion: "test" }),
    );
    await expect(service.create("org", "actor", input)).rejects.toMatchObject({ status: 409 });
    expect(tx.hrmsAssetEvent.create).not.toHaveBeenCalled();
  });
  it("propagates actual infrastructure failures instead of claiming duplicate serial", async () => {
    const { service, tx } = fixture();
    const error = new Error("Database unavailable");
    tx.auditLog.create.mockRejectedValue(error);
    await expect(service.create("org", "actor", input)).rejects.toBe(error);
  });
});
