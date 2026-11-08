import { HttpStatus, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import type {
  CreateHrmsDesignationDto,
  CreateHrmsEmploymentTypeDto,
  CreateHrmsLocationDto,
  UpdateHrmsDesignationDto,
  UpdateHrmsEmploymentTypeDto,
  UpdateHrmsLocationDto,
} from "../dto/hrms-master-data.dto";

@Injectable()
export class HrmsMasterDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  listLocations(organizationId: string) {
    return this.prisma.hrmsLocation.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
  }

  async createLocation(organizationId: string, actorUserId: string, input: CreateHrmsLocationDto) {
    const location = await this.prisma.hrmsLocation
      .create({
        data: {
          organizationId,
          name: input.name.trim(),
          code: this.clean(input.code),
          countryCode: input.countryCode.toUpperCase(),
          city: this.clean(input.city),
          timezone: input.timezone.trim(),
          isActive: input.isActive ?? true,
        },
      })
      .catch((error: unknown) =>
        this.handleConflict(error, ErrorCode.HRMS_LOCATION_CONFLICT, "Location name or code already exists"),
      );
    await this.record("location", "created", organizationId, actorUserId, location.id, "HrmsLocation");
    return location;
  }

  async updateLocation(organizationId: string, locationId: string, actorUserId: string, input: UpdateHrmsLocationDto) {
    await this.requireLocation(organizationId, locationId);
    const location = await this.prisma.hrmsLocation
      .update({
        where: { id: locationId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.code !== undefined ? { code: this.clean(input.code) } : {}),
          ...(input.countryCode !== undefined ? { countryCode: input.countryCode.toUpperCase() } : {}),
          ...(input.city !== undefined ? { city: this.clean(input.city) } : {}),
          ...(input.timezone !== undefined ? { timezone: input.timezone.trim() } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      })
      .catch((error: unknown) =>
        this.handleConflict(error, ErrorCode.HRMS_LOCATION_CONFLICT, "Location name or code already exists"),
      );
    await this.record("location", "updated", organizationId, actorUserId, location.id, "HrmsLocation");
    return location;
  }

  async removeLocation(organizationId: string, locationId: string, actorUserId: string): Promise<void> {
    await this.requireLocation(organizationId, locationId);
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: { organizationId, workLocationId: locationId, deletedAt: null },
      select: { id: true },
    });
    if (employee) {
      throw new AppError(
        ErrorCode.HRMS_LOCATION_IN_USE,
        "This location cannot be deleted because it is assigned to one or more employees.",
        HttpStatus.CONFLICT,
      );
    }
    await this.prisma.hrmsLocation.delete({ where: { id: locationId } });
    await this.record("location", "deleted", organizationId, actorUserId, locationId, "HrmsLocation");
  }

  listDesignations(organizationId: string) {
    return this.prisma.hrmsDesignation.findMany({
      where: { organizationId },
      include: { department: { select: { id: true, name: true, code: true } } },
      orderBy: { name: "asc" },
    });
  }

  async createDesignation(organizationId: string, actorUserId: string, input: CreateHrmsDesignationDto) {
    if (input.departmentId) {
      await this.requireDepartment(organizationId, input.departmentId);
    }
    const designation = await this.prisma.hrmsDesignation
      .create({
        data: {
          organizationId,
          name: input.name.trim(),
          code: this.clean(input.code),
          departmentId: input.departmentId ?? null,
          isActive: input.isActive ?? true,
        },
        include: { department: { select: { id: true, name: true, code: true } } },
      })
      .catch((error: unknown) =>
        this.handleConflict(error, ErrorCode.HRMS_DESIGNATION_CONFLICT, "Designation name or code already exists"),
      );
    await this.record("designation", "created", organizationId, actorUserId, designation.id, "HrmsDesignation");
    return designation;
  }

  async updateDesignation(
    organizationId: string,
    designationId: string,
    actorUserId: string,
    input: UpdateHrmsDesignationDto,
  ) {
    await this.requireDesignation(organizationId, designationId);
    if (input.departmentId) {
      await this.requireDepartment(organizationId, input.departmentId);
    }
    const designation = await this.prisma.hrmsDesignation
      .update({
        where: { id: designationId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.code !== undefined ? { code: this.clean(input.code) } : {}),
          ...(input.departmentId !== undefined ? { departmentId: input.departmentId } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
        include: { department: { select: { id: true, name: true, code: true } } },
      })
      .catch((error: unknown) =>
        this.handleConflict(error, ErrorCode.HRMS_DESIGNATION_CONFLICT, "Designation name or code already exists"),
      );
    await this.record("designation", "updated", organizationId, actorUserId, designation.id, "HrmsDesignation");
    return designation;
  }

  async removeDesignation(organizationId: string, designationId: string, actorUserId: string): Promise<void> {
    await this.requireDesignation(organizationId, designationId);
    await this.prisma.hrmsDesignation.delete({ where: { id: designationId } });
    await this.record("designation", "deleted", organizationId, actorUserId, designationId, "HrmsDesignation");
  }

  listEmploymentTypes(organizationId: string) {
    return this.prisma.hrmsEmploymentType.findMany({ where: { organizationId }, orderBy: { name: "asc" } });
  }

  async createEmploymentType(organizationId: string, actorUserId: string, input: CreateHrmsEmploymentTypeDto) {
    const employmentType = await this.prisma.hrmsEmploymentType
      .create({
        data: {
          organizationId,
          name: input.name.trim(),
          code: this.clean(input.code),
          isActive: input.isActive ?? true,
        },
      })
      .catch((error: unknown) =>
        this.handleConflict(
          error,
          ErrorCode.HRMS_EMPLOYMENT_TYPE_CONFLICT,
          "Employment type name or code already exists",
        ),
      );
    await this.record(
      "employment_type",
      "created",
      organizationId,
      actorUserId,
      employmentType.id,
      "HrmsEmploymentType",
    );
    return employmentType;
  }

  async updateEmploymentType(
    organizationId: string,
    employmentTypeId: string,
    actorUserId: string,
    input: UpdateHrmsEmploymentTypeDto,
  ) {
    await this.requireEmploymentType(organizationId, employmentTypeId);
    const employmentType = await this.prisma.hrmsEmploymentType
      .update({
        where: { id: employmentTypeId },
        data: {
          ...(input.name !== undefined ? { name: input.name.trim() } : {}),
          ...(input.code !== undefined ? { code: this.clean(input.code) } : {}),
          ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
        },
      })
      .catch((error: unknown) =>
        this.handleConflict(
          error,
          ErrorCode.HRMS_EMPLOYMENT_TYPE_CONFLICT,
          "Employment type name or code already exists",
        ),
      );
    await this.record(
      "employment_type",
      "updated",
      organizationId,
      actorUserId,
      employmentType.id,
      "HrmsEmploymentType",
    );
    return employmentType;
  }

  async removeEmploymentType(organizationId: string, employmentTypeId: string, actorUserId: string): Promise<void> {
    const employmentType = await this.requireEmploymentType(organizationId, employmentTypeId);
    const employee = await this.prisma.hrmsEmployee.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { employmentType: employmentType.name },
          ...(employmentType.code ? [{ employmentType: employmentType.code }] : []),
        ],
      },
      select: { id: true },
    });
    if (employee) {
      throw new AppError(
        ErrorCode.HRMS_EMPLOYMENT_TYPE_IN_USE,
        "This employment type cannot be deleted because it is assigned to one or more employees.",
        HttpStatus.CONFLICT,
      );
    }

    await this.prisma.hrmsEmploymentType.delete({ where: { id: employmentTypeId } });
    await this.record(
      "employment_type",
      "deleted",
      organizationId,
      actorUserId,
      employmentTypeId,
      "HrmsEmploymentType",
    );
  }

  private async requireLocation(organizationId: string, id: string) {
    return this.require(
      this.prisma.hrmsLocation.findFirst({ where: { id, organizationId }, select: { id: true } }),
      ErrorCode.HRMS_LOCATION_NOT_FOUND,
      "Location",
    );
  }

  private async requireDesignation(organizationId: string, id: string) {
    return this.require(
      this.prisma.hrmsDesignation.findFirst({ where: { id, organizationId }, select: { id: true } }),
      ErrorCode.HRMS_DESIGNATION_NOT_FOUND,
      "Designation",
    );
  }

  private async requireEmploymentType(organizationId: string, id: string) {
    return this.require(
      this.prisma.hrmsEmploymentType.findFirst({
        where: { id, organizationId },
        select: { id: true, name: true, code: true },
      }),
      ErrorCode.HRMS_EMPLOYMENT_TYPE_NOT_FOUND,
      "Employment type",
    );
  }

  private async requireDepartment(organizationId: string, id: string) {
    return this.require(
      this.prisma.organizationDepartment.findFirst({
        where: { id, organizationId, deletedAt: null },
        select: { id: true },
      }),
      ErrorCode.DEPARTMENT_NOT_FOUND,
      "Department",
    );
  }

  private async require<T>(query: Promise<T | null>, errorCode: ErrorCode, resource: string): Promise<T> {
    const record = await query;
    if (!record) {
      throw new AppError(errorCode, `${resource} not found`, HttpStatus.NOT_FOUND);
    }
    return record;
  }

  private handleConflict(error: unknown, errorCode: ErrorCode, message: string): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new AppError(errorCode, message, HttpStatus.CONFLICT);
    }
    throw error;
  }

  private clean(value: string | null | undefined): string | null {
    return value?.trim() || null;
  }

  private record(
    resource: string,
    action: "created" | "updated" | "deleted",
    organizationId: string,
    actorUserId: string,
    resourceId: string,
    resourceType: string,
  ) {
    return this.audit.record({
      action: `hrms.${resource}.${action}`,
      organizationId,
      actorUserId,
      resourceType,
      resourceId,
    });
  }
}
