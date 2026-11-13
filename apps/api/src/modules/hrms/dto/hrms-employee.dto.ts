import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from "class-validator";

const employeeSortFields = [
  "employeeNumber",
  "name",
  "status",
  "employmentType",
  "startDate",
  "department",
  "location",
] as const;
export type EmployeeSortField = (typeof employeeSortFields)[number];

export class ListHrmsEmployeesDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ minimum: 1, maximum: 100, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(120)
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  query?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ enum: employeeSortFields, default: "employeeNumber" })
  @IsOptional()
  @IsIn(employeeSortFields)
  sortBy: EmployeeSortField = "employeeNumber";

  @ApiPropertyOptional({ enum: ["asc", "desc"], default: "asc" })
  @IsOptional()
  @IsIn(["asc", "desc"])
  sortOrder: "asc" | "desc" = "asc";
}

class EmployeeLifecycleDto {
  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  biometricId?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "date" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  retirementDate?: string | null;

  @ApiPropertyOptional({ nullable: true, format: "date" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  resignationDate?: string | null;
}

export class CreateHrmsEmployeeDto extends EmployeeLifecycleDto {
  @ApiProperty() @IsUUID() userId!: string;
  @ApiProperty() @IsString() @MinLength(1) @Matches(/\S/) @MaxLength(64) employeeNumber!: string;
  @ApiProperty({ example: "ACTIVE" }) @IsString() @MinLength(1) @MaxLength(64) status!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employmentType?: string;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() workLocationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() shiftId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() departmentId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() designationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() reportingManagerId?: string | null;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
}

export class UpdateHrmsEmployeeDto extends EmployeeLifecycleDto {
  @ApiPropertyOptional()
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(64)
  employeeNumber?: string;
  @ApiPropertyOptional({ example: "ACTIVE" }) @IsOptional() @IsString() @MinLength(1) @MaxLength(64) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employmentType?: string;
  @ApiPropertyOptional({ nullable: true })
  @ValidateIf((_object, value: unknown) => value !== undefined && value !== null)
  @IsUUID()
  workLocationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() shiftId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() departmentId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() designationId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @IsOptional() @IsUUID() reportingManagerId?: string | null;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
}

/** Maximum rows accepted per bulk import; keeps validation and the import transaction bounded. */
export const EMPLOYEE_IMPORT_MAX_ROWS = 5000;
export const employeeImportFormats = ["csv", "xlsx"] as const;
export type EmployeeFileFormat = (typeof employeeImportFormats)[number];

/**
 * One mapped import row. Every field is a trimmed string so that semantic problems are reported
 * per row (instead of rejecting the whole request); references use human-friendly keys.
 */
export class ImportEmployeeRowDto {
  @ApiProperty() @IsInt() @Min(1) rowNumber!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(320) email?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) employeeNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) employmentType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) workLocation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) department?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) designation?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) reportingManagerEmployeeNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(32) startDate?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) biometricId?: string;
}

export class ImportEmployeesDto {
  @ApiProperty({ type: [ImportEmployeeRowDto] })
  @IsArray()
  @ArrayMaxSize(EMPLOYEE_IMPORT_MAX_ROWS)
  @ValidateNested({ each: true })
  @Type(() => ImportEmployeeRowDto)
  rows!: ImportEmployeeRowDto[];
}

export class EmployeeTemplateQueryDto {
  @ApiPropertyOptional({ enum: employeeImportFormats, default: "xlsx" })
  @IsOptional()
  @IsIn(employeeImportFormats)
  format: EmployeeFileFormat = "xlsx";
}

export class ExportHrmsEmployeesDto {
  @ApiProperty({ enum: employeeImportFormats }) @IsIn(employeeImportFormats) format!: EmployeeFileFormat;
  @ApiProperty({ enum: ["all", "selected", "filtered"] }) @IsIn(["all", "selected", "filtered"]) scope!:
    | "all"
    | "selected"
    | "filtered";
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(EMPLOYEE_IMPORT_MAX_ROWS)
  @IsUUID(undefined, { each: true })
  ids?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) query?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(64) status?: string;
  @ApiPropertyOptional() @IsOptional() @IsUUID() departmentId?: string;
  @ApiPropertyOptional({ enum: employeeSortFields }) @IsOptional() @IsIn(employeeSortFields) sortBy?: EmployeeSortField;
  @ApiPropertyOptional({ enum: ["asc", "desc"] }) @IsOptional() @IsIn(["asc", "desc"]) sortOrder?: "asc" | "desc";
}
