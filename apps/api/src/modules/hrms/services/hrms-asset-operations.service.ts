import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import {
  z,
  hrmsAssetReplacementSchema,
  hrmsAssetRequestDecisionSchema,
  hrmsAssetMaintenanceSchema,
  hrmsAssetRepairCloseSchema,
  hrmsAssetAccessorySchema,
  hrmsAssetAccessoryReturnSchema,
  hrmsAssetOverrideSchema,
  hrmsAssetStockSchema,
  hrmsAssetStockObservationSchema,
  hrmsAssetStockResolutionSchema,
  hrmsAssetProcurementSchema,
  hrmsAssetProcurementDecisionSchema,
  hrmsAssetDepreciationSchema,
} from "@dhriti/validation";
import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { PermissionService } from "../../authorization/services/permission.service";
import { enqueueNotification } from "../../notification/notification-events";
import { HrmsAssetService } from "./hrms-asset.service";
import { assetClearance } from "../asset-clearance";

export const assetFailure = (message: string, status = HttpStatus.BAD_REQUEST) =>
  new AppError(ErrorCode.VALIDATION_FAILED, message, status);
export function assetInput<T>(schema: z.ZodType<T>, body: unknown): T {
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    throw assetFailure(parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "));
  }
  return parsed.data;
}
export async function assetWrite<T>(db: PrismaService, operation: (tx: Prisma.TransactionClient) => Promise<T>) {
  try {
    return await db.$transaction(operation, {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 30000,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2034", "P2025", "P2002"].includes(error.code)) {
      throw assetFailure(
        "Asset data changed or conflicts with an existing record. Reload and retry.",
        HttpStatus.CONFLICT,
      );
    }
    throw error;
  }
}
export async function assetAudit(
  tx: Prisma.TransactionClient,
  organizationId: string,
  actorUserId: string,
  resourceId: string,
  action: string,
  metadata: Prisma.InputJsonObject = {},
) {
  await tx.auditLog.create({
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
export async function requireAsset(
  tx: Prisma.TransactionClient,
  organizationId: string,
  id: string,
  revision?: number,
) {
  const asset = await tx.hrmsAsset.findFirst({ where: { id, organizationId, archivedAt: null } });
  if (!asset) {
    throw assetFailure("Asset not found.", HttpStatus.NOT_FOUND);
  }
  if (revision !== undefined && asset.revision !== revision) {
    throw assetFailure("Asset changed. Reload before saving.", HttpStatus.CONFLICT);
  }
  return asset;
}

@Injectable()
export class HrmsAssetOperationsService {
  constructor(
    private readonly db: PrismaService,
    private readonly assets: HrmsAssetService,
    private readonly permissions: PermissionService,
  ) {}

  async requestReplacement(org: string, actor: string, body: unknown) {
    const input = assetInput(hrmsAssetReplacementSchema, body);
    return assetWrite(this.db, async (tx) => {
      const asset = await requireAsset(tx, org, input.assetId, input.revision);
      const employee = await tx.hrmsEmployee.findFirst({
        where: {
          id: asset.assignedEmployeeId ?? undefined,
          organizationId: org,
          userId: actor,
          deletedAt: null,
          status: "ACTIVE",
        },
        include: { reportingManager: { select: { userId: true, status: true, deletedAt: true } } },
      });
      if (
        !asset.assignedEmployeeId ||
        asset.status !== "ASSIGNED" ||
        !employee ||
        employee.id !== asset.assignedEmployeeId
      ) {
        throw assetFailure("Only your currently assigned assets can be replaced.", HttpStatus.FORBIDDEN);
      }
      if (
        await tx.hrmsAssetRequest.findFirst({
          where: { organizationId: org, assetId: asset.id, status: { in: ["PENDING", "APPROVED"] } },
        })
      ) {
        throw assetFailure("An open replacement request already exists for this asset.", HttpStatus.CONFLICT);
      }
      const manager = employee.reportingManager;
      const managerUserId =
        manager && manager.status === "ACTIVE" && !manager.deletedAt && manager.userId !== actor
          ? manager.userId
          : null;
      const request = await tx.hrmsAssetRequest.create({
        data: { organizationId: org, assetId: asset.id, employeeId: employee.id, managerUserId, reason: input.reason },
      });
      await assetAudit(tx, org, actor, request.id, "replacement_requested", { assetId: asset.id, managerUserId });
      if (managerUserId) {
        await this.notify(tx, org, actor, request.id, [managerUserId], "Asset replacement needs your review");
      }
      return request;
    });
  }

  async requests(org: string, actor: string, page: number, pageSize: number, dashboard = false) {
    const manage = await this.permissions.hasPermission({
      organizationId: org,
      userId: actor,
      permissionKey: "hrms.asset.manage",
    });
    const employee = await this.db.hrmsEmployee.findFirst({
      where: { organizationId: org, userId: actor, deletedAt: null },
      select: { id: true },
    });
    const where: Prisma.HrmsAssetRequestWhereInput = {
      organizationId: org,
      // The compact dashboard needs current custody status and actionable reviews, not the tenant's full history.
      ...(dashboard
        ? {
            AND: [
              {
                OR: [
                  ...(employee
                    ? [
                        {
                          employeeId: employee.id,
                          OR: [
                            { status: { in: ["PENDING", "APPROVED"] } },
                            { asset: { assignedEmployeeId: employee.id } },
                          ],
                        },
                      ]
                    : []),
                  { status: "PENDING", managerUserId: actor },
                  ...(manage ? [{ status: "PENDING", managerUserId: null }, { status: "APPROVED" }] : []),
                ],
              },
            ],
          }
        : {}),
      ...(manage
        ? {}
        : {
            OR: [{ managerUserId: actor }, ...(employee ? [{ employeeId: employee.id }] : [])],
          }),
    };
    const [items, total] = await this.db.$transaction([
      this.db.hrmsAssetRequest.findMany({
        where,
        include: { asset: { select: { name: true, assetTag: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.hrmsAssetRequest.count({ where }),
    ]);
    const employees = await this.db.hrmsEmployee.findMany({
      where: { organizationId: org, id: { in: [...new Set(items.map((item) => item.employeeId))] } },
      select: { id: true, employeeNumber: true, user: { select: { name: true } } },
    });
    const requestedFor = new Map(employees.map((entry) => [entry.id, entry]));
    return {
      items: items.map((item) => ({
        ...item,
        isOwn: item.employeeId === employee?.id,
        requestedFor: requestedFor.get(item.employeeId) ?? null,
        canDecide:
          item.employeeId !== employee?.id &&
          item.status === "PENDING" &&
          (item.managerUserId === actor || (!item.managerUserId && manage)),
        canFulfil: item.status === "APPROVED" && manage,
      })),
      total,
    };
  }

  async decideRequest(org: string, actor: string, id: string, body: unknown) {
    const input = assetInput(hrmsAssetRequestDecisionSchema, body);
    const manage = await this.permissions.hasPermission({
      organizationId: org,
      userId: actor,
      permissionKey: "hrms.asset.manage",
    });
    return assetWrite(this.db, async (tx) => {
      const request = await tx.hrmsAssetRequest.findFirst({
        where: { id, organizationId: org, revision: input.revision },
      });
      if (!request) {
        throw assetFailure("Request changed or not found.", HttpStatus.CONFLICT);
      }
      const employee = await tx.hrmsEmployee.findFirst({
        where: { id: request.employeeId, organizationId: org, deletedAt: null, status: "ACTIVE" },
      });
      if (!employee) {
        throw assetFailure("Request employee is no longer active.", HttpStatus.CONFLICT);
      }
      if (input.action === "FULFIL") {
        if (!manage || request.status !== "APPROVED") {
          throw assetFailure("Only asset managers may fulfil approved requests.", HttpStatus.FORBIDDEN);
        }
        if (!input.replacementAssetId || !input.assetRevision) {
          throw assetFailure("Choose available replacement equipment and its current revision.");
        }
        if (input.replacementAssetId === request.assetId) {
          throw assetFailure("Replacement must be a different asset.");
        }
        const old = await tx.hrmsAsset.findFirst({ where: { id: request.assetId, organizationId: org } });
        if (old?.assignedEmployeeId) {
          throw assetFailure("Verify return of the original asset before fulfilling replacement.", HttpStatus.CONFLICT);
        }
        const replacement = await requireAsset(tx, org, input.replacementAssetId, input.assetRevision);
        await this.assets.custody(
          org,
          replacement.id,
          actor,
          "ISSUE",
          {
            revision: replacement.revision,
            employeeId: employee.id,
            condition: replacement.condition,
            notes: input.note,
          },
          tx,
        );
      } else {
        if (request.status !== "PENDING" || !(request.managerUserId === actor || (!request.managerUserId && manage))) {
          throw assetFailure(
            "Only the assigned manager, or asset manager for managerless requests, may decide.",
            HttpStatus.FORBIDDEN,
          );
        }
        if (employee.userId === actor) {
          throw assetFailure("You cannot approve your own replacement request.", HttpStatus.FORBIDDEN);
        }
      }
      const updated = await tx.hrmsAssetRequest.update({
        where: { id, organizationId: org, revision: input.revision },
        data: {
          status: input.action === "FULFIL" ? "FULFILLED" : input.action === "APPROVE" ? "APPROVED" : "REJECTED",
          decisionById: actor,
          decisionNote: input.note,
          ...(input.action === "FULFIL" ? { replacementAssetId: input.replacementAssetId } : {}),
          revision: { increment: 1 },
        },
      });
      await assetAudit(tx, org, actor, id, "request_decided", { action: input.action, note: input.note });
      await this.notify(tx, org, actor, id, [employee.userId], `Asset request ${updated.status.toLowerCase()}`);
      return updated;
    });
  }

  async maintenance(org: string, page: number, pageSize: number) {
    const where = { organizationId: org };
    const [items, total] = await this.db.$transaction([
      this.db.hrmsAssetMaintenance.findMany({
        where,
        include: { asset: { select: { assetTag: true, name: true, revision: true } } },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.hrmsAssetMaintenance.count({ where }),
    ]);
    return { items, total };
  }
  async openMaintenance(org: string, actor: string, body: unknown) {
    const input = assetInput(hrmsAssetMaintenanceSchema, body);
    return assetWrite(this.db, async (tx) => {
      const asset = await requireAsset(tx, org, input.assetId, input.revision);
      if (asset.assignedEmployeeId || asset.status === "UNFIT") {
        throw assetFailure(
          "Verify employee return before opening maintenance; unfit assets cannot be serviced.",
          HttpStatus.CONFLICT,
        );
      }
      if (
        await tx.hrmsAssetMaintenance.findFirst({ where: { organizationId: org, assetId: asset.id, status: "OPEN" } })
      ) {
        throw assetFailure("An open maintenance ticket already exists.", HttpStatus.CONFLICT);
      }
      const ticket = await tx.hrmsAssetMaintenance.create({
        data: { organizationId: org, assetId: asset.id, fault: input.fault, vendor: input.vendor, openedById: actor },
      });
      await tx.hrmsAsset.update({
        where: { id: asset.id, revision: asset.revision },
        data: { status: "MAINTENANCE", revision: { increment: 1 } },
      });
      await assetAudit(tx, org, actor, asset.id, "maintenance_opened", { ticketId: ticket.id, fault: input.fault });
      return ticket;
    });
  }
  async closeMaintenance(org: string, actor: string, id: string, body: unknown) {
    const input = assetInput(hrmsAssetRepairCloseSchema, body);
    return assetWrite(this.db, async (tx) => {
      const ticket = await tx.hrmsAssetMaintenance.findFirst({
        where: { id, organizationId: org, revision: input.revision, status: "OPEN" },
      });
      if (!ticket) {
        throw assetFailure("Ticket changed or already closed.", HttpStatus.CONFLICT);
      }
      const asset = await requireAsset(tx, org, ticket.assetId, input.assetRevision);
      if (asset.status !== "MAINTENANCE" || asset.assignedEmployeeId) {
        throw assetFailure("Asset must be unassigned in Maintenance.", HttpStatus.CONFLICT);
      }
      const result = await tx.hrmsAssetMaintenance.update({
        where: { id, revision: input.revision },
        data: {
          status: "CLOSED",
          resolution: input.resolution,
          cost: input.cost,
          currency: input.currency,
          closedAt: new Date(),
          revision: { increment: 1 },
        },
      });
      await tx.hrmsAsset.update({
        where: { id: asset.id, revision: input.assetRevision },
        data: { status: input.status, condition: input.condition, revision: { increment: 1 } },
      });
      await assetAudit(tx, org, actor, asset.id, "maintenance_closed", {
        ticketId: id,
        resolution: input.resolution,
        cost: input.cost,
        currency: input.currency,
      });
      return result;
    });
  }

  async accessories(org: string, assetId: string) {
    await requireAsset(this.db, org, assetId);
    return this.db.hrmsAssetAccessory.findMany({ where: { organizationId: org, assetId }, orderBy: { name: "asc" } });
  }
  async addAccessory(org: string, actor: string, assetId: string, body: unknown) {
    const input = assetInput(hrmsAssetAccessorySchema, body);
    return assetWrite(this.db, async (tx) => {
      const asset = await requireAsset(tx, org, assetId, input.revision);
      if (asset.assignedEmployeeId) {
        throw assetFailure("Configure accessories before issuing the asset.", HttpStatus.CONFLICT);
      }
      const result = await tx.hrmsAssetAccessory.create({
        data: { organizationId: org, assetId, name: input.name, quantity: input.quantity },
      });
      await tx.hrmsAsset.update({
        where: { id: assetId, revision: input.revision },
        data: { revision: { increment: 1 } },
      });
      await assetAudit(tx, org, actor, assetId, "accessory_added", {
        accessoryId: result.id,
        name: input.name,
        quantity: input.quantity,
      });
      return result;
    });
  }
  async returnAccessory(org: string, actor: string, id: string, body: unknown) {
    const input = assetInput(hrmsAssetAccessoryReturnSchema, body);
    return assetWrite(this.db, async (tx) => {
      const item = await tx.hrmsAssetAccessory.findFirst({
        where: { id, organizationId: org, revision: input.revision },
      });
      if (!item || input.quantity > item.outstanding) {
        throw assetFailure("Accessory changed or return quantity exceeds outstanding items.", HttpStatus.CONFLICT);
      }
      const asset = await requireAsset(tx, org, item.assetId);
      if (!asset.assignedEmployeeId) {
        throw assetFailure("Accessory is not in employee custody.", HttpStatus.CONFLICT);
      }
      const result = await tx.hrmsAssetAccessory.update({
        where: { id, revision: input.revision },
        data: { outstanding: { decrement: input.quantity }, condition: input.condition, revision: { increment: 1 } },
      });
      await tx.hrmsAsset.update({
        where: { id: asset.id, revision: asset.revision },
        data: { revision: { increment: 1 } },
      });
      await assetAudit(tx, org, actor, asset.id, "accessory_returned", {
        accessoryId: id,
        quantity: input.quantity,
        condition: input.condition,
        note: input.note,
        employeeId: asset.assignedEmployeeId,
      });
      return result;
    });
  }

  async overrideClearance(org: string, actor: string, employeeId: string, body: unknown) {
    const input = assetInput(hrmsAssetOverrideSchema, body);
    const allowed =
      (await this.permissions.isOrganizationAdministrator(actor, org)) ||
      (await this.permissions.hasPermission({
        organizationId: org,
        userId: actor,
        permissionKey: "hrms.workforce.manage",
      }));
    if (!allowed) {
      throw assetFailure("Only HR or an organization administrator may skip asset clearance.", HttpStatus.FORBIDDEN);
    }
    return assetWrite(this.db, async (tx) => {
      const employee = await tx.hrmsEmployee.findFirst({
        where: { id: employeeId, organizationId: org },
        select: { id: true },
      });
      if (!employee) {
        throw assetFailure("Employee not found.", HttpStatus.NOT_FOUND);
      }
      const state = await assetClearance(tx, org, employeeId);
      if (state.fingerprint !== input.fingerprint || !state.outstanding.length) {
        throw assetFailure("Clearance changed or no override is needed. Reload.", HttpStatus.CONFLICT);
      }
      await tx.hrmsAssetClearanceOverride.create({
        data: {
          organizationId: org,
          employeeId,
          actorUserId: actor,
          reason: input.reason,
          fingerprint: state.fingerprint,
        },
      });
      await assetAudit(tx, org, actor, employeeId, "clearance_skipped", {
        reason: input.reason,
        fingerprint: state.fingerprint,
        assetIds: state.outstanding.map((asset) => asset.id),
      });
      return assetClearance(tx, org, employeeId);
    });
  }

  async stockChecks(org: string) {
    return this.db.hrmsAssetStockCheck.findMany({
      where: { organizationId: org },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }
  async createStockCheck(org: string, actor: string, body: unknown) {
    const input = assetInput(hrmsAssetStockSchema, body);
    return assetWrite(this.db, async (tx) => {
      const inventory = await tx.hrmsAsset.findMany({
        where: { organizationId: org, archivedAt: null },
        select: { id: true, location: true, assignedEmployeeId: true },
        take: 10001,
      });
      if (inventory.length > 10000) {
        throw assetFailure("Stock checks currently support up to 10,000 active assets.");
      }
      const check = await tx.hrmsAssetStockCheck.create({
        data: { organizationId: org, name: input.name, createdById: actor },
      });
      if (inventory.length) {
        await tx.hrmsAssetStockItem.createMany({
          data: inventory.map((asset) => ({
            organizationId: org,
            checkId: check.id,
            assetId: asset.id,
            expectedLocation: asset.location,
            expectedHolderId: asset.assignedEmployeeId,
          })),
        });
      }
      await assetAudit(tx, org, actor, check.id, "stock_started", { count: inventory.length });
      return check;
    });
  }
  async stockItems(org: string, id: string, page: number, pageSize: number) {
    const check = await this.db.hrmsAssetStockCheck.findFirst({ where: { id, organizationId: org } });
    if (!check) {
      throw assetFailure("Stock check not found.", HttpStatus.NOT_FOUND);
    }
    const where = { organizationId: org, checkId: id };
    const [items, total] = await this.db.$transaction([
      this.db.hrmsAssetStockItem.findMany({
        where,
        include: { asset: { select: { assetTag: true, name: true } } },
        orderBy: { id: "asc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.hrmsAssetStockItem.count({ where }),
    ]);
    return { check, items, total };
  }
  async observeStock(org: string, actor: string, id: string, body: unknown, resolve = false) {
    const input = resolve
      ? assetInput(hrmsAssetStockResolutionSchema, body)
      : assetInput(hrmsAssetStockObservationSchema, body);
    return assetWrite(this.db, async (tx) => {
      const item = await tx.hrmsAssetStockItem.findFirst({
        where: { id, organizationId: org, revision: input.revision },
        include: { check: true },
      });
      if (!item || item.check.status !== "OPEN") {
        throw assetFailure("Stock item changed or check closed.", HttpStatus.CONFLICT);
      }
      if ("resolution" in input && ["UNCHECKED", "FOUND"].includes(item.result)) {
        throw assetFailure("Only an observed discrepancy requires resolution.");
      }
      const result = await tx.hrmsAssetStockItem.update({
        where: { id, revision: input.revision },
        data: {
          ...("resolution" in input
            ? { resolution: input.resolution, resolvedById: actor }
            : {
                result: input.result,
                observedLocation: input.observedLocation,
                note: input.note,
                checkedById: actor,
                resolution: null,
                resolvedById: null,
              }),
          revision: { increment: 1 },
        },
      });
      await tx.hrmsAssetStockCheck.update({ where: { id: item.checkId }, data: { revision: { increment: 1 } } });
      await assetAudit(tx, org, actor, item.assetId, resolve ? "stock_resolved" : "stock_observed", {
        checkId: item.checkId,
        ...input,
      });
      return result;
    });
  }
  async completeStock(org: string, actor: string, id: string, revision: number) {
    return assetWrite(this.db, async (tx) => {
      const open = await tx.hrmsAssetStockCheck.findFirst({
        where: { id, organizationId: org, revision, status: "OPEN" },
      });
      if (!open) {
        throw assetFailure("Stock check changed or completed.", HttpStatus.CONFLICT);
      }
      const unresolved = await tx.hrmsAssetStockItem.count({
        where: {
          organizationId: org,
          checkId: id,
          OR: [{ result: "UNCHECKED" }, { result: { not: "FOUND" }, resolution: null }],
        },
      });
      if (unresolved) {
        throw assetFailure("Observe all items and resolve discrepancies before completing.", HttpStatus.CONFLICT);
      }
      const result = await tx.hrmsAssetStockCheck.update({
        where: { id, revision },
        data: { status: "COMPLETED", completedAt: new Date(), revision: { increment: 1 } },
      });
      await assetAudit(tx, org, actor, id, "stock_completed");
      return result;
    });
  }

  async procurement(org: string, page: number, pageSize: number) {
    const where = { organizationId: org };
    const [items, total] = await this.db.$transaction([
      this.db.hrmsAssetProcurement.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.db.hrmsAssetProcurement.count({ where }),
    ]);
    return { items, total };
  }
  async createProcurement(org: string, actor: string, body: unknown) {
    const input = assetInput(hrmsAssetProcurementSchema, body);
    return assetWrite(this.db, async (tx) => {
      const result = await tx.hrmsAssetProcurement.create({
        data: { organizationId: org, requestedById: actor, ...input },
      });
      await assetAudit(tx, org, actor, result.id, "procurement_requested", input);
      return result;
    });
  }
  async decideProcurement(org: string, actor: string, id: string, body: unknown) {
    const input = assetInput(hrmsAssetProcurementDecisionSchema, body);
    await this.permissions.assertPermission({
      organizationId: org,
      userId: actor,
      permissionKey: "hrms.payroll.manage",
    });
    return assetWrite(this.db, async (tx) => {
      const current = await tx.hrmsAssetProcurement.findFirst({
        where: { id, organizationId: org, revision: input.revision, status: "PENDING" },
      });
      if (!current) {
        throw assetFailure("Procurement changed or already decided.", HttpStatus.CONFLICT);
      }
      if (current.requestedById === actor) {
        throw assetFailure("Another finance approver must decide your procurement request.", HttpStatus.FORBIDDEN);
      }
      const result = await tx.hrmsAssetProcurement.update({
        where: { id, revision: input.revision },
        data: {
          status: input.action === "APPROVE" ? "APPROVED" : "REJECTED",
          decisionNote: input.note,
          decidedById: actor,
          revision: { increment: 1 },
        },
      });
      await assetAudit(tx, org, actor, id, "procurement_decided", input);
      return result;
    });
  }
  async depreciation(org: string) {
    return (
      (await this.db.hrmsAssetDepreciation.findUnique({ where: { organizationId: org } })) ?? {
        organizationId: org,
        revision: 0,
        method: "DISABLED",
        usefulLifeMonths: null,
        residualPercent: null,
      }
    );
  }
  async configureDepreciation(org: string, actor: string, body: unknown) {
    const input = assetInput(hrmsAssetDepreciationSchema, body);
    await this.permissions.assertPermission({
      organizationId: org,
      userId: actor,
      permissionKey: "hrms.payroll.manage",
    });
    return assetWrite(this.db, async (tx) => {
      const { revision, reason, ...data } = input;
      const result =
        revision === 0
          ? await tx.hrmsAssetDepreciation.create({ data: { organizationId: org, ...data } })
          : await tx.hrmsAssetDepreciation.update({
              where: { organizationId: org, revision },
              data: { ...data, revision: { increment: 1 } },
            });
      await assetAudit(tx, org, actor, org, "depreciation_configured", { ...input, reason });
      return result;
    });
  }
  async accounting(org: string, asOf: string) {
    const policy = await this.depreciation(org);
    const assets = await this.db.hrmsAsset.findMany({
      where: { organizationId: org, archivedAt: null },
      orderBy: { assetTag: "asc" },
      take: 10001,
    });
    if (assets.length > 10000) {
      throw assetFailure("Accounting export supports up to 10,000 active assets.");
    }
    const date = new Date(`${asOf}T00:00:00Z`);
    const rows = assets.map((asset) => {
      const eligible =
        policy.method === "STRAIGHT_LINE" &&
        policy.usefulLifeMonths &&
        policy.residualPercent !== null &&
        asset.purchaseCost !== null &&
        asset.purchaseDate !== null;
      if (
        !eligible ||
        !asset.purchaseDate ||
        asset.purchaseCost === null ||
        !policy.usefulLifeMonths ||
        policy.residualPercent === null
      ) {
        return {
          assetTag: asset.assetTag,
          name: asset.name,
          currency: asset.currency,
          cost: asset.purchaseCost?.toString() ?? null,
          depreciation: null,
          netBookValue: null,
          status: policy.method === "DISABLED" ? "DISABLED" : "MISSING_PURCHASE_DATA",
        };
      }
      // Completed UTC calendar months; no depreciation before purchase, no automatic ledger posting.
      const months = Math.max(
        0,
        Math.min(
          policy.usefulLifeMonths,
          (date.getUTCFullYear() - asset.purchaseDate.getUTCFullYear()) * 12 +
            date.getUTCMonth() -
            asset.purchaseDate.getUTCMonth() -
            (date.getUTCDate() < asset.purchaseDate.getUTCDate() ? 1 : 0),
        ),
      );
      const residual = asset.purchaseCost.mul(new Prisma.Decimal(policy.residualPercent)).div(100);
      const depreciation = asset.purchaseCost
        .minus(residual)
        .mul(months)
        .div(policy.usefulLifeMonths)
        .toDecimalPlaces(3, Prisma.Decimal.ROUND_HALF_UP);
      return {
        assetTag: asset.assetTag,
        name: asset.name,
        currency: asset.currency,
        cost: asset.purchaseCost.toString(),
        depreciation: depreciation.toFixed(3),
        netBookValue: asset.purchaseCost.minus(depreciation).toFixed(3),
        status: "CALCULATED",
      };
    });
    const cell = (value: unknown) =>
      `"${String(value ?? "")
        .replace(/^[\s]*[=+@-]/, (prefix) => `'${prefix}`)
        .replaceAll('"', '""')}"`;
    const csv = [
      ["Asset tag", "Name", "Currency", "Cost", "Accumulated depreciation", "Net book value", "Status", "As of"],
      ...rows.map((row) => [
        row.assetTag,
        row.name,
        row.currency,
        row.cost,
        row.depreciation,
        row.netBookValue,
        row.status,
        asOf,
      ]),
    ]
      .map((row) => row.map(cell).join(","))
      .join("\r\n");
    return { policy, rows, csv, asOf };
  }
  private notify(
    tx: Prisma.TransactionClient,
    org: string,
    actor: string,
    id: string,
    recipients: string[],
    title: string,
  ) {
    return enqueueNotification(tx, {
      organizationId: org,
      actorId: actor,
      sourceType: "hrms",
      sourceId: id,
      type: "SYSTEM",
      recipientIds: recipients,
      title,
      path: "/hrms",
      dedupKey: `asset:${id}:${title}`,
    });
  }
}
