import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
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
  ValidateNested,
} from "class-validator";

export class PayrollProfileDto {
  @IsString() @Matches(/\S/) @MinLength(1) @MaxLength(120) name!: string;
  @Matches(/^[A-Z]{2}$/) countryCode!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @IsInt() @Min(0) @Max(3) minorUnits!: number;
  @IsIn(["MONTHLY", "WEEKLY", "BIWEEKLY", "SEMIMONTHLY"]) frequency!: "MONTHLY" | "WEEKLY" | "BIWEEKLY" | "SEMIMONTHLY";
  @IsOptional() @Matches(/^[1-9]\d{3}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) calendarAnchor?: string;
  @IsOptional() @IsInt() @Min(0) @Max(60) payDateOffset?: number;
  @IsIn(["EMPLOYEE", "CONTRACTOR", "LOCAL_PROVIDER", "EOR"]) employmentModel!: string;
  @IsOptional() @IsUUID() workLocationId?: string;
  @IsOptional() @IsString() @MaxLength(200) registration?: string;
  @IsBoolean() rulesVerified!: boolean;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) effectiveFrom!: string;
}

export class SalaryComponentDto {
  @Matches(/^[A-Z][A-Z0-9_]{0,39}$/) code!: string;
  @IsString() @Matches(/\S/) @MinLength(1) @MaxLength(120) name!: string;
  @IsIn(["EARNING", "DEDUCTION", "EMPLOYER"]) type!: "EARNING" | "DEDUCTION" | "EMPLOYER";
  @IsIn(["FIXED", "PERCENT_GROSS", "PERCENT_COMPONENT", "REMAINDER"]) calculation!:
    "FIXED" | "PERCENT_GROSS" | "PERCENT_COMPONENT" | "REMAINDER";
  @Matches(/^\d{1,12}(?:\.\d{1,4})?$/) value!: string;
  @IsOptional() @Matches(/^[A-Z][A-Z0-9_]{0,39}$/) basis?: string;
}

export class SalaryStructureDto {
  @IsUUID() profileId!: string;
  @IsString() @Matches(/\S/) @MinLength(1) @MaxLength(120) name!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SalaryComponentDto)
  components!: SalaryComponentDto[];
}

export class SalaryAssignmentDto {
  @IsUUID() employeeId!: string;
  @IsUUID() structureId!: string;
  @Matches(/^\d{1,12}(?:\.\d{1,4})?$/) monthlyGross!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) effectiveFrom!: string;
}

export class ExpenseClaimDto {
  @IsUUID() employeeId!: string;
  @IsString() @Matches(/\S/) @MinLength(1) @MaxLength(160) title!: string;
  @Matches(/^\d{1,12}(?:\.\d{1,4})?$/) amount!: string;
  @Matches(/^[A-Z]{3}$/) currency!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) expenseDate!: string;
  @IsString() @Matches(/\S/) @MinLength(1) @MaxLength(500) receiptReference!: string;
}

export class PayrollRunDto {
  @IsUUID() profileId!: string;
  @IsOptional() @IsUUID() departmentId?: string;
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])(?:-(0[1-9]|[12]\d|3[01]))?$/) period!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) payDate!: string;
  @IsOptional() @IsIn(["NONE", "CALENDAR_DAYS"]) prorationPolicy?: "NONE" | "CALENDAR_DAYS";
}

export class PayrollRunDecisionDto {
  @IsString() @Matches(/\S/) @MinLength(3) @MaxLength(1000) reason!: string;
}

export class SandboxPaymentDto {
  @IsIn(["SUBMIT", "SETTLE", "FAIL"]) action!: "SUBMIT" | "SETTLE" | "FAIL";
  @IsBoolean() confirmSandbox!: boolean;
}

export class VariablePayInputDto {
  @IsUUID() employeeId!: string;
  @IsUUID() profileId!: string;
  @IsString() @Matches(/\S/) @MaxLength(120) name!: string;
  @IsIn(["EARNING", "DEDUCTION", "EMPLOYER"]) type!: "EARNING" | "DEDUCTION" | "EMPLOYER";
  @IsIn(["FIXED", "HOURS"]) calculation!: "FIXED" | "HOURS";
  @Matches(/^\d{1,8}(?:\.\d{1,4})?$/) quantity!: string;
  @Matches(/^\d{1,12}(?:\.\d{1,4})?$/) rate!: string;
  @Matches(/^\d{1,2}(?:\.\d{1,4})?$/) multiplier!: string;
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/) startPeriod!: string;
  @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])$/) endPeriod!: string;
  @IsOptional() @Matches(/^[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/) targetPeriod?: string;
  @IsString() @Matches(/\S/) @MinLength(3) @MaxLength(1000) reason!: string;
}

export class VariablePayDecisionDto {
  @IsIn(["APPROVE", "REJECT", "CANCEL"]) action!: "APPROVE" | "REJECT" | "CANCEL";
}
