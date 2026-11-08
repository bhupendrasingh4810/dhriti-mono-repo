import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  AssetType,
  AssetCondition,
  AssetStatus,
  LeaveStatus,
  LeaveType,
  ReviewStatus,
  ReviewType,
  TrainingEnrollmentStatus,
  TrainingStatus,
  TrainingType,
} from "@prisma/client";
import { Transform, Type } from "class-transformer";
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateHrmsLeaveDto {
  @ApiProperty() @IsUUID() employeeId!: string;
  @ApiProperty({ enum: LeaveType }) @IsEnum(LeaveType) leaveType!: LeaveType;
  @ApiProperty({ format: "date" }) @IsDateString() startDate!: string;
  @ApiProperty({ format: "date" }) @IsDateString() endDate!: string;
  @ApiProperty() @IsNumber() @Min(0.5) totalDays!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) reason?: string;
}

export class UpdateHrmsLeaveStatusDto {
  @ApiProperty({ enum: LeaveStatus }) @IsEnum(LeaveStatus) status!: LeaveStatus;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) rejectionReason?: string;
}

export class CreateHrmsPerformanceReviewDto {
  @ApiProperty() @IsUUID() employeeId!: string;
  @ApiProperty() @IsUUID() reviewerEmployeeId!: string;
  @ApiProperty({ enum: ReviewType }) @IsEnum(ReviewType) reviewType!: ReviewType;
  @ApiProperty() @IsString() @MaxLength(120) cycle!: string;
  @ApiProperty({ format: "date" }) @IsDateString() startDate!: string;
  @ApiProperty({ format: "date" }) @IsDateString() dueDate!: string;
  @ApiPropertyOptional({ enum: ReviewStatus }) @IsOptional() @IsEnum(ReviewStatus) status?: ReviewStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) overallRating?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) comments?: string;
}

export class CreateHrmsPayrollDto {
  @ApiProperty() @IsUUID() employeeId!: string;
  @ApiProperty() @IsString() @MaxLength(120) period!: string;
  @ApiProperty({ format: "date" }) @IsDateString() periodStart!: string;
  @ApiProperty({ format: "date" }) @IsDateString() periodEnd!: string;
  @ApiProperty({ format: "date" }) @IsDateString() payDate!: string;
  @ApiProperty() @IsNumber() @Min(0) grossSalary!: number;
  @ApiProperty() @IsNumber() @Min(0) totalDeductions!: number;
  @ApiProperty() @IsNumber() @Min(0) netPay!: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(12) currency?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

export class CreateHrmsTrainingDto {
  @ApiProperty() @IsString() @MaxLength(200) title!: string;
  @ApiProperty({ enum: TrainingType }) @IsEnum(TrainingType) type!: TrainingType;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) description?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() startDate?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() endDate?: string;
  @ApiPropertyOptional({ enum: TrainingStatus }) @IsOptional() @IsEnum(TrainingStatus) status?: TrainingStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(1) maxParticipants?: number;
}

export class EnrollHrmsTrainingDto {
  @ApiProperty() @IsUUID() employeeId!: string;
  @ApiPropertyOptional({ enum: TrainingEnrollmentStatus })
  @IsOptional()
  @IsEnum(TrainingEnrollmentStatus)
  status?: TrainingEnrollmentStatus;
}

export class CreateHrmsAssetDto {
  @ApiProperty() @IsString() @MaxLength(200) name!: string;
  @ApiProperty({ enum: AssetType }) @IsEnum(AssetType) type!: AssetType;
  @ApiProperty() @IsString() @MaxLength(200) serialNumber!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(100) customCategory?: string;
  @ApiPropertyOptional({ enum: AssetCondition }) @IsOptional() @IsEnum(AssetCondition) condition?: AssetCondition;
  @ApiPropertyOptional({ enum: AssetStatus }) @IsOptional() @IsIn(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "UNFIT"]) status?: AssetStatus;
  @ApiPropertyOptional() @IsOptional() @IsUUID() assignedEmployeeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) location?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(5000) notes?: string;
}

export class UpdateHrmsAssetDto extends CreateHrmsAssetDto {}

export class ListHrmsAssetsDto {
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) page?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(1) pageSize?: number;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value || undefined) @IsString() @MaxLength(200) search?: string;
  @ApiPropertyOptional({ enum: AssetType }) @IsOptional() @Transform(({ value }) => value || undefined) @IsEnum(AssetType) type?: AssetType;
  @ApiPropertyOptional({ enum: AssetCondition }) @IsOptional() @Transform(({ value }) => value || undefined) @IsEnum(AssetCondition) condition?: AssetCondition;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value || undefined) @IsIn(["AVAILABLE", "ASSIGNED", "MAINTENANCE", "UNFIT"]) status?: AssetStatus;
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value || undefined) @IsIn(["name", "serialNumber", "status", "condition", "createdAt"]) sortBy?: "name" | "serialNumber" | "status" | "condition" | "createdAt";
  @ApiPropertyOptional() @IsOptional() @Transform(({ value }) => value || undefined) @IsIn(["asc", "desc"]) sortOrder?: "asc" | "desc";
}

export class AssignHrmsAssetDto {
  @ApiPropertyOptional() @IsOptional() @IsUUID() employeeId?: string;
}

export class CreateHrmsBenefitDto {
  @ApiProperty() @IsUUID() employeeId!: string;
  @ApiProperty() @IsString() @MaxLength(200) provider!: string;
  @ApiProperty() @IsString() @MaxLength(200) planName!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(200) policyNumber?: string;
  @ApiProperty({ format: "date" }) @IsDateString() coverageStarts!: string;
  @ApiPropertyOptional({ format: "date" }) @IsOptional() @IsDateString() coverageEnds?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
