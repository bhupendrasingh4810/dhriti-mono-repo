import { HttpStatus, Injectable } from "@nestjs/common";
import { assertAssetClearance } from "../asset-clearance";
import { Prisma } from "@prisma/client";
import {
  hrmsEmployeeProfileSchema,
  updateHrmsEmployeeProfileSchema,
  hrmsProfileFieldDefinitionsSchema,
  updateHrmsProfileFieldCatalogSchema,
  validateHrmsOrganizationFields,
  hrmsEmployeeLifecycleSchema,
  z,
} from "@dhriti/validation";
import type { HrmsEmployeeProfileResponse, HrmsProfileFieldCatalog, HrmsEmployeeTimelinePage } from "@dhriti/types";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import { applyLifecycleAction, lifecycleError } from "../employee-lifecycle";
import {
  EMPLOYEE_IMPORT_MAX_ROWS,
  type CreateHrmsEmployeeDto,
  type EmployeeSortField,
  type ListHrmsEmployeesDto,
  type UpdateHrmsEmployeeDto,
  type EmployeeTimelineQueryDto,
} from "../dto/hrms-employee.dto";

const employeeRelations = {
  workLocation: { select: { id: true, name: true, code: true } },
  shift: { select: { id: true, name: true, startTime: true, endTime: true, timeZone: true, isActive: true } },
  department: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true, code: true } },
  reportingManager: { select: { id: true, employeeNumber: true, user: { select: { name: true } } } },
} satisfies Prisma.HrmsEmployeeInclude;

const employeeSelect = {
  id: true,
  employeeNumber: true,
  status: true,
  employmentType: true,
  workLocationId: true,
  shiftId: true,
  departmentId: true,
  designationId: true,
  reportingManagerId: true,
  startDate: true,
  endDate: true,
  biometricId: true,
  retirementDate: true,
  resignationDate: true,
  createdAt: true,
  updatedAt: true,
  user: { select: { id: true, name: true, email: true, avatarUrl: true } },
  ...employeeRelations,
} satisfies Prisma.HrmsEmployeeSelect;

const jobFields = {
  employeeNumber: "Employee number",
  status: "Employment status",
  employmentType: "Employment type",
  departmentId: "Department",
  designationId: "Designation",
  workLocationId: "Work location",
  shiftId: "Shift",
  reportingManagerId: "Reporting manager",
  startDate: "Joining date",
  endDate: "Employment end date",
  retirementDate: "Retirement date",
  resignationDate: "Resignation date",
} as const;
const timelineDetailsSchema = z.object({
  version: z.literal(1),
  changes: z.array(
    z.object({ field: z.string(), label: z.string(), before: z.string().nullable(), after: z.string().nullable() }),
  ),
});
type JobRecord = Pick<
  Prisma.HrmsEmployeeGetPayload<{ include: typeof employeeRelations }>,
  keyof typeof jobFields | keyof typeof employeeRelations
>;

/** Snapshots names at edit time so renaming/deleting master data does not rewrite career history. */
function jobChanges(before: JobRecord, after: JobRecord) {
  const value = (record: JobRecord, field: keyof typeof jobFields): string | null => {
    const raw = record[field];
    if (raw instanceof Date) {
      return raw.toISOString();
    }
    return raw ?? null;
  };
  const display = (record: JobRecord, field: keyof typeof jobFields): string | null => {
    if (field === "departmentId") {
      return record.department?.name ?? value(record, field);
    }
    if (field === "designationId") {
      return record.designation?.name ?? value(record, field);
    }
    if (field === "workLocationId") {
      return record.workLocation?.name ?? value(record, field);
    }
    if (field === "shiftId") {
      return record.shift?.name ?? value(record, field);
    }
    if (field === "reportingManagerId") {
      return record.reportingManager
        ? `${record.reportingManager.user.name} (${record.reportingManager.employeeNumber})`
        : value(record, field);
    }
    return value(record, field);
  };
  return (Object.keys(jobFields) as (keyof typeof jobFields)[])
    .filter((field) => value(before, field) !== value(after, field))
    .map((field) => ({ field, label: jobFields[field], before: display(before, field), after: display(after, field) }));
}

