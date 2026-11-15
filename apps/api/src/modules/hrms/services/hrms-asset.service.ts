import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  hrmsAssetRegisterSchema,
  hrmsAssetCustodySchema,
  hrmsAssetRevisionSchema,
  hrmsAssetCategorySchema,
  z,
} from "@dhriti/validation";
import type { AssetRegisterInput, AssetCustodyInput } from "@dhriti/types";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import type { ListHrmsAssetsDto } from "../dto/hrms-operations.dto";
import { assetClearance } from "../asset-clearance";

const fail = (message: string, status = HttpStatus.BAD_REQUEST) =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, status);
const relations = {
  assignedEmployee: { select: { id: true, employeeNumber: true, user: { select: { name: true } } } },
  category: { select: { id: true, name: true, isActive: true } },
} satisfies Prisma.HrmsAssetInclude;
const clean = (value: string | null | undefined) => value?.trim() || null;
function parse<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw fail(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  }
  return parsed.data;
}

@Injectable()
export class HrmsAssetService {
  constructor(private readonly prisma: PrismaService) {}

  private where(organizationId: string, query: ListHrmsAssetsDto): Prisma.HrmsAssetWhereInput {
    return {
      organizationId,
      archivedAt: query.archived === "true" ? { not: null } : null,
      ...(query.type ? { type: query.type } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.condition ? { condition: query.condition } : {}),
      ...(query.search
        ? {
            OR: [
              ...["name", "serialNumber", "assetTag", "brand", "model", "location"].map((key) => ({
                [key]: { contains: query.search, mode: "insensitive" },
              })),
              { assignedEmployee: { user: { name: { contains: query.search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };
  }

  async list(organizationId: string, query: ListHrmsAssetsDto = {}) {
    const page = query.page ?? 1;
    const pageSize = Math.min(100, query.pageSize ?? 20);
    const where = this.where(organizationId, query);
    const [items, total, all, assigned, available, maintenance] = await this.prisma.$transaction([
      this.prisma.hrmsAsset.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ [query.sortBy ?? "name"]: query.sortOrder ?? "asc" }, { id: "asc" }],
        include: relations,
      }),
      this.prisma.hrmsAsset.count({ where }),
      this.prisma.hrmsAsset.count({ where: { organizationId, archivedAt: null } }),
      this.prisma.hrmsAsset.count({ where: { organizationId, archivedAt: null, status: "ASSIGNED" } }),
      this.prisma.hrmsAsset.count({ where: { organizationId, archivedAt: null, status: "AVAILABLE" } }),
      this.prisma.hrmsAsset.count({ where: { organizationId, archivedAt: null, status: "MAINTENANCE" } }),
    ]);
    const custodianIds = [
      ...new Set(items.flatMap((asset) => (asset.custodianEmployeeId ? [asset.custodianEmployeeId] : []))),
    ];
    const custodians = custodianIds.length
      ? await this.prisma.hrmsEmployee.findMany({
          where: { organizationId, id: { in: custodianIds } },
          select: { id: true, employeeNumber: true, user: { select: { name: true } } },
        })
      : [];
    const custodianById = new Map(custodians.map((employee) => [employee.id, employee]));
    return {
      items: items.map((asset) => ({
        ...asset,
        custodianEmployee: asset.custodianEmployeeId ? (custodianById.get(asset.custodianEmployeeId) ?? null) : null,
      })),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      summary: { total: all, assigned, available, maintenance },
    };
  }

  async categories(organizationId: string) {
    return this.prisma.hrmsAssetCategory.findMany({
      where: { organizationId },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }

  /** Asset workflows need only names/numbers, not directory or private employee-profile access. */
  async employees(
    organizationId: string,
    query: { page?: number; pageSize?: number; query?: string; includeInactive?: string },
  ) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const where: Prisma.HrmsEmployeeWhereInput = {
      organizationId,
      deletedAt: null,
      ...(query.includeInactive === "true" ? {} : { status: "ACTIVE" }),
      ...(query.query?.trim()
        ? {
            OR: [
              { user: { name: { contains: query.query.trim(), mode: "insensitive" } } },
              { employeeNumber: { contains: query.query.trim(), mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hrmsEmployee.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ employeeNumber: "asc" }, { id: "asc" }],
        select: { id: true, employeeNumber: true, user: { select: { name: true } } },
      }),
      this.prisma.hrmsEmployee.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async saveCategory(organizationId: string, actorUserId: string, body: unknown, id?: string) {
    const input = parse(hrmsAssetCategorySchema, body);
    return this.write(async (tx) => {
      if (id && !(await tx.hrmsAssetCategory.findFirst({ where: { id, organizationId } }))) {
        throw fail("Category not found.", HttpStatus.NOT_FOUND);
      }
      const record = id
        ? await tx.hrmsAssetCategory.update({ where: { id, organizationId }, data: input })
        : await tx.hrmsAssetCategory.create({ data: { organizationId, ...input } });
      await this.audit(tx, organizationId, actorUserId, record.id, "category_updated", {
        name: record.name,
        isActive: record.isActive,
      });
      return record;
    });
  }

  private async employee(tx: Prisma.TransactionClient, organizationId: string, employeeId: string, active = true) {
    const employee = await tx.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null, ...(active ? { status: "ACTIVE" } : {}) },
      select: { id: true, userId: true, employeeNumber: true, user: { select: { name: true } } },
    });
    if (!employee) {
      throw fail("Employee not found or not eligible in this organization.", HttpStatus.NOT_FOUND);
    }
    return employee;
  }

  private async asset(tx: Prisma.TransactionClient, organizationId: string, id: string, revision?: number) {
    const asset = await tx.hrmsAsset.findFirst({ where: { id, organizationId }, include: relations });
    if (!asset) {
      throw fail("Asset not found.", HttpStatus.NOT_FOUND);
    }
    if (asset.archivedAt) {
      throw fail("Archived assets cannot be changed.", HttpStatus.CONFLICT);
    }
    if (revision !== undefined && asset.revision !== revision) {
      throw fail("Asset changed. Reload before saving.", HttpStatus.CONFLICT);
    }
    return asset;
  }

  private async registerData(
    tx: Prisma.TransactionClient,
    organizationId: string,
    input: AssetRegisterInput,
    currentCategory?: string | null,
  ) {
    if (input.categoryId) {
      const category = await tx.hrmsAssetCategory.findFirst({ where: { id: input.categoryId, organizationId } });
      if (!category || (!category.isActive && input.categoryId !== currentCategory)) {
        throw fail("Choose an active category in this organization.");
      }
    }
    if (input.custodianEmployeeId) {
      await this.employee(tx, organizationId, input.custodianEmployeeId);
    }
    return {
      name: input.name,
      assetTag: input.assetTag,
      serialNumber: clean(input.serialNumber),
      type: input.type,
      customCategory: input.type === "OTHER" ? clean(input.customCategory) : null,
      categoryId: input.categoryId ?? null,
      brand: clean(input.brand),
      model: clean(input.model),
      specifications: clean(input.specifications),
      location: clean(input.location),
      custodianEmployeeId: input.custodianEmployeeId ?? null,
      vendor: clean(input.vendor),
      purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
      purchaseCost:
        input.purchaseCost !== undefined && input.purchaseCost !== null ? new Prisma.Decimal(input.purchaseCost) : null,
      currency: input.currency ?? null,
      warrantyExpiresOn: input.warrantyExpiresOn ? new Date(input.warrantyExpiresOn) : null,
      notes: clean(input.notes),
    };
  }

  async create(organizationId: string, actorUserId: string, body: unknown, transaction?: Prisma.TransactionClient) {
    const input = parse(hrmsAssetRegisterSchema, body);
    if ((input.status === "ASSIGNED") !== !!input.assignedEmployeeId) {
      throw fail("Assigned status requires an employee; other statuses must not have an assignee.");
    }
    const operation = async (tx: Prisma.TransactionClient) => {
      const data = await this.registerData(tx, organizationId, input);
      const employee = input.assignedEmployeeId
        ? await this.employee(tx, organizationId, input.assignedEmployeeId)
        : null;
      const asset = await tx.hrmsAsset.create({
        data: {
          organizationId,
          ...data,
          status: input.status ?? "AVAILABLE",
          condition: input.condition ?? "GOOD",
          assignedEmployeeId: employee?.id ?? null,
          assignedAt: employee ? new Date() : null,
        },
        include: relations,
      });
      await this.event(tx, asset, actorUserId, employee ? "ISSUED" : "CREATED", "Asset registered.", employee);
      await this.audit(tx, organizationId, actorUserId, asset.id, "created", { assetTag: asset.assetTag });
      return asset;
    };
    return transaction ? operation(transaction) : this.write(operation);
  }

  async update(organizationId: string, id: string, actorUserId: string, body: unknown) {
    const { revision, ...register } = parse(hrmsAssetRevisionSchema.passthrough(), body);
    const input = parse(hrmsAssetRegisterSchema, register);
    return this.write(async (tx) => {
      const current = await this.asset(tx, organizationId, id, revision);
      if (input.status && input.status !== current.status && await tx.hrmsAssetMaintenance.findFirst({ where: { organizationId, assetId: id, status: "OPEN" } })) {
        throw fail("Close the open maintenance ticket to change asset status.", HttpStatus.CONFLICT);
      }
      if (input.assignedEmployeeId !== undefined && input.assignedEmployeeId !== current.assignedEmployeeId) {
        throw fail("Use issue or return to change asset custody.", HttpStatus.CONFLICT);
      }
      if (input.status && (input.status === "ASSIGNED") !== !!current.assignedEmployeeId) {
        throw fail("Use issue or return to change asset custody.", HttpStatus.CONFLICT);
      }
      if (current.assignedEmployeeId && input.condition && input.condition !== current.condition) {
        throw fail("Record the condition through the return workflow while an asset is assigned.");
      }
      const data = await this.registerData(tx, organizationId, input, current.categoryId);
      const asset = await tx.hrmsAsset.update({
        where: { id, organizationId, revision },
        data: {
          ...data,
          ...(input.status ? { status: input.status } : {}),
          ...(input.condition ? { condition: input.condition } : {}),
          revision: { increment: 1 },
        },
        include: relations,
      });
      await this.event(tx, asset, actorUserId, "UPDATED", "Register details updated.");
      await this.audit(tx, organizationId, actorUserId, id, "updated", {
        before: JSON.parse(JSON.stringify(current)),
        after: JSON.parse(JSON.stringify(asset)),
      });
      return asset;
    });
  }

  /** Custody, condition, history and audit commit together; revision + serializable isolation prevent double issue. */
  async custody(organizationId: string, id: string, actorUserId: string, action: "ISSUE" | "RETURN", body: unknown, transaction?: Prisma.TransactionClient) {
    const input: AssetCustodyInput = parse(hrmsAssetCustodySchema, body);
    const operation = async (tx: Prisma.TransactionClient) => {
      const current = await this.asset(tx, organizationId, id, input.revision);
      if (action === "ISSUE" && (current.status !== "AVAILABLE" || current.assignedEmployeeId || !input.employeeId)) {
        throw fail("Only an available asset can be issued; choose an employee.", HttpStatus.CONFLICT);
      }
      if (action === "RETURN" && (!current.assignedEmployeeId || current.status !== "ASSIGNED")) {
        throw fail("Only an assigned asset can be returned.", HttpStatus.CONFLICT);
      }
      if (action === "RETURN" && (input.employeeId || input.expectedReturnDate)) {
        throw fail("Return cannot change the holder or set a new due date.");
      }
      if (action === "ISSUE" && input.status) {
        throw fail("Issue sets Assigned status automatically.");
      }
      if (input.expectedReturnDate && input.expectedReturnDate < new Date().toISOString().slice(0, 10)) {
        throw fail("Expected return date cannot be in the past.");
      }
      const employee =
        action === "ISSUE" && input.employeeId
          ? await this.employee(tx, organizationId, input.employeeId)
          : current.assignedEmployee;
      const accessories = await tx.hrmsAssetAccessory.findMany({ where: { organizationId, assetId: id } });
      if (action === "RETURN" && accessories.some((item) => item.outstanding > 0)) {
        throw fail("Record all outstanding accessory returns before returning the asset.", HttpStatus.CONFLICT);
      }
      if (action === "ISSUE") {
        for (const accessory of accessories) {
          await tx.hrmsAssetAccessory.update({ where: { id: accessory.id, revision: accessory.revision },
            data: { outstanding: accessory.quantity, revision: { increment: 1 } } });
        }
      }
      const asset = await tx.hrmsAsset.update({
        where: { id, organizationId, revision: input.revision },
        data: {
          assignedEmployeeId: action === "ISSUE" ? employee?.id : null,
          assignedAt: action === "ISSUE" ? new Date() : null,
          acknowledgedAt: null,
          expectedReturnDate:
            action === "ISSUE" && input.expectedReturnDate ? new Date(input.expectedReturnDate) : null,
          status: action === "ISSUE" ? "ASSIGNED" : (input.status ?? "AVAILABLE"),
          condition: input.condition,
          revision: { increment: 1 },
        },
        include: relations,
      });
      await this.event(tx, asset, actorUserId, action === "ISSUE" ? "ISSUED" : "RETURNED", input.notes, employee);
      await this.audit(tx, organizationId, actorUserId, id, action.toLowerCase(), {
        employeeId: employee?.id ?? null,
        condition: input.condition,
        notes: input.notes,
        previousExpectedReturnDate: current.expectedReturnDate?.toISOString() ?? null,
        accessories: accessories.map((item) => ({ id: item.id, name: item.name, quantity: item.quantity, outstanding: action === "ISSUE" ? item.quantity : item.outstanding })),
      });
      return asset;
    };
    return transaction ? operation(transaction) : this.write(operation);
  }

  private event(
    tx: Prisma.TransactionClient,
    asset: {
      id: string;
      organizationId: string;
      condition: string;
      expectedReturnDate: Date | null;
    },
    actorUserId: string,
    action: string,
    notes: string,
    employee?: {
      id: string;
      employeeNumber: string;
      user: { name: string };
    } | null,
  ) {
    return tx.hrmsAssetEvent.create({
      data: {
        organizationId: asset.organizationId,
        assetId: asset.id,
        actorUserId,
        action,
        notes,
        condition: asset.condition,
        expectedReturnDate: asset.expectedReturnDate,
        employeeId: employee?.id ?? null,
        employeeName: employee ? `${employee.user.name} (${employee.employeeNumber})` : null,
      },
    });
  }

  async history(organizationId: string, assetId: string, page = 1) {
    if (!(await this.prisma.hrmsAsset.findFirst({ where: { id: assetId, organizationId }, select: { id: true } }))) {
      throw fail("Asset not found.", HttpStatus.NOT_FOUND);
    }
    const where = { organizationId, assetId };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hrmsAssetEvent.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * 20,
        take: 20,
      }),
      this.prisma.hrmsAssetEvent.count({ where }),
    ]);
    const actors = await this.prisma.user.findMany({
      where: { id: { in: [...new Set(items.map((event) => event.actorUserId))] } },
      select: { id: true, name: true },
    });
    const names = new Map(actors.map((actor) => [actor.id, actor.name]));
    return {
      items: items.map((event) => ({ ...event, actorName: names.get(event.actorUserId) ?? null })),
      total,
      page,
      pageSize: 20,
    };
  }

