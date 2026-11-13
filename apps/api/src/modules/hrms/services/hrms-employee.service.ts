import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import {
  EMPLOYEE_IMPORT_MAX_ROWS,
  type CreateHrmsEmployeeDto,
  type EmployeeSortField,
  type ListHrmsEmployeesDto,
  type UpdateHrmsEmployeeDto,
} from "../dto/hrms-employee.dto";

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
  workLocation: { select: { id: true, name: true, code: true } },
  shift: { select: { id: true, name: true, startTime: true, endTime: true, timeZone: true, isActive: true } },
  department: { select: { id: true, name: true, code: true } },
  designation: { select: { id: true, name: true, code: true } },
  reportingManager: { select: { id: true, employeeNumber: true, user: { select: { name: true } } } },
} satisfies Prisma.HrmsEmployeeSelect;

@Injectable()
export class HrmsEmployeeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

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
    const [members, departments, designations, locations, employmentTypes, shifts, managers] = await this.prisma.$transaction([
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
      select: { shift: { select: { id: true, name: true, startTime: true, endTime: true, timeZone: true, isActive: true } } },
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

  async create(organizationId: string, actorUserId: string, input: CreateHrmsEmployeeDto) {
    await this.assertActiveMember(organizationId, input.userId);
    if (input.workLocationId) {
      await this.assertActiveWorkLocation(organizationId, input.workLocationId);
    }
    await this.assertOrganizationReferences(organizationId, input);
    this.validateLifecycleDates(input.startDate ? new Date(input.startDate) : null, input);
    const employee = await this.prisma.hrmsEmployee
      .create({
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
      })
      .catch(() => {
        throw new AppError(
          ErrorCode.EMPLOYEE_ALREADY_EXISTS,
          "Employee number or user is already assigned in this organization",
          HttpStatus.CONFLICT,
        );
      });
    await this.audit.record({
      action: "hrms.employee.created",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employee.id,
    });
    return employee;
  }

  async update(organizationId: string, employeeId: string, actorUserId: string, input: UpdateHrmsEmployeeDto) {
    const current = await this.requireEmployee(organizationId, employeeId);
    if (input.workLocationId) {
      await this.assertActiveWorkLocation(organizationId, input.workLocationId);
    }
    await this.assertOrganizationReferences(organizationId, input, employeeId);
    const startDate = input.startDate !== undefined ? new Date(input.startDate) : current.startDate;
    this.validateLifecycleDates(startDate, {
      retirementDate:
        input.retirementDate === undefined ? current.retirementDate?.toISOString().slice(0, 10) : input.retirementDate,
      resignationDate:
        input.resignationDate === undefined
          ? current.resignationDate?.toISOString().slice(0, 10)
          : input.resignationDate,
    });
    const employee = await this.prisma.hrmsEmployee
      .update({
        where: { id: employeeId },
        data: {
          ...(input.employeeNumber !== undefined ? { employeeNumber: input.employeeNumber.trim() } : {}),
          ...(input.status !== undefined ? { status: input.status.trim() } : {}),
          ...(input.employmentType !== undefined ? { employmentType: input.employmentType.trim() } : {}),
          ...(input.workLocationId !== undefined ? { workLocationId: input.workLocationId } : {}),
          ...(input.shiftId !== undefined ? { shiftId: input.shiftId } : {}),
          ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
          ...(input.designationId !== undefined ? { designationId: input.designationId } : {}),
          ...(input.reportingManagerId !== undefined ? { reportingManagerId: input.reportingManagerId } : {}),
          ...(input.startDate !== undefined ? { startDate: new Date(input.startDate) } : {}),
          ...(input.endDate !== undefined ? { endDate: new Date(input.endDate) } : {}),
          ...(input.biometricId !== undefined ? { biometricId: input.biometricId?.trim() || null } : {}),
          ...(input.retirementDate !== undefined
            ? { retirementDate: input.retirementDate ? new Date(`${input.retirementDate}T00:00:00.000Z`) : null }
            : {}),
          ...(input.resignationDate !== undefined
            ? { resignationDate: input.resignationDate ? new Date(`${input.resignationDate}T00:00:00.000Z`) : null }
            : {}),
        },
      })
      .catch((error: unknown) => {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError(
            ErrorCode.EMPLOYEE_ALREADY_EXISTS,
            "Employee code is already assigned in this organization",
            HttpStatus.CONFLICT,
          );
        }
        throw error;
      });
    await this.audit.record({
      action: "hrms.employee.updated",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employeeId,
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
    await this.requireEmployee(organizationId, employeeId);
    await this.prisma.hrmsEmployee.update({
      where: { id: employeeId },
      data: { deletedAt: new Date(), status: "INACTIVE", endDate: new Date() },
    });
    // Soft delete does not trigger the FK SetNull, so detach reports to keep the org chart consistent.
    await this.prisma.hrmsEmployee.updateMany({
      where: { organizationId, reportingManagerId: employeeId },
      data: { reportingManagerId: null },
    });
    await this.audit.record({
      action: "hrms.employee.deleted",
      organizationId,
      actorUserId,
      resourceType: "HrmsEmployee",
      resourceId: employeeId,
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
  ): Promise<void> {
    if (input.departmentId) {
      const department = await this.prisma.organizationDepartment.findFirst({
        where: { id: input.departmentId, organizationId, deletedAt: null, isActive: true },
        select: { id: true },
      });
      if (!department) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Active department not found", HttpStatus.BAD_REQUEST);
      }
    }
    if (input.shiftId) {
      const shift = await this.prisma.hrmsShift.findFirst({
        where: { id: input.shiftId, organizationId, isActive: true },
        select: { id: true },
      });
      if (!shift) {
        throw new AppError(ErrorCode.HRMS_SHIFT_NOT_FOUND, "Active shift not found", HttpStatus.BAD_REQUEST);
      }
    }
    if (input.designationId) {
      const designation = await this.prisma.hrmsDesignation.findFirst({
        where: { id: input.designationId, organizationId, isActive: true },
        select: { id: true },
      });
      if (!designation) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Active designation not found", HttpStatus.BAD_REQUEST);
      }
    }
    if (input.reportingManagerId) {
      if (input.reportingManagerId === employeeId) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "An employee cannot report to themselves", HttpStatus.BAD_REQUEST);
      }
      const manager = await this.prisma.hrmsEmployee.findFirst({
        where: { id: input.reportingManagerId, organizationId, deletedAt: null },
        select: { id: true },
      });
      if (!manager) {
        throw new AppError(ErrorCode.VALIDATION_FAILED, "Reporting manager not found", HttpStatus.BAD_REQUEST);
      }
      if (employeeId) {
        await this.assertNoReportingCycle(organizationId, employeeId, input.reportingManagerId);
      }
    }
  }

  private async assertNoReportingCycle(organizationId: string, employeeId: string, managerId: string) {
    const seen = new Set<string>();
    let cursor: string | null = managerId;
    while (cursor && !seen.has(cursor)) {
      if (cursor === employeeId) {
        throw new AppError(
          ErrorCode.VALIDATION_FAILED,
          "Reporting manager would create a circular reporting line",
          HttpStatus.BAD_REQUEST,
        );
      }
      seen.add(cursor);
      const parent: { reportingManagerId: string | null } | null = await this.prisma.hrmsEmployee.findFirst({
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
