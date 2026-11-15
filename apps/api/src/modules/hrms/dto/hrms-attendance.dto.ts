import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsIn, IsNumber, IsOptional, IsString, MaxLength, MinLength, Min, Max, ValidateIf, ValidateNested, IsDefined, IsObject } from "class-validator";
import { Type } from "class-transformer";
import type { AttendanceCaptureSource, AttendanceDevice, AttendanceWorkMode } from "@dhriti/types";
import { AttendanceRegularizationType, AttendanceStatus } from "@prisma/client";

export class UpsertHrmsAttendanceDto {
  @ApiProperty({ format: "date" }) @IsDateString() date!: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() checkIn?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() checkOut?: string;
  @ApiPropertyOptional({ enum: AttendanceStatus }) @IsOptional() @IsEnum(AttendanceStatus) status?: AttendanceStatus;
  @ApiPropertyOptional() @IsOptional() @IsNumber() @Min(0) workHours?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

class AttendancePositionDto {
  @ApiProperty() @IsNumber() @Min(-90) @Max(90) latitude!: number;
  @ApiProperty() @IsNumber() @Min(-180) @Max(180) longitude!: number;
  @ApiProperty({ description: "Reported accuracy radius in meters" }) @IsNumber() @Min(0) accuracy!: number;
  @ApiProperty({ format: "date-time" }) @IsDateString({ strict: true }) capturedAt!: string;
}

class AttendanceCaptureDto {
  @ApiProperty({ enum: ["OFFICE", "REMOTE", "FIELD"] })
  @IsIn(["OFFICE", "REMOTE", "FIELD"]) mode!: AttendanceWorkMode;
  @ApiProperty({ enum: ["WEB", "MOBILE_WEB", "NATIVE"] })
  @IsIn(["WEB", "MOBILE_WEB", "NATIVE"]) source!: AttendanceCaptureSource;
  @ApiProperty({ enum: ["DESKTOP", "PHONE", "TABLET", "OTHER"] })
  @IsIn(["DESKTOP", "PHONE", "TABLET", "OTHER"]) device!: AttendanceDevice;
  @ApiPropertyOptional({ type: AttendancePositionDto })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDefined() @IsObject() @ValidateNested() @Type(() => AttendancePositionDto)
  position?: AttendancePositionDto;
}

export class AttendancePunchDto {
  @ApiPropertyOptional({ type: AttendanceCaptureDto, description: "Required when organization GPS enforcement is enabled" })
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsDefined() @IsObject() @ValidateNested() @Type(() => AttendanceCaptureDto)
  capture?: AttendanceCaptureDto;
}

export class ClockInDto extends AttendancePunchDto {
  /** Fallback calendar day (YYYY-MM-DD) for employees without a shift; shifted employees use the shift's own day and zone. */
  @ApiProperty({ format: "date" }) @IsDateString({ strict: true }) date!: string;
}

export class CreateAttendanceRegularizationDto {
  @ApiProperty({ format: "date" }) @IsDateString({ strict: true }) date!: string;
  @ApiProperty({ enum: AttendanceRegularizationType }) @IsEnum(AttendanceRegularizationType) type!: AttendanceRegularizationType;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() requestedCheckIn?: string;
  @ApiPropertyOptional({ format: "date-time" }) @IsOptional() @IsDateString() requestedCheckOut?: string;
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) reason!: string;
}

export class DecideAttendanceRegularizationDto {
  @ApiProperty({ enum: ["APPROVED", "REJECTED"] }) @IsIn(["APPROVED", "REJECTED"]) status!: "APPROVED" | "REJECTED";
  @ApiProperty() @IsString() @MinLength(1) @MaxLength(2000) decisionNote!: string;
}