  async myAssets(organizationId: string, userId: string, page = 1, pageSize = 20) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { id: true },
    });
    if (!employee) {
      throw fail("No employee record found.", HttpStatus.NOT_FOUND);
    }
    const where = { organizationId, assignedEmployeeId: employee.id, archivedAt: null };
    // Self-service intentionally excludes purchase cost, private notes and custodian data.
    const [items, total] = await this.prisma.$transaction([
      this.prisma.hrmsAsset.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          assetTag: true,
          name: true,
          serialNumber: true,
          condition: true,
          assignedAt: true,
          expectedReturnDate: true,
          acknowledgedAt: true,
          revision: true,
        },
      }),
      this.prisma.hrmsAsset.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async acknowledge(organizationId: string, id: string, userId: string, body: unknown) {
    const { revision } = parse(hrmsAssetRevisionSchema, body);
    return this.write(async (tx) => {
      const current = await this.asset(tx, organizationId, id, revision);
      if (!current.assignedEmployeeId) {
        throw fail("Asset not found in your custody.", HttpStatus.NOT_FOUND);
      }
      const employee = await tx.hrmsEmployee.findFirst({
        where: {
          id: current.assignedEmployeeId,
          organizationId,
          userId,
          deletedAt: null,
        },
        select: { id: true, employeeNumber: true, user: { select: { name: true } } },
      });
      if (!employee || current.status !== "ASSIGNED") {
        throw fail("Asset not found in your custody.", HttpStatus.NOT_FOUND);
      }
      if (current.acknowledgedAt) {
        throw fail("Receipt is already acknowledged.", HttpStatus.CONFLICT);
      }
      const asset = await tx.hrmsAsset.update({
        where: { id, organizationId, revision },
        data: { acknowledgedAt: new Date(), revision: { increment: 1 } },
      });
      await this.event(
        tx,
        asset,
        userId,
        "ACKNOWLEDGED",
        "Employee acknowledged receipt and recorded issue condition.",
        employee,
      );
      await this.audit(tx, organizationId, userId, id, "acknowledged", { employeeId: employee.id });
    });
  }

  async clearance(organizationId: string, employeeId: string) {
    await this.employee(this.prisma, organizationId, employeeId, false);
    return assetClearance(this.prisma, organizationId, employeeId);
  }

  /** DELETE archives; no deletion of custody history, accounting evidence or legacy assignments. */
  async archive(organizationId: string, id: string, actorUserId: string, body: unknown) {
    const { revision } = parse(hrmsAssetRevisionSchema, body);
    return this.write(async (tx) => {
      const current = await this.asset(tx, organizationId, id, revision);
      if (current.assignedEmployeeId || current.status === "ASSIGNED") {
        throw fail("Return the asset before archiving it.", HttpStatus.CONFLICT);
      }
      if (await tx.hrmsAssetMaintenance.findFirst({ where: { organizationId, assetId: id, status: "OPEN" } })) {
        throw fail("Close the open maintenance ticket before archiving.", HttpStatus.CONFLICT);
      }
      const asset = await tx.hrmsAsset.update({
        where: { id, organizationId, revision },
        data: { archivedAt: new Date(), revision: { increment: 1 } },
      });
      await this.event(tx, asset, actorUserId, "ARCHIVED", "Removed from active inventory; history retained.");
      await this.audit(tx, organizationId, actorUserId, id, "archived", {});
    });
  }

  async export(organizationId: string, query: ListHrmsAssetsDto) {
    const items = await this.prisma.$transaction(
      async (tx) => {
        const where = this.where(organizationId, query);
        if ((await tx.hrmsAsset.count({ where })) > 10000) {
          throw fail("Export is limited to 10,000 rows. Narrow the filters.");
        }
        return tx.hrmsAsset.findMany({ where, include: relations, orderBy: [{ assetTag: "asc" }, { id: "asc" }] });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
    // Neutralize spreadsheet formulas, including values supplied as employee/vendor names.
    const cell = (value: unknown) => {
      const text = value === null || value === undefined ? "" : String(value);
      return `"${(/^[\s]*[=+\-@]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`;
    };
    const rows = [
      [
        "Asset tag",
        "Name",
        "Serial",
        "Category",
        "Brand",
        "Model",
        "Location",
        "Employee",
        "Status",
        "Condition",
        "Purchase date",
        "Purchase cost",
        "Currency",
        "Vendor",
        "Warranty expiry",
        "Expected return",
        "Acknowledged",
        "Archived",
      ],
      ...items.map((asset) => [
        asset.assetTag,
        asset.name,
        asset.serialNumber,
        asset.category?.name ?? asset.customCategory ?? asset.type,
        asset.brand,
        asset.model,
        asset.location,
        asset.assignedEmployee?.user.name,
        asset.status,
        asset.condition,
        asset.purchaseDate?.toISOString().slice(0, 10),
        asset.purchaseCost?.toString(),
        asset.currency,
        asset.vendor,
        asset.warrantyExpiresOn?.toISOString().slice(0, 10),
        asset.expectedReturnDate?.toISOString().slice(0, 10),
        asset.acknowledgedAt?.toISOString(),
        asset.archivedAt?.toISOString(),
      ]),
    ];
    return { csv: rows.map((row) => row.map(cell).join(",")).join("\r\n"), count: items.length };
  }

  private audit(
    tx: Prisma.TransactionClient,
    organizationId: string,
    actorUserId: string,
    resourceId: string,
    action: string,
    metadata: Prisma.InputJsonObject,
  ) {
    return tx.auditLog.create({
      data: {
        organizationId,
        actorUserId,
        resourceId,
        resourceType: "HrmsAsset",
        action: `hrms.asset.${action}`,
        metadata,
      },
    });
  }

  private async write<T>(operation: (tx: Prisma.TransactionClient) => Promise<T>) {
    try {
      return await this.prisma.$transaction(operation, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw fail(
            "An asset tag, serial number or category name already exists in this organization.",
            HttpStatus.CONFLICT,
          );
        }
        if (["P2034", "P2025", "P2003"].includes(error.code)) {
          throw fail("Asset data changed. Reload and retry.", HttpStatus.CONFLICT);
        }
      }
      throw error;
    }
  }
}
