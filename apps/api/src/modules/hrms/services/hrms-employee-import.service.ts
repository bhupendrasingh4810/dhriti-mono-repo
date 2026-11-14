import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import { HttpStatus, Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";

import { AppError } from "../../../common/errors/app-error";
import { ErrorCode } from "../../../common/errors/error-codes";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../audit/audit.service";
import {
  EMPLOYEE_IMPORT_MAX_ROWS,
  type EmployeeFileFormat,
  type ImportEmployeeRowDto,
} from "../dto/hrms-employee.dto";

export const EMPLOYEE_IMPORT_MAX_BYTES = 10 * 1024 * 1024;
export const EMPLOYEE_STATUSES = ["ACTIVE", "ON_LEAVE", "INACTIVE"] as const;

type ImportFieldKey = Exclude<keyof ImportEmployeeRowDto, "rowNumber">;

/**
 * Single source of truth for the import contract: the downloadable template, the column-mapping
 * suggestions and the validator all derive from this list.
 */
export const EMPLOYEE_IMPORT_FIELDS: ReadonlyArray<{
  key: ImportFieldKey;
  label: string;
  required: boolean;
  example: string;
  aliases: string[];
}> = [
  { key: "email", label: "Work Email", required: true, example: "aarav.bhatia@company.com", aliases: ["email", "work email", "email address", "mail"] },
  { key: "employeeNumber", label: "Employee Number", required: true, example: "EMP-1042", aliases: ["employee number", "employee id", "emp id", "emp no", "employee code", "code"] },
  { key: "status", label: "Status", required: false, example: "ACTIVE", aliases: ["status", "employment status"] },
  { key: "employmentType", label: "Employment Type", required: false, example: "Full-time", aliases: ["employment type", "type", "worker type"] },
  { key: "workLocation", label: "Work Location", required: false, example: "Bengaluru HQ", aliases: ["work location", "location", "office"] },
  { key: "department", label: "Department", required: false, example: "Engineering", aliases: ["department", "team", "dept"] },
  { key: "designation", label: "Designation", required: false, example: "Staff Engineer", aliases: ["designation", "job title", "title", "role", "position"] },
  { key: "reportingManagerEmployeeNumber", label: "Reporting Manager Employee Number", required: false, example: "EMP-1001", aliases: ["reporting manager employee number", "reporting manager", "manager id", "manager employee number", "manager"] },
  { key: "startDate", label: "Date of Joining (YYYY-MM-DD)", required: false, example: "2026-01-15", aliases: ["date of joining", "joining date", "start date", "doj", "joined"] },
  { key: "biometricId", label: "Biometric ID", required: false, example: "BIO-0042", aliases: ["biometric id", "biometric"] },
];

export interface ImportRowResult {
  rowNumber: number;
  valid: boolean;
  errors: string[];
}

interface NormalizedRow {
  rowNumber: number;
  userId: string;
  email: string;
  employeeNumber: string;
  status: string;
  employmentType: string | null;
  workLocationId: string | null;
  departmentId: string | null;
  designationId: string | null;
  managerNumber: string | null;
  startDate: Date | null;
  biometricId: string | null;
}

const normalizeHeader = (value: string) =>
  value.replace(/\(.*?\)/g, " ").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
const clean = (value: string | undefined) => (value ?? "").trim();
const lookupKey = (value: string) => value.trim().toLowerCase();

/** Spreadsheet formulas in exported cells would execute when opened; neutralise leading trigger characters. */
function safeCell(value: string): string {
  return /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
}

function cellToText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) {return "";}
  if (value instanceof Date) {return value.toISOString().slice(0, 10);}
  if (typeof value === "object") {
    if ("result" in value && value.result !== undefined) {return cellToText(value.result);}
    if ("richText" in value) {return value.richText.map((part) => part.text).join("").trim();}
    if ("text" in value) {return String(value.text).trim();}
    if ("error" in value) {return "";}
  }
  return String(value).trim();
}