@Injectable()
export class HrmsEmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Restricted job events only; personal values, biometric IDs and unrelated audit metadata are never returned. */
  async timeline(
    organizationId: string,
    employeeId: string,
    query: EmployeeTimelineQueryDto,
  ): Promise<HrmsEmployeeTimelinePage> {
    await this.requireEmployee(organizationId, employeeId);
    const where = {
      organizationId,
      resourceType: "HrmsEmployee",
      resourceId: employeeId,
      OR: [
        { action: { in: ["hrms.employee.created", "hrms.employee.updated", "hrms.employee.imported"] } },
        { action: { startsWith: "hrms.employee.lifecycle." } },
      ],
    };
    const [events, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        select: { id: true, action: true, actorUserId: true, createdAt: true, metadata: true },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    const actorIds = [...new Set(events.flatMap((event) => (event.actorUserId ? [event.actorUserId] : [])))];
    const actors = actorIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: actorIds } }, select: { id: true, name: true } })
      : [];
    return {
      items: events.map((event) => {
        const metadata = event.metadata;
        const details =
          metadata && typeof metadata === "object" && !Array.isArray(metadata) ? metadata.timeline : undefined;
        const parsed = details === undefined ? null : timelineDetailsSchema.safeParse(details);
        if (parsed && !parsed.success) {
          throw new AppError(
            ErrorCode.INTERNAL_ERROR,
            "Invalid persisted employee timeline",
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
        return {
          id: event.id,
          action: event.action,
          recordedAt: event.createdAt.toISOString(),
          actor: actors.find((actor) => actor.id === event.actorUserId) ?? null,
          changes: parsed?.success ? parsed.data.changes : [],
          hasChangeDetails: parsed?.success ?? false,
        };
      }),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async list(organizationId: string, query: ListHrmsEmployeesDto) {
    const where = this.buildWhere(organizationId, query);
    const [items, total, active, onLeave, newJoiners] = await this.prisma.$transaction([
      this.prisma.hrmsEmployee.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: this.buildOrderBy(query.sortBy, query.sortOrder),
        select: employeeSelect,
      }),
      this.prisma.hrmsEmployee.count({ where }),
      this.prisma.hrmsEmployee.count({ where: { organizationId, deletedAt: null, status: "ACTIVE" } }),
      this.prisma.hrmsEmployee.count({ where: { organizationId, deletedAt: null, status: "ON_LEAVE" } }),
      this.prisma.hrmsEmployee.count({
        where: {
          organizationId,
          deletedAt: null,
          startDate: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
        },
      }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pageSize: query.pageSize,
      totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      summary: { total, active, onLeave, newJoiners },
    };
  }

  /** Returns every employee matching the filters (or explicit ids), capped at the import row limit. */
  listForExport(
    organizationId: string,
    filters: Pick<ListHrmsEmployeesDto, "query" | "status" | "departmentId">,
    options: { ids?: string[]; sortBy?: EmployeeSortField; sortOrder?: "asc" | "desc" } = {},
  ) {
    return this.prisma.hrmsEmployee.findMany({
      where: { ...this.buildWhere(organizationId, filters), ...(options.ids ? { id: { in: options.ids } } : {}) },
      orderBy: this.buildOrderBy(options.sortBy ?? "employeeNumber", options.sortOrder ?? "asc"),
      take: EMPLOYEE_IMPORT_MAX_ROWS,
      select: employeeSelect,
    });
  }

  /** Lookup data for the add/edit employee form; scoped to the workforce permission, not member admin. */
  async options(organizationId: string) {
    const [members, departments, designations, locations, employmentTypes, shifts, managers] =
      await this.prisma.$transaction([
        this.prisma.organizationMember.findMany({
          where: {
            organizationId,
            deletedAt: null,
            removedAt: null,
            status: "ACTIVE",
            user: { deletedAt: null, hrmsEmployees: { none: { organizationId, deletedAt: null } } },
          },
          orderBy: { user: { name: "asc" } },
          select: { user: { select: { id: true, name: true, email: true } } },
        }),
        this.prisma.organizationDepartment.findMany({
          where: { organizationId, deletedAt: null, isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        this.prisma.hrmsDesignation.findMany({
          where: { organizationId, isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true, departmentId: true },
        }),
        this.prisma.hrmsLocation.findMany({
          where: { organizationId, isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        this.prisma.hrmsEmploymentType.findMany({
          where: { organizationId, isActive: true },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        }),
        this.prisma.hrmsShift.findMany({
          where: { organizationId, isActive: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { id: true, name: true, startTime: true, endTime: true, timeZone: true },
        }),
        this.prisma.hrmsEmployee.findMany({
          where: { organizationId, deletedAt: null },
          orderBy: { user: { name: "asc" } },
          select: { id: true, employeeNumber: true, user: { select: { name: true } } },
        }),
      ]);
    return {
      members: members.map((member) => member.user),
      departments,
      designations,
      locations,
      employmentTypes,
      shifts,
      managers,
    };
  }

  /** Flat hierarchy nodes; the client assembles the tree so roots (no manager) and orphans stay visible. */
  async orgChart(organizationId: string) {
    const employees = await this.prisma.hrmsEmployee.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { user: { name: "asc" } },
      select: {
        id: true,
        employeeNumber: true,
        status: true,
        reportingManagerId: true,
        user: { select: { name: true, avatarUrl: true } },
        department: { select: { name: true } },
        designation: { select: { name: true } },
      },
    });
    return { items: employees, total: employees.length };
  }

  private buildWhere(
    organizationId: string,
    query: Pick<ListHrmsEmployeesDto, "query" | "status" | "departmentId">,
  ): Prisma.HrmsEmployeeWhereInput {
    return {
      organizationId,
      deletedAt: null,
      ...(query.status ? { status: query.status } : {}),
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.query
        ? {
            OR: [
              { employeeNumber: { contains: query.query, mode: "insensitive" } },
              { employmentType: { contains: query.query, mode: "insensitive" } },
              { user: { name: { contains: query.query, mode: "insensitive" } } },
              { user: { email: { contains: query.query, mode: "insensitive" } } },
              { workLocation: { name: { contains: query.query, mode: "insensitive" } } },
              { department: { name: { contains: query.query, mode: "insensitive" } } },
              { designation: { name: { contains: query.query, mode: "insensitive" } } },
            ],
          }
        : {}),
    };
  }

  private buildOrderBy(
    sortBy: EmployeeSortField,
    sortOrder: "asc" | "desc",
  ): Prisma.HrmsEmployeeOrderByWithRelationInput[] {
    const primary: Prisma.HrmsEmployeeOrderByWithRelationInput =
      sortBy === "name"
        ? { user: { name: sortOrder } }
        : sortBy === "department"
          ? { department: { name: sortOrder } }
          : sortBy === "location"
            ? { workLocation: { name: sortOrder } }
            : { [sortBy]: sortOrder };
    // Stable tiebreaker so pagination never repeats or skips rows.
    return [primary, { id: "asc" }];
  }

  /** The signed-in user's assigned shift (null when they have no employee record or no shift). Open to every member. */
  async myShift(organizationId: string, userId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: {
        shift: { select: { id: true, name: true, startTime: true, endTime: true, timeZone: true, isActive: true } },
      },
    });
    return employee?.shift ?? null;
  }

  /** The signed-in user's date of joining (null when unknown); bounds how far back their attendance log can go. */
  async myStartDate(organizationId: string, userId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, userId, deletedAt: null },
      select: { startDate: true },
    });
    return { startDate: employee?.startDate?.toISOString().slice(0, 10) ?? null };
  }

  async get(organizationId: string, employeeId: string) {
    return this.requireEmployee(organizationId, employeeId);
  }

  /** Requires the employee-profile migration; legacy user-global personal data is never copied implicitly. */
  async profile(
    organizationId: string,
    employeeId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<HrmsEmployeeProfileResponse> {
    const employee = await db.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
      select: { profileData: true, profileVersion: true },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    }
    const parsed = hrmsEmployeeProfileSchema.safeParse(employee.profileData);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Stored employee profile is invalid",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return {
      profile: parsed.data,
      version: employee.profileVersion,
      catalog: await this.profileFields(organizationId, db),
    };
  }

  async profileFields(
    organizationId: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<HrmsProfileFieldCatalog> {
    const organization = await db.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { hrmsProfileFields: true, hrmsProfileFieldsVersion: true },
    });
    if (!organization) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Organization not found", HttpStatus.NOT_FOUND);
    }
    const parsed = hrmsProfileFieldDefinitionsSchema.safeParse(organization.hrmsProfileFields);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.INTERNAL_ERROR,
        "Stored profile field catalog is invalid",
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    return { definitions: parsed.data, version: organization.hrmsProfileFieldsVersion };
  }

  async updateProfileFields(
    organizationId: string,
    actorUserId: string,
    input: unknown,
  ): Promise<HrmsProfileFieldCatalog> {
    const parsed = updateHrmsProfileFieldCatalogSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
        HttpStatus.BAD_REQUEST,
      );
    }
    const current = await this.profileFields(organizationId);
    const { definitions, version } = parsed.data;
    for (const old of current.definitions) {
      const next = definitions.find((field) => field.id === old.id);
      if (!next || next.type !== old.type) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Existing fields must be archived, not deleted or retyped.",
          HttpStatus.BAD_REQUEST,
        );
      }
    }
    const result = await this.prisma.organization.updateMany({
      where: { id: organizationId, deletedAt: null, hrmsProfileFieldsVersion: version },
      data: { hrmsProfileFields: definitions, hrmsProfileFieldsVersion: { increment: 1 } },
    });
    if (result.count !== 1) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Field catalog changed. Reload before saving.",
        HttpStatus.CONFLICT,
      );
    }
    await this.audit.record({
      action: "hrms.employee.profile_fields_updated",
      organizationId,
      actorUserId,
      resourceType: "Organization",
      resourceId: organizationId,
      metadata: { fieldIds: definitions.map((field) => field.id) },
    });
    return { definitions, version: version + 1 };
  }

  async updateProfile(
    organizationId: string,
    employeeId: string,
    actorUserId: string,
    input: unknown,
  ): Promise<HrmsEmployeeProfileResponse> {
    const parsed = updateHrmsEmployeeProfileSchema.safeParse(input);
    if (!parsed.success) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; "),
        HttpStatus.BAD_REQUEST,
      );
    }
    const { profile, version } = parsed.data;
    const current = await this.prisma
      .$transaction(
        async (db) => {
          const current = await this.profile(organizationId, employeeId, db);
          if ((parsed.data.catalogVersion ?? 0) !== current.catalog.version) {
            throw new AppError(
              ErrorCode.VALIDATION_FAILED,
              "Field catalog changed. Reload the profile before saving.",
              HttpStatus.CONFLICT,
            );
          }
          const values = profile.organizationFields ?? {};
          const fieldsErrors = validateHrmsOrganizationFields(current.catalog.definitions, values);
          if (Object.keys(fieldsErrors).length) {
            throw new AppError(
              ErrorCode.VALIDATION_FAILED,
              "Review the organization profile fields.",
              HttpStatus.BAD_REQUEST,
              { fields: fieldsErrors },
            );
          }
          // Archived values remain historical; they cannot be silently changed or removed.
          for (const field of current.catalog.definitions.filter((field) => field.archived)) {
            if (JSON.stringify(values[field.id]) !== JSON.stringify(current.profile.organizationFields?.[field.id])) {
              throw new AppError(
                ErrorCode.VALIDATION_FAILED,
                "Archived field values cannot be changed.",
                HttpStatus.BAD_REQUEST,
              );
            }
          }
          // Compare-and-swap prevents an older editor from silently replacing another HR user's changes.
          const changed = await db.hrmsEmployee.updateMany({
            where: { id: employeeId, organizationId, deletedAt: null, profileVersion: version },
            data: { profileData: profile, profileVersion: { increment: 1 } },
          });
          if (changed.count !== 1) {
            throw new AppError(
              ErrorCode.VALIDATION_FAILED,
              "Employee profile changed. Reload the profile before saving again.",
              HttpStatus.CONFLICT,
            );
          }
          return current;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "Profile or field policy changed. Reload before saving.",
            HttpStatus.CONFLICT,
          );
        }
        throw error;
      });
    await this.audit.record({
      action: "hrms.employee.profile_updated",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employeeId,
      metadata: {
        fields: Object.keys(profile).filter((key) => {
          const field = key as keyof typeof profile;
          return JSON.stringify(current.profile[field]) !== JSON.stringify(profile[field]);
        }),
      },
    });
    return { profile, version: version + 1, catalog: current.catalog };
  }

  async create(organizationId: string, actorUserId: string, input: CreateHrmsEmployeeDto) {
    await this.assertActiveMember(organizationId, input.userId);
    if (input.workLocationId) {
      await this.assertActiveWorkLocation(organizationId, input.workLocationId);
    }
    this.validateLifecycleDates(input.startDate ? new Date(input.startDate) : null, input);
    if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Employment end date must not be before the joining date",
        HttpStatus.BAD_REQUEST,
      );
    }
    const employee = await this.prisma
      .$transaction(async (tx) => {
        await this.assertOrganizationReferences(organizationId, input, undefined, tx);
        const created = await tx.hrmsEmployee.create({
          data: {
            organizationId,
            userId: input.userId,
            employeeNumber: input.employeeNumber.trim(),
            status: input.status.trim(),
            employmentType: input.employmentType?.trim() ?? null,
            workLocationId: input.workLocationId ?? null,
            shiftId: input.shiftId ?? null,
            departmentId: input.departmentId ?? null,
            designationId: input.designationId ?? null,
            reportingManagerId: input.reportingManagerId ?? null,
            startDate: input.startDate ? new Date(input.startDate) : null,
            endDate: input.endDate ? new Date(input.endDate) : null,
            biometricId: input.biometricId?.trim() || null,
            retirementDate: input.retirementDate ? new Date(`${input.retirementDate}T00:00:00.000Z`) : null,
            resignationDate: input.resignationDate ? new Date(`${input.resignationDate}T00:00:00.000Z`) : null,
          },
        });
        // Career records are business data: a failed history write must roll back the employee write.
        await tx.auditLog.create({
          data: {
            action: "hrms.employee.created",
            organizationId,
            actorUserId,
            resourceType: "HrmsEmployee",
            resourceId: created.id,
          },
        });
        return created;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
          throw new AppError(ErrorCode.VALIDATION_FAILED, "Employee or reporting structure changed. Reload before saving.", HttpStatus.CONFLICT);
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError(
            ErrorCode.EMPLOYEE_ALREADY_EXISTS,
            "Employee number or user is already assigned in this organization",
            HttpStatus.CONFLICT,
          );
        }
        throw error;
      });
    return employee;
  }

  async update(organizationId: string, employeeId: string, actorUserId: string, input: UpdateHrmsEmployeeDto) {
    const current = await this.requireEmployee(organizationId, employeeId);
    if (input.workLocationId) {
      await this.assertActiveWorkLocation(organizationId, input.workLocationId);
    }
    const startDate =
      input.startDate !== undefined ? (input.startDate ? new Date(input.startDate) : null) : current.startDate;
    const endDate = input.endDate !== undefined ? (input.endDate ? new Date(input.endDate) : null) : current.endDate;
    if (startDate && endDate && endDate < startDate) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Employment end date must not be before the joining date",
        HttpStatus.BAD_REQUEST,
      );
    }
    this.validateLifecycleDates(startDate, {
      retirementDate:
        input.retirementDate === undefined ? current.retirementDate?.toISOString().slice(0, 10) : input.retirementDate,
      resignationDate:
        input.resignationDate === undefined
          ? current.resignationDate?.toISOString().slice(0, 10)
          : input.resignationDate,
    });
    const employee = await this.prisma
      .$transaction(async (tx) => {
        await this.assertOrganizationReferences(organizationId, input, employeeId, tx);
        if (input.status === "INACTIVE" && current.status !== "INACTIVE") {
          await assertAssetClearance(tx, organizationId, employeeId);
        }
        if (input.startDate !== undefined || input.resignationDate !== undefined) {
          const record = await tx.hrmsEmployee.findFirst({
            where: { id: employeeId, organizationId, deletedAt: null },
            select: { lifecycleData: true },
          });
          if (!record) {throw lifecycleError("Employee not found.", HttpStatus.NOT_FOUND);}
          const lifecycle = hrmsEmployeeLifecycleSchema.safeParse(record.lifecycleData);
          if (!lifecycle.success) {throw lifecycleError("Stored lifecycle data is invalid.", HttpStatus.INTERNAL_SERVER_ERROR);}
          const { probationEndDate, contractStartDate, contractEndDate, noticePeriodDays } = lifecycle.data;
          applyLifecycleAction(lifecycle.data, {
            action: "CONFIGURE", version: 0, reason: "Validate job date change",
            data: { probationEndDate, contractStartDate, contractEndDate, noticePeriodDays },
          }, startDate?.toISOString().slice(0, 10) ?? null,
          input.resignationDate === undefined ? current.resignationDate?.toISOString().slice(0, 10) ?? null : input.resignationDate,
          new Date().toISOString().slice(0, 10));
        }
        const updated = await tx.hrmsEmployee.update({
          where: { id: employeeId, organizationId, deletedAt: null, updatedAt: current.updatedAt },
          include: employeeRelations,
          data: {
            ...(input.employeeNumber !== undefined ? { employeeNumber: input.employeeNumber.trim() } : {}),
            ...(input.status !== undefined ? { status: input.status.trim() } : {}),
            ...(input.employmentType !== undefined ? { employmentType: input.employmentType.trim() } : {}),
            ...(input.workLocationId !== undefined ? { workLocationId: input.workLocationId } : {}),
            ...(input.shiftId !== undefined ? { shiftId: input.shiftId } : {}),
            ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
            ...(input.designationId !== undefined ? { designationId: input.designationId } : {}),
            ...(input.reportingManagerId !== undefined ? { reportingManagerId: input.reportingManagerId } : {}),
            ...(input.startDate !== undefined ? { startDate } : {}),
            ...(input.endDate !== undefined ? { endDate } : {}),
            ...(input.biometricId !== undefined ? { biometricId: input.biometricId?.trim() || null } : {}),
            ...(input.retirementDate !== undefined
              ? { retirementDate: input.retirementDate ? new Date(`${input.retirementDate}T00:00:00.000Z`) : null }
              : {}),
            ...(input.resignationDate !== undefined
              ? { resignationDate: input.resignationDate ? new Date(`${input.resignationDate}T00:00:00.000Z`) : null }
              : {}),
          },
        });
        const changes = jobChanges(current, updated);
        await tx.auditLog.create({
          data: {
            action: "hrms.employee.updated",
            organizationId,
            actorUserId,
            resourceType: "HrmsEmployee",
            resourceId: employeeId,
            metadata: { timeline: { version: 1, changes } },
          },
        });
        return updated;
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && ["P2025", "P2034"].includes(error.code)) {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "Employee changed while editing. Reload before saving.",
            HttpStatus.CONFLICT,
          );
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError(
            ErrorCode.EMPLOYEE_ALREADY_EXISTS,
            "Employee code is already assigned in this organization",
            HttpStatus.CONFLICT,
          );
        }
        throw error;
      });
    return employee;
  }

  private validateLifecycleDates(
    startDate: Date | null,
    input: { retirementDate?: string | null; resignationDate?: string | null },
  ) {
    if (!startDate) {
      return;
    }
    const joiningDate = startDate.toISOString().slice(0, 10);
    if (input.retirementDate && input.retirementDate < joiningDate) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Retirement date cannot precede date of joining",
        HttpStatus.BAD_REQUEST,
      );
    }
    if (input.resignationDate && input.resignationDate < joiningDate) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        "Resignation date cannot precede date of joining",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async delete(organizationId: string, employeeId: string, actorUserId: string): Promise<void> {
    const current = await this.requireEmployee(organizationId, employeeId);
    await this.prisma
      .$transaction(
        async (tx) => {
          await assertAssetClearance(tx, organizationId, employeeId);
          const reports = await tx.hrmsEmployee.findMany({
            where: { organizationId, reportingManagerId: employeeId, deletedAt: null },
            include: employeeRelations,
          });
          await tx.hrmsEmployee.update({
            where: { id: employeeId, organizationId, deletedAt: null, updatedAt: current.updatedAt },
            data: { deletedAt: new Date(), status: "INACTIVE", endDate: new Date() },
          });
          // Soft deletion does not trigger FK SetNull. History and report detachment commit together.
          await tx.hrmsEmployee.updateMany({
            where: { organizationId, reportingManagerId: employeeId },
            data: { reportingManagerId: null },
          });
          await tx.auditLog.createMany({
            data: [
              {
                action: "hrms.employee.deleted",
                organizationId,
                actorUserId,
                resourceType: "HrmsEmployee",
                resourceId: employeeId,
              },
              ...reports.map((report) => ({
                action: "hrms.employee.updated",
                organizationId,
                actorUserId,
                resourceType: "HrmsEmployee",
                resourceId: report.id,
                metadata: {
                  timeline: {
                    version: 1,
                    changes: jobChanges(report, { ...report, reportingManagerId: null, reportingManager: null }),
                  },
                },
              })),
            ],
          });
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      )
      .catch((error: unknown) => {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2025" || error.code === "P2034")
        ) {
          throw new AppError(
            ErrorCode.VALIDATION_FAILED,
            "Employee or reporting structure changed. Reload before removing the employee.",
            HttpStatus.CONFLICT,
          );
        }
        throw error;
      });
  }

  private async requireEmployee(organizationId: string, employeeId: string) {
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { id: employeeId, organizationId, deletedAt: null },
      select: {
        ...employeeSelect,
        directReports: {
          where: { deletedAt: null },
          select: { id: true, employeeNumber: true, user: { select: { name: true } } },
        },
      },
    });
    if (!employee) {
      throw new AppError(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found", HttpStatus.NOT_FOUND);
    }
    return employee;
  }

  private async assertActiveMember(organizationId: string, userId: string): Promise<void> {
    const membership = await this.prisma.organizationMember.findFirst({
      where: { organizationId, userId, deletedAt: null, user: { deletedAt: null } },
      select: { id: true },
    });
    if (!membership) {
      throw new AppError(
        ErrorCode.MEMBER_NOT_FOUND,
        "Employee must be an active organization member",
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validates tenant-owned references. A reporting manager must be a different employee of the same
   * organization and must not report (directly or transitively) to the employee being edited.
   */
  private async assertOrganizationReferences(
    organizationId: string,
    input: {
      departmentId?: string | null;
      designationId?: string | null;
      reportingManagerId?: string | null;
      shiftId?: string | null;
    },
    employeeId?: string,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    if (input.departmentId) {
      const department = await db.organizationDepartment.findFirst({
        where: { id: input.departmentId, organizationId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!department) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Active department not found", HttpStatus.BAD_REQUEST);
      }
    }
    if (input.shiftId) {
      const shift = await db.hrmsShift.findFirst({
        where: { id: input.shiftId, organizationId, isActive: true },
        select: { id: true },
      });
      if (!shift) {
        throw new AppError(ErrorCode.HRMS_SHIFT_NOT_FOUND, "Active shift not found", HttpStatus.BAD_REQUEST);
      }
    }
    if (input.designationId) {
      const designation = await db.hrmsDesignation.findFirst({
        where: { id: input.designationId, organizationId, isActive: true },
        select: { id: true },
      });
      if (!designation) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Active designation not found", HttpStatus.BAD_REQUEST);
      }
    }
    if (input.reportingManagerId) {
      if (input.reportingManagerId === employeeId) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "An employee cannot report to themselves",
          HttpStatus.BAD_REQUEST,
        );
      }
      const manager = await db.hrmsEmployee.findFirst({
        where: { id: input.reportingManagerId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!manager) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Reporting manager not found", HttpStatus.BAD_REQUEST);
      }
      if (employeeId) {
        await this.assertNoReportingCycle(organizationId, employeeId, input.reportingManagerId, db);
      }
    }
  }

  private async assertNoReportingCycle(organizationId: string, employeeId: string, managerId: string, db: Prisma.TransactionClient) {
    const seen = new Set<string>();
    let cursor: string | null = managerId;
    while (cursor) {
      if (cursor === employeeId || seen.has(cursor)) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Reporting manager would create a circular reporting line",
          HttpStatus.BAD_REQUEST,
        );
      }
      seen.add(cursor);
      const parent: { reportingManagerId: string | null } | null = await db.hrmsEmployee.findFirst({
        where: { id: cursor, organizationId, deletedAt: null },
        select: { reportingManagerId: true },
      });
      cursor = parent?.reportingManagerId ?? null;
    }
  }

  private async assertActiveWorkLocation(organizationId: string, workLocationId: string): Promise<void> {
    const location = await this.prisma.hrmsLocation.findFirst({
      where: { id: workLocationId, organizationId, isActive: true },
      select: { id: true },
    });
    if (!location) {
      throw new AppError(ErrorCode.HRMS_LOCATION_NOT_FOUND, "Active work location not found", HttpStatus.BAD_REQUEST);
    }
  }
}