@Injectable()
export class HrmsEmployeeImportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async buildTemplate(format: EmployeeFileFormat): Promise<{ buffer: Buffer; contentType: string; fileName: string }> {
    const headers = EMPLOYEE_IMPORT_FIELDS.map((field) => (field.required ? `${field.label} *` : field.label));
    const example = EMPLOYEE_IMPORT_FIELDS.map((field) => field.example);
    return this.writeFile(format, "Employees", headers, [example], "employee-import-template");
  }

  async parseUpload(file: { buffer: Buffer; originalname: string; size: number } | undefined) {
    if (!file) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Upload a CSV or XLSX file", HttpStatus.BAD_REQUEST);
    }
    if (file.size > EMPLOYEE_IMPORT_MAX_BYTES) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "File exceeds the 10 MB limit", HttpStatus.BAD_REQUEST);
    }
    const extension = file.originalname.toLowerCase().split(".").pop();
    if (extension !== "csv" && extension !== "xlsx") {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "Only .csv and .xlsx files are supported", HttpStatus.BAD_REQUEST);
    }
    const table = await this.readTable(file.buffer, extension).catch(() => {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "The file could not be read", HttpStatus.BAD_REQUEST);
    });
    const [headerRow, ...body] = table;
    const headers = (headerRow ?? []).map((value) => value.replace(/\s*\*$/, "").trim());
    if (headers.every((header) => !header)) {
      throw new AppError(ErrorCode.VALIDATION_FAILED, "The first row must contain column headings", HttpStatus.BAD_REQUEST);
    }
    const dataRows = body
      .map((values, index) => ({ rowNumber: index + 2, values }))
      .filter((row) => row.values.some((value) => value));
    if (dataRows.length > EMPLOYEE_IMPORT_MAX_ROWS) {
      throw new AppError(
        ErrorCode.VALIDATION_FAILED,
        `Files are limited to ${EMPLOYEE_IMPORT_MAX_ROWS} employees`,
        HttpStatus.BAD_REQUEST,
      );
    }
    const normalizedHeaders = headers.map(normalizeHeader);
    const suggestedMapping: Record<string, number | null> = {};
    const claimed = new Set<number>();
    for (const field of EMPLOYEE_IMPORT_FIELDS) {
      const wanted = [normalizeHeader(field.label), ...field.aliases];
      const index = normalizedHeaders.findIndex((header, position) => !claimed.has(position) && wanted.includes(header));
      suggestedMapping[field.key] = index >= 0 ? index : null;
      if (index >= 0) {claimed.add(index);}
    }
    return {
      format: extension,
      headers,
      rows: dataRows,
      fields: EMPLOYEE_IMPORT_FIELDS.map(({ key, label, required }) => ({ key, label, required })),
      suggestedMapping,
    };
  }

  async validate(organizationId: string, rows: ImportEmployeeRowDto[]) {
    const { results } = await this.evaluate(organizationId, rows);
    const valid = results.filter((result) => result.valid).length;
    return { results, summary: { total: results.length, valid, invalid: results.length - valid } };
  }

  /** Re-validates server-side (the client result is never trusted) and inserts every valid row atomically. */
  async importRows(organizationId: string, actorUserId: string, rows: ImportEmployeeRowDto[]) {
    const { results, accepted } = await this.evaluate(organizationId, rows);
    const ids = new Map(accepted.map((row) => [row.employeeNumber, randomUUID()]));
    const existing = accepted.some((row) => row.managerNumber)
      ? await this.prisma.hrmsEmployee.findMany({
          where: { organizationId, deletedAt: null, employeeNumber: { in: accepted.flatMap((r) => (r.managerNumber ? [r.managerNumber] : [])) } },
          select: { id: true, employeeNumber: true },
        })
      : [];
    const existingIds = new Map(existing.map((employee) => [employee.employeeNumber, employee.id]));
    if (accepted.length > 0) {
      // A single INSERT lets rows reference managers created by the same statement.
      await this.prisma.hrmsEmployee
        .createMany({
          data: accepted.map((row) => ({
            id: ids.get(row.employeeNumber)!,
            organizationId,
            userId: row.userId,
            employeeNumber: row.employeeNumber,
            status: row.status,
            employmentType: row.employmentType,
            workLocationId: row.workLocationId,
            departmentId: row.departmentId,
            designationId: row.designationId,
            reportingManagerId: row.managerNumber
              ? (ids.get(row.managerNumber) ?? existingIds.get(row.managerNumber) ?? null)
              : null,
            startDate: row.startDate,
            biometricId: row.biometricId,
          })),
        })
        .catch(() => {
          throw new AppError(
            ErrorCode.EMPLOYEE_ALREADY_EXISTS,
            "Employees changed while importing; validate the file again",
            HttpStatus.CONFLICT,
          );
        });
      await this.audit.record({
        action: "hrms.employee.imported",
        organizationId,
        actorUserId,
        resourceType: "HrmsEmployee",
        metadata: { created: accepted.length, skipped: results.length - accepted.length },
      });
    }
    const errors = results.filter((result) => !result.valid);
    return { created: accepted.length, skipped: errors.length, errors };
  }

  async buildExport(
    format: EmployeeFileFormat,
    employees: Array<{
      employeeNumber: string;
      status: string;
      employmentType: string | null;
      startDate: Date | null;
      user: { name: string; email: string };
      workLocation: { name: string } | null;
      department: { name: string } | null;
      designation: { name: string } | null;
      reportingManager: { employeeNumber: string; user: { name: string } } | null;
    }>,
  ) {
    const headers = [
      "Employee Number",
      "Name",
      "Work Email",
      "Status",
      "Employment Type",
      "Work Location",
      "Department",
      "Designation",
      "Reporting Manager",
      "Date of Joining",
    ];
    const rows = employees.map((employee) => [
      employee.employeeNumber,
      employee.user.name,
      employee.user.email,
      employee.status,
      employee.employmentType ?? "",
      employee.workLocation?.name ?? "",
      employee.department?.name ?? "",
      employee.designation?.name ?? "",
      employee.reportingManager ? `${employee.reportingManager.user.name} (${employee.reportingManager.employeeNumber})` : "",
      employee.startDate ? employee.startDate.toISOString().slice(0, 10) : "",
    ]);
    return this.writeFile(format, "Workforce", headers, rows, "workforce-roster");
  }

  private async evaluate(organizationId: string, input: ImportEmployeeRowDto[]) {
    const [members, employees, locations, departments, designations, employmentTypes] = await this.prisma.$transaction([
      this.prisma.organizationMember.findMany({
        where: { organizationId, deletedAt: null, removedAt: null, status: "ACTIVE", user: { deletedAt: null } },
        select: { user: { select: { id: true, email: true } } },
      }),
      this.prisma.hrmsEmployee.findMany({
        where: { organizationId, deletedAt: null },
        select: { id: true, userId: true, employeeNumber: true, reportingManager: { select: { employeeNumber: true } } },
      }),
      this.prisma.hrmsLocation.findMany({ where: { organizationId, isActive: true }, select: { id: true, name: true, code: true } }),
      this.prisma.organizationDepartment.findMany({
        where: { organizationId, deletedAt: null, isActive: true },
        select: { id: true, name: true, code: true },
      }),
      this.prisma.hrmsDesignation.findMany({
        where: { organizationId, isActive: true },
        select: { id: true, name: true, code: true, departmentId: true },
      }),
      this.prisma.hrmsEmploymentType.findMany({ where: { organizationId, isActive: true }, select: { name: true, code: true } }),
    ]);
    const byNameOrCode = <T extends { name: string; code: string | null }>(items: T[]) => {
      const map = new Map<string, T>();
      for (const item of items) {
        map.set(lookupKey(item.name), item);
        if (item.code) {map.set(lookupKey(item.code), item);}
      }
      return map;
    };
    const memberByEmail = new Map(members.map((member) => [lookupKey(member.user.email), member.user.id]));
    const employeeUserIds = new Set(employees.map((employee) => employee.userId));
    const employeeNumbers = new Set(employees.map((employee) => employee.employeeNumber));
    const locationMap = byNameOrCode(locations);
    const departmentMap = byNameOrCode(departments);
    const designationMap = byNameOrCode(designations);
    const typeMap = byNameOrCode(employmentTypes);

    const errorsByRow = new Map<number, string[]>();
    const fail = (rowNumber: number, message: string) =>
      errorsByRow.set(rowNumber, [...(errorsByRow.get(rowNumber) ?? []), message]);
    const normalized = new Map<number, NormalizedRow>();
    const seenEmails = new Set<string>();
    const seenNumbers = new Set<string>();

    for (const row of input) {
      const email = lookupKey(clean(row.email));
      const employeeNumber = clean(row.employeeNumber);
      let userId: string | undefined;
      if (!email) {fail(row.rowNumber, "Work email is required");}
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {fail(row.rowNumber, "Work email is not valid");}
      else if (!memberByEmail.has(email)) {fail(row.rowNumber, "No active organization member has this email");}
      else {
        userId = memberByEmail.get(email);
        if (employeeUserIds.has(userId!)) {fail(row.rowNumber, "This member is already an employee");}
        else if (seenEmails.has(email)) {fail(row.rowNumber, "Duplicate email in file");}
        seenEmails.add(email);
      }
      if (!employeeNumber) {fail(row.rowNumber, "Employee number is required");}
      else if (employeeNumbers.has(employeeNumber)) {fail(row.rowNumber, "Employee number already exists");}
      else if (seenNumbers.has(employeeNumber)) {fail(row.rowNumber, "Duplicate employee number in file");}
      seenNumbers.add(employeeNumber);

      const status = clean(row.status) ? clean(row.status).toUpperCase().replace(/[\s-]+/g, "_") : "ACTIVE";
      if (!(EMPLOYEE_STATUSES as readonly string[]).includes(status)) {
        fail(row.rowNumber, `Status must be one of ${EMPLOYEE_STATUSES.join(", ")}`);
      }
      const typeName = clean(row.employmentType);
      const type = typeName ? typeMap.get(lookupKey(typeName)) : undefined;
      if (typeName && !type) {fail(row.rowNumber, `Employment type "${typeName}" is not configured`);}
      const locationName = clean(row.workLocation);
      const location = locationName ? locationMap.get(lookupKey(locationName)) : undefined;
      if (locationName && !location) {fail(row.rowNumber, `Work location "${locationName}" is not configured`);}
      const departmentName = clean(row.department);
      const department = departmentName ? departmentMap.get(lookupKey(departmentName)) : undefined;
      if (departmentName && !department) {fail(row.rowNumber, `Department "${departmentName}" is not configured`);}
      const designationName = clean(row.designation);
      const designation = designationName ? designationMap.get(lookupKey(designationName)) : undefined;
      if (designationName && !designation) {fail(row.rowNumber, `Designation "${designationName}" is not configured`);}
      if (designation?.departmentId && department && designation.departmentId !== department.id) {
        fail(row.rowNumber, "Designation belongs to a different department");
      }
      const startText = clean(row.startDate);
      let startDate: Date | null = null;
      if (startText) {
        startDate = /^\d{4}-\d{2}-\d{2}$/.test(startText) ? new Date(`${startText}T00:00:00.000Z`) : null;
        if (!startDate || Number.isNaN(startDate.getTime()) || startDate.toISOString().slice(0, 10) !== startText) {
          startDate = null;
          fail(row.rowNumber, "Date of joining must be a valid YYYY-MM-DD date");
        }
      }
      if (!errorsByRow.has(row.rowNumber)) {
        normalized.set(row.rowNumber, {
          rowNumber: row.rowNumber,
          userId: userId!,
          email,
          employeeNumber,
          status,
          employmentType: type?.name ?? null,
          workLocationId: location?.id ?? null,
          departmentId: department?.id ?? null,
          designationId: designation?.id ?? null,
          managerNumber: clean(row.reportingManagerEmployeeNumber) || null,
          startDate,
          biometricId: clean(row.biometricId) || null,
        });
      }
    }

    // Manager references may point at existing employees or at other accepted rows; iterate until stable
    // because rejecting one row can orphan rows that report to it.
    let changed = true;
    while (changed) {
      changed = false;
      const acceptedNumbers = new Set([...normalized.values()].map((row) => row.employeeNumber));
      for (const row of [...normalized.values()]) {
        if (!row.managerNumber) {continue;}
        if (row.managerNumber === row.employeeNumber) {
          fail(row.rowNumber, "An employee cannot report to themselves");
        } else if (!employeeNumbers.has(row.managerNumber) && !acceptedNumbers.has(row.managerNumber)) {
          fail(row.rowNumber, `Reporting manager "${row.managerNumber}" was not found or is invalid`);
        } else {
          continue;
        }
        normalized.delete(row.rowNumber);
        changed = true;
      }
    }
    const managerOf = new Map<string, string | null>(
      employees.map((employee) => [employee.employeeNumber, employee.reportingManager?.employeeNumber ?? null]),
    );
    for (const row of normalized.values()) {managerOf.set(row.employeeNumber, row.managerNumber);}
    for (const row of [...normalized.values()]) {
      const visited = new Set<string>([row.employeeNumber]);
      let cursor = row.managerNumber;
      while (cursor) {
        if (visited.has(cursor)) {
          fail(row.rowNumber, "Reporting manager creates a circular reporting line");
          normalized.delete(row.rowNumber);
          break;
        }
        visited.add(cursor);
        cursor = managerOf.get(cursor) ?? null;
      }
    }

    const results: ImportRowResult[] = input.map((row) => ({
      rowNumber: row.rowNumber,
      valid: normalized.has(row.rowNumber),
      errors: errorsByRow.get(row.rowNumber) ?? [],
    }));
    return { results, accepted: [...normalized.values()] };
  }

  private async readTable(buffer: Buffer, extension: "csv" | "xlsx"): Promise<string[][]> {
    const workbook = new ExcelJS.Workbook();
    if (extension === "xlsx") {
      // XLSX is a zip container; reject anything else before handing it to the parser.
      if (buffer.subarray(0, 2).toString("latin1") !== "PK") {throw new Error("Not an XLSX file");}
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    } else {
      await workbook.csv.read(Readable.from(buffer));
    }
    const sheet = workbook.worksheets[0];
    if (!sheet) {return [];}
    const table: string[][] = [];
    const width = sheet.columnCount;
    sheet.eachRow({ includeEmpty: true }, (row) => {
      table.push(Array.from({ length: width }, (_unused, index) => cellToText(row.getCell(index + 1).value)));
    });
    return table;
  }

  private async writeFile(
    format: EmployeeFileFormat,
    sheetName: string,
    headers: string[],
    rows: string[][],
    baseName: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(headers);
    for (const row of rows) {sheet.addRow(row.map(safeCell));}
    if (format === "xlsx") {
      sheet.getRow(1).font = { bold: true };
      sheet.columns.forEach((column) => (column.width = 24));
      return {
        buffer: Buffer.from(await workbook.xlsx.writeBuffer()),
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        fileName: `${baseName}.xlsx`,
      };
    }
    return {
      buffer: Buffer.from(await workbook.csv.writeBuffer()),
      contentType: "text/csv; charset=utf-8",
      fileName: `${baseName}.csv`,
    };
  }
}
